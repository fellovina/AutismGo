import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import { RecoveryIcon } from '../features/recovery/data';
import { RecoveryScreen } from '../features/recovery/RecoveryUI';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'CalmAudios'>;

const audioOptions: {
  id: string;
  title: string;
  description: string;
  icon: RecoveryIcon;
  color: string;
}[] = [
  { id: 'audio-1', title: 'Audio 1', description: 'Empty slot for your file', icon: 'music-note-outline', color: colors.sky },
  { id: 'audio-2', title: 'Audio 2', description: 'Empty slot for your file', icon: 'music-note-outline', color: colors.lavender },
  { id: 'audio-3', title: 'Audio 3', description: 'Empty slot for your file', icon: 'music-note-outline', color: colors.mint },
  { id: 'audio-4', title: 'Audio 4', description: 'Empty slot for your file', icon: 'music-note-outline', color: colors.sunshine },
  { id: 'audio-5', title: 'Audio 5', description: 'Empty slot for your file', icon: 'music-note-outline', color: colors.coral },
];

export default function CalmAudiosEntryScreen({ navigation }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <RecoveryScreen title="Listen to Audios" onBack={() => navigation.goBack()}>
      <Text style={styles.title}>Choose an audio</Text>
      <Text style={styles.copy}>
        These 5 audio slots are ready for your files later. For now, the play button is just a placeholder.
      </Text>

      <View style={styles.list}>
        {audioOptions.map((audio) => {
          const isSelected = selectedId === audio.id;

          return (
            <Pressable
              key={audio.id}
              onPress={() => setSelectedId((current) => (current === audio.id ? null : audio.id))}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: audio.color }]}>
                <MaterialCommunityIcons name={audio.icon} size={30} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{audio.title}</Text>
                <Text style={styles.description}>{audio.description}</Text>
              </View>
              <View style={styles.playButton}>
                <MaterialCommunityIcons
                  name={isSelected ? 'pause' : 'play'}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>
          {selectedId ? `${audioOptions.find((item) => item.id === selectedId)?.title} selected` : 'No audio selected'}
        </Text>
        <Text style={styles.placeholderCopy}>
          Add your own audio files later, then we can connect these buttons to real playback.
        </Text>
      </View>
    </RecoveryScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginTop: spacing.sm },
  copy: {
    ...typography.subtitle,
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
  },
  list: { gap: spacing.md, marginTop: spacing.xl },
  card: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.label, fontSize: 17 },
  description: { ...typography.subtitle, fontSize: 14, marginTop: 4 },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  placeholder: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 22,
    backgroundColor: '#EEF4FA',
  },
  placeholderTitle: { ...typography.label, fontSize: 17, textAlign: 'center' },
  placeholderCopy: {
    ...typography.subtitle,
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
});
