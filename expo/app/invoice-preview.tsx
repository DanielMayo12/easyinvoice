import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Download, Send, Trash2, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { formatCurrency, formatDate, calculateLineItemTotal, calculateInvoiceSubtotal } from '@/types/invoice';

export default function InvoicePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const invoice = getInvoice(id ?? '');
  const subtotal = useMemo(() => (invoice ? calculateInvoiceSubtotal(invoice.lineItems) : 0), [invoice]);

  const handleShare = useCallback(async () => {
    if (!invoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const itemLines = invoice.lineItems.map((item) => `  ${item.description} - ${item.quantity} x ${formatCurrency(item.rate, invoice.currency)} = ${formatCurrency(calculateLineItemTotal(item), invoice.currency)}`).join('\n');
    const text = `Invoice ${invoice.invoiceNumber}\nFrom: ${invoice.businessName}\nTo: ${invoice.clientName}\nDate: ${formatDate(invoice.issueDate)}\nDue: ${formatDate(invoice.dueDate)}\n\nItems:\n${itemLines}\n\nTotal: ${formatCurrency(subtotal, invoice.currency)}${invoice.notes ? `\n\nNotes: ${invoice.notes}` : ''}`;
    try { await Share.share({ message: text, title: `Invoice ${invoice.invoiceNumber}` }); } catch (e) { console.log('[InvoicePreview] Share error:', e); }
  }, [invoice, subtotal]);

  const handleExportPDF = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Export PDF', 'PDF export will be available in a future update.', [{ text: 'OK' }]);
  }, []);

  const handleMarkPaid = useCallback(() => { if (!invoice) return; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); updateInvoice({ ...invoice, status: 'paid' }); }, [invoice, updateInvoice]);
  const handleMarkSent = useCallback(() => { if (!invoice) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); updateInvoice({ ...invoice, status: 'sent' }); }, [invoice, updateInvoice]);

  const handleDelete = useCallback(() => {
    if (!invoice) return;
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteInvoice(invoice.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); } },
    ]);
  }, [invoice, deleteInvoice, router]);

  if (!invoice) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Invoice' }} />
        <Text style={styles.emptyText}>Invoice not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const statusColor = invoice.status === 'paid' ? Colors.success : invoice.status === 'sent' ? Colors.primaryLight : Colors.textTertiary;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Invoice ${invoice.invoiceNumber}` }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBar}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</Text>
          </View>
          {invoice.status !== 'paid' && (
            <TouchableOpacity style={styles.markPaidBtn} onPress={invoice.status === 'draft' ? handleMarkSent : handleMarkPaid} activeOpacity={0.7}>
              <CheckCircle size={14} color={Colors.success} />
              <Text style={styles.markPaidText}>{invoice.status === 'draft' ? 'Mark Sent' : 'Mark Paid'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.invoiceDocument}>
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.docTitle}>INVOICE</Text>
              <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.docHeaderRight}>
              <Text style={styles.docDateLabel}>Issue Date</Text>
              <Text style={styles.docDateValue}>{formatDate(invoice.issueDate)}</Text>
              <Text style={[styles.docDateLabel, { marginTop: 6 }]}>Due Date</Text>
              <Text style={styles.docDateValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
          <View style={styles.docDivider} />
          <View style={styles.partiesRow}>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>From</Text>
              {invoice.businessName ? <Text style={styles.partyName}>{invoice.businessName}</Text> : null}
              {invoice.businessEmail ? <Text style={styles.partyDetail}>{invoice.businessEmail}</Text> : null}
              {invoice.businessPhone ? <Text style={styles.partyDetail}>{invoice.businessPhone}</Text> : null}
              {invoice.businessAddress ? <Text style={styles.partyDetail}>{invoice.businessAddress}</Text> : null}
            </View>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>Bill To</Text>
              <Text style={styles.partyName}>{invoice.clientName}</Text>
              {invoice.clientEmail ? <Text style={styles.partyDetail}>{invoice.clientEmail}</Text> : null}
            </View>
          </View>
          <View style={styles.docDivider} />
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.tableCenter]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableRight]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.tableRight]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.tableCenter]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{formatCurrency(item.rate, invoice.currency)}</Text>
              <Text style={[styles.tableCell, styles.tableRight, styles.tableCellBold]}>{formatCurrency(calculateLineItemTotal(item), invoice.currency)}</Text>
            </View>
          ))}
          <View style={styles.docDivider} />
          <View style={styles.totalsSection}>
            <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Subtotal</Text><Text style={styles.totalsValue}>{formatCurrency(subtotal, invoice.currency)}</Text></View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}><Text style={styles.grandTotalLabel}>Total Due</Text><Text style={styles.grandTotalValue}>{formatCurrency(subtotal, invoice.currency)}</Text></View>
          </View>
          {invoice.notes ? (<View style={styles.notesSection}><Text style={styles.notesLabel}>Notes</Text><Text style={styles.notesText}>{invoice.notes}</Text></View>) : null}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7} testID="share-button"><Send size={18} color={Colors.primary} /><Text style={styles.actionBtnText}>Share</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExportPDF} activeOpacity={0.7} testID="export-pdf-button"><Download size={18} color={Colors.primary} /><Text style={styles.actionBtnText}>Export</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete} activeOpacity={0.7} testID="delete-button"><Trash2 size={18} color={Colors.danger} /><Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 50 },
  emptyContainer: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.surface, padding: 20 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 16 },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: Colors.textInverse, fontSize: 15, fontWeight: '600' as const },
  statusBar: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
  statusBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' as const },
  markPaidBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.successBg },
  markPaidText: { fontSize: 13, fontWeight: '600' as const, color: Colors.success },
  invoiceDocument: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 }, web: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 } }) },
  docHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
  docHeaderRight: { alignItems: 'flex-end' as const },
  docTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.primary, letterSpacing: 2 },
  invoiceNum: { fontSize: 14, fontWeight: '500' as const, color: Colors.textSecondary, marginTop: 2 },
  docDateLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' as const },
  docDateValue: { fontSize: 14, color: Colors.text, fontWeight: '600' as const },
  docDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  partiesRow: { flexDirection: 'row' as const, gap: 20 },
  partyBlock: { flex: 1 },
  partyLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 },
  partyName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 2 },
  partyDetail: { fontSize: 13, color: Colors.textSecondary, marginBottom: 1 },
  tableHeader: { flexDirection: 'row' as const, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  tableHeaderText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, flex: 1 },
  tableCenter: { textAlign: 'center' as const },
  tableRight: { textAlign: 'right' as const },
  tableRow: { flexDirection: 'row' as const, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tableCell: { fontSize: 13, color: Colors.text, flex: 1 },
  tableCellBold: { fontWeight: '600' as const },
  totalsSection: { alignItems: 'flex-end' as const },
  totalsRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, width: '60%', paddingVertical: 4 },
  totalsLabel: { fontSize: 14, color: Colors.textSecondary },
  totalsValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  totalsDivider: { height: 1, backgroundColor: Colors.border, width: '60%', marginVertical: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.primary },
  notesSection: { marginTop: 16, backgroundColor: Colors.surface, borderRadius: 10, padding: 12 },
  notesLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  actionsRow: { flexDirection: 'row' as const, gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, backgroundColor: Colors.card, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border },
  actionBtnDanger: { borderColor: Colors.dangerBg, backgroundColor: Colors.dangerBg },
  actionBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
});
