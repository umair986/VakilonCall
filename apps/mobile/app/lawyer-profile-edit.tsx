import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LANGUAGES, SCENARIOS } from '@vakiloncall/shared';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

export default function LawyerProfileEditScreen(): React.JSX.Element {
  const router = useRouter();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current profile data
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await api.getLawyerProfile();
        if (result.success && isMounted) {
          const data = result.data as {
            languages?: string[];
            scenario_tags?: string[];
          };
          if (data.languages?.length) setSelectedLanguages(data.languages);
          if (data.scenario_tags?.length) setSelectedScenarios(data.scenario_tags);
        }
      } catch {
        // Use defaults
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  const toggleLanguage = useCallback((code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(code)) {
        // Don't allow removing the last language
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== code);
      }
      return [...prev, code];
    });
    setSaveSuccess(false);
  }, []);

  const toggleScenario = useCallback((type: string) => {
    setSelectedScenarios((prev) => {
      if (prev.includes(type)) {
        return prev.filter((s) => s !== type);
      }
      return [...prev, type];
    });
    setSaveSuccess(false);
  }, []);

  const selectAllScenarios = useCallback(() => {
    setSelectedScenarios(SCENARIOS.map((s) => s.type));
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const result = await api.updateLawyerProfile({
        languages: selectedLanguages,
        scenario_tags: selectedScenarios,
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          router.back();
        }, 800);
      } else {
        setError(result.error?.message ?? 'Failed to update profile');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedLanguages, selectedScenarios, router]);

  if (isLoading) {
    return (
      <>
        <ScreenHeader title="Edit Expertise" subtitle="Languages & scenarios" back />
        <Screen centered>
          <ActivityIndicator size="large" color={brandColors.text} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Edit Expertise" subtitle="Languages & scenarios" back />
      <Screen scroll>
        {/* Languages Section */}
        <LegalCard style={styles.sectionCard}>
          <StatusPill label="Languages you speak" icon="translate" />
          <Text style={styles.sectionSubtitle}>
            Select the languages you can consult in. Matching uses these to pair you with users.
          </Text>
          <View style={styles.chipGrid}>
            {LANGUAGES.filter((l) => l.available_phase <= 2).map((lang) => {
              const isSelected = selectedLanguages.includes(lang.code);
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Icon
                    source={isSelected ? 'check-circle' : 'circle-outline'}
                    size={18}
                    color={isSelected ? brandColors.successLight : brandColors.textMuted}
                  />
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.chipNative}>{lang.native_label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hint}>
            More languages (Tamil, Telugu, Kannada, Bengali, Marathi) coming in Phase 4.
          </Text>
        </LegalCard>

        {/* Scenarios Section */}
        <LegalCard style={styles.sectionCard}>
          <View style={styles.scenarioHeader}>
            <StatusPill label="Scenario expertise" icon="briefcase-outline" />
            <TouchableOpacity onPress={selectAllScenarios} activeOpacity={0.7}>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose which legal scenarios you can handle. Requests are routed based on these tags.
          </Text>
          <View style={styles.scenarioList}>
            {SCENARIOS.map((scenario) => {
              const isSelected = selectedScenarios.includes(scenario.type);
              return (
                <TouchableOpacity
                  key={scenario.type}
                  style={[styles.scenarioItem, isSelected && styles.scenarioItemSelected]}
                  onPress={() => toggleScenario(scenario.type)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scenarioLeft}>
                    <Icon
                      source={scenario.icon}
                      size={22}
                      color={isSelected ? brandColors.text : brandColors.textMuted}
                    />
                    <View style={styles.scenarioCopy}>
                      <Text style={[styles.scenarioLabel, isSelected && styles.scenarioLabelSelected]}>
                        {scenario.label}
                      </Text>
                      <Text style={styles.scenarioDesc}>{scenario.description}</Text>
                    </View>
                  </View>
                  <Icon
                    source={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={isSelected ? brandColors.successLight : brandColors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </LegalCard>

        {/* Summary */}
        <LegalCard variant="notice" style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} · {selectedScenarios.length} scenario{selectedScenarios.length !== 1 ? 's' : ''}
          </Text>
          {selectedScenarios.length === 0 && (
            <Text style={styles.warningText}>
              ⚠ No scenarios selected — you won't receive any call requests.
            </Text>
          )}
        </LegalCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryAction
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || selectedScenarios.length === 0}
          icon={saveSuccess ? 'check-circle-outline' : 'content-save-outline'}
        >
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </PrimaryAction>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  chipSelected: {
    borderColor: brandColors.successLight,
    backgroundColor: `${brandColors.successLight}10`,
  },
  chipLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: brandColors.text,
  },
  chipNative: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  hint: {
    ...typography.caption,
    color: brandColors.textMuted,
    fontStyle: 'italic',
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scenarioList: {
    gap: spacing.xs,
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  scenarioItemSelected: {
    borderColor: brandColors.successLight,
    backgroundColor: `${brandColors.successLight}10`,
  },
  scenarioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  scenarioCopy: {
    flex: 1,
    gap: 2,
  },
  scenarioLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    fontWeight: '600',
  },
  scenarioLabelSelected: {
    color: brandColors.text,
  },
  scenarioDesc: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  summaryCard: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  warningText: {
    ...typography.caption,
    color: brandColors.errorLight,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
