import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'AIAssistant'>;

type Message = { id: number; from: 'assistant' | 'user'; text: string };

function calmingReply(message: string) {
  const text = message.toLowerCase();
  if (text.includes('noise') || text.includes('loud') || text.includes('overstimulat')) return 'That sounds like a lot. Try moving to a quiet space. You can use the Quiet Space activity here.';
  if (text.includes('panic') || text.includes('anxious') || text.includes('breath')) return 'You are not alone. Try one slow breath. The Deep Breathing activity can guide you.';
  if (text.includes('angry') || text.includes('upset') || text.includes('stress')) return 'It is okay to pause. Try the Grounding Exercise, or take a short break and drink some water.';
  if (text.includes('sound') || text.includes('music')) return 'A calm sound may help. You can listen to Rain Sound or Beach Waves in Recovery.';
  return 'Thank you for telling me. Try one small step: take a short break, drink some water, or choose a Recovery activity.';
}

export default function AIAssistantScreen({ navigation, route }: Props) {
  const [message, setMessage] = useState('');
  const recoveryMode = Boolean(route.params?.recoveryMode);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, from: 'assistant', text: recoveryMode ? 'I’m here with you. Tell me how you feel, and I’ll suggest one small calming step.' : 'Hi. How are you feeling right now? You can tell me what is happening, or ask for a calming exercise.' }]);
  const send = () => { const clean = message.trim(); if (!clean) return; setMessages(current => [...current, { id: Date.now(), from: 'user', text: clean }, { id: Date.now()+1, from: 'assistant', text: calmingReply(clean) }]); setMessage(''); };

  if (recoveryMode) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={25} color={colors.text} />
            </Pressable>
            <View style={styles.titleGroup}>
              <Text style={styles.title}>Talk to AI</Text>
              <Text style={styles.status}>Coming soon</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.placeholderWrap}>
            <View style={styles.placeholderIcon}>
              <MaterialCommunityIcons name="robot-outline" size={52} color={colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>Talk to AI is empty for now</Text>
            <Text style={styles.placeholderCopy}>
              The recovery shortcut is ready, and you can add the AI support experience here later.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={25} color={colors.text} />
          </Pressable>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.status}>Here to support you</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.conversation} keyboardShouldPersistTaps="handled">
          {messages.map(item => <View key={item.id} style={[styles.messageRow,item.from==='user'&&styles.userRow]}>{item.from==='assistant'?<View style={styles.assistantIcon}><MaterialCommunityIcons name="robot-outline" size={28} color={colors.primary} /></View>:null}<View style={[styles.messageBubble,item.from==='user'&&styles.userBubble]}><Text style={[styles.messageText,item.from==='user'&&styles.userText]}>{item.text}</Text></View></View>)}
          {recoveryMode?<View style={styles.suggestions}><Pressable style={styles.suggestion} onPress={()=>navigation.navigate('DeepBreathing')}><Text style={styles.suggestionText}>Try breathing</Text></Pressable><Pressable style={styles.suggestion} onPress={()=>navigation.navigate('CalmAudios')}><Text style={styles.suggestionText}>Play calm audio</Text></Pressable><Pressable style={styles.suggestion} onPress={()=>navigation.navigate('GroundingExercise')}><Text style={styles.suggestionText}>Try grounding</Text></Pressable></View>:null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
              pressed && message.trim() && styles.sendButtonPressed,
            ]}
            disabled={!message.trim()}
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <MaterialCommunityIcons name="send" size={21} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: { flex: 1, alignItems: 'center' },
  title: { ...typography.label, fontSize: 17 },
  status: { ...typography.subtitle, fontSize: 12, marginTop: 2, color: '#3A815F' },
  headerSpacer: { width: 44 },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  placeholderIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  placeholderTitle: {
    ...typography.title,
    marginTop: spacing.lg,
    fontSize: 24,
    textAlign: 'center',
  },
  placeholderCopy: {
    ...typography.subtitle,
    maxWidth: 420,
    marginTop: spacing.md,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
  },
  conversation: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  userRow: { justifyContent: 'flex-end' },
  assistantIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  messageBubble: {
    maxWidth: 560,
    flexShrink: 1,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: '#EEF4FA',
  },
  messageText: { ...typography.body, lineHeight: 21 },
  userBubble: { backgroundColor: colors.primary },
  userText: { color: '#FFFFFF' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm, marginLeft: 50 },
  suggestion: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.lavender },
  suggestionText: { ...typography.label, color: colors.primary, fontSize: 13 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E3EAF3',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: { backgroundColor: '#AAB4C3' },
  sendButtonPressed: { opacity: 0.75 },
});
