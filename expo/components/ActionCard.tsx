import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  iconBg: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingColor?: string;
  labelColor?: string;
  testID?: string;
}

const ActionCard = React.memo(function ActionCard({
  icon,
  label,
  iconBg,
  onPress,
  disabled = false,
  loading = false,
  loadingColor,
  labelColor,
  testID,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, disabled && styles.actionCardDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
      disabled={disabled}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        {loading ? (
          <ActivityIndicator size="small" color={loadingColor ?? Colors.textSecondary} />
        ) : (
          icon
        )}
      </View>
      <Text style={[styles.actionLabel, labelColor ? { color: labelColor } : undefined]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

export default ActionCard;

const styles = StyleSheet.create({
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
