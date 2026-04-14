import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Invoice } from '@/types/invoice';
import { generateId, generateInvoiceNumber } from '@/utils/invoice';

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
    setInvoices((prev) => {
      const updated = [invoice, ...prev];
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const updateInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => {
      const updated = prev.map((i) => (i.id === invoice.id ? invoice : i));
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const getInvoice = useCallback(
    (id: string) => invoices.find((i) => i.id === id),
    [invoices]
  );

  const duplicateInvoice = useCallback((id: string) => {
    const source = invoices.find((i) => i.id === id);
    if (!source) return null;

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newInvoice: Invoice = {
      ...source,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      issueDate: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'draft',
      createdAt: now.toISOString(),
      lineItems: source.lineItems.map((item) => ({
        ...item,
        id: generateId(),
      })),
    };

    setInvoices((prev) => {
      const updated = [newInvoice, ...prev];
      syncMutation.mutate(updated);
      return updated;
    });

    return newInvoice;
  }, [invoices, syncMutation]);

  const totalAmount = useMemo(
    () => invoices.reduce(
      (sum, inv) => sum + inv.lineItems.reduce((s, item) => s + item.quantity * item.rate, 0),
      0
    ),
    [invoices]
  );

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  return {
    invoices,
    recentInvoices,
    totalAmount,
    isLoading: invoicesQuery.isLoading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    duplicateInvoice,
  };
});
