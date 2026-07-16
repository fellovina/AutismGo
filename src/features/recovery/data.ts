import { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type RecoveryIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const BREATHING_TECHNIQUE = {
  title: 'Calm breathing',
  inhaleSeconds: 4,
  holdSeconds: 4,
  exhaleSeconds: 6,
  repetitions: 5,
} as const;

export const CALM_SOUNDS = [
  {
    id: 'rain',
    title: 'Rain Sound',
    description: 'Gentle rain on a roof',
    icon: 'weather-rainy' as RecoveryIcon,
    color: '#DDF2FF',
    source: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
  },
  {
    id: 'waves',
    title: 'Beach Waves',
    description: 'Slow waves by the shore',
    icon: 'waves' as RecoveryIcon,
    color: '#DDF8ED',
    source: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
  },
] as const;

export const GROUNDING_STEPS = [
  { count: 5, sense: 'see', instruction: 'Look around. Find 5 things you can see.', icon: 'eye-outline' },
  { count: 4, sense: 'feel', instruction: 'Find 4 things you can feel.', icon: 'hand-wave-outline' },
  { count: 3, sense: 'hear', instruction: 'Find 3 different sounds you can hear.', icon: 'ear-hearing' },
  { count: 2, sense: 'smell', instruction: 'Find 2 things you can smell.', icon: 'flower-outline' },
  { count: 1, sense: 'taste', instruction: 'Find 1 thing you can taste.', icon: 'food-apple-outline' },
] as const;

export type Emotion = 'Better' | 'Calm' | 'Still stressed' | 'Neutral';
