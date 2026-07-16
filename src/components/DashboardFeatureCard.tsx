import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../theme/colors';

interface DashboardFeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  backgroundColor: string;
  width: number;
  onPress?: () => void;
}

export default function DashboardFeatureCard({
  title,
  description,
  icon,
  accentColor,
  backgroundColor,
  width,
  onPress,
}: DashboardFeatureCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width }, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <MaterialCommunityIcons name={icon} size={25} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 184,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.label,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.subtitle,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
});
