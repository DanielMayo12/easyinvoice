import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'success';
  testID?: string;
}

const PrimaryButton = React.memo(function PrimaryButton({
  children,
  onPress,
  style,
  variant = 'primary',
  testID,
}: PrimaryButtonProps) {
  const bgColor = variant === 'success' ? Colors.success : Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, shadowStyle(bgColor), style]}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
});

function shadowStyle(color: string) {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    web: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
  });
}

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
});

export const buttonTextStyle = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
});
