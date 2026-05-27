import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SCENARIOS } from '@vakiloncall/shared';
import { useTokenStore } from '../stores/tokenStore';
import { brandColors, spacing, typography } from '../utils/theme';

// Map scenario icon names to emojis for cross-platform support
const SCENARIO_EMOJIS: Record<string, string> = {
  car: '🚗',
  'file-document-remove': '📄',
  handcuffs: '⛓️',
  'home-alert': '🏠',
  'phone-alert': '📱',
  'office-building': '🏢',
  'home-remove': '🏚️',
  shopping: '🛒',
  gavel: '⚖️',
};

export default function ScenarioSelectScreen(): React.JSX.Element {
  const router = useRouter();
  const balance = useTokenStore((s) => s.balance);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestHelp = useCallback(async (): Promise<void> => {
    if (!selectedScenario) return;

    if (balance <= 0) {
      router.push('/token-store');
      return;
    }

    setIsRequesting(true);

    try {
      // TODO: In Sprint 3, this will:
      // 1. Fire SOS to emergency contacts (if set up)
      // 2. Emit WebSocket event to matching engine
      // 3. Navigate to "Searching for Lawyer" screen
      // For now, show a placeholder

      // Simulate a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to matching screen (to be built in Sprint 3)
      // router.push({ pathname: '/matching', params: { scenario: selectedScenario } });
      router.back(); // Temporary — go back to home
    } catch {
      // Error handling
    } finally {
      setIsRequesting(false);
    }
  }, [selectedScenario, balance, router]);

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
        <Text style={styles.headerTitle}>What's Happening?</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Select the situation you're facing. This helps us connect you with the
          right lawyer.
        </Text>

        {/* Scenario Grid */}
        <View style={styles.scenariosGrid}>
          {SCENARIOS.map((scenario) => {
            const isSelected = selectedScenario === scenario.type;
            return (
              <Pressable
                key={scenario.type}
                onPress={() => setSelectedScenario(scenario.type)}
                style={styles.scenarioPressable}
              >
                <Surface
                  style={[
                    styles.scenarioCard,
                    isSelected && styles.scenarioCardSelected,
                  ]}
                  elevation={isSelected ? 3 : 1}
                >
                  <Text style={styles.scenarioEmoji}>
                    {SCENARIO_EMOJIS[scenario.icon] ?? '⚖️'}
                  </Text>
                  <Text
                    style={[
                      styles.scenarioLabel,
                      isSelected && styles.scenarioLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {scenario.label}
                  </Text>
                  <Text
                    style={styles.scenarioDescription}
                    numberOfLines={2}
                  >
                    {scenario.description}
                  </Text>
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  ) : null}
                </Surface>
              </Pressable>
            );
          })}
        </View>

        {/* Token Balance Warning */}
        {balance <= 0 ? (
          <Surface style={styles.warningCard} elevation={1}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>No Tokens Available</Text>
              <Text style={styles.warningSub}>
                You need at least 1 token to connect with a lawyer.
              </Text>
            </View>
          </Surface>
        ) : null}

        {/* Request Button */}
        <Button
          mode="contained"
          onPress={handleRequestHelp}
          loading={isRequesting}
          disabled={!selectedScenario || isRequesting}
          style={[
            styles.requestButton,
            balance <= 0 && styles.requestButtonBuyTokens,
          ]}
          labelStyle={styles.requestButtonLabel}
          contentStyle={styles.requestButtonContent}
          icon={balance > 0 ? 'phone' : 'plus'}
        >
          {isRequesting
            ? 'Connecting...'
            : balance <= 0
            ? 'Buy Tokens First'
            : 'Connect with Lawyer Now'}
        </Button>

        {selectedScenario && balance > 0 ? (
          <Text style={styles.costNote}>
            This will use 1 token from your balance ({balance} remaining)
          </Text>
        ) : null}

        {/* Tips Section */}
        <Surface style={styles.tipsCard} elevation={1}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipItem}>
            • Stay calm and describe your situation clearly
          </Text>
          <Text style={styles.tipItem}>
            • The lawyer can hear you — no video required
          </Text>
          <Text style={styles.tipItem}>
            • Call is limited to 15 minutes per token
          </Text>
          <Text style={styles.tipItem}>
            • Your location will be shared with the lawyer for context
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
  subtitle: {
    ...typography.body,
    color: brandColors.textSecondary,
    marginBottom: spacing.lg,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  scenarioPressable: {
    width: '47%',
    flexGrow: 1,
  },
  scenarioCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 130,
    position: 'relative',
  },
  scenarioCardSelected: {
    borderColor: brandColors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  scenarioEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  scenarioLabel: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  scenarioLabelSelected: {
    color: brandColors.primaryLight,
  },
  scenarioDescription: {
    ...typography.caption,
    color: brandColors.textMuted,
    lineHeight: 16,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: brandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: brandColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.accent,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    ...typography.body,
    color: brandColors.accent,
    fontWeight: '600',
  },
  warningSub: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  requestButton: {
    borderRadius: 14,
  },
  requestButtonBuyTokens: {
    backgroundColor: brandColors.accent,
  },
  requestButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  requestButtonContent: {
    paddingVertical: spacing.sm,
  },
  costNote: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  tipsCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  tipsTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tipItem: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});
