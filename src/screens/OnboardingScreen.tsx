import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroIcon}><Text style={styles.heroIconText}>+</Text></View>
      <Text style={styles.title}>Welcome to Autism Go</Text>
      <Text style={styles.subtitle}>
        Autism Go helps you notice when a place or moment might feel overwhelming —
        before it happens — so you can plan around it with confidence.
      </Text>
      <View style={styles.chipRow}>
        <Text style={[styles.chip, styles.mintChip]}>Plan ahead</Text>
        <Text style={[styles.chip, styles.sunChip]}>Feel supported</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.md, textAlign: 'center' },
  heroIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.sunshine, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroIconText: { fontSize: 42, color: colors.primary },
  subtitle: {
    ...typography.subtitle,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  chip: { overflow: 'hidden', paddingVertical: 8, paddingHorizontal: 13, borderRadius: 18, color: colors.text, fontWeight: '700', fontSize: 13 },
  mintChip: { backgroundColor: colors.mint },
  sunChip: { backgroundColor: colors.sunshine },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
