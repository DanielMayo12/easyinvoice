import { LineItem } from '@/types/invoice';
import { CURRENCIES } from '@/constants/currencies';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '$';
}

export function calculateLineItemTotal(item: LineItem): number {
  return item.quantity * item.rate;
}

export function calculateInvoiceSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${rand}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
