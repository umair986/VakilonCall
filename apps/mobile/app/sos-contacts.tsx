import React, { useState, useEffect, useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text, TextInput } from 'react-native-paper';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relation: string;
}

const EMPTY_CONTACT: EmergencyContact = { name: '', phone: '', relation: '' };

export default function SosContactsScreen(): React.JSX.Element {
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ ...EMPTY_CONTACT }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getSosContacts()
      .then((result) => {
        if (result.success) {
          const sorted = [...result.data].sort((a, b) => a.priority - b.priority);
          setContacts(
            sorted.length > 0
              ? sorted.map((contact) => ({
                  id: contact.id,
                  name: contact.name,
                  phone: contact.phone,
                  relation: contact.relation ?? '',
                }))
              : [{ ...EMPTY_CONTACT }]
          );
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const addContact = useCallback(() => {
    if (contacts.length >= 3) {
      Alert.alert('Maximum reached', 'You can add up to 3 emergency contacts.');
      return;
    }
    setContacts((prev) => [...prev, { ...EMPTY_CONTACT }]);
  }, [contacts.length]);

  const removeContact = useCallback((index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateContact = useCallback(
    (index: number, field: keyof EmergencyContact, value: string) => {
      setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    },
    []
  );

  const handleSave = useCallback(async (): Promise<void> => {
    const validContacts = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      Alert.alert('Missing contact', 'Add at least one contact with name and phone.');
      return;
    }

    for (const contact of validContacts) {
      const digits = contact.phone.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 12 && digits.length !== 13) {
        Alert.alert('Invalid phone', `Invalid phone number for ${contact.name}.`);
        return;
      }
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const formatted = validContacts.map((contact) => {
        const digits = contact.phone.replace(/\D/g, '');
        return {
          name: contact.name.trim(),
          phone: contact.phone.startsWith('+91') ? contact.phone : `+91${digits.slice(-10)}`,
          relation: contact.relation.trim() || undefined,
        };
      });

      const result = await api.setSosContacts(formatted);
      if (result.success) {
        setContacts(
          result.data.map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            relation: contact.relation ?? '',
          }))
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        Alert.alert('Error', result.error.message);
      }
    } catch {
      Alert.alert('Save failed', 'Failed to save contacts. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [contacts]);

  if (isLoading) {
    return (
      <>
        <ScreenHeader title="Emergency Contacts" subtitle="Location alerts" back />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.text} />
        </View>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Emergency Contacts" subtitle="Location alerts" back />
      <Screen scroll>
        <LegalCard variant="danger" style={styles.infoBanner}>
          <StatusPill label="Emergency alert" tone="danger" icon="alert-outline" />
          <Text style={styles.infoText}>
            These contacts can receive an SMS with your GPS location when you
            request legal assistance.
          </Text>
        </LegalCard>

        <View style={styles.contactsList}>
          {contacts.map((contact, index) => (
            <LegalCard key={index} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactNumber}>Contact {index + 1}</Text>
                {contacts.length > 1 ? (
                  <IconButton
                    icon="close-circle-outline"
                    iconColor={brandColors.errorLight}
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
                placeholder="Rahul Sharma"
                value={contact.name}
                onChangeText={(v) => updateContact(index, 'name', v)}
                maxLength={100}
                outlineColor={brandColors.border}
                activeOutlineColor={brandColors.text}
                textColor={brandColors.text}
                placeholderTextColor={brandColors.textMuted}
              />

              <TextInput
                style={styles.input}
                mode="outlined"
                label="Phone Number *"
                placeholder="9876543210"
                value={contact.phone}
                onChangeText={(v) => updateContact(index, 'phone', v.replace(/[^\d+]/g, ''))}
                keyboardType="phone-pad"
                maxLength={13}
                outlineColor={brandColors.border}
                activeOutlineColor={brandColors.text}
                textColor={brandColors.text}
                placeholderTextColor={brandColors.textMuted}
              />

              <TextInput
                style={styles.input}
                mode="outlined"
                label="Relation"
                placeholder="Mother, friend, spouse"
                value={contact.relation}
                onChangeText={(v) => updateContact(index, 'relation', v)}
                maxLength={50}
                outlineColor={brandColors.border}
                activeOutlineColor={brandColors.text}
                textColor={brandColors.text}
                placeholderTextColor={brandColors.textMuted}
              />
            </LegalCard>
          ))}
        </View>

        {contacts.length < 3 ? (
          <PrimaryAction mode="outlined" onPress={addContact} icon="plus">
            Add Contact ({contacts.length}/3)
          </PrimaryAction>
        ) : null}

        {saveSuccess ? (
          <LegalCard variant="notice" style={styles.successBanner}>
            <Text style={styles.successText}>Emergency contacts saved successfully.</Text>
          </LegalCard>
        ) : null}

        <PrimaryAction
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          icon="content-save-outline"
        >
          {isSaving ? 'Saving' : 'Save Emergency Contacts'}
        </PrimaryAction>

        <LegalCard style={styles.previewCard}>
          <Text style={styles.previewTitle}>SMS preview</Text>
          <Text style={styles.previewText}>
            URGENT: [Your Name] needs help. Location: https://maps.google.com/?q=...
          </Text>
        </LegalCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: brandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  contactsList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactCard: {
    gap: spacing.sm,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactNumber: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  removeButton: {
    margin: 0,
  },
  input: {
    backgroundColor: brandColors.surface,
    fontSize: 15,
  },
  successBanner: {
    marginVertical: spacing.md,
  },
  successText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  previewCard: {
    marginTop: spacing.lg,
  },
  previewTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.sm,
  },
  previewText: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
});
