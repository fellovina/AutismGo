export type UserRole = 'autistic_user' | 'caregiver';

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string | null;
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
