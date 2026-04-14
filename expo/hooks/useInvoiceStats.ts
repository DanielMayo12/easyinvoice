import { useMemo } from 'react';
import { useInvoices } from '@/context/InvoiceContext';
import { calculateInvoiceSubtotal } from '@/utils/invoice';

export function useInvoiceStats() {
  const { invoices, recentInvoices, totalAmount } = useInvoices();

  const paidCount = useMemo(
    () => invoices.filter((i) => i.status === 'paid').length,
    [invoices]
  );

  const pendingCount = useMemo(
    () => invoices.filter((i) => i.status === 'sent').length,
    [invoices]
  );

  const paidAmount = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, inv) => sum + calculateInvoiceSubtotal(inv.lineItems), 0),
    [invoices]
  );

  return {
    totalCount: invoices.length,
    paidCount,
    pendingCount,
    totalAmount,
    paidAmount,
    invoices,
    recentInvoices,
  };
}
