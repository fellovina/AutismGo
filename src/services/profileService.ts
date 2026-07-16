import { supabase } from '../lib/supabase';
import { EmergencyContact, Gender, Profile, SensoryProfile } from '../types';
import { getLocalAvatarUri, removeLocalAvatar, saveLocalAvatar } from './avatarStorageService';

export interface ProfileFormData {
  fullName: string;
  nickname: string;
  dateOfBirth: Date | null;
  email: string;
  phoneNumber: string;
  gender: Gender | null;
  emergencyContact: EmergencyContact;
  triggers: string[];
  copingStrategies: string[];
}

export interface PendingAvatar {
  uri: string;
  base64: string;
  mimeType: string;
}

export function formatCalendarDate(date: Date | null): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface SaveProfileInput {
  userId: string;
  currentEmail: string;
  currentAvatarPath: string | null;
  form: ProfileFormData;
  pendingAvatar: PendingAvatar | null;
  removeAvatar: boolean;
}

const PHONE_PATTERN = /^[+]?[-\d\s().]{7,20}$/;

type LegacyProfileMetadata = {
  nickname?: string | null;
  date_of_birth?: string | null;
  phone_number?: string | null;
  gender?: Gender | null;
  emergency_contact?: EmergencyContact | null;
  preferred_coping_strategies?: string[];
};

function base64ToArrayBuffer(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export function validateProfile(form: ProfileFormData): string | null {
  if (!form.fullName.trim()) return 'Full name is required.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.';
  if (form.dateOfBirth && form.dateOfBirth > new Date()) return 'Date of birth cannot be in the future.';
  if (form.phoneNumber.trim() && !PHONE_PATTERN.test(form.phoneNumber.trim())) {
    return 'Enter a valid phone number.';
  }

  const emergency = form.emergencyContact;
  const hasEmergencyValue = emergency.name.trim() || emergency.phone.trim() || emergency.relationship || emergency.email?.trim();
  if (hasEmergencyValue && (!emergency.name.trim() || !emergency.phone.trim() || !emergency.relationship)) {
    return 'Complete every emergency contact field or leave all three empty.';
  }
  if (emergency.phone.trim() && !PHONE_PATTERN.test(emergency.phone.trim())) {
    return 'Enter a valid emergency contact phone number.';
  }
  if (emergency.email?.trim() && !/^\S+@\S+\.\S+$/.test(emergency.email.trim())) {
    return 'Enter a valid caregiver email address.';
  }
  return null;
}

export async function loadSensoryProfile(userId: string): Promise<SensoryProfile | null> {
  const { data, error } = await supabase
    .from('sensory_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as SensoryProfile | null;
}

export async function createAvatarUrl(path: string | null, userId?: string) {
  if (path) {
    const { data, error } = await supabase.storage.from('profile-photos').createSignedUrl(path, 3600);
    if (!error) return data.signedUrl;
    console.warn('Remote profile photo is unavailable; checking device storage', error.message);
  }
  return userId ? getLocalAvatarUri(userId) : null;
}

export async function saveProfile({
  userId,
  currentEmail,
  currentAvatarPath,
  form,
  pendingAvatar,
  removeAvatar,
}: SaveProfileInput) {
  const validationError = validateProfile(form);
  if (validationError) throw new Error(validationError);

  const metadataDetails: LegacyProfileMetadata = {
    nickname: form.nickname.trim() || null,
    date_of_birth: formatCalendarDate(form.dateOfBirth),
    phone_number: form.phoneNumber.trim() || null,
    gender: form.gender,
    emergency_contact: form.emergencyContact.name.trim()
      ? {
          name: form.emergencyContact.name.trim(),
          phone: form.emergencyContact.phone.trim(),
          relationship: form.emergencyContact.relationship,
          email: form.emergencyContact.email?.trim() || undefined,
          avatar_uri: form.emergencyContact.avatar_uri ?? null,
        }
      : null,
    preferred_coping_strategies: form.copingStrategies,
  };

  // The initial production database predates the profile-details migration.
  // Detect it explicitly so unsupported columns do not reject the whole save.
  const { error: schemaError } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .limit(1);
  const usesLegacySchema = schemaError?.code === '42703';
  if (schemaError && !usesLegacySchema) throw schemaError;

  if (usesLegacySchema) {
    const { data: legacyProfile, error: legacyProfileError } = await supabase
      .from('profiles')
      .update({ full_name: form.fullName.trim() })
      .eq('id', userId)
      .select('*')
      .single();
    if (legacyProfileError || !legacyProfile) {
      throw legacyProfileError ?? new Error('Profile was not updated.');
    }

    const { data: legacySensory, error: legacySensoryError } = await supabase
      .from('sensory_profiles')
      .upsert({ user_id: userId, top_triggers: form.triggers }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (legacySensoryError) throw legacySensoryError;

    const nextEmail = form.email.trim().toLowerCase();
    const authUpdate = {
      data: { autismgo_profile: metadataDetails },
      ...(nextEmail !== currentEmail.toLowerCase() ? { email: nextEmail } : {}),
    };
    const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdate);
    if (authError) throw authError;

    let localAvatarUrl = await getLocalAvatarUri(userId);
    if (pendingAvatar) {
      localAvatarUrl = await saveLocalAvatar(userId, pendingAvatar.uri, pendingAvatar.mimeType);
    } else if (removeAvatar) {
      await removeLocalAvatar(userId);
      localAvatarUrl = null;
    }

    return {
      avatarPath: null,
      avatarUrl: localAvatarUrl,
      emailConfirmationRequired: authData.user.email !== nextEmail,
      profile: { ...legacyProfile, ...metadataDetails, avatar_path: null } as Profile,
      sensoryProfile: {
        ...legacySensory,
        preferred_coping_strategies: form.copingStrategies,
      } as SensoryProfile,
    };
  }

  let avatarPath = currentAvatarPath;
  if (pendingAvatar) {
    avatarPath = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage.from('profile-photos').upload(
      avatarPath,
      base64ToArrayBuffer(pendingAvatar.base64),
      { contentType: pendingAvatar.mimeType, upsert: true }
    );
    if (error) throw error;
    await removeLocalAvatar(userId);
  } else if (removeAvatar) {
    if (currentAvatarPath) {
      const { error } = await supabase.storage.from('profile-photos').remove([currentAvatarPath]);
      if (error) throw error;
    }
    avatarPath = null;
    await removeLocalAvatar(userId);
  }

  const emergency = form.emergencyContact;
  const emergencyContact = emergency.name.trim()
    ? {
        name: emergency.name.trim(),
        phone: emergency.phone.trim(),
        relationship: emergency.relationship,
        email: emergency.email?.trim() || undefined,
        avatar_uri: emergency.avatar_uri ?? null,
      }
    : null;

  // Save the dependent sensory row first. This prevents a later sensory
  // schema/policy failure from leaving the visible profile partially updated.
  const { data: updatedSensoryProfile, error: sensoryError } = await supabase
    .from('sensory_profiles')
    .upsert({
      user_id: userId,
      top_triggers: form.triggers,
      preferred_coping_strategies: form.copingStrategies,
    }, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (sensoryError) throw sensoryError;

  const { data: updatedProfile, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: form.fullName.trim(),
      nickname: form.nickname.trim() || null,
      date_of_birth: formatCalendarDate(form.dateOfBirth),
      phone_number: form.phoneNumber.trim() || null,
      gender: form.gender,
      avatar_path: avatarPath,
      emergency_contact: emergencyContact,
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (profileError) throw profileError;
  if (!updatedProfile) throw new Error('The profile update did not return a saved profile.');

  const nextEmail = form.email.trim().toLowerCase();
  let emailConfirmationRequired = false;
  const authUpdate = {
    data: { autismgo_profile: metadataDetails },
    ...(nextEmail !== currentEmail.toLowerCase() ? { email: nextEmail } : {}),
  };
  const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdate);
  if (authError) throw authError;
  emailConfirmationRequired = authData.user.email !== nextEmail;

  return {
    avatarPath,
    avatarUrl: null,
    emailConfirmationRequired,
    profile: updatedProfile as Profile,
    sensoryProfile: updatedSensoryProfile as SensoryProfile,
  };
}

export function profileToForm(
  profile: Profile,
  email: string,
  sensoryProfile: SensoryProfile | null,
  userMetadata?: Record<string, unknown>
): ProfileFormData {
  const triggerAliases: Record<string, string> = {
    'Loud noises': 'Loud Noises',
    Crowds: 'Crowded Places',
    'Bright lights': 'Bright Lights',
    'Strong smells': 'Strong Smells',
  };

  const legacy = (userMetadata?.autismgo_profile ?? {}) as LegacyProfileMetadata;
  const dateOfBirth = profile.date_of_birth ?? legacy.date_of_birth;

  return {
    fullName: profile.full_name ?? '',
    nickname: profile.nickname ?? legacy.nickname ?? '',
    dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`) : null,
    email,
    phoneNumber: profile.phone_number ?? legacy.phone_number ?? '',
    gender: profile.gender ?? legacy.gender ?? null,
    emergencyContact: profile.emergency_contact ?? legacy.emergency_contact ?? { name: '', phone: '', relationship: '' },
    triggers: sensoryProfile?.top_triggers.map((trigger) => triggerAliases[trigger] ?? trigger) ?? [],
    copingStrategies: sensoryProfile?.preferred_coping_strategies ?? legacy.preferred_coping_strategies ?? [],
  };
}
