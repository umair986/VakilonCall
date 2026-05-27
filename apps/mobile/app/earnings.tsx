import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CALL_ECONOMICS } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';

// Mock data — will be replaced with API calls in production
const MOCK_EARNINGS = {
  total_earnings: 1280,
  wallet_balance: 512,
  pending_payout: 0,
  total_calls: 40,
  avg_rating: 4.6,
  recent_calls: [
    {
      id: '1',
      scenario: 'Traffic Stop',
      duration_min: 12,
      earned: CALL_ECONOMICS.LAWYER_PAYOUT_INR,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      rating: 5,
    },
    {
      id: '2',
      scenario: 'FIR Refusal',
      duration_min: 8,
      earned: CALL_ECONOMICS.LAWYER_PAYOUT_INR,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      rating: 4,
    },
    {
      id: '3',
      scenario: 'Digital Arrest Scam',
      duration_min: 15,
      earned: CALL_ECONOMICS.LAWYER_PAYOUT_INR,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 5,
    },
    {
      id: '4',
      scenario: 'Custodial Arrest',
      duration_min: 14,
      earned: CALL_ECONOMICS.LAWYER_PAYOUT_INR,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 4,
    },
  ],
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function EarningsScreen(): React.JSX.Element {
  const router = useRouter();
  const [earnings] = useState(MOCK_EARNINGS);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={brandColors.text}
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Earnings */}
        <Surface style={styles.earningsCard} elevation={2}>
          <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
          <Text style={styles.earningsValue}>
            ₹{earnings.total_earnings.toLocaleString('en-IN')}
          </Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>
                {earnings.total_calls}
              </Text>
              <Text style={styles.earningsStatLabel}>Calls</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>
                ⭐ {earnings.avg_rating}
              </Text>
              <Text style={styles.earningsStatLabel}>Rating</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>
                ₹{CALL_ECONOMICS.LAWYER_PAYOUT_INR}
              </Text>
              <Text style={styles.earningsStatLabel}>Per Call</Text>
            </View>
          </View>
        </Surface>

        {/* Wallet & Payout */}
        <View style={styles.walletRow}>
          <Surface style={styles.walletCard} elevation={1}>
            <Text style={styles.walletLabel}>Available</Text>
            <Text style={styles.walletValue}>
              ₹{earnings.wallet_balance}
            </Text>
          </Surface>
          <Surface style={styles.walletCard} elevation={1}>
            <Text style={styles.walletLabel}>Pending</Text>
            <Text style={[styles.walletValue, { color: brandColors.accent }]}>
              ₹{earnings.pending_payout}
            </Text>
          </Surface>
        </View>

        {/* Request Payout Button */}
        <Button
          mode="contained"
          onPress={() => {
            /* Payout request — Sprint 4 */
          }}
          style={styles.payoutButton}
          labelStyle={styles.payoutButtonLabel}
          icon="bank-transfer"
          disabled={earnings.wallet_balance < 100}
        >
          Request Payout
        </Button>
        {earnings.wallet_balance < 100 ? (
          <Text style={styles.payoutNote}>
            Minimum ₹100 required for withdrawal
          </Text>
        ) : null}

        {/* Recent Calls */}
        <Text style={styles.sectionTitle}>Recent Consultations</Text>

        {earnings.recent_calls.map((call) => (
          <Surface key={call.id} style={styles.callCard} elevation={1}>
            <View style={styles.callHeader}>
              <Text style={styles.callScenario}>{call.scenario}</Text>
              <Text style={styles.callEarned}>+₹{call.earned}</Text>
            </View>
            <View style={styles.callMeta}>
              <Text style={styles.callDetail}>
                {call.duration_min} min • {'⭐'.repeat(call.rating)}
              </Text>
              <Text style={styles.callDate}>{formatDate(call.date)}</Text>
            </View>
          </Surface>
        ))}

        {/* Info Note */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.infoTitle}>ℹ️ Payout Info</Text>
          <Text style={styles.infoText}>
            • Earnings are held for {CALL_ECONOMICS.PAYOUT_HOLD_DAYS} days
            before withdrawal
          </Text>
          <Text style={styles.infoText}>
            • Payouts via UPI or bank transfer (NEFT/IMPS)
          </Text>
          <Text style={styles.infoText}>
            • You earn ₹{CALL_ECONOMICS.LAWYER_PAYOUT_INR} per completed
            consultation
          </Text>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: brandColors.white,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  earningsCard: {
    backgroundColor: brandColors.primaryDark,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  earningsLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  earningsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: brandColors.white,
    marginBottom: spacing.lg,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  earningsStat: {
    alignItems: 'center',
  },
  earningsStatValue: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '700',
  },
  earningsStatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  earningsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  walletRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  walletCard: {
    flex: 1,
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: 'center',
  },
  walletLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  walletValue: {
    ...typography.h2,
    color: brandColors.secondary,
  },
  payoutButton: {
    borderRadius: 14,
    marginBottom: spacing.sm,
  },
  payoutButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  payoutNote: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  callCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  callScenario: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
  },
  callEarned: {
    ...typography.body,
    color: brandColors.secondary,
    fontWeight: '700',
  },
  callMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callDetail: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  callDate: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  infoCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  infoTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});
