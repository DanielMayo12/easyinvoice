import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';

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

export default SectionHeader;

const styles = StyleSheet.create({
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
});
