
export type InvoiceStatus = 'Pending' | 'Verified' | 'Paid';

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  category?: string;
  gstRate?: number; // e.g., 18
}

export interface Invoice {
  id: string;
  vendorName: string;
  vendorGstin?: string; // GST Identification Number
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  lineItems: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  totalAmount: number;
  status: InvoiceStatus;
  imageUrl?: string;
  rawText?: string;
  confidence: number;
  createdAt: string;
  paymentDate?: string;
  currency: string; // Default 'INR'
}

export interface DashboardStats {
  totalProcessed: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  topVendors: { name: string; amount: number }[];
}

export interface AIExtractionResult {
  vendorName: string;
  vendorGstin?: string;
  invoiceNumber: string;
  date: string;
  lineItems: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  totalAmount: number;
  confidence: number;
}
