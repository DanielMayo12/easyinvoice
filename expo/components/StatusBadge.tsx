import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { InvoiceStatus } from '@/types/invoice';

interface StatusBadgeProps {
  status: InvoiceStatus;
  size?: 'small' | 'default';
}

export function getStatusConfig(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return { color: Colors.success, bg: Colors.successBg, label: 'Paid' };
    case 'sent':
      return { color: Colors.primary, bg: Colors.primaryBg, label: 'Sent' };
    default:
      return { color: Colors.textTertiary, bg: Colors.surfaceAlt, label: 'Draft' };
  }
}

const StatusBadge = React.memo(function StatusBadge({
  status,
  size = 'default',
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: config.color }, isSmall && styles.dotSmall]} />
      <Text style={[styles.label, { color: config.color }, isSmall && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
});

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  labelSmall: {
    fontSize: 11,
  },
});
