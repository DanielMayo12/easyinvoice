import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconOuter}>
        <View style={styles.emptyIconInner}>
          {icon}
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          {actionIcon}
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

export default EmptyState;

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyIconInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
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
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 240,
  },
  emptyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
