import AsyncStorage from '@react-native-async-storage/async-storage';
import { Caregiver, ChatMessage, EmergencyAlertPayload } from '../features/caregiver/types';
import type { EmergencyContact } from '../types';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

const caregiversKey = (userId: string) => `caregivers:${userId}`;
const messagesKey = (userId: string, caregiverId: string) => `caregiver-chat:${userId}:${caregiverId}`;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function primaryCaregiverFromProfile(userId: string, contact: EmergencyContact | null | undefined): Caregiver | null {
  if (!contact?.name?.trim()) return null;
  return {
    id: `primary-${userId}`,
    name: contact.name.trim(),
    relationship: contact.relationship || 'Primary caregiver',
    phone: contact.phone || '',
    email: contact.email || '',
    avatarUri: contact.avatar_uri,
    online: false,
    primary: true,
  };
}

export async function getAdditionalCaregivers(userId: string): Promise<Caregiver[]> {
  return read<Caregiver[]>(caregiversKey(userId), []);
}

export async function saveCaregiver(userId: string, caregiver: Omit<Caregiver, 'id' | 'primary' | 'online'> & { id?: string }) {
  const caregivers = await getAdditionalCaregivers(userId);
  const saved: Caregiver = {
    ...caregiver,
    id: caregiver.id ?? `caregiver-${Date.now()}`,
    primary: false,
    online: false,
  };
  const existingIndex = caregivers.findIndex(item => item.id === saved.id);
  const next = existingIndex >= 0
    ? caregivers.map(item => item.id === saved.id ? saved : item)
    : [...caregivers, saved];
  await AsyncStorage.setItem(caregiversKey(userId), JSON.stringify(next));
  const persisted = await getAdditionalCaregivers(userId);
  if (!persisted.some(item => item.id === saved.id)) throw new Error('Caregiver was not persisted.');
  return saved;
}

export async function savePrimaryCaregiver(
  userId: string,
  contact: EmergencyContact,
  currentProfile: Profile | null,
  userMetadata: Record<string, unknown>,
) {
  const { error: schemaError } = await supabase
    .from('profiles')
    .select('emergency_contact')
    .eq('id', userId)
    .limit(1);
  const usesLegacySchema = schemaError?.code === '42703';
  if (schemaError && !usesLegacySchema) throw schemaError;

  let persistedProfile: Profile | null = null;
  if (!usesLegacySchema) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ emergency_contact: contact })
      .eq('id', userId)
      .select('*')
      .single();
    if (error || !data) throw error ?? new Error('Primary caregiver was not persisted.');
    persistedProfile = data as Profile;
  }

  const existingDetails = (userMetadata.autismgo_profile ?? {}) as Record<string, unknown>;
  const { error: metadataError } = await supabase.auth.updateUser({
    data: { autismgo_profile: { ...existingDetails, emergency_contact: contact } },
  });
  if (metadataError) throw metadataError;

  return {
    contact,
    profile: persistedProfile ?? (currentProfile ? { ...currentProfile, emergency_contact: contact } : null),
  };
}

export async function deleteCaregiver(userId: string, caregiverId: string) {
  const caregivers = await getAdditionalCaregivers(userId);
  await AsyncStorage.setItem(caregiversKey(userId), JSON.stringify(caregivers.filter(item => item.id !== caregiverId)));
  await AsyncStorage.removeItem(messagesKey(userId, caregiverId));
}

export async function getMessages(userId: string, caregiverId: string): Promise<ChatMessage[]> {
  return read<ChatMessage[]>(messagesKey(userId, caregiverId), []);
}

export async function sendMessage(userId: string, caregiverId: string, text: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: `local-${Date.now()}`,
    caregiverId,
    sender: 'user',
    text: text.trim(),
    sentAt: new Date().toISOString(),
  };
  const messages = await getMessages(userId, caregiverId);
  await AsyncStorage.setItem(messagesKey(userId, caregiverId), JSON.stringify([...messages, message]));
  return message;
}

export async function sendEmergencyAlert(payload: EmergencyAlertPayload): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 650));
  console.info('Emergency alert simulated', payload.caregiverId, payload.sentAt);
}
