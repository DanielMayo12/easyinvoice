import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Invoice } from '@/types/invoice';
import { formatCurrency, formatDate, calculateInvoiceSubtotal } from '@/utils/invoice';
import StatusBadge from '@/components/StatusBadge';

interface InvoiceCardProps {
  invoice: Invoice;
  isMenuOpen: boolean;
  onPress: (id: string) => void;
  onMenuToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isLast?: boolean;
}

const InvoiceCard = React.memo(function InvoiceCard({
  invoice,
  isMenuOpen,
  onPress,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onDelete,
  isLast = false,
}: InvoiceCardProps) {
  const total = calculateInvoiceSubtotal(invoice.lineItems);

  return (
    <View>
      <TouchableOpacity
        style={[styles.invoiceCard, isLast && { marginBottom: 0 }]}
        onPress={() => onPress(invoice.id)}
        activeOpacity={0.7}
        testID={`invoice-card-${invoice.id}`}
      >
        <View style={styles.invoiceCardBody}>
          <View style={styles.invoiceCardTop}>
            <View style={styles.invoiceCardMeta}>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <StatusBadge status={invoice.status} size="small" />
            </View>
            <View style={styles.invoiceCardActions}>
              <Text style={styles.invoiceAmount}>
                {formatCurrency(total, invoice.currency)}
              </Text>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => onMenuToggle(invoice.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MoreHorizontal size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.invoiceCardBottom}>
            <Text style={styles.clientName} numberOfLines={1}>
              {invoice.clientName || 'No client'}
            </Text>
            <Text style={styles.invoiceDate}>{formatDate(invoice.issueDate)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {isMenuOpen && (
        <View style={styles.contextMenu}>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => onEdit(invoice.id)}
            activeOpacity={0.7}
          >
            <Pencil size={14} color={Colors.warning} />
            <Text style={styles.contextMenuText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.contextMenuDivider} />
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => onDuplicate(invoice.id)}
            activeOpacity={0.7}
          >
            <Copy size={14} color={Colors.primary} />
            <Text style={styles.contextMenuText}>Duplicate</Text>
          </TouchableOpacity>
          <View style={styles.contextMenuDivider} />
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => onDelete(invoice.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color={Colors.danger} />
            <Text style={[styles.contextMenuText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default InvoiceCard;

const styles = StyleSheet.create({
  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceCardBody: {
    flex: 1,
  },
  invoiceCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  invoiceCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  invoiceCardActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  invoiceCardBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  clientName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  contextMenu: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  contextMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextMenuText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },
});
