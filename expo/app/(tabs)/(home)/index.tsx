import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  FileText,
  TrendingUp,
  ChevronRight,
  Receipt,
  ArrowUpRight,
  Zap,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import {
  formatCurrency,
  formatDate,
  calculateInvoiceSubtotal,
} from '@/types/invoice';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, recentInvoices, totalAmount, deleteInvoice, duplicateInvoice } = useInvoices();
  const { settings } = useSettings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedInvoices = showAll ? invoices : recentInvoices;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/create-invoice');
    });
  }, [router, buttonScale]);

  const handleInvoicePress = useCallback(
    (invoiceId: string) => {
      if (activeMenuId) {
        setActiveMenuId(null);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/invoice-preview', params: { id: invoiceId } });
    },
    [router, activeMenuId]
  );

  const handleMenuToggle = useCallback((invoiceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveMenuId((prev) => (prev === invoiceId ? null : invoiceId));
  }, []);

  const handleEdit = useCallback(
    (invoiceId: string) => {
      setActiveMenuId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/create-invoice', params: { id: invoiceId } });
    },
    [router]
  );

  const handleDuplicate = useCallback(
    (invoiceId: string) => {
      setActiveMenuId(null);
      const newInvoice = duplicateInvoice(invoiceId);
      if (newInvoice) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[Home] Duplicated invoice:', newInvoice.id);
      }
    },
    [duplicateInvoice]
  );

  const handleDelete = useCallback(
    (invoiceId: string) => {
      setActiveMenuId(null);
      Alert.alert(
        'Delete Invoice',
        'This action cannot be undone. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteInvoice(invoiceId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('[Home] Deleted invoice:', invoiceId);
            },
          },
        ]
      );
    },
    [deleteInvoice]
  );

  const getStatusConfig = useCallback(
    (status: string): { color: string; bg: string; label: string } => {
      switch (status) {
        case 'paid':
          return { color: Colors.success, bg: Colors.successBg, label: 'Paid' };
        case 'sent':
          return { color: Colors.primary, bg: Colors.primaryBg, label: 'Sent' };
        default:
          return {
            color: Colors.textTertiary,
            bg: Colors.surfaceAlt,
            label: 'Draft',
          };
      }
    },
    []
  );

  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <View style={styles.logoRow}>
                  <View style={styles.logoIcon}>
                    <Zap size={16} color={Colors.card} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.appName}>EasyInvoice</Text>
                </View>
                <Text style={styles.subtitle}>
                  Professional invoices, fast.
                </Text>
              </View>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePress}
              activeOpacity={0.9}
              testID="create-invoice-button"
            >
              <View style={styles.createButtonContent}>
                <View style={styles.createButtonLeft}>
                  <View style={styles.createButtonIconWrap}>
                    <Plus
                      size={20}
                      color={Colors.textInverse}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View>
                    <Text style={styles.createButtonTitle}>
                      Create New Invoice
                    </Text>
                    <Text style={styles.createButtonSub}>
                      Ready in under 2 minutes
                    </Text>
                  </View>
                </View>
                <ArrowUpRight
                  size={20}
                  color="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[styles.statIcon, { backgroundColor: Colors.primaryBg }]}
              >
                <FileText size={16} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{invoices.length}</Text>
              <Text style={styles.statLabel}>Total Invoices</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: Colors.successBg },
                ]}
              >
                <TrendingUp
                  size={16}
                  color={Colors.success}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {formatCurrency(totalAmount, settings.defaultCurrency)}
              </Text>
              <Text style={styles.statLabel}>Total Invoiced</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: Colors.warningBg },
                ]}
              >
                <Receipt size={16} color={Colors.warning} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{paidCount}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showAll ? 'All Invoices' : 'Recent Invoices'}
            </Text>
            {invoices.length > 5 && (
              <TouchableOpacity
                onPress={() => setShowAll((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>
                  {showAll ? 'Show Less' : `View All (${invoices.length})`}
                </Text>
              </TouchableOpacity>
            )}
            {invoices.length > 0 && invoices.length <= 5 && (
              <Text style={styles.sectionCount}>
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {displayedInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIconInner}>
                  <FileText size={28} color={Colors.textTertiary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button above to create your first professional invoice
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreatePress}
                activeOpacity={0.8}
              >
                <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.invoiceList}>
              {displayedInvoices.map((inv, index) => {
                const total = calculateInvoiceSubtotal(inv.lineItems);
                const statusConfig = getStatusConfig(inv.status);
                const isMenuOpen = activeMenuId === inv.id;
                return (
                  <View key={inv.id}>
                    <TouchableOpacity
                      style={[
                        styles.invoiceCard,
                        index === displayedInvoices.length - 1 && { marginBottom: 0 },
                      ]}
                      onPress={() => handleInvoicePress(inv.id)}
                      activeOpacity={0.7}
                      testID={`invoice-card-${inv.id}`}
                    >
                      <View style={styles.invoiceCardBody}>
                        <View style={styles.invoiceCardTop}>
                          <View style={styles.invoiceCardMeta}>
                            <Text style={styles.invoiceNumber}>
                              {inv.invoiceNumber}
                            </Text>
                            <View
                              style={[
                                styles.statusPill,
                                { backgroundColor: statusConfig.bg },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: statusConfig.color },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusLabel,
                                  { color: statusConfig.color },
                                ]}
                              >
                                {statusConfig.label}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.invoiceCardActions}>
                            <Text style={styles.invoiceAmount}>
                              {formatCurrency(total, inv.currency)}
                            </Text>
                            <TouchableOpacity
                              style={styles.menuBtn}
                              onPress={() => handleMenuToggle(inv.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MoreHorizontal size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.invoiceCardBottom}>
                          <Text style={styles.clientName} numberOfLines={1}>
                            {inv.clientName || 'No client'}
                          </Text>
                          <Text style={styles.invoiceDate}>
                            {formatDate(inv.issueDate)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isMenuOpen && (
                      <View style={styles.contextMenu}>
                        <TouchableOpacity
                          style={styles.contextMenuItem}
                          onPress={() => handleEdit(inv.id)}
                          activeOpacity={0.7}
                        >
                          <Pencil size={14} color={Colors.warning} />
                          <Text style={styles.contextMenuText}>Edit</Text>
                        </TouchableOpacity>
                        <View style={styles.contextMenuDivider} />
                        <TouchableOpacity
                          style={styles.contextMenuItem}
                          onPress={() => handleDuplicate(inv.id)}
                          activeOpacity={0.7}
                        >
                          <Copy size={14} color={Colors.primary} />
                          <Text style={styles.contextMenuText}>Duplicate</Text>
                        </TouchableOpacity>
                        <View style={styles.contextMenuDivider} />
                        <TouchableOpacity
                          style={styles.contextMenuItem}
                          onPress={() => handleDelete(inv.id)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={14} color={Colors.danger} />
                          <Text style={[styles.contextMenuText, { color: Colors.danger }]}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
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
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
    paddingLeft: 36,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      web: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
    }),
  },
  createButtonContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 18,
  },
  createButtonLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  createButtonIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  createButtonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  createButtonSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
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
  invoiceList: {
    gap: 8,
  },
  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceCardBody: {
    flex: 1,
  },
  invoiceCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  invoiceCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  invoiceCardActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  invoiceCardBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  clientName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  contextMenu: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  contextMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextMenuText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },
});
