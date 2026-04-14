import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, FileText, TrendingUp, Clock, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import { formatCurrency, formatDate, calculateInvoiceSubtotal } from '@/types/invoice';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, recentInvoices, totalAmount } = useInvoices();
  const { settings } = useSettings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => { router.push('/create-invoice'); });
  }, [router, buttonScale]);

  const handleInvoicePress = useCallback((invoiceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/invoice-preview', params: { id: invoiceId } });
  }, [router]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid': return Colors.success;
      case 'sent': return Colors.primaryLight;
      default: return Colors.textTertiary;
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.appName}>EasyInvoice</Text>
            <Text style={styles.subtitle}>Create professional invoices in minutes</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePress} activeOpacity={0.85} testID="create-invoice-button">
              <View style={styles.createButtonInner}>
                <View style={styles.createButtonIcon}>
                  <Plus size={22} color={Colors.textInverse} strokeWidth={2.5} />
                </View>
                <View style={styles.createButtonTextWrap}>
                  <Text style={styles.createButtonTitle}>Create New Invoice</Text>
                  <Text style={styles.createButtonSubtitle}>Start from scratch or use saved details</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.primaryBg }]}>
                <FileText size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{invoices.length}</Text>
              <Text style={styles.statLabel}>Invoices</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.successBg }]}>
                <TrendingUp size={18} color={Colors.success} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>{formatCurrency(totalAmount, settings.defaultCurrency)}</Text>
              <Text style={styles.statLabel}>Total Invoiced</Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRow}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
          </View>
          {recentInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <FileText size={32} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySubtitle}>Create your first invoice to get started</Text>
            </View>
          ) : (
            <View style={styles.invoiceList}>
              {recentInvoices.map((inv) => {
                const total = calculateInvoiceSubtotal(inv.lineItems);
                const color = getStatusColor(inv.status);
                return (
                  <TouchableOpacity key={inv.id} style={styles.invoiceCard} onPress={() => handleInvoicePress(inv.id)} activeOpacity={0.7} testID={`invoice-card-${inv.id}`}>
                    <View style={styles.invoiceCardLeft}>
                      <View style={styles.invoiceCardHeader}>
                        <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                          <Text style={[styles.statusText, { color }]}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</Text>
                        </View>
                      </View>
                      <Text style={styles.clientName}>{inv.clientName || 'No client'}</Text>
                      <Text style={styles.invoiceDate}>{formatDate(inv.createdAt)}</Text>
                    </View>
                    <View style={styles.invoiceCardRight}>
                      <Text style={styles.invoiceAmount}>{formatCurrency(total, inv.currency)}</Text>
                      <ChevronRight size={16} color={Colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 16, paddingBottom: 24 },
  appName: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  createButton: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
    }),
  },
  createButtonInner: { flexDirection: 'row' as const, alignItems: 'center' as const },
  createButtonIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 14 },
  createButtonTextWrap: { flex: 1 },
  createButtonTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.textInverse },
  createButtonSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row' as const, gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12 },
  statValue: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  sectionHeaderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  emptyState: { backgroundColor: Colors.card, borderRadius: 16, padding: 40, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.border },
  emptyIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '600' as const, color: Colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' as const },
  invoiceList: { gap: 10 },
  invoiceCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.border },
  invoiceCardLeft: { flex: 1 },
  invoiceCardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 4 },
  invoiceNumber: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  clientName: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  invoiceDate: { fontSize: 12, color: Colors.textTertiary },
  invoiceCardRight: { alignItems: 'flex-end' as const, gap: 4 },
  invoiceAmount: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
});
