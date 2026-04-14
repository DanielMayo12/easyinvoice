import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  UserRound,
  FileText,
  Package,
  Check,
  AlertCircle,
  StickyNote,
  Hash,
  Calendar,
  Coins,
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

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  stepNumber: number;
  subtitle?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
}

const SectionHeader = React.memo(function SectionHeader({
  icon,
  title,
  stepNumber,
  subtitle,
  collapsed,
  onToggle,
  collapsible = false,
}: SectionHeaderProps) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={collapsible ? onToggle : undefined}
      activeOpacity={collapsible ? 0.7 : 1}
      disabled={!collapsible}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{stepNumber}</Text>
        </View>
        <View style={styles.sectionHeaderText}>
          <View style={styles.sectionTitleRow}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {collapsible ? (
        <View style={styles.collapseIcon}>
          {collapsed ? (
            <ChevronDown size={18} color={Colors.textTertiary} />
          ) : (
            <ChevronUp size={18} color={Colors.textTertiary} />
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

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

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { addInvoice, updateInvoice, getInvoice } = useInvoices();
  const { settings } = useSettings();

  const existingInvoice = editId ? getInvoice(editId) : undefined;
  const isEditing = !!existingInvoice;

  const [businessName, setBusinessName] = useState(
    existingInvoice?.businessName ?? settings.businessName
  );
  const [businessEmail, setBusinessEmail] = useState(
    existingInvoice?.businessEmail ?? settings.businessEmail
  );
  const [businessPhone, setBusinessPhone] = useState(
    existingInvoice?.businessPhone ?? settings.businessPhone
  );
  const [businessAddress, setBusinessAddress] = useState(
    existingInvoice?.businessAddress ?? settings.businessAddress
  );
  const [clientName, setClientName] = useState(existingInvoice?.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(existingInvoice?.clientEmail ?? '');
  const [invoiceNumber] = useState(
    existingInvoice?.invoiceNumber ?? generateInvoiceNumber()
  );
  const [issueDate, setIssueDate] = useState(
    existingInvoice?.issueDate ?? getTodayStr()
  );
  const [dueDate, setDueDate] = useState(
    existingInvoice?.dueDate ?? getDefaultDueDate()
  );
  const [currency, setCurrency] = useState(
    existingInvoice?.currency ?? settings.defaultCurrency
  );
  const [notes, setNotes] = useState(existingInvoice?.notes ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(
    existingInvoice?.lineItems?.length
      ? existingInvoice.lineItems
      : [{ id: generateId(), description: '', quantity: 1, rate: 0 }]
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [businessCollapsed, setBusinessCollapsed] = useState(
    isEditing
      ? true
      : !!(settings.businessName && settings.businessEmail)
  );

  const scrollRef = useRef<ScrollView>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const subtotal = useMemo(
    () => calculateInvoiceSubtotal(lineItems),
    [lineItems]
  );

  const itemCount = useMemo(
    () => lineItems.filter((i) => i.description.trim()).length,
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
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
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

    const filteredLineItems = lineItems.filter((item) => item.description.trim());

    if (isEditing && existingInvoice) {
      const updatedInvoice: Invoice = {
        ...existingInvoice,
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
        lineItems: filteredLineItems,
      };
      updateInvoice(updatedInvoice);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[CreateInvoice] Updated invoice:', updatedInvoice.id);
      router.back();
    } else {
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
        lineItems: filteredLineItems,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      addInvoice(newInvoice);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[CreateInvoice] Created new invoice:', newInvoice.id);
      router.replace({ pathname: '/invoice-preview', params: { id: newInvoice.id } });
    }
  }, [
    validate,
    shakeError,
    isEditing,
    existingInvoice,
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
    updateInvoice,
    router,
  ]);

  const handleCurrencySelect = useCallback((code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const screenTitle = isEditing ? 'Edit Invoice' : 'New Invoice';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen
        options={{
          title: screenTitle,
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
          <View style={styles.metaLeft}>
            <View style={styles.metaIconWrap}>
              <FileText size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metaInvoiceNum}>{invoiceNumber}</Text>
              <Text style={styles.metaDate}>
                {isEditing ? 'Editing' : 'Created'} {getTodayStr()}
              </Text>
            </View>
          </View>
          <View style={styles.metaStatusBadge}>
            <Text style={styles.metaStatusText}>
              {isEditing ? (existingInvoice?.status ?? 'Draft').charAt(0).toUpperCase() + (existingInvoice?.status ?? 'draft').slice(1) : 'Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={<Building2 size={15} color={Colors.primary} />}
            title="My Business"
            stepNumber={1}
            subtitle={businessCollapsed && businessName ? businessName : undefined}
            collapsed={businessCollapsed}
            onToggle={() => setBusinessCollapsed((v) => !v)}
            collapsible
          />
          {!businessCollapsed && (
            <View style={styles.sectionBody}>
              <FormField label="Business Name">
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Your Business Name"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />
              </FormField>
              <FormField label="Email">
                <TextInput
                  style={styles.input}
                  value={businessEmail}
                  onChangeText={setBusinessEmail}
                  placeholder="email@business.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </FormField>
              <View style={styles.fieldRow}>
                <View style={styles.fieldRowHalf}>
                  <FormField label="Phone">
                    <TextInput
                      style={styles.input}
                      value={businessPhone}
                      onChangeText={setBusinessPhone}
                      placeholder="+1 (555) 000"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                    />
                  </FormField>
                </View>
                <View style={styles.fieldRowHalf} />
              </View>
              <FormField label="Address">
                <TextInput
                  style={styles.input}
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  placeholder="123 Main St, City, State"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />
              </FormField>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={<UserRound size={15} color={Colors.primary} />}
            title="Client Details"
            stepNumber={2}
          />
          <View style={styles.sectionBody}>
            <FormField
              label="Client Name"
              required
              error={touched.clientName ? errors.clientName : undefined}
              shakeAnim={shakeAnim}
            >
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
                returnKeyType="next"
                testID="client-name-input"
              />
            </FormField>
            <FormField label="Client Email">
              <TextInput
                style={styles.input}
                value={clientEmail}
                onChangeText={setClientEmail}
                placeholder="client@email.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </FormField>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={<Calendar size={15} color={Colors.primary} />}
            title="Invoice Details"
            stepNumber={3}
          />
          <View style={styles.sectionBody}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldRowHalf}>
                <FormField label="Invoice #">
                  <View style={styles.readonlyField}>
                    <Hash size={13} color={Colors.textTertiary} />
                    <Text style={styles.readonlyText}>{invoiceNumber}</Text>
                  </View>
                </FormField>
              </View>
              <View style={styles.fieldRowHalf}>
                <FormField label="Currency">
                  <TouchableOpacity
                    style={styles.currencySelector}
                    onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencyLeft}>
                      <Coins size={13} color={Colors.textSecondary} />
                      <Text style={styles.currencyText}>
                        {getCurrencySymbol(currency)} {currency}
                      </Text>
                    </View>
                    <ChevronDown size={14} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </FormField>
              </View>
            </View>
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
            <View style={styles.fieldRow}>
              <View style={styles.fieldRowHalf}>
                <FormField label="Issue Date">
                  <TextInput
                    style={styles.input}
                    value={issueDate}
                    onChangeText={setIssueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </FormField>
              </View>
              <View style={styles.fieldRowHalf}>
                <FormField label="Due Date">
                  <TextInput
                    style={styles.input}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </FormField>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={<Package size={15} color={Colors.primary} />}
            title="Items"
            stepNumber={4}
            subtitle={itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : undefined}
          />
          <View style={styles.sectionBody}>
            {touched.lineItems && errors.lineItems ? (
              <Animated.View
                style={[styles.errorRow, { transform: [{ translateX: shakeAnim }] }]}
              >
                <AlertCircle size={12} color={Colors.danger} />
                <Text style={styles.errorText}>{errors.lineItems}</Text>
              </Animated.View>
            ) : null}

            {lineItems.map((item, index) => {
              const itemTotal = calculateLineItemTotal(item);
              return (
                <View key={item.id} style={styles.lineItemCard}>
                  <View style={styles.lineItemHeader}>
                    <View style={styles.lineItemBadge}>
                      <Text style={styles.lineItemBadgeText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.lineItemHeaderRight}>
                      <Text style={styles.lineItemLiveTotal}>
                        {formatCurrency(itemTotal, currency)}
                      </Text>
                      {lineItems.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeLineItem(item.id)}
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
                    onChangeText={(v) => updateLineItem(item.id, 'description', v)}
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
                        onChangeText={(v) => updateLineItem(item.id, 'quantity', v)}
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
                        onChangeText={(v) => updateLineItem(item.id, 'rate', v)}
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
            })}

            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={addLineItem}
              activeOpacity={0.7}
              testID="add-line-item-button"
            >
              <View style={styles.addItemIconWrap}>
                <Plus size={16} color={Colors.textInverse} strokeWidth={2.5} />
              </View>
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={<StickyNote size={15} color={Colors.primary} />}
            title="Notes"
            stepNumber={5}
          />
          <View style={styles.sectionBody}>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Payment terms, thank you note, bank details..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

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

        <View style={{ height: 110 }} />
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
            <Check size={18} color={Colors.textInverse} strokeWidth={2.5} />
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Update Invoice' : 'Save Invoice'}
            </Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  invoiceMetaBanner: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  metaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  metaInvoiceNum: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metaDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  metaStatusBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },

  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
    paddingLeft: 21,
  },
  collapseIcon: {
    padding: 4,
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 12,
  },

  fieldWrapper: {},
  fieldRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  fieldRowHalf: {
    flex: 1,
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
  readonlyField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  readonlyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  currencyLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  currencyText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
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
  addItemBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
  },
  addItemIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },

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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
  },
  bottomBarTotal: {},
  bottomBarTotalLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bottomBarTotalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 1,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
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
