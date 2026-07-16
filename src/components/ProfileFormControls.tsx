import React from 'react';
import { DimensionValue, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export function ProfileSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function ProfileField({
  label,
  value,
  editable,
  width,
  ...inputProps
}: TextInputProps & {
  label: string;
  value: string;
  editable: boolean;
  width: DimensionValue;
}) {
  return (
    <View style={[styles.field, { width }]}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          {...inputProps}
          value={value}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
      ) : (
        <Text style={[styles.readOnlyValue, !value && styles.emptyValue]}>
          {value || 'Not provided'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { ...typography.label, fontSize: 19, marginBottom: spacing.xs },
  cardSubtitle: {
    ...typography.subtitle,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  field: { minWidth: 0, marginTop: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FBFCFE',
    color: colors.text,
    fontSize: 15,
  },
  readOnlyValue: {
    minHeight: 48,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyValue: { color: colors.textMuted },
});
