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
  ArrowUpRight,
  Zap,
  Receipt,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import { formatCurrency } from '@/utils/invoice';
import EmptyState from '@/components/EmptyState';
import InvoiceCard from '@/components/InvoiceCard';

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
                <Text style={styles.subtitle}>Professional invoices, fast.</Text>
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
                    <Plus size={20} color={Colors.textInverse} strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={styles.createButtonTitle}>Create New Invoice</Text>
                    <Text style={styles.createButtonSub}>Ready in under 2 minutes</Text>
                  </View>
                </View>
                <ArrowUpRight size={20} color="rgba(255,255,255,0.5)" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primaryBg }]}>
                <FileText size={16} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{invoices.length}</Text>
              <Text style={styles.statLabel}>Total Invoices</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.successBg }]}>
                <TrendingUp size={16} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {formatCurrency(totalAmount, settings.defaultCurrency)}
              </Text>
              <Text style={styles.statLabel}>Total Invoiced</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.warningBg }]}>
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
              <TouchableOpacity onPress={() => setShowAll((v) => !v)} activeOpacity={0.7}>
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
            <EmptyState
              icon={<FileText size={28} color={Colors.textTertiary} />}
              title="No invoices yet"
              subtitle="Tap the button above to create your first professional invoice"
              actionLabel="Get Started"
              actionIcon={<Plus size={16} color={Colors.primary} strokeWidth={2.5} />}
              onAction={handleCreatePress}
            />
          ) : (
            <View style={styles.invoiceList}>
              {displayedInvoices.map((inv, index) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  isMenuOpen={activeMenuId === inv.id}
                  onPress={handleInvoicePress}
                  onMenuToggle={handleMenuToggle}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  isLast={index === displayedInvoices.length - 1}
                />
              ))}
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
  invoiceList: {
    gap: 8,
  },
});
