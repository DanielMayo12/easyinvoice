import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  FileText,
  TrendingUp,
  ChevronRight,
  Zap,
  Receipt,
  Clock,
  CircleDollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInvoices } from '@/context/InvoiceContext';
import { useSettings } from '@/context/SettingsContext';
import { useInvoiceStats } from '@/hooks/useInvoiceStats';
import { formatCurrency } from '@/utils/invoice';
import InvoiceRow from '@/components/InvoiceRow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, recentInvoices } = useInvoices();
  const { settings } = useSettings();
  const { totalCount, paidCount, pendingCount, totalAmount, paidAmount } = useInvoiceStats();

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const [showAll, setShowAll] = useState(false);

  const displayedInvoices = showAll ? invoices : recentInvoices;
  const greeting = useMemo(() => getGreeting(), []);
  const hasInvoices = totalCount > 0;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(statsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      router.push('/create-invoice');
    });
  }, [router, ctaScale]);

  const handleInvoicePress = useCallback(
    (invoiceId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/invoice-preview', params: { id: invoiceId } });
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>
          <LinearGradient
            colors={['#0A1628', '#132240', '#1A3060']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { paddingTop: insets.top + 16 }]}
          >
            <View style={styles.heroPattern}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.heroPatternCircle,
                    {
                      width: 60 + i * 40,
                      height: 60 + i * 40,
                      borderRadius: 30 + i * 20,
                      right: -20 + i * 10,
                      top: -30 + i * 8,
                      opacity: 0.03 + i * 0.008,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.heroBrand}>
              <View style={styles.heroLogoWrap}>
                <Zap size={14} color="#0F6FFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.heroAppName}>EasyInvoice</Text>
            </View>

            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroTagline}>
              {hasInvoices
                ? `You have ${totalCount} invoice${totalCount !== 1 ? 's' : ''} totaling ${formatCurrency(totalAmount, settings.defaultCurrency)}`
                : 'Create professional invoices in seconds'}
            </Text>

            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <TouchableOpacity
                style={styles.heroCta}
                onPress={handleCreatePress}
                activeOpacity={0.85}
                testID="create-invoice-button"
              >
                <View style={styles.heroCtaIconWrap}>
                  <Plus size={18} color="#0F6FFF" strokeWidth={2.5} />
                </View>
                <Text style={styles.heroCtaText}>New Invoice</Text>
                <ArrowRight size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.heroHelperText}>Takes less than 30 seconds</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: statsFade }]}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EBF3FF' }]}>
                <CircleDollarSign size={16} color={Colors.primary} strokeWidth={2} />
              </View>
            </View>
            <Text style={styles.statAmount} numberOfLines={1}>
              {formatCurrency(totalAmount, settings.defaultCurrency)}
            </Text>
            <Text style={styles.statDescription}>Total invoiced</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <TrendingUp size={16} color={Colors.success} strokeWidth={2} />
              </View>
            </View>
            <Text style={styles.statAmount} numberOfLines={1}>
              {formatCurrency(paidAmount, settings.defaultCurrency)}
            </Text>
            <Text style={styles.statDescription}>Collected</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsRowSmall, { opacity: statsFade }]}>
          <View style={styles.miniStat}>
            <View style={[styles.miniStatIcon, { backgroundColor: '#EBF3FF' }]}>
              <FileText size={13} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.miniStatValue}>{totalCount}</Text>
            <Text style={styles.miniStatLabel}>Total</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <View style={[styles.miniStatIcon, { backgroundColor: '#ECFDF5' }]}>
              <Receipt size={13} color={Colors.success} strokeWidth={2} />
            </View>
            <Text style={styles.miniStatValue}>{paidCount}</Text>
            <Text style={styles.miniStatLabel}>Paid</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <View style={[styles.miniStatIcon, { backgroundColor: '#FFFBEB' }]}>
              <Clock size={13} color={Colors.warning} strokeWidth={2} />
            </View>
            <Text style={styles.miniStatValue}>{pendingCount}</Text>
            <Text style={styles.miniStatLabel}>Pending</Text>
          </View>
        </Animated.View>

        {!hasInvoices ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircleOuter}>
                <View style={styles.emptyCircleMiddle}>
                  <View style={styles.emptyCircleInner}>
                    <Sparkles size={28} color={Colors.primary} strokeWidth={1.5} />
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first professional invoice{'\n'}in under 2 minutes
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={handleCreatePress}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.emptyActionText}>Create Your First Invoice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {showAll ? 'All Invoices' : 'Recent'}
              </Text>
              {totalCount > 5 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAll((v) => !v);
                  }}
                  activeOpacity={0.7}
                  style={styles.viewAllBtn}
                >
                  <Text style={styles.viewAllText}>
                    {showAll ? 'Show Less' : `All (${totalCount})`}
                  </Text>
                  <ChevronRight size={14} color={Colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.invoiceList}>
              {displayedInvoices.map((inv, index) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  onPress={handleInvoicePress}
                  index={index}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  heroCard: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  heroPattern: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroPatternCircle: {
    position: 'absolute' as const,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  heroBrand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 20,
  },
  heroLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroAppName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.3,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  heroCta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroCtaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroHelperText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center' as const,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  heroCtaText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -1,
    paddingTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  statCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  statCardHeader: {
    marginBottom: 12,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  statsRowSmall: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      web: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
  miniStat: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 6,
  },
  miniStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  invoiceList: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
      web: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
    }),
  },
  emptyContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      web: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F5F7FA',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyCircleMiddle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#EBF3FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyCircleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
