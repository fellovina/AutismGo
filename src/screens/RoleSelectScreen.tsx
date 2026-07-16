import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

export default function RoleSelectScreen() {
  const { session, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<UserRole | null>(null);

  const chooseRole = async (role: UserRole) => {
    if (!session?.user) return;
    setLoading(role);

    // upsert because the profile row might not exist yet for a brand-new user
    await supabase.from('profiles').upsert({
      id: session.user.id,
      role,
    });

    await refreshProfile();
    setLoading(null);
    // RootNavigator will now route to the correct next step
    // (permission setup for autistic_user, or link screen for caregiver).
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's using Autism Go?</Text>
      <Text style={styles.subtitle}>This helps us set up the right experience for you.</Text>

      <TouchableOpacity
        style={[styles.card, styles.autisticCard]}
        onPress={() => chooseRole('autistic_user')}
        disabled={loading !== null}
      >
        {loading === 'autistic_user' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.cardIcon}>*</Text>
            <Text style={styles.cardTitle}>I'm an autistic individual</Text>
            <Text style={styles.cardSubtitle}>Track your own sensory patterns and get alerts</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.caregiverCard]}
        onPress={() => chooseRole('caregiver')}
        disabled={loading !== null}
      >
        {loading === 'caregiver' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.cardIcon}>+</Text>
            <Text style={styles.cardTitle}>I'm a caregiver</Text>
            <Text style={styles.cardSubtitle}>Support someone else using the app</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.title, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.subtitle, textAlign: 'center', marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 84,
    justifyContent: 'center',
  },
  cardTitle: { ...typography.label, fontSize: 17, marginBottom: 4 },
  cardSubtitle: { ...typography.subtitle, fontSize: 13 },
  autisticCard: { backgroundColor: colors.lavender, borderColor: '#C9BEFF' },
  caregiverCard: { backgroundColor: colors.mint, borderColor: '#A9E8CC' },
  cardIcon: { fontSize: 24, color: colors.primary, marginBottom: 4 },
});
