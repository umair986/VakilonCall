import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  TextInput,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { brandColors, spacing, typography } from '../utils/theme';

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relation: string;
}

const EMPTY_CONTACT: EmergencyContact = { name: '', phone: '', relation: '' };

export default function SosContactsScreen(): React.JSX.Element {
  const router = useRouter();

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { ...EMPTY_CONTACT },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing contacts on mount
  useEffect(() => {
    // TODO: Replace with api.getSosContacts()
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const addContact = useCallback(() => {
    if (contacts.length >= 3) {
      Alert.alert('Maximum Reached', 'You can add up to 3 emergency contacts.');
      return;
    }
    setContacts((prev) => [...prev, { ...EMPTY_CONTACT }]);
  }, [contacts.length]);

  const removeContact = useCallback((index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateContact = useCallback(
    (index: number, field: keyof EmergencyContact, value: string) => {
      setContacts((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleSave = useCallback(async (): Promise<void> => {
    // Validate
    const validContacts = contacts.filter(
      (c) => c.name.trim() && c.phone.trim()
    );

    if (validContacts.length === 0) {
      Alert.alert('Error', 'Please add at least one contact with name and phone.');
      return;
    }

    // Validate phone numbers
    for (const contact of validContacts) {
      const digits = contact.phone.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 12 && digits.length !== 13) {
        Alert.alert('Error', `Invalid phone number for ${contact.name}. Use +91XXXXXXXXXX format.`);
        return;
      }
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Format phones with +91 prefix
      const formatted = validContacts.map((c) => ({
        name: c.name.trim(),
        phone: c.phone.startsWith('+91')
          ? c.phone
          : `+91${c.phone.replace(/\D/g, '').slice(-10)}`,
        relation: c.relation.trim() || undefined,
      }));

      // TODO: Replace with api.setSosContacts(formatted)
      // Simulate save
      await new Promise((r) => setTimeout(r, 500));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      Alert.alert('Error', 'Failed to save contacts. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [contacts]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <Surface style={styles.infoBanner} elevation={1}>
          <Text style={styles.infoIcon}>🆘</Text>
          <Text style={styles.infoText}>
            These contacts will receive an SMS with your GPS location when you
            press "Get Legal Help Now". Add trusted family or friends who can
            help in an emergency.
          </Text>
        </Surface>

        {/* Contact Cards */}
        {contacts.map((contact, index) => (
          <Surface key={index} style={styles.contactCard} elevation={1}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactNumber}>
                Contact #{index + 1}
              </Text>
              {contacts.length > 1 ? (
                <IconButton
                  icon="close-circle"
                  iconColor={brandColors.error}
                  size={20}
                  onPress={() => removeContact(index)}
                  style={styles.removeButton}
                />
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              mode="outlined"
              label="Full Name *"
              placeholder="e.g. Mom, Rahul Sharma"
              value={contact.name}
              onChangeText={(v) => updateContact(index, 'name', v)}
              maxLength={100}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholderTextColor={brandColors.textMuted}
            />

            <TextInput
              style={styles.input}
              mode="outlined"
              label="Phone Number *"
              placeholder="9876543210"
              value={contact.phone}
              onChangeText={(v) =>
                updateContact(index, 'phone', v.replace(/[^\d+]/g, ''))
              }
              keyboardType="phone-pad"
              maxLength={13}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholderTextColor={brandColors.textMuted}
            />

            <TextInput
              style={styles.input}
              mode="outlined"
              label="Relation (optional)"
              placeholder="e.g. Mother, Friend, Spouse"
              value={contact.relation}
              onChangeText={(v) => updateContact(index, 'relation', v)}
              maxLength={50}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholderTextColor={brandColors.textMuted}
            />
          </Surface>
        ))}

        {/* Add Contact Button */}
        {contacts.length < 3 ? (
          <Button
            mode="outlined"
            onPress={addContact}
            textColor={brandColors.primary}
            style={styles.addButton}
            icon="plus"
          >
            Add Contact ({contacts.length}/3)
          </Button>
        ) : null}

        {/* Success message */}
        {saveSuccess ? (
          <Surface style={styles.successBanner} elevation={1}>
            <Text style={styles.successText}>
              ✅ Emergency contacts saved successfully!
            </Text>
          </Surface>
        ) : null}

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
          contentStyle={styles.saveButtonContent}
          icon="content-save"
        >
          {isSaving ? 'Saving...' : 'Save Emergency Contacts'}
        </Button>

        {/* SMS Preview */}
        <Surface style={styles.previewCard} elevation={1}>
          <Text style={styles.previewTitle}>📱 SMS Preview</Text>
          <Text style={styles.previewText}>
            "URGENT: [Your Name] needs help! Location:
            https://maps.google.com/?q=... | Time: [current time] | Sent via
            Vakil On Call"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.error,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactNumber: {
    ...typography.body,
    color: brandColors.primary,
    fontWeight: '600',
  },
  removeButton: {
    margin: 0,
  },
  input: {
    backgroundColor: brandColors.surface,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  addButton: {
    borderRadius: 12,
    borderColor: brandColors.primary,
    marginBottom: spacing.lg,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.body,
    color: brandColors.secondary,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  saveButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
  previewCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
  },
  previewTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  previewText: {
    ...typography.caption,
    color: brandColors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
