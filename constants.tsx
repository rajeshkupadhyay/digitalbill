
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Settings, 
  CheckCircle, 
  Clock, 
  CreditCard 
} from 'lucide-react';

export const APP_NAME = "BillDigitize AI";
export const CURRENCY_SYMBOL = "₹";

export const INVOICE_STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Verified: 'bg-blue-100 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const NAVIGATION = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, id: 'dashboard' },
  { name: 'Invoice Library', icon: <FileText size={20} />, id: 'library' },
  { name: 'Process New', icon: <Upload size={20} />, id: 'upload' },
];

export const SYSTEM_PROMPT = `You are an expert invoice digitization AI specialized in Indian Invoices (GST).
Analyze the provided raw OCR text and extract structured data.

GUIDELINES:
1. Vendor Normalization: Normalize vendor names. Identify the "GSTIN" (GST Identification Number) of the vendor.
2. GST Extraction: Extract CGST, SGST, and IGST components. Note that for local sales, CGST and SGST are usually present and equal. For interstate, IGST is present.
3. Default GST: Business transactions in India often have a GST rate of 18%.
4. Line Items: Extract description, quantity, rate, amount, and the GST rate applied to each item if visible.
5. Categorization: Detect expense category (e.g., Office Supplies, Utilities, Software, Rent).
6. Validation: Ensure (subtotal + CGST + SGST + IGST) equals totalAmount. 
7. Currency: The currency is Indian Rupee (INR).
8. Date Formatting: Convert all dates to YYYY-MM-DD.

Return the data in the specified JSON schema.`;
