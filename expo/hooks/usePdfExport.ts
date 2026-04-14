import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Invoice } from '@/types/invoice';
import { generateInvoiceHtml } from '@/utils/invoiceHtml';

export function usePdfExport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(
    async (invoice: Invoice, logoUri?: string): Promise<string | null> => {
      try {
        console.log('[PDF] Generating PDF for:', invoice.invoiceNumber);
        const html = generateInvoiceHtml(invoice, logoUri);
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        console.log('[PDF] Generated at:', uri);
        return uri;
      } catch (error) {
        console.log('[PDF] Generation error:', error);
        return null;
      }
    },
    []
  );

  const sharePdf = useCallback(
    async (invoice: Invoice, logoUri?: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsGenerating(true);
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
        const uri = await generatePdf(invoice, logoUri);
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
          console.log('[PDF] Shared successfully');
        } else {
          Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        }
      } catch (e) {
        console.log('[PDF] Share error:', e);
        Alert.alert('Share Failed', 'Something went wrong while sharing. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePdf]
  );

  const printPdf = useCallback(
    async (invoice: Invoice, logoUri?: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsGenerating(true);
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
        console.log('[PDF] Print dialog opened');
      } catch (e) {
        console.log('[PDF] Export error:', e);
        Alert.alert('Export Failed', 'Could not generate the PDF. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return { isGenerating, sharePdf, printPdf };
}
