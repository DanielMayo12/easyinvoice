import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, Trash2, ChevronDown, ChevronUp, Building2, User, FileText, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import { Invoice, LineItem, CURRENCIES, generateInvoiceNumber, calculateLineItemTotal, calculateInvoiceSubtotal, formatCurrency, getCurrencySymbol } from '@/types/invoice';

function generateId(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
function getTodayStr(): string { return new Date().toISOString().split('T')[0]; }
function getDefaultDueDate(): string { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; }

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
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: generateId(), description: '', quantity: 1, rate: 0 }]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ business: true, client: true, details: true, items: true });
  const subtotal = useMemo(() => calculateInvoiceSubtotal(lineItems), [lineItems]);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] })); }, []);
  const addLineItem = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLineItems((prev) => [...prev, { id: generateId(), description: '', quantity: 1, rate: 0 }]); }, []);
  const removeLineItem = useCallback((itemId: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLineItems((prev) => { if (prev.length <= 1) return prev; return prev.filter((item) => item.id !== itemId); }); }, []);
  const updateLineItem = useCallback((itemId: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (field === 'quantity' || field === 'rate') return { ...item, [field]: parseFloat(value) || 0 };
      return { ...item, [field]: value };
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!clientName.trim()) { Alert.alert('Missing Info', 'Please enter a client name.'); return; }
    const hasValidItem = lineItems.some((item) => item.description.trim() && item.rate > 0);
    if (!hasValidItem) { Alert.alert('Missing Items', 'Add at least one line item with description and rate.'); return; }
    const newInvoice: Invoice = { id: generateId(), invoiceNumber, issueDate, dueDate, currency, notes, businessName, businessEmail, businessPhone, businessAddress, clientName, clientEmail, lineItems: lineItems.filter((item) => item.description.trim()), status: 'draft', createdAt: new Date().toISOString() };
    addInvoice(newInvoice);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/invoice-preview', params: { id: newInvoice.id } });
  }, [clientName, lineItems, invoiceNumber, issueDate, dueDate, currency, notes, businessName, businessEmail, businessPhone, businessAddress, clientEmail, addInvoice, router]);

  const renderSectionHeader = useCallback((title: string, section: keyof typeof expandedSections, icon: React.ReactNode) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section)} activeOpacity={0.7}>
      <View style={styles.sectionHeaderLeft}>{icon}<Text style={styles.sectionTitle}>{title}</Text></View>
      {expandedSections[section] ? <ChevronUp size={18} color={Colors.textTertiary} /> : <ChevronDown size={18} color={Colors.textTertiary} />}
    </TouchableOpacity>
  ), [expandedSections, toggleSection]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen options={{ title: 'New Invoice', headerRight: () => (<TouchableOpacity onPress={handleSave} testID="save-invoice-button"><Text style={styles.headerSaveText}>Save</Text></TouchableOpacity>) }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.invoiceMeta}><View style={styles.metaRow}><Text style={styles.metaLabel}>Invoice #</Text><Text style={styles.metaValue}>{invoiceNumber}</Text></View></View>

        <View style={styles.card}>
          {renderSectionHeader('Business Details', 'business', <Building2 size={16} color={Colors.primary} />)}
          {expandedSections.business && (<View style={styles.sectionContent}>
            <TextInput style={styles.textInput} value={businessName} onChangeText={setBusinessName} placeholder="Business Name" placeholderTextColor={Colors.textTertiary} />
            <TextInput style={styles.textInput} value={businessEmail} onChangeText={setBusinessEmail} placeholder="Email" placeholderTextColor={Colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.textInput} value={businessPhone} onChangeText={setBusinessPhone} placeholder="Phone" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" />
            <TextInput style={[styles.textInput, styles.lastInput]} value={businessAddress} onChangeText={setBusinessAddress} placeholder="Address" placeholderTextColor={Colors.textTertiary} />
          </View>)}
        </View>

        <View style={styles.card}>
          {renderSectionHeader('Client Details', 'client', <User size={16} color={Colors.primary} />)}
          {expandedSections.client && (<View style={styles.sectionContent}>
            <TextInput style={styles.textInput} value={clientName} onChangeText={setClientName} placeholder="Client Name *" placeholderTextColor={Colors.textTertiary} testID="client-name-input" />
            <TextInput style={[styles.textInput, styles.lastInput]} value={clientEmail} onChangeText={setClientEmail} placeholder="Client Email" placeholderTextColor={Colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
          </View>)}
        </View>

        <View style={styles.card}>
          {renderSectionHeader('Invoice Details', 'details', <FileText size={16} color={Colors.primary} />)}
          {expandedSections.details && (<View style={styles.sectionContent}>
            <View style={styles.dateRow}>
              <View style={styles.dateField}><Text style={styles.fieldLabel}>Issue Date</Text><TextInput style={styles.textInput} value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} /></View>
              <View style={styles.dateField}><Text style={styles.fieldLabel}>Due Date</Text><TextInput style={styles.textInput} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} /></View>
            </View>
            <Text style={styles.fieldLabel}>Currency</Text>
            <TouchableOpacity style={styles.currencySelector} onPress={() => setShowCurrencyPicker(!showCurrencyPicker)} activeOpacity={0.7}>
              <Text style={styles.currencySelectorText}>{getCurrencySymbol(currency)} {currency}</Text>
              <ChevronDown size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            {showCurrencyPicker && (<View style={styles.currencyList}>{CURRENCIES.map((c) => (<TouchableOpacity key={c.code} style={[styles.currencyOption, currency === c.code && styles.currencyOptionActive]} onPress={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}><Text style={styles.currencyOptionSymbol}>{c.symbol}</Text><Text style={styles.currencyOptionName}>{c.name}</Text></TouchableOpacity>))}</View>)}
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput style={[styles.textInput, styles.lastInput, styles.multilineInput]} value={notes} onChangeText={setNotes} placeholder="Payment terms, thank you note, etc." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={3} textAlignVertical="top" />
          </View>)}
        </View>

        <View style={styles.card}>
          {renderSectionHeader('Line Items', 'items', <Package size={16} color={Colors.primary} />)}
          {expandedSections.items && (<View style={styles.sectionContent}>
            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemLabel}>Item {index + 1}</Text>
                  {lineItems.length > 1 && (<TouchableOpacity onPress={() => removeLineItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Trash2 size={16} color={Colors.danger} /></TouchableOpacity>)}
                </View>
                <TextInput style={styles.textInput} value={item.description} onChangeText={(v) => updateLineItem(item.id, 'description', v)} placeholder="Description" placeholderTextColor={Colors.textTertiary} />
                <View style={styles.lineItemNumbers}>
                  <View style={styles.lineItemNumberField}><Text style={styles.fieldLabelSmall}>Qty</Text><TextInput style={styles.numberInput} value={item.quantity ? String(item.quantity) : ''} onChangeText={(v) => updateLineItem(item.id, 'quantity', v)} placeholder="1" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" /></View>
                  <View style={styles.lineItemNumberField}><Text style={styles.fieldLabelSmall}>Rate</Text><TextInput style={styles.numberInput} value={item.rate ? String(item.rate) : ''} onChangeText={(v) => updateLineItem(item.id, 'rate', v)} placeholder="0.00" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" /></View>
                  <View style={styles.lineItemTotal}><Text style={styles.fieldLabelSmall}>Total</Text><Text style={styles.lineItemTotalValue}>{formatCurrency(calculateLineItemTotal(item), currency)}</Text></View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addItemButton} onPress={addLineItem} activeOpacity={0.7} testID="add-line-item-button"><Plus size={16} color={Colors.primary} /><Text style={styles.addItemText}>Add Line Item</Text></TouchableOpacity>
          </View>)}
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text></View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}><Text style={styles.grandTotalLabel}>Total</Text><Text style={styles.grandTotalValue}>{formatCurrency(subtotal, currency)}</Text></View>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85} testID="save-invoice-main-button"><Text style={styles.saveButtonText}>Save Invoice</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 50 },
  headerSaveText: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  invoiceMeta: { backgroundColor: Colors.primaryBg, borderRadius: 12, padding: 14, marginBottom: 16 },
  metaRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  metaLabel: { fontSize: 13, fontWeight: '500' as const, color: Colors.primary },
  metaValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 14, overflow: 'hidden' as const },
  sectionHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 14 },
  sectionHeaderLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  sectionContent: { paddingHorizontal: 14, paddingBottom: 14 },
  textInput: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight },
  lastInput: { marginBottom: 0 },
  multilineInput: { minHeight: 80, paddingTop: 12 },
  dateRow: { flexDirection: 'row' as const, gap: 10 },
  dateField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary, marginBottom: 4, marginTop: 4, paddingLeft: 2 },
  fieldLabelSmall: { fontSize: 11, fontWeight: '500' as const, color: Colors.textTertiary, marginBottom: 4 },
  currencySelector: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight },
  currencySelectorText: { fontSize: 15, color: Colors.text, fontWeight: '500' as const },
  currencyList: { backgroundColor: Colors.surface, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' as const },
  currencyOption: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 12, gap: 8 },
  currencyOptionActive: { backgroundColor: Colors.primaryBg },
  currencyOptionSymbol: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, width: 24, textAlign: 'center' as const },
  currencyOptionName: { fontSize: 14, color: Colors.text },
  lineItem: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight },
  lineItemHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  lineItemLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  lineItemNumbers: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
  lineItemNumberField: { flex: 1 },
  numberInput: { backgroundColor: Colors.card, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight, textAlign: 'center' as const },
  lineItemTotal: { flex: 1, alignItems: 'center' as const },
  lineItemTotalValue: { backgroundColor: Colors.card, borderRadius: 8, padding: 10, fontSize: 14, fontWeight: '600' as const, color: Colors.primary, textAlign: 'center' as const, overflow: 'hidden' as const, width: '100%', borderWidth: 1, borderColor: Colors.borderLight },
  addItemButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed' as const },
  addItemText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  totalCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  grandTotalValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.primary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' as const, ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }, android: { elevation: 6 }, web: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 } }) },
  saveButtonText: { fontSize: 16, fontWeight: '700' as const, color: Colors.textInverse },
});
