import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  shakeAnim?: Animated.Value;
}

const FormField = React.memo(function FormField({
  label,
  required,
  children,
  error,
  shakeAnim,
}: FormFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error && shakeAnim ? (
        <Animated.View
          style={[styles.errorRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          <AlertCircle size={12} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
});

export default FormField;

const styles = StyleSheet.create({
  fieldWrapper: {},
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  required: {
    color: Colors.danger,
  },
  errorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
});
