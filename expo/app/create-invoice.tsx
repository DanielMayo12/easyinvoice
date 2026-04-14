import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Plus,
  Trash2,
  ChevronDown,
  Building2,
  User,
  FileText,
  Package,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import {
  Invoice,
  LineItem,
  CURRENCIES,
  generateInvoiceNumber,
  calculateLineItemTotal,
  calculateInvoiceSubtotal,
  formatCurrency,
  getCurrencySymbol,
} from '@/types/invoice';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}
function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

interface ValidationErrors {
  clientName?: string;
  lineItems?: string;
}

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { addInvoice } = useInvoices();
  const { settings } = useSettings();

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessEmail, setBusinessEmail] = useState(settings.businessEmail);
  const [businessPhone, setBusinessPhone] = useState(settings.businessPhone);
  const [businessAddress, setBusinessAddress] = useState(settings.businessAddress);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [issueDate, setIssueDate] = useState(getTodayStr());
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, rate: 0 },
  ]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<ScrollView>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const subtotal = useMemo(
    () => calculateInvoiceSubtotal(lineItems),
    [lineItems]
  );

  const validate = useCallback((): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!clientName.trim()) errs.clientName = 'Client name is required';
    const hasValidItem = lineItems.some(
      (item) => item.description.trim() && item.rate > 0
    );
    if (!hasValidItem)
      errs.lineItems = 'Add at least one item with description and rate';
    return errs;
  }, [clientName, lineItems]);

  const shakeError = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const addLineItem = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLineItems((prev) => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, rate: 0 },
    ]);
  }, []);

  const removeLineItem = useCallback((itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== itemId);
    });
  }, []);

  const updateLineItem = useCallback(
    (itemId: string, field: keyof LineItem, value: string) => {
      setLineItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          if (field === 'quantity') {
            const num = parseFloat(value) || 0;
            return { ...item, quantity: Math.max(0, num) };
          }
          if (field === 'rate') {
            const num = parseFloat(value) || 0;
            return { ...item, rate: Math.max(0, num) };
          }
          return { ...item, [field]: value };
        })
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ clientName: true, lineItems: true });

    if (Object.keys(validationErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeError();
      return;
    }

    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      notes,
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      clientName,
      clientEmail,
      lineItems: lineItems.filter((item) => item.description.trim()),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    addInvoice(newInvoice);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/invoice-preview', params: { id: newInvoice.id } });
  }, [
    validate,
    shakeError,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    notes,
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    clientName,
    clientEmail,
    lineItems,
    addInvoice,
    router,
  ]);

  const handleCurrencySelect = useCallback((code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const renderFieldError = (message?: string) => {
    if (!message) return null;
    return (
      <Animated.View
        style={[styles.errorRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        <AlertCircle size={12} color={Colors.danger} />
        <Text style={styles.errorText}>{message}</Text>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'New Invoice',
          headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
        }}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.invoiceMetaBanner}>
          <View style={styles.metaBadge}>
            <FileText size={14} color={Colors.primary} />
            <Text style={styles.metaBadgeText}>{invoiceNumber}</Text>
          </View>
          <Text style={styles.metaDate}>Created {getTodayStr()}</Text>
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Your Details</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Business Details</Text>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Your Business Name"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={businessEmail}
                onChangeText={setBusinessEmail}
                placeholder="email@business.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={businessPhone}
                  onChangeText={setBusinessPhone}
                  placeholder="+1 (555) 000"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="123 Main St, City, State"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Client Info</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Client Details</Text>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                Client Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  touched.clientName && errors.clientName && styles.inputError,
                ]}
                value={clientName}
                onChangeText={(v) => {
                  setClientName(v);
                  if (errors.clientName)
                    setErrors((e) => ({ ...e, clientName: undefined }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, clientName: true }))}
                placeholder="Client or Company Name"
                placeholderTextColor={Colors.textTertiary}
                testID="client-name-input"
              />
              {touched.clientName && renderFieldError(errors.clientName)}
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Client Email</Text>
              <TextInput
                style={styles.input}
                value={clientEmail}
                onChangeText={setClientEmail}
                placeholder="client@email.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <Text style={styles.stepLabel}>Invoice Details</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileText size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Dates & Currency</Text>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.label}>Issue Date</Text>
                <TextInput
                  style={styles.input}
                  value={issueDate}
                  onChangeText={setIssueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.label}>Due Date</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Currency</Text>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.currencyText}>
                  {getCurrencySymbol(currency)} {currency}
                </Text>
                <ChevronDown size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
              {showCurrencyPicker && (
                <View style={styles.currencyDropdown}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.currencyOption,
                        currency === c.code && styles.currencyOptionActive,
                      ]}
                      onPress={() => handleCurrencySelect(c.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.currencySymbol}>{c.symbol}</Text>
                      <Text style={styles.currencyName}>{c.name}</Text>
                      {currency === c.code && (
                        <Check size={14} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Payment terms, thank you note..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNum}>4</Text>
          </View>
          <Text style={styles.stepLabel}>Line Items</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Package size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Items & Services</Text>
          </View>
          <View style={styles.fieldGroup}>
            {touched.lineItems && renderFieldError(errors.lineItems)}
            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.lineItemCard}>
                <View style={styles.lineItemTop}>
                  <View style={styles.lineItemBadge}>
                    <Text style={styles.lineItemBadgeText}>
                      Item {index + 1}
                    </Text>
                  </View>
                  {lineItems.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeLineItem(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.removeBtn}
                    >
                      <Trash2 size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.lineItemDescInput}
                  value={item.description}
                  onChangeText={(v) => updateLineItem(item.id, 'description', v)}
                  placeholder="What did you provide?"
                  placeholderTextColor={Colors.textTertiary}
                />
                <View style={styles.lineItemNumbers}>
                  <View style={styles.lineItemNumField}>
                    <Text style={styles.lineItemNumLabel}>Qty</Text>
                    <TextInput
                      style={styles.lineItemNumInput}
                      value={item.quantity ? String(item.quantity) : ''}
                      onChangeText={(v) =>
                        updateLineItem(item.id, 'quantity', v)
                      }
                      placeholder="1"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.lineItemNumField}>
                    <Text style={styles.lineItemNumLabel}>Rate</Text>
                    <TextInput
                      style={styles.lineItemNumInput}
                      value={item.rate ? String(item.rate) : ''}
                      onChangeText={(v) => updateLineItem(item.id, 'rate', v)}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.lineItemTotalField}>
                    <Text style={styles.lineItemNumLabel}>Total</Text>
                    <View style={styles.lineItemTotalBox}>
                      <Text style={styles.lineItemTotalValue}>
                        {formatCurrency(calculateLineItemTotal(item), currency)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={addLineItem}
              activeOpacity={0.7}
              testID="add-line-item-button"
            >
              <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.addItemText}>Add Another Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subtotal, currency)}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(subtotal, currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomBarTotal}>
            <Text style={styles.bottomBarTotalLabel}>Total</Text>
            <Text style={styles.bottomBarTotalValue}>
              {formatCurrency(subtotal, currency)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            testID="save-invoice-main-button"
          >
            <Text style={styles.saveBtnText}>Save Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  invoiceMetaBanner: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  metaBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  metaDate: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '500' as const,
  },
  stepIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 10,
    paddingLeft: 2,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    overflow: 'hidden' as const,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  fieldGroup: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  fieldWrapper: {},
  fieldRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
    backgroundColor: Colors.dangerBg,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top' as const,
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
  currencySelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  currencyText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  currencyDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginTop: 6,
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
  lineItemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  lineItemTop: {
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
    fontWeight: '600' as const,
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
    gap: 8,
  },
  lineItemNumField: {
    flex: 1,
  },
  lineItemNumLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  lineItemNumInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textAlign: 'center' as const,
  },
  lineItemTotalField: {
    flex: 1,
    alignItems: 'center' as const,
  },
  lineItemTotalBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: '100%',
    alignItems: 'center' as const,
  },
  lineItemTotalValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  addItemBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
    borderStyle: 'dashed' as const,
    backgroundColor: Colors.primaryBg,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  totalSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  totalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  bottomBarInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
  },
  bottomBarTotal: {},
  bottomBarTotalLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  bottomBarTotalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
});
