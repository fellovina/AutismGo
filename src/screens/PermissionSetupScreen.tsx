import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import * as Location from 'expo-location';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function PermissionSetupScreen({ onContinue }: { onContinue: () => void }) {
  const { session } = useAuth();
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [wearableSimulated, setWearableSimulated] = useState(false);
  const [saving, setSaving] = useState(false);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationChecked(true);
    if (status === 'granted') {
      setLocationGranted(true);
    } else {
      setLocationGranted(false);
      Alert.alert(
        'Location not enabled',
        'You can still use the app, but sensory-map and route features need location access. You can enable it later in Settings.'
      );
    }
  };

  const handleContinue = async () => {
    if (!session?.user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        location_permission_granted: locationGranted,
        wearable_simulated: wearableSimulated,
      })
      .eq('id', session.user.id);
    setSaving(false);
    onContinue();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Permissions</Text>
      <Text style={styles.subtitle}>
        Autism Go uses two types of data. Here's exactly what's real and what isn't.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Location</Text>
        <Text style={styles.cardBody}>
          Used to detect crowd levels near you and suggest calmer routes. This is real —
          your device will ask you to confirm.
        </Text>
        <TouchableOpacity
          style={[styles.smallButton, locationGranted && styles.smallButtonDisabled]}
          onPress={requestLocation}
        >
          <Text style={styles.smallButtonText}>
            {locationGranted ? '✓ Location Enabled' : 'Enable Location Access'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⌚ Wearable (Heart Rate / Sleep)</Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ Simulation only. This prototype does not connect to a real smartwatch. Toggling
            this on generates sample heart rate and sleep data so you can see how the feature
            would work. A finished version would connect via Apple Health or Health Connect.
          </Text>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.body}>Turn on simulated wearable data</Text>
          <Switch
            value={wearableSimulated}
            onValueChange={setWearableSimulated}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.title, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.subtitle, textAlign: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.label, fontSize: 16, marginBottom: spacing.xs },
  cardBody: { ...typography.body, marginBottom: spacing.md, color: colors.textMuted },
  body: { ...typography.body },
  smallButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallButtonDisabled: { backgroundColor: colors.secondary },
  smallButtonText: { color: '#fff', fontWeight: '600' },
  disclaimerBox: {
    backgroundColor: '#FFF6E5',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  disclaimerText: { fontSize: 12.5, color: '#8A6D1D', lineHeight: 17 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
