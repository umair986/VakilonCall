import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { SCENARIOS } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const balance = useTokenStore((s) => s.balance);

  const handleGetHelp = useCallback((): void => {
    if (balance <= 0) {
      router.push('/token-store');
      return;
    }
    router.push('/scenario-select');
  }, [balance, router]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.full_name ?? 'there'} 👋
            </Text>
            <Text style={styles.greetingSub}>Your legal safety companion</Text>
          </View>
          <IconButton
            icon="account-circle"
            iconColor={brandColors.textSecondary}
            size={32}
            onPress={() => router.push('/profile')}
          />
        </View>

        {/* Token Balance Card */}
        <Surface style={styles.balanceCard} elevation={2}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Token Balance</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
              <Text style={styles.balanceSub}>
                {balance === 0
                  ? 'Buy tokens to get legal help'
                  : `${balance} consultation${balance !== 1 ? 's' : ''} available`}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.push('/token-store')}
              textColor={brandColors.primary}
              style={styles.buyButton}
              icon="plus"
              compact
            >
              Buy Tokens
            </Button>
          </View>
        </Surface>

        {/* Main CTA — Get Help Now */}
        <Surface style={styles.ctaCard} elevation={3}>
          <Text style={styles.ctaEmoji}>🚨</Text>
          <Text style={styles.ctaTitle}>Need Legal Help Right Now?</Text>
          <Text style={styles.ctaSubtitle}>
            Connect with a verified lawyer in under 60 seconds
          </Text>
          <Button
            mode="contained"
            onPress={handleGetHelp}
            style={styles.ctaButton}
            labelStyle={styles.ctaButtonLabel}
            contentStyle={styles.ctaButtonContent}
            icon="phone"
          >
            {balance > 0 ? 'Get Legal Help Now' : 'Buy Tokens to Start'}
          </Button>
        </Surface>

        {/* Quick Scenarios */}
        <View style={styles.scenariosSection}>
          <Text style={styles.sectionTitle}>Common Situations</Text>
          <View style={styles.scenariosGrid}>
            {SCENARIOS.slice(0, 6).map((scenario) => (
              <Surface key={scenario.type} style={styles.scenarioChip} elevation={1}>
                <Text style={styles.scenarioLabel}>{scenario.label}</Text>
              </Surface>
            ))}
          </View>
        </View>

        {/* Free Rights Section */}
        <Surface style={styles.rightsCard} elevation={1}>
          <View style={styles.rightsContent}>
            <Text style={styles.rightsIcon}>📜</Text>
            <View style={styles.rightsText}>
              <Text style={styles.rightsTitle}>Know Your Rights</Text>
              <Text style={styles.rightsSubtitle}>
                Free access to your constitutional rights — no tokens needed
              </Text>
            </View>
          </View>
          <Button
            mode="text"
            onPress={() => router.push('/rights')}
            textColor={brandColors.secondary}
            compact
          >
            View Rights →
          </Button>
        </Surface>

        {/* SOS Setup Reminder */}
        <Surface style={styles.sosCard} elevation={1}>
          <View style={styles.sosContent}>
            <Text style={styles.sosIcon}>🆘</Text>
            <View style={styles.sosText}>
              <Text style={styles.sosTitle}>Set Up Emergency Contacts</Text>
              <Text style={styles.sosSubtitle}>
                Your contacts will be alerted automatically when you need help
              </Text>
            </View>
          </View>
          <Button
            mode="text"
            onPress={() => router.push('/profile')}
            textColor={brandColors.accent}
            compact
          >
            Set Up →
          </Button>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: brandColors.white,
  },
  greetingSub: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: brandColors.primary,
    marginVertical: 2,
  },
  balanceSub: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
  buyButton: {
    borderRadius: 10,
    borderColor: brandColors.primary,
  },
  ctaCard: {
    backgroundColor: brandColors.primaryDark,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ctaEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  ctaTitle: {
    ...typography.h3,
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  ctaSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaButton: {
    borderRadius: 14,
    width: '100%',
    backgroundColor: brandColors.white,
  },
  ctaButtonLabel: {
    ...typography.button,
    color: brandColors.primaryDark,
  },
  ctaButtonContent: {
    paddingVertical: spacing.sm,
  },
  scenariosSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.md,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scenarioChip: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scenarioLabel: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
  rightsCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rightsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rightsIcon: {
    fontSize: 28,
  },
  rightsText: {
    flex: 1,
  },
  rightsTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
  },
  rightsSubtitle: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  sosCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.md,
  },
  sosContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  sosIcon: {
    fontSize: 28,
  },
  sosText: {
    flex: 1,
  },
  sosTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
  },
  sosSubtitle: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
});
