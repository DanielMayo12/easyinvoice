import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { formatCurrency } from '@/utils/invoice';

interface InvoiceSummaryCardProps {
  subtotal: number;
  currency: string;
}

const InvoiceSummaryCard = React.memo(function InvoiceSummaryCard({
  subtotal,
  currency,
}: InvoiceSummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(subtotal, currency)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryGrandLabel}>Total Due</Text>
        <Text style={styles.summaryGrandValue}>
          {formatCurrency(subtotal, currency)}
        </Text>
      </View>
    </View>
  );
});

export default InvoiceSummaryCard;

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 2,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryGrandLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryGrandValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
});
