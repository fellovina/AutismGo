import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'>;

export default function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={styles.input}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        onPress={() => setIsVisible((visible) => !visible)}
        accessibilityRole="button"
        accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
        hitSlop={4}
      >
        <MaterialCommunityIcons
          name={isVisible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  toggle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  togglePressed: {
    opacity: 0.55,
  },
});
