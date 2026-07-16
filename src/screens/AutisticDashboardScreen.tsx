import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function AutisticDashboardScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {profile?.full_name ?? 'there'} 👋</Text>
      <Text style={styles.subtitle}>Your invite code (share with a caregiver):</Text>
      <Text style={styles.code}>{profile?.invite_code}</Text>
      <Text style={styles.placeholder}>
        The main dashboard (sensory map, risk score, recovery mode) isn't built yet —
        this is just confirming login + onboarding worked end to end.
      </Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.title, marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
  code: {
    ...typography.title,
    fontSize: 32,
    letterSpacing: 4,
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.md,
    backgroundColor: colors.lavender,
    borderRadius: 18,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#C9BEFF',
  },
  placeholder: { ...typography.subtitle, textAlign: 'center', marginVertical: spacing.lg },
  button: {
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
