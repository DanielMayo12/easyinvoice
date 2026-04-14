import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Invoice } from '@/types/invoice';

const STORAGE_KEY = 'easyinvoice_invoices';

export const [InvoiceProvider, useInvoices] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as Invoice[] : [];
    },
  });

  useEffect(() => {
    if (invoicesQuery.data) setInvoices(invoicesQuery.data);
  }, [invoicesQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: Invoice[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['invoices'], data),
  });

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => { const updated = [invoice, ...prev]; syncMutation.mutate(updated); return updated; });
  }, [syncMutation]);

  const updateInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => { const updated = prev.map((i) => (i.id === invoice.id ? invoice : i)); syncMutation.mutate(updated); return updated; });
  }, [syncMutation]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => { const updated = prev.filter((i) => i.id !== id); syncMutation.mutate(updated); return updated; });
  }, [syncMutation]);

  const getInvoice = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices]);

  const totalAmount = useMemo(() => invoices.reduce((sum, inv) => sum + inv.lineItems.reduce((s, item) => s + item.quantity * item.rate, 0), 0), [invoices]);
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  return { invoices, recentInvoices, totalAmount, isLoading: invoicesQuery.isLoading, addInvoice, updateInvoice, deleteInvoice, getInvoice };
});
