
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  X, 
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Cpu,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Invoice, DashboardStats } from './types';
import { APP_NAME, NAVIGATION } from './constants';
import { storage } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { InvoiceUpload } from './components/InvoiceUpload';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceForm } from './components/InvoiceForm';
import { parseInvoiceText } from './services/gemini';

// External Tesseract variable declared via script tag
declare var Tesseract: any;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | null>(null);
  const [selectedInvoiceImage, setSelectedInvoiceImage] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setInvoices(storage.getInvoices());
  }, []);

  const handleProcessFile = async (file: File) => {
    // Basic validation
    if (file.type === 'application/pdf') {
      alert("PDF support currently requires manual entry or image conversion. Please upload a JPG or PNG for automatic OCR.");
      setEditingInvoice({ status: 'Pending', date: new Date().toISOString().split('T')[0] });
      setActiveTab('edit');
      return;
    }

    if (typeof Tesseract === 'undefined') {
      alert("OCR Engine (Tesseract) failed to load. Please check your internet connection and refresh.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Reading file...');
    
    try {
      // Convert file to Data URL to ensure OCR compatibility and avoid 'Error attempting to read image'
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setSelectedInvoiceImage(imageData);
      setStatusMessage('Step 1: Running OCR engine...');
      
      // 1. OCR with Tesseract.js (Client-side)
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        { 
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setStatusMessage(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const { data: { text, confidence } } = result;

      setStatusMessage('Step 2: AI analyzing structured data...');
      
      // 2. AI Parsing with Gemini
      const extracted = await parseInvoiceText(text);
      
      // 3. Prepare for review
      setEditingInvoice({
        ...extracted,
        rawText: text,
        confidence: confidence / 100
      });
      setActiveTab('edit');
    } catch (error: any) {
      console.error("Processing failed:", error);
      alert(`OCR Failure: ${error?.message || "Could not read the image"}. Falling back to manual entry.`);
      setEditingInvoice({ status: 'Pending', date: new Date().toISOString().split('T')[0] });
      setActiveTab('edit');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    const updated = storage.addInvoice(invoice);
    setInvoices(updated);
    setEditingInvoice(null);
    setSelectedInvoiceImage(undefined);
    setActiveTab('library');
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const updated = storage.deleteInvoice(id);
      setInvoices(updated);
    }
  };

  const handleUpdateStatus = (id: string, status: any) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const updated = storage.updateInvoice({ ...inv, status });
      setInvoices(updated);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoiceImage(invoice.imageUrl);
    setActiveTab('edit');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard invoices={invoices} />;
      case 'library':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Invoice Library</h1>
                <p className="text-slate-500">Manage and export all digitized documents</p>
              </div>
              <button 
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                <Plus size={20} /> New Invoice
              </button>
            </div>
            <InvoiceTable 
              invoices={invoices} 
              onDelete={handleDeleteInvoice} 
              onUpdateStatus={handleUpdateStatus}
              onView={handleViewInvoice}
            />
          </div>
        );
      case 'upload':
        return (
          <div className="max-w-4xl mx-auto py-12">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Process Your Invoices</h1>
              <p className="text-slate-500">Fast, accurate data extraction powered by Gemini AI</p>
            </div>
            <InvoiceUpload 
              onProcess={handleProcessFile} 
              isProcessing={isProcessing} 
              statusMessage={statusMessage}
            />
          </div>
        );
      case 'edit':
        return editingInvoice ? (
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('library')} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <X size={24} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Verify Extraction</h1>
                  <p className="text-slate-500">Review AI-detected fields before saving to library</p>
                </div>
             </div>
             <InvoiceForm 
                initialData={editingInvoice} 
                imageUrl={selectedInvoiceImage}
                onSave={handleSaveInvoice}
                onCancel={() => {
                  setEditingInvoice(null);
                  setSelectedInvoiceImage(undefined);
                  setActiveTab('library');
                }}
             />
          </div>
        ) : null;
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 border-r border-slate-800 flex flex-col z-20 sticky top-0 h-screen`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
             <Cpu size={18} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight">{APP_NAME}</span>}
        </div>

        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-2">
            {NAVIGATION.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="text-sm">{item.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
           {sidebarOpen && (
             <div className="bg-slate-800/50 p-4 rounded-xl mb-4 text-xs">
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold uppercase tracking-widest">
                   <Zap size={14} />
                   AI Powered
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Extracting data from images using Tesseract engine & Gemini Flash.
                </p>
             </div>
           )}
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
           >
             <Menu size={20} className="shrink-0" />
             {sidebarOpen && <span className="text-sm">Collapse</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
               Workspace / {NAVIGATION.find(n => n.id === activeTab)?.name || 'Editor'}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                 JD
               </div>
               <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">John Doe</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pro Account</p>
               </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        {/* Footer info/links */}
        <footer className="mt-auto border-t border-slate-200 p-8 text-slate-400 text-sm">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p>&copy; 2024 BillDigitize AI. Intelligent Financial Automation.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-blue-600 transition-colors">Integration API</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Vendor Database</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Settings</a>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
