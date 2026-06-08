import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Text } from 'react-native-paper';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { SCENARIOS } from '@vakiloncall/shared';
import { radius, spacing, typography } from '../utils/theme';

const palette = {
  paper: '#FBFAF6',
  white: '#FFFFFF',
  ink: '#0B0B0B',
  black: '#000000',
  muted: '#62615C',
  soft: '#F0EDE5',
  line: '#D8D4C9',
  danger: '#B42318',
};

export default function HomeRoute(): React.JSX.Element {
  return <Redirect href="/user-tabs" />;
}

export function HomeScreen(): React.JSX.Element {
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.overline}>Vakil On Call</Text>
            <Text style={styles.title}>{user?.full_name ?? 'Legal desk'}</Text>
          </View>
          <IconButton
            icon="account-circle-outline"
            iconColor={palette.ink}
            size={28}
            onPress={() => router.push('/profile')}
            style={styles.profileButton}
          />
        </View>

        <View style={styles.commandPanel}>
          <View style={styles.commandTop}>
            <View style={styles.blackSeal}>
              <Icon source="phone-in-talk-outline" color={palette.white} size={26} />
            </View>
            <View style={styles.caseTag}>
              <Text style={styles.caseTagText}>{balance > 0 ? 'Ready to file' : 'Token required'}</Text>
            </View>
          </View>
          <Text style={styles.commandTitle}>Start a legal assistance request</Text>
          <Text style={styles.commandText}>
            Choose the issue, open a request, and connect with a verified lawyer
            when one is available.
          </Text>
          <Button
            mode="contained"
            onPress={handleGetHelp}
            buttonColor={palette.white}
            textColor={palette.black}
            icon={balance > 0 ? 'phone-in-talk-outline' : 'plus'}
            style={styles.commandButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {balance > 0 ? 'Request Lawyer' : 'Buy Tokens'}
          </Button>
        </View>

        <View style={styles.docketRow}>
          <View style={styles.docketCard}>
            <Text style={styles.docketLabel}>Tokens</Text>
            <Text style={styles.docketValue}>{balance}</Text>
            <Text style={styles.docketMeta}>
              {balance === 1 ? '1 consultation available' : `${balance} consultations available`}
            </Text>
          </View>
          <View style={styles.docketCard}>
            <Text style={styles.docketLabel}>Target response</Text>
            <Text style={styles.docketValue}>60s</Text>
            <Text style={styles.docketMeta}>Typical lawyer matching window</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Issue intake</Text>
          <Button mode="text" textColor={palette.black} onPress={() => router.push('/scenario-select')}>
            View all
          </Button>
        </View>

        <View style={styles.issueList}>
          {SCENARIOS.slice(0, 5).map((scenario, index) => (
            <View key={scenario.type} style={styles.issueRow}>
              <View style={styles.issueIndex}>
                <Text style={styles.issueIndexText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.issueCopy}>
                <Text style={styles.issueTitle}>{scenario.label}</Text>
                <Text style={styles.issueDescription} numberOfLines={2}>
                  {scenario.description}
                </Text>
              </View>
              <Icon source={scenario.icon || 'gavel'} color={palette.muted} size={20} />
            </View>
          ))}
        </View>

        <View style={styles.readinessPanel}>
          <Text style={styles.sectionTitle}>Readiness</Text>
          <ReadinessRow
            icon="shield-check-outline"
            title="Know Your Rights"
            subtitle="Free legal reference before you speak"
            onPress={() => router.push('/rights')}
          />
          <View style={styles.divider} />
          <ReadinessRow
            icon="alert-outline"
            title="Emergency Contacts"
            subtitle="Prepare location alerts for trusted contacts"
            onPress={() => router.push('/sos-contacts')}
            danger
          />
          <View style={styles.divider} />
          <ReadinessRow
            icon="wallet-outline"
            title="Token Store"
            subtitle="Keep consultation access ready"
            onPress={() => router.push('/token-store')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReadinessRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}): React.JSX.Element {
  return (
    <Button
      mode="text"
      onPress={onPress}
      textColor={palette.ink}
      contentStyle={styles.readinessContent}
      style={styles.readinessButton}
    >
      <View style={styles.readinessInner}>
        <View style={[styles.readinessIcon, danger && styles.readinessIconDanger]}>
          <Icon source={icon} color={danger ? palette.danger : palette.ink} size={20} />
        </View>
        <View style={styles.readinessCopy}>
          <Text style={styles.readinessTitle}>{title}</Text>
          <Text style={styles.readinessSubtitle}>{subtitle}</Text>
        </View>
        <Icon source="chevron-right" color={palette.muted} size={20} />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  letterhead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  overline: {
    ...typography.section,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: palette.ink,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    backgroundColor: palette.white,
  },
  commandPanel: {
    backgroundColor: palette.black,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  commandTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  blackSeal: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#363636',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseTag: {
    borderWidth: 1,
    borderColor: '#3E3E3E',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  caseTagText: {
    ...typography.caption,
    color: palette.white,
    fontWeight: '800',
  },
  commandTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: palette.white,
  },
  commandText: {
    ...typography.bodySmall,
    color: '#C8C8C2',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  commandButton: {
    borderRadius: radius.sm,
  },
  buttonContent: {
    minHeight: 50,
  },
  buttonLabel: {
    ...typography.button,
  },
  docketRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  docketCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 118,
  },
  docketLabel: {
    ...typography.section,
    color: palette.muted,
  },
  docketValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: palette.ink,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  docketMeta: {
    ...typography.caption,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: palette.muted,
  },
  issueList: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  issueIndex: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueIndexText: {
    ...typography.caption,
    color: palette.ink,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  issueCopy: {
    flex: 1,
  },
  issueTitle: {
    ...typography.bodySmall,
    color: palette.ink,
    fontWeight: '800',
  },
  issueDescription: {
    ...typography.caption,
    color: palette.muted,
    marginTop: 2,
  },
  readinessPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  readinessButton: {
    borderRadius: radius.sm,
  },
  readinessContent: {
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
  },
  readinessInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readinessIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
  readinessIconDanger: {
    borderColor: '#E4B7B3',
    backgroundColor: '#FFF3F2',
  },
  readinessCopy: {
    flex: 1,
    alignItems: 'flex-start',
  },
  readinessTitle: {
    ...typography.bodySmall,
    color: palette.ink,
    fontWeight: '800',
  },
  readinessSubtitle: {
    ...typography.caption,
    color: palette.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: palette.line,
  },
});
