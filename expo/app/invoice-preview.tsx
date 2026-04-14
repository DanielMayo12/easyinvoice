import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Send,
  Download,
  Trash2,
  CheckCircle,
  ArrowRight,
  FileText,
  Pencil,
  Copy,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import {
  formatCurrency,
  formatDate,
  calculateLineItemTotal,
  calculateInvoiceSubtotal,
} from '@/utils/invoice';
import { generateInvoiceHtml } from '@/utils/invoiceHtml';
import StatusBadge, { getStatusConfig } from '@/components/StatusBadge';
import ActionCard from '@/components/ActionCard';

export default function InvoicePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getInvoice, updateInvoice, deleteInvoice, duplicateInvoice } = useInvoices();
  const { settings } = useSettings();
  const invoice = getInvoice(id ?? '');
  const logoUri = settings.logoUri;
  const subtotal = useMemo(
    () => (invoice ? calculateInvoiceSubtotal(invoice.lineItems) : 0),
    [invoice]
  );

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleEdit = useCallback(() => {
    if (!invoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/create-invoice', params: { id: invoice.id } });
  }, [invoice, router]);

  const handleDuplicate = useCallback(() => {
    if (!invoice) return;
    Alert.alert(
      'Duplicate Invoice',
      'Create a copy of this invoice with a new number and today\'s date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            const newInvoice = duplicateInvoice(invoice.id);
            if (newInvoice) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('[InvoicePreview] Duplicated invoice:', newInvoice.id);
              router.replace({ pathname: '/invoice-preview', params: { id: newInvoice.id } });
            }
          },
        },
      ]
    );
  }, [invoice, duplicateInvoice, router]);

  const generatePdf = useCallback(async (): Promise<string | null> => {
    if (!invoice) return null;
    try {
      console.log('[InvoicePreview] Generating PDF for:', invoice.invoiceNumber);
      const html = generateInvoiceHtml(invoice, logoUri);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      console.log('[InvoicePreview] PDF generated at:', uri);
      return uri;
    } catch (error) {
      console.log('[InvoicePreview] PDF generation error:', error);
      return null;
    }
  }, [invoice, logoUri]);

  const handleShare = useCallback(async () => {
    if (!invoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGeneratingPdf(true);
    try {
      if (Platform.OS === 'web') {
        const html = generateInvoiceHtml(invoice, logoUri);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }
      const uri = await generatePdf();
      if (!uri) {
        Alert.alert('Error', 'Could not generate PDF. Please try again.');
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoice.invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
        console.log('[InvoicePreview] Shared PDF successfully');
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (e) {
      console.log('[InvoicePreview] Share error:', e);
      Alert.alert('Share Failed', 'Something went wrong while sharing. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [invoice, generatePdf, logoUri]);

  const handleExportPDF = useCallback(async () => {
    if (!invoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGeneratingPdf(true);
    try {
      if (Platform.OS === 'web') {
        const html = generateInvoiceHtml(invoice, logoUri);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }
      const html = generateInvoiceHtml(invoice, logoUri);
      await Print.printAsync({ html });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[InvoicePreview] Print dialog opened');
    } catch (e) {
      console.log('[InvoicePreview] Export PDF error:', e);
      Alert.alert('Export Failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [invoice, logoUri]);

  const handleMarkPaid = useCallback(() => {
    if (!invoice) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateInvoice({ ...invoice, status: 'paid' });
  }, [invoice, updateInvoice]);

  const handleMarkSent = useCallback(() => {
    if (!invoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateInvoice({ ...invoice, status: 'sent' });
  }, [invoice, updateInvoice]);

  const handleDelete = useCallback(() => {
    if (!invoice) return;
    Alert.alert(
      'Delete Invoice',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteInvoice(invoice.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            console.log('[InvoicePreview] Deleted invoice:', invoice.id);
            router.back();
          },
        },
      ]
    );
  }, [invoice, deleteInvoice, router]);

  if (!invoice) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Invoice' }} />
        <View style={styles.emptyIconWrap}>
          <FileText size={32} color={Colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Invoice not found</Text>
        <Text style={styles.emptySubtitle}>This invoice may have been deleted</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.emptyBackBtn}>
          <Text style={styles.emptyBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextAction =
    invoice.status === 'draft'
      ? { label: 'Mark as Sent', onPress: handleMarkSent }
      : invoice.status === 'sent'
        ? { label: 'Mark as Paid', onPress: handleMarkPaid }
        : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: invoice.invoiceNumber,
          headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          <StatusBadge status={invoice.status} />
          {nextAction && (
            <TouchableOpacity
              style={styles.nextActionBtn}
              onPress={nextAction.onPress}
              activeOpacity={0.7}
            >
              <CheckCircle size={14} color={Colors.success} />
              <Text style={styles.nextActionText}>{nextAction.label}</Text>
              <ArrowRight size={12} color={Colors.success} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.document}>
          <View style={styles.docTopBar} />
          <View style={styles.docContent}>
            <View style={styles.docHeader}>
              <View style={styles.docHeaderLeft}>
                {logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.docLogo}
                    contentFit="contain"
                    testID="invoice-logo"
                  />
                ) : null}
                <Text style={styles.docInvoiceWord}>INVOICE</Text>
                <Text style={styles.docInvoiceNum}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.docHeaderRight}>
                <View style={styles.docDateBlock}>
                  <Text style={styles.docDateLabel}>Issued</Text>
                  <Text style={styles.docDateValue}>{formatDate(invoice.issueDate)}</Text>
                </View>
                <View style={styles.docDateBlock}>
                  <Text style={styles.docDateLabel}>Due</Text>
                  <Text style={styles.docDateValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.docSeparator} />

            <View style={styles.partiesRow}>
              <View style={styles.partyCol}>
                <Text style={styles.partyTag}>FROM</Text>
                {invoice.businessName ? <Text style={styles.partyName}>{invoice.businessName}</Text> : null}
                {invoice.businessEmail ? <Text style={styles.partyDetail}>{invoice.businessEmail}</Text> : null}
                {invoice.businessPhone ? <Text style={styles.partyDetail}>{invoice.businessPhone}</Text> : null}
                {invoice.businessAddress ? <Text style={styles.partyDetail}>{invoice.businessAddress}</Text> : null}
              </View>
              <View style={styles.partyCol}>
                <Text style={styles.partyTag}>BILL TO</Text>
                <Text style={styles.partyName}>{invoice.clientName}</Text>
                {invoice.clientEmail ? <Text style={styles.partyDetail}>{invoice.clientEmail}</Text> : null}
              </View>
            </View>

            <View style={styles.tableSection}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeadCell, styles.qtyCol]}>Qty</Text>
                <Text style={[styles.tableHeadCell, styles.rateCol]}>Rate</Text>
                <Text style={[styles.tableHeadCell, styles.amtCol]}>Amount</Text>
              </View>
              {invoice.lineItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                >
                  <Text style={[styles.tableCell, styles.descCol]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.rateCol]}>
                    {formatCurrency(item.rate, invoice.currency)}
                  </Text>
                  <Text style={[styles.tableCell, styles.amtCol, styles.amtBold]}>
                    {formatCurrency(calculateLineItemTotal(item), invoice.currency)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.docSeparator} />

            <View style={styles.totalsBlock}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(subtotal, invoice.currency)}
                </Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.totalsRow}>
                <Text style={styles.totalDueLabel}>Total Due</Text>
                <Text style={styles.totalDueValue}>
                  {formatCurrency(subtotal, invoice.currency)}
                </Text>
              </View>
            </View>

            {invoice.notes ? (
              <View style={styles.notesBlock}>
                <Text style={styles.notesTag}>NOTES</Text>
                <Text style={styles.notesContent}>{invoice.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <View style={styles.actionsRow}>
            <ActionCard
              icon={<Pencil size={16} color={Colors.warning} />}
              label="Edit"
              iconBg={Colors.warningBg}
              onPress={handleEdit}
              testID="edit-button"
            />
            <ActionCard
              icon={<Copy size={16} color={Colors.primary} />}
              label="Duplicate"
              iconBg={Colors.primaryBg}
              onPress={handleDuplicate}
              testID="duplicate-button"
            />
            <ActionCard
              icon={<Send size={16} color={Colors.success} />}
              label="Share PDF"
              iconBg={Colors.successBg}
              onPress={handleShare}
              disabled={isGeneratingPdf}
              loading={isGeneratingPdf}
              loadingColor={Colors.success}
              testID="share-button"
            />
          </View>
          <View style={[styles.actionsRow, { marginTop: 10 }]}>
            <ActionCard
              icon={<Download size={16} color={Colors.textSecondary} />}
              label="Print PDF"
              iconBg={Colors.surfaceAlt}
              onPress={handleExportPDF}
              disabled={isGeneratingPdf}
              loading={isGeneratingPdf}
              loadingColor={Colors.textSecondary}
              testID="export-pdf-button"
            />
            <ActionCard
              icon={<Trash2 size={16} color={Colors.danger} />}
              label="Delete"
              iconBg={Colors.dangerBg}
              onPress={handleDelete}
              labelColor={Colors.danger}
              testID="delete-button"
            />
            <View style={styles.actionCardPlaceholder} />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.surface,
    padding: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  emptyBackBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBackBtnText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  statusSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  nextActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.successBg,
  },
  nextActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  document: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      web: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  docTopBar: {
    height: 4,
    backgroundColor: Colors.primary,
  },
  docContent: {
    padding: 22,
  },
  docHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  docLogo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  docHeaderLeft: {},
  docHeaderRight: {
    alignItems: 'flex-end' as const,
    gap: 8,
  },
  docInvoiceWord: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 3,
  },
  docInvoiceNum: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  docDateBlock: {},
  docDateLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  docDateValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  docSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 18,
  },
  partiesRow: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  partyCol: {
    flex: 1,
  },
  partyTag: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tableSection: {
    marginTop: 18,
  },
  tableHead: {
    flexDirection: 'row' as const,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeadCell: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  descCol: { flex: 3 },
  qtyCol: { flex: 1, textAlign: 'center' as const },
  rateCol: { flex: 1.5, textAlign: 'right' as const },
  amtCol: { flex: 1.5, textAlign: 'right' as const },
  tableRow: {
    flexDirection: 'row' as const,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(248,250,252,0.5)',
  },
  tableCell: {
    fontSize: 13,
    color: Colors.text,
  },
  amtBold: {
    fontWeight: '600' as const,
  },
  totalsBlock: {
    alignItems: 'flex-end' as const,
  },
  totalsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '55%',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '55%',
    marginVertical: 10,
  },
  totalDueLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalDueValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  notesBlock: {
    marginTop: 20,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
  },
  notesTag: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {},
  actionsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  actionCardPlaceholder: {
    flex: 1,
  },
});
