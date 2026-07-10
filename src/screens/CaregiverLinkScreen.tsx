import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CaregiverLinkScreen({ onComplete }: { onComplete: () => void }) {
  const { session, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const finishSetup = async () => {
    if (!session?.user) return;
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id);
    await refreshProfile();
    onComplete();
  };

  const handleLink = async () => {
    if (!code.trim()) {
      setError('Enter the invite code your patient shared with you.');
      return;
    }
    setError(null);
    setSaving(true);

    const { error: rpcError } = await supabase.rpc('link_caregiver_to_patient', {
      p_invite_code: code.trim().toUpperCase(),
    });

    setSaving(false);

    if (rpcError) {
      setError('That code didn\'t match anyone. Double check it and try again.');
      return;
    }

    await finishSetup();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Link to Someone You Support</Text>
      <Text style={styles.subtitle}>
        Ask them to open Autism Go → Profile → and share their invite code with you.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. AB3D9F"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLink} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Link Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={finishSetup} style={{ marginTop: spacing.md }}>
        <Text style={styles.link}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.title, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.subtitle, textAlign: 'center', marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 2,
  },
  error: { color: colors.error, marginTop: spacing.md, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: colors.primary, textAlign: 'center' },
});
