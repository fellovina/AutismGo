import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { SENSORY_TRIGGER_OPTIONS } from '../types';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function PersonalProfileScreen({ onComplete }: { onComplete: () => void }) {
  const { session, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSave = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    const ageNumber = parseInt(age, 10);
    if (!ageNumber || ageNumber <= 0 || ageNumber > 120) {
      setError('Please enter a valid age.');
      return;
    }
    if (!session?.user) return;

    setSaving(true);
    try {
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          age: ageNumber,
          invite_code: generateInviteCode(),
          onboarding_complete: true,
        })
        .eq('id', session.user.id)
        .select('id')
        .single();
      if (profileError || !updatedProfile) throw profileError ?? new Error('Profile was not updated.');

      const { error: sensoryError } = await supabase.from('sensory_profiles').upsert({
        user_id: session.user.id,
        top_triggers: selectedTriggers,
        notes: notes.trim() || null,
      }, { onConflict: 'user_id' });
      if (sensoryError) throw sensoryError;

      await refreshProfile();
      onComplete();
    } catch (saveError) {
      console.warn('Profile setup save failed', saveError);
      setError("We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>Tell Us About You</Text>
      <Text style={styles.subtitle}>
        This helps Autism Go personalize what counts as "overwhelming" for you specifically.
      </Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Your name" value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Your age"
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
      />

      <Text style={styles.label}>What tends to overwhelm you? (select any that apply)</Text>
      <View style={styles.chipRow}>
        {SENSORY_TRIGGER_OPTIONS.map((trigger) => {
          const selected = selectedTriggers.includes(trigger);
          return (
            <TouchableOpacity
              key={trigger}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleTrigger(trigger)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{trigger}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Anything else? (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. sudden loud noises, specific fabrics..."
        multiline
        numberOfLines={3}
        value={notes}
        onChangeText={setNotes}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Finish Setup</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.chipBackground,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: colors.chipSelected },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  error: { color: colors.error, marginTop: spacing.md },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
