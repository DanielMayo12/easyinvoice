import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { Invoice } from '@/types/invoice';
import { formatCurrency, formatDate, calculateInvoiceSubtotal } from '@/utils/invoice';
import StatusBadge from '@/components/StatusBadge';

function getTimeSince(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

interface InvoiceRowProps {
  invoice: Invoice;
  onPress: (id: string) => void;
  index: number;
}

const InvoiceRow = React.memo(function InvoiceRow({ invoice, onPress, index }: InvoiceRowProps) {
  const total = calculateInvoiceSubtotal(invoice.lineItems);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: 100 + index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: 100 + index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const avatarBg =
    invoice.status === 'paid'
      ? '#ECFDF5'
      : invoice.status === 'sent'
        ? '#EBF3FF'
        : '#F8FAFC';

  const avatarColor =
    invoice.status === 'paid'
      ? Colors.success
      : invoice.status === 'sent'
        ? Colors.primary
        : Colors.textTertiary;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPress(invoice.id)}
        activeOpacity={0.6}
        testID={`invoice-row-${invoice.id}`}
      >
        <View style={styles.left}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {(invoice.clientName || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.client} numberOfLines={1}>
              {invoice.clientName || 'Unnamed Client'}
            </Text>
            <View style={styles.subMeta}>
              <Text style={styles.number}>{invoice.invoiceNumber}</Text>
              <View style={styles.dot} />
              <Text style={styles.time}>{getTimeSince(invoice.createdAt)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>
            {formatCurrency(total, invoice.currency)}
          </Text>
          <StatusBadge status={invoice.status} size="small" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default InvoiceRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  left: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  meta: {
    flex: 1,
  },
  client: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  subMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  number: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },
  time: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  right: {
    alignItems: 'flex-end' as const,
    gap: 5,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
});
