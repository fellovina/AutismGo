import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../theme/colors';

interface DatePickerModalProps {
  visible: boolean;
  value: Date | null;
  onCancel: () => void;
  onConfirm: (date: Date | null) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export default function DatePickerModal({
  visible,
  value,
  onCancel,
  onConfirm,
}: DatePickerModalProps) {
  const today = new Date();
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (!visible) return;
    const initial = value ?? new Date(2000, 0, 1);
    setYear(initial.getFullYear());
    setMonth(initial.getMonth());
    setDay(initial.getDate());
  }, [value, visible]);

  const updateYear = (amount: number) => {
    const nextYear = Math.min(today.getFullYear(), Math.max(1900, year + amount));
    setYear(nextYear);
    setDay((current) => Math.min(current, daysInMonth(nextYear, month)));
  };

  const updateMonth = (amount: number) => {
    const nextMonth = (month + amount + 12) % 12;
    setMonth(nextMonth);
    setDay((current) => Math.min(current, daysInMonth(year, nextMonth)));
  };

  const updateDay = (amount: number) => {
    const maximum = daysInMonth(year, month);
    setDay((current) => ((current - 1 + amount + maximum) % maximum) + 1);
  };

  const confirm = () => {
    const selectedDate = new Date(year, month, day);
    onConfirm(selectedDate > today ? today : selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Close date picker" />
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Date of Birth</Text>
              <Text style={styles.subtitle}>Choose your birth date</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onCancel} accessibilityLabel="Close date picker">
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.pickers}>
            <DatePart label="Month" value={MONTHS[month]} onDecrease={() => updateMonth(-1)} onIncrease={() => updateMonth(1)} />
            <DatePart label="Day" value={String(day)} onDecrease={() => updateDay(-1)} onIncrease={() => updateDay(1)} />
            <DatePart label="Year" value={String(year)} onDecrease={() => updateYear(-1)} onIncrease={() => updateYear(1)} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.clearButton} onPress={() => onConfirm(null)}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={confirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DatePart({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.datePart}>
      <Text style={styles.partLabel}>{label}</Text>
      <Pressable style={styles.stepButton} onPress={onIncrease} accessibilityLabel={`Increase ${label}`}>
        <MaterialCommunityIcons name="chevron-up" size={25} color={colors.primary} />
      </Pressable>
      <Text style={styles.partValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {value}
      </Text>
      <Pressable style={styles.stepButton} onPress={onDecrease} accessibilityLabel={`Decrease ${label}`}>
        <MaterialCommunityIcons name="chevron-down" size={25} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(23, 38, 61, 0.44)',
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    padding: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.surface,
    shadowColor: '#102A43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { ...typography.label, fontSize: 19 },
  subtitle: { ...typography.subtitle, fontSize: 13, marginTop: 3 },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pickers: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  datePart: { flex: 1, minWidth: 0, alignItems: 'center' },
  partLabel: { ...typography.label, fontSize: 13, marginBottom: spacing.xs },
  stepButton: {
    width: '100%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#EEF4FA',
  },
  partValue: {
    width: '100%',
    minHeight: 48,
    paddingVertical: 13,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  clearButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm, marginRight: 'auto' },
  clearText: { color: colors.error, fontWeight: '600' },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  cancelText: { color: colors.text, fontWeight: '600' },
  confirmButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  confirmText: { color: '#FFFFFF', fontWeight: '600' },
});
