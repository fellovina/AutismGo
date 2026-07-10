import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Autism Go</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...typography.title,
    color: colors.primary,
  },
});
