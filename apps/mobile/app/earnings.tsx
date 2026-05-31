import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { CALL_ECONOMICS } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';
import { LegalCard, MetricTile, PrimaryAction, Screen, ScreenHeader } from '../components/ui';

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
  const [earnings] = useState(MOCK_EARNINGS);

  return (
    <>
      <ScreenHeader title="Earnings" subtitle="Lawyer payouts" back />
      <Screen scroll>
        <LegalCard style={styles.heroCard}>
          <Text style={styles.sectionLabel}>Total earnings</Text>
          <Text style={styles.heroValue}>Rs {earnings.total_earnings.toLocaleString('en-IN')}</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroMeta}>{earnings.total_calls} calls</Text>
            <Text style={styles.heroMeta}>{earnings.avg_rating} rating</Text>
            <Text style={styles.heroMeta}>Rs {CALL_ECONOMICS.LAWYER_PAYOUT_INR}/call</Text>
          </View>
        </LegalCard>

        <View style={styles.metricsRow}>
          <MetricTile label="Available" value={`Rs ${earnings.wallet_balance}`} />
          <MetricTile label="Pending" value={`Rs ${earnings.pending_payout}`} />
        </View>

        <PrimaryAction
          onPress={() => undefined}
          icon="bank-transfer"
          disabled={earnings.wallet_balance < 100}
        >
          Request Payout
        </PrimaryAction>
        {earnings.wallet_balance < 100 ? (
          <Text style={styles.payoutNote}>Minimum Rs 100 required for withdrawal.</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Recent consultations</Text>
        <View style={styles.callList}>
          {earnings.recent_calls.map((call) => (
            <LegalCard key={call.id} style={styles.callCard}>
              <View style={styles.callHeader}>
                <Text style={styles.callScenario}>{call.scenario}</Text>
                <Text style={styles.callEarned}>+Rs {call.earned}</Text>
              </View>
              <Text style={styles.callMeta}>
                {call.duration_min} min | {call.rating}/5 rating | {formatDate(call.date)}
              </Text>
            </LegalCard>
          ))}
        </View>

        <LegalCard variant="notice" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payout information</Text>
          <Text style={styles.infoText}>
            Earnings are held for {CALL_ECONOMICS.PAYOUT_HOLD_DAYS} days before withdrawal.
          </Text>
          <Text style={styles.infoText}>Payouts are expected via UPI or bank transfer.</Text>
        </LegalCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '700',
    color: brandColors.text,
    fontVariant: ['tabular-nums'],
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroMeta: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  payoutNote: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  callList: {
    gap: spacing.sm,
  },
  callCard: {
    padding: spacing.md,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  callScenario: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
    flex: 1,
  },
  callEarned: {
    ...typography.bodySmall,
    color: brandColors.successLight,
    fontWeight: '700',
  },
  callMeta: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: spacing.xs,
  },
  infoCard: {
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  infoTitle: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  infoText: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
});
