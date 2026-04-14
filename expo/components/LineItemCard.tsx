import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LineItem } from '@/types/invoice';
import { calculateLineItemTotal, formatCurrency } from '@/utils/invoice';

interface LineItemCardProps {
  item: LineItem;
  index: number;
  currency: string;
  canRemove: boolean;
  onUpdate: (itemId: string, field: keyof LineItem, value: string) => void;
  onRemove: (itemId: string) => void;
}

const LineItemCard = React.memo(function LineItemCard({
  item,
  index,
  currency,
  canRemove,
  onUpdate,
  onRemove,
}: LineItemCardProps) {
  const itemTotal = calculateLineItemTotal(item);

  return (
    <View style={styles.lineItemCard}>
      <View style={styles.lineItemHeader}>
        <View style={styles.lineItemBadge}>
          <Text style={styles.lineItemBadgeText}>#{index + 1}</Text>
        </View>
        <View style={styles.lineItemHeaderRight}>
          <Text style={styles.lineItemLiveTotal}>
            {formatCurrency(itemTotal, currency)}
          </Text>
          {canRemove && (
            <TouchableOpacity
              onPress={() => onRemove(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.removeBtn}
            >
              <Trash2 size={13} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TextInput
        style={styles.lineItemDescInput}
        value={item.description}
        onChangeText={(v) => onUpdate(item.id, 'description', v)}
        placeholder="Description (e.g. Web Design)"
        placeholderTextColor={Colors.textTertiary}
        returnKeyType="next"
      />

      <View style={styles.lineItemNumbers}>
        <View style={styles.lineItemNumField}>
          <Text style={styles.lineItemNumLabel}>Qty</Text>
          <TextInput
            style={styles.lineItemNumInput}
            value={item.quantity ? String(item.quantity) : ''}
            onChangeText={(v) => onUpdate(item.id, 'quantity', v)}
            placeholder="1"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={styles.lineItemMultiply}>
          <Text style={styles.lineItemMultiplyText}>×</Text>
        </View>
        <View style={styles.lineItemNumField}>
          <Text style={styles.lineItemNumLabel}>Rate</Text>
          <TextInput
            style={styles.lineItemNumInput}
            value={item.rate ? String(item.rate) : ''}
            onChangeText={(v) => onUpdate(item.id, 'rate', v)}
            placeholder="0.00"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={styles.lineItemEquals}>
          <Text style={styles.lineItemEqualsText}>=</Text>
        </View>
        <View style={styles.lineItemTotalField}>
          <Text style={styles.lineItemNumLabel}>Total</Text>
          <View style={styles.lineItemTotalBox}>
            <Text style={styles.lineItemTotalValue}>
              {formatCurrency(itemTotal, currency)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export default LineItemCard;

const styles = StyleSheet.create({
  lineItemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  lineItemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  lineItemBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lineItemBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  lineItemHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  lineItemLiveTotal: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lineItemDescInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  lineItemNumbers: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 4,
  },
  lineItemNumField: {
    flex: 1,
  },
  lineItemNumLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    marginBottom: 4,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  lineItemNumInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textAlign: 'center' as const,
  },
  lineItemMultiply: {
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  lineItemMultiplyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  lineItemEquals: {
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  lineItemEqualsText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  lineItemTotalField: {
    flex: 1.2,
    alignItems: 'center' as const,
  },
  lineItemTotalBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 9,
    width: '100%',
    alignItems: 'center' as const,
  },
  lineItemTotalValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
