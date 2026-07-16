import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../theme/colors';

interface SelectionChipsProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: string[];
  editable: boolean;
  onToggle: (option: T) => void;
  singleSelect?: boolean;
  formatLabel?: (option: T) => string;
}

export default function SelectionChips<T extends string>({
  label,
  options,
  selected,
  editable,
  onToggle,
  singleSelect = false,
  formatLabel = (option) => option,
}: SelectionChipsProps<T>) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          if (!editable && !isSelected) return null;
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && editable && styles.chipPressed,
              ]}
              onPress={() => onToggle(option)}
              disabled={!editable}
              accessibilityRole={singleSelect ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: isSelected, disabled: !editable }}
            >
              {isSelected ? (
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              ) : null}
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {formatLabel(option)}
              </Text>
            </Pressable>
          );
        })}
        {!editable && selected.length === 0 ? <Text style={styles.empty}>Not provided</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  label: { ...typography.label, fontSize: 15, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F7FAFC',
  },
  chipSelected: { backgroundColor: '#177B68', borderColor: '#177B68' },
  chipPressed: { opacity: 0.7 },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF' },
  empty: { ...typography.subtitle, paddingVertical: spacing.sm },
});
