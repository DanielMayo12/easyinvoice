import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Info,
  Check,
  ChevronRight,
  Palette,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { CURRENCIES } from '@/types/invoice';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleCurrencySelect = useCallback(
    (code: string) => {
      updateSettings({ defaultCurrency: code });
      setShowCurrencyPicker(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateSettings]
  );

  const selectedCurrency = CURRENCIES.find(
    (c) => c.code === settings.defaultCurrency
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Configure your business defaults
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Business Details</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <View
              style={[styles.inputIcon, { backgroundColor: Colors.primaryBg }]}
            >
              <Building2 size={16} color={Colors.primary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={settings.businessName}
                onChangeText={(v) => updateSettings({ businessName: v })}
                placeholder="Your Business Name"
                placeholderTextColor={Colors.textTertiary}
                testID="settings-business-name"
              />
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.inputRow}>
            <View
              style={[styles.inputIcon, { backgroundColor: Colors.primaryBg }]}
            >
              <Mail size={16} color={Colors.primary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={settings.businessEmail}
                onChangeText={(v) => updateSettings({ businessEmail: v })}
                placeholder="email@business.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="settings-business-email"
              />
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.inputRow}>
            <View
              style={[styles.inputIcon, { backgroundColor: Colors.primaryBg }]}
            >
              <Phone size={16} color={Colors.primary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={settings.businessPhone}
                onChangeText={(v) => updateSettings({ businessPhone: v })}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                testID="settings-business-phone"
              />
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.inputRow}>
            <View
              style={[styles.inputIcon, { backgroundColor: Colors.primaryBg }]}
            >
              <MapPin size={16} color={Colors.primary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={settings.businessAddress}
                onChangeText={(v) => updateSettings({ businessAddress: v })}
                placeholder="123 Main St, City, State"
                placeholderTextColor={Colors.textTertiary}
                testID="settings-business-address"
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            activeOpacity={0.7}
            testID="currency-selector"
          >
            <View
              style={[styles.inputIcon, { backgroundColor: Colors.warningBg }]}
            >
              <DollarSign size={16} color={Colors.warning} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Default Currency</Text>
              <Text style={styles.inputValue}>
                {selectedCurrency
                  ? `${selectedCurrency.symbol} ${selectedCurrency.name}`
                  : 'USD'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showCurrencyPicker && (
            <View style={styles.currencyList}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyOption,
                    settings.defaultCurrency === curr.code &&
                      styles.currencyOptionActive,
                  ]}
                  onPress={() => handleCurrencySelect(curr.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencySymbolWrap}>
                    <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                  </View>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyName}>{curr.name}</Text>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                  </View>
                  {settings.defaultCurrency === curr.code && (
                    <Check size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.separator} />
          <View style={styles.inputRow}>
            <View
              style={[
                styles.inputIcon,
                { backgroundColor: Colors.surfaceAlt },
              ]}
            >
              <Palette size={16} color={Colors.textSecondary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>App Theme</Text>
              <Text style={styles.inputValueMuted}>Coming soon</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <View
              style={[
                styles.inputIcon,
                { backgroundColor: Colors.surfaceAlt },
              ]}
            >
              <Info size={16} color={Colors.textSecondary} />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.aboutAppName}>EasyInvoice</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonSaved]}
          onPress={handleSave}
          activeOpacity={0.85}
          testID="save-settings-button"
        >
          {saved ? (
            <View style={styles.saveButtonInner}>
              <Check size={18} color={Colors.textInverse} />
              <Text style={styles.saveButtonText}>Saved!</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden' as const,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
  inputValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  inputValueMuted: {
    fontSize: 15,
    color: Colors.textTertiary,
    fontStyle: 'italic' as const,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 62,
  },
  currencyList: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 4,
  },
  currencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  currencyOptionActive: {
    backgroundColor: Colors.primaryBg,
  },
  currencySymbolWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  currencyCode: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  aboutAppName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  aboutVersion: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  saveButtonSaved: {
    backgroundColor: Colors.success,
  },
  saveButtonInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
});
