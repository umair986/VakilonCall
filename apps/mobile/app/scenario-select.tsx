import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SCENARIOS } from '@vakiloncall/shared';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { getCurrentLocation } from '../utils/location';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

export default function ScenarioSelectScreen(): React.JSX.Element {
  const router = useRouter();
  const balance = useTokenStore((s) => s.balance);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');

  const handleRequestHelp = useCallback(async (): Promise<void> => {
    if (!selectedScenario) return;
    if (balance <= 0) {
      router.push('/token-store');
      return;
    }

    setError('');
    setIsRequesting(true);

    try {
      const location = await getCurrentLocation();
      const result = await api.requestCall(
        selectedScenario,
        location?.latitude,
        location?.longitude
      );

      if (result.success) {
        const data = result.data as { call_session_id: string };

        if (location) {
          api.fireSos({
            latitude: location.latitude,
            longitude: location.longitude,
          }).catch(() => {
            // Non-blocking: emergency contacts may not be configured yet.
          });
        }

        router.push({
          pathname: '/matching',
          params: { scenario: selectedScenario, callSessionId: data.call_session_id },
        });
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to create a call request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  }, [selectedScenario, balance, router]);

  const selected = SCENARIOS.find((scenario) => scenario.type === selectedScenario);

  return (
    <>
      <ScreenHeader title="Situation" subtitle="Choose legal category" back />
      <Screen scroll contentStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Select the situation you are facing. This helps route your request to
          the right available lawyer.
        </Text>

        <View style={styles.scenariosGrid}>
          {SCENARIOS.map((scenario) => {
            const isSelected = selectedScenario === scenario.type;
            return (
              <Pressable
                key={scenario.type}
                onPress={() => setSelectedScenario(scenario.type)}
                style={styles.scenarioPressable}
              >
                <LegalCard style={[styles.scenarioCard, isSelected && styles.scenarioCardSelected]}>
                  <View style={styles.scenarioIconRow}>
                    <View style={styles.scenarioIcon}>
                      <Icon source={scenario.icon || 'gavel'} color={brandColors.text} size={22} />
                    </View>
                    {isSelected ? <Icon source="check-circle" color={brandColors.text} size={18} /> : null}
                  </View>
                  <Text style={styles.scenarioLabel} numberOfLines={2}>
                    {scenario.label}
                  </Text>
                  <Text style={styles.scenarioDescription} numberOfLines={3}>
                    {scenario.description}
                  </Text>
                </LegalCard>
              </Pressable>
            );
          })}
        </View>

        {balance <= 0 ? (
          <LegalCard variant="notice" style={styles.notice}>
            <StatusPill label="Token required" tone="warning" icon="alert-outline" />
            <Text style={styles.noticeTitle}>No consultation tokens available</Text>
            <Text style={styles.noticeText}>
              You need at least one token to connect with a lawyer.
            </Text>
          </LegalCard>
        ) : null}

        <LegalCard style={styles.guidanceCard}>
          <Text style={styles.sectionTitle}>Before connecting</Text>
          <Text style={styles.guidanceText}>- Stay calm and describe facts clearly.</Text>
          <Text style={styles.guidanceText}>- The call is audio-only and limited to 15 minutes per token.</Text>
          <Text style={styles.guidanceText}>- Your selected category helps lawyers prepare context.</Text>
        </LegalCard>

        {error ? (
          <LegalCard variant="danger" style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </LegalCard>
        ) : null}
      </Screen>

      <View style={styles.stickyBar}>
        <View style={styles.stickyCopy}>
          <Text style={styles.stickyLabel}>Selected</Text>
          <Text style={styles.stickyValue} numberOfLines={1}>
            {selected?.label ?? 'No situation selected'}
          </Text>
        </View>
        <PrimaryAction
          onPress={handleRequestHelp}
          loading={isRequesting}
          disabled={!selectedScenario || isRequesting}
          icon={balance > 0 ? 'phone-in-talk-outline' : 'plus'}
          style={styles.stickyButton}
        >
          {balance <= 0 ? 'Buy Tokens' : 'Connect'}
        </PrimaryAction>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  intro: {
    ...typography.bodySmall,
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
    minHeight: 148,
    padding: spacing.md,
    gap: spacing.sm,
  },
  scenarioCardSelected: {
    borderColor: brandColors.text,
    backgroundColor: brandColors.surfaceElevated,
  },
  scenarioIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioLabel: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
  },
  scenarioDescription: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  notice: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  noticeText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  guidanceCard: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.sm,
  },
  guidanceText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  errorCard: {
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E0DA',
  },
  stickyCopy: {
    flex: 1,
  },
  stickyLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  stickyValue: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
  },
  stickyButton: {
    minWidth: 130,
  },
});
