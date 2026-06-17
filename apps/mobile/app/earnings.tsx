import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { CALL_ECONOMICS, SCENARIOS } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';
import { LegalCard, MetricTile, PrimaryAction, Screen, ScreenHeader } from '../components/ui';
import { api } from '../services/api';

interface EarningsData {
  total_earnings: number;
  wallet_balance: number;
  pending_payout: number;
  total_calls: number;
  avg_rating: number;
  recent_calls: Array<{
    id: string;
    scenario: string;
    duration_min: number;
    earned: number;
    date: string;
    rating: number | null;
  }>;
}

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

function scenarioLabel(type: string): string {
  return SCENARIOS.find((s) => s.type === type)?.label ?? type;
}

export default function EarningsScreen(): React.JSX.Element {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEarnings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await api.getLawyerEarnings();
      if (result.success) {
        setEarnings(result.data);
      } else {
        setError(result.error?.message ?? 'Failed to load earnings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  if (isLoading) {
    return (
      <>
        <ScreenHeader title="Earnings" subtitle="Lawyer payouts" back />
        <Screen centered>
          <ActivityIndicator size="large" color={brandColors.text} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </Screen>
      </>
    );
  }

  if (error || !earnings) {
    return (
      <>
        <ScreenHeader title="Earnings" subtitle="Lawyer payouts" back />
        <Screen centered>
          <Text style={styles.errorText}>{error || 'Failed to load earnings.'}</Text>
          <PrimaryAction onPress={loadEarnings} icon="refresh">Retry</PrimaryAction>
        </Screen>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Earnings" subtitle="Lawyer payouts" back />
      <Screen scroll>
        <LegalCard style={styles.heroCard}>
          <Text style={styles.sectionLabel}>Total earnings</Text>
          <Text style={styles.heroValue}>₹{earnings.total_earnings.toLocaleString('en-IN')}</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroMeta}>{earnings.total_calls} calls</Text>
            <Text style={styles.heroMeta}>{earnings.avg_rating.toFixed(1)} rating</Text>
            <Text style={styles.heroMeta}>₹{CALL_ECONOMICS.LAWYER_PAYOUT_INR}/call</Text>
          </View>
        </LegalCard>

        <View style={styles.metricsRow}>
          <MetricTile label="Available" value={`₹${earnings.wallet_balance}`} />
          <MetricTile label="Pending" value={`₹${earnings.pending_payout}`} />
        </View>

        <PrimaryAction
          onPress={() => undefined}
          icon="bank-transfer"
          disabled={earnings.wallet_balance < 100}
        >
          Request Payout
        </PrimaryAction>
        {earnings.wallet_balance < 100 ? (
          <Text style={styles.payoutNote}>Minimum ₹100 required for withdrawal.</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Recent consultations</Text>
        <View style={styles.callList}>
          {earnings.recent_calls.length === 0 ? (
            <LegalCard style={styles.callCard}>
              <Text style={styles.emptyText}>No completed calls yet. Go online to start receiving requests.</Text>
            </LegalCard>
          ) : (
            earnings.recent_calls.map((call) => (
              <LegalCard key={call.id} style={styles.callCard}>
                <View style={styles.callHeader}>
                  <Text style={styles.callScenario}>{scenarioLabel(call.scenario)}</Text>
                  <Text style={styles.callEarned}>+₹{call.earned}</Text>
                </View>
                <Text style={styles.callMeta}>
                  {call.duration_min} min{call.rating != null ? ` | ${call.rating}/5 rating` : ''} | {formatDate(call.date)}
                </Text>
              </LegalCard>
            ))
          )}
        </View>

        <LegalCard variant="notice" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payout information</Text>
          <Text style={styles.infoText}>
            Earnings are held for {CALL_ECONOMICS.PAYOUT_HOLD_DAYS} days before withdrawal.
          </Text>
          <Text style={styles.infoText}>Payouts are processed via UPI or bank transfer.</Text>
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
  emptyText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
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
  loadingText: {
    ...typography.bodySmall,
    color: brandColors.textMuted,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
