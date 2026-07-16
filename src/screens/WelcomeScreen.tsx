import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.orbit}>
        <View style={[styles.dot, styles.dotOne]} />
        <View style={[styles.dot, styles.dotTwo]} />
        <Text style={styles.orbitText}>*</Text>
      </View>
      <Text style={styles.logo}>Autism Go</Text>
      <Text style={styles.tagline}>Your calm, colorful companion for everyday plans.</Text>
      <View style={{ marginTop: spacing.xl, width: '100%' }}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  orbit: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  orbitText: { fontSize: 48, lineHeight: 52, color: colors.primary },
  dot: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  dotOne: { backgroundColor: colors.secondary, top: 8, right: 6 },
  dotTwo: { backgroundColor: '#FF9F7F', bottom: 7, left: 3 },
  logo: { ...typography.title, color: colors.primary, marginTop: spacing.md },
  tagline: { ...typography.subtitle, textAlign: 'center', marginTop: spacing.sm, maxWidth: 280 },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
