import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { SCENARIOS } from '@vakiloncall/shared';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import {
  ActionRow,
  LegalCard,
  MetricTile,
  PrimaryAction,
  Screen,
  StatusPill,
} from '../components/ui';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const balance = useTokenStore((s) => s.balance);
  const setBalance = useTokenStore((s) => s.setBalance);

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await api.getTokenBalance();
        if (res.success && res.data && typeof res.data.token_balance === 'number' && isMounted) {
          setBalance(res.data.token_balance);
        }
      } catch (err) {
        console.error('Failed to fetch token balance:', err);
      }
    };
    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [setBalance]);

  const handleGetHelp = useCallback((): void => {
    router.push(balance <= 0 ? '/token-store' : '/scenario-select');
  }, [balance, router]);

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Citizen dashboard</Text>
          <Text style={styles.title}>{user?.full_name ?? 'Legal assistance'}</Text>
        </View>
        <IconButton
          icon="account-circle-outline"
          iconColor={brandColors.textSecondary}
          size={28}
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricTile
          label="Tokens"
          value={balance}
          supportingText={balance === 1 ? '1 consultation' : `${balance} consultations`}
        />
        <MetricTile label="Response" value="<60s" supportingText="Typical match time" />
      </View>

      <LegalCard style={styles.commandCard}>
        <View style={styles.commandHeader}>
          <View style={styles.commandIcon}>
            <Icon source="phone-in-talk-outline" color={brandColors.black} size={24} />
          </View>
          <StatusPill
            label={balance > 0 ? 'Ready' : 'Token required'}
            tone={balance > 0 ? 'success' : 'warning'}
          />
        </View>
        <Text style={styles.commandTitle}>Request legal assistance</Text>
        <Text style={styles.commandCopy}>
          Select your situation and connect with an available verified lawyer.
        </Text>
        <PrimaryAction
          onPress={handleGetHelp}
          icon={balance > 0 ? 'phone-in-talk-outline' : 'plus'}
        >
          {balance > 0 ? 'Start Request' : 'Buy Tokens'}
        </PrimaryAction>
      </LegalCard>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Common situations</Text>
          <Button mode="text" textColor={brandColors.textSecondary} onPress={() => router.push('/scenario-select')}>
            View all
          </Button>
        </View>
        <View style={styles.scenarioList}>
          {SCENARIOS.slice(0, 5).map((scenario) => (
            <LegalCard key={scenario.type} variant="outlined" style={styles.scenarioRow}>
              <Icon source={scenario.icon || 'gavel'} color={brandColors.textSecondary} size={20} />
              <View style={styles.scenarioCopy}>
                <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                <Text style={styles.scenarioDescription} numberOfLines={1}>
                  {scenario.description}
                </Text>
              </View>
            </LegalCard>
          ))}
        </View>
      </View>

      <LegalCard style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Legal readiness</Text>
        <ActionRow
          icon="shield-check-outline"
          title="Know Your Rights"
          subtitle="Free constitutional rights reference"
          onPress={() => router.push('/rights')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="alert-outline"
          title="Emergency Contacts"
          subtitle="Add trusted contacts for location alerts"
          tone="danger"
          onPress={() => router.push('/sos-contacts')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="wallet-outline"
          title="Token Store"
          subtitle="Manage consultation balance"
          onPress={() => router.push('/token-store')}
        />
      </LegalCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kicker: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: brandColors.text,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: radius.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  commandCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: brandColors.text,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commandIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: '#D5D5CE',
  },
  commandTitle: {
    ...typography.h2,
    color: brandColors.black,
  },
  commandCopy: {
    ...typography.bodySmall,
    color: '#3F3F3A',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  scenarioList: {
    gap: spacing.sm,
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  scenarioCopy: {
    flex: 1,
  },
  scenarioLabel: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
  },
  scenarioDescription: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  actionsCard: {
    gap: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.border,
  },
});
