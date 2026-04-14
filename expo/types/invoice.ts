export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  clientName: string;
  clientEmail: string;
  lineItems: LineItem[];
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
}

export type InvoiceStatus = Invoice['status'];

export interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  defaultCurrency: string;
  logoUri: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}
