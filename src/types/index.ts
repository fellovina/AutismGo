export type UserRole = 'autistic_user' | 'caregiver';
export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  avatar_uri?: string | null;
}

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  nickname: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  gender: Gender | null;
  avatar_path: string | null;
  emergency_contact: EmergencyContact | null;
  age: number | null;
  invite_code: string | null;
  onboarding_complete: boolean;
  location_permission_granted: boolean;
  wearable_simulated: boolean;
  created_at: string;
}

export interface SensoryProfile {
  user_id: string;
  top_triggers: string[];
  notes: string | null;
  preferred_coping_strategies: string[];
  updated_at: string;
}

export const SENSORY_TRIGGER_OPTIONS = [
  'Loud noises',
  'Crowds',
  'Bright lights',
  'Strong smells',
  'Physical touch',
  'Unexpected changes',
  'Certain textures',
  'Fast-moving crowds',
] as const;

export const PROFILE_TRIGGER_OPTIONS = [
  'Loud Noises',
  'Crowded Places',
  'Bright Lights',
  'Strong Smells',
] as const;

export const COPING_STRATEGY_OPTIONS = [
  'Noise-Cancelling Headphones',
  'Deep Breathing',
  'Quiet Room',
  'Listen to Calming Music',
] as const;
