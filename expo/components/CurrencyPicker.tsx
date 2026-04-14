import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CURRENCIES } from '@/constants/currencies';

interface CurrencyPickerProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

const CurrencyPicker = React.memo(function CurrencyPicker({
  selectedCode,
  onSelect,
}: CurrencyPickerProps) {
  return (
    <View style={styles.currencyDropdown}>
      {CURRENCIES.map((c) => (
        <TouchableOpacity
          key={c.code}
          style={[
            styles.currencyOption,
            selectedCode === c.code && styles.currencyOptionActive,
          ]}
          onPress={() => onSelect(c.code)}
          activeOpacity={0.7}
        >
          <Text style={styles.currencySymbol}>{c.symbol}</Text>
          <Text style={styles.currencyName}>{c.name}</Text>
          {selectedCode === c.code && (
            <Check size={14} color={Colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
});

export default CurrencyPicker;

const styles = StyleSheet.create({
  currencyDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  currencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  currencyOptionActive: {
    backgroundColor: Colors.primaryBg,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 24,
    textAlign: 'center' as const,
  },
  currencyName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
});
