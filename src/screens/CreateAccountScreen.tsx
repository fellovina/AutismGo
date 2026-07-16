import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/RootNavigator';
import PasswordInput from '../components/PasswordInput';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateAccount'>;

export default function CreateAccountScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setError(null);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: signUpError, needsEmailConfirmation } = await signUp(email.trim(), password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsEmailConfirmation) {
      Alert.alert(
        'Check your email',
        `We sent a verification link to ${email.trim()}. Open it, then come back here and log in.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    // No confirmation required — RootNavigator will automatically move to
    // RoleSelect once it detects the new session.
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Let's get you set up.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <PasswordInput
        placeholder="At least 6 characters"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        textContentType="newPassword"
      />

      <Text style={styles.label}>Confirm Password</Text>
      <PasswordInput
        placeholder="Re-enter your password"
        placeholderTextColor={colors.textMuted}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        textContentType="newPassword"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
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
  error: { color: colors.error, marginTop: spacing.md },
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
