export interface SimulatedFactors {
  heartRateBpm: number;
  sleepQuality: { hours: number; minutes: number; qualityScore?: number };
  crowdedness: number;
  timeInBusyArea: { hours: number; minutes: number };
}

export interface CheckInEntry {
  timestamp: string;
  moodRating: number;
  tirednessRating: number;
  environmentComfort: number;
  notes?: string;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type FactorKey = 'heartRate' | 'sleep' | 'crowd' | 'duration' | 'checkIn';

export interface FactorContribution {
  key: FactorKey;
  label: string;
  value: number;
  weightedValue: number;
  percentage: number;
}

const baseWeights: Record<FactorKey, number> = {
  heartRate: 0.25,
  sleep: 0.2,
  crowd: 0.2,
  duration: 0.15,
  checkIn: 0.2,
};

export interface RiskCalculationOptions {
  topTriggers?: string[];
}

const triggerFactorBoosts: Partial<Record<string, Partial<Record<FactorKey, number>>>> = {
  Crowds: { crowd: 0.18, duration: 0.08 },
  'Fast-moving crowds': { crowd: 0.2, duration: 0.1, heartRate: 0.05 },
  'Loud noises': { heartRate: 0.16, crowd: 0.06 },
  'Bright lights': { duration: 0.1, heartRate: 0.08 },
  'Strong smells': { duration: 0.08, heartRate: 0.08 },
  'Physical touch': { crowd: 0.1, heartRate: 0.08 },
  'Unexpected changes': { heartRate: 0.14, checkIn: 0.08 },
  'Certain textures': { checkIn: 0.1, heartRate: 0.05 },
};

function normalizeWeights(weights: Record<FactorKey, number>) {
  const total = (Object.keys(weights) as FactorKey[]).reduce((sum, key) => sum + weights[key], 0);
  return (Object.keys(weights) as FactorKey[]).reduce((next, key) => {
    next[key] = total > 0 ? weights[key] / total : 0;
    return next;
  }, {} as Record<FactorKey, number>);
}

function getAdaptiveWeights(topTriggers?: string[]) {
  const [primaryTrigger] = topTriggers ?? [];
  if (!primaryTrigger) {
    return { weights: baseWeights, primaryTrigger: null as string | null };
  }

  const boosts = triggerFactorBoosts[primaryTrigger];
  if (!boosts) {
    return { weights: baseWeights, primaryTrigger };
  }

  const adjusted = { ...baseWeights };
  (Object.keys(boosts) as FactorKey[]).forEach((key) => {
    adjusted[key] += boosts[key] ?? 0;
  });

  return { weights: normalizeWeights(adjusted), primaryTrigger };
}

export const normalize = (value: number, min: number, max: number) =>
  Math.min(1, Math.max(0, (value - min) / (max - min)));

export function getRiskLevel(score: number): RiskLevel {
  if (score < 0.3) return 'Low';
  if (score < 0.5) return 'Moderate';
  if (score < 0.75) return 'High';
  return 'Critical';
}

export function calculateRiskScore(
  factors: SimulatedFactors,
  checkIn?: CheckInEntry,
  options?: RiskCalculationOptions
) {
  const values: Record<FactorKey, number> = {
    heartRate: normalize(factors.heartRateBpm, 60, 140),
    sleep: 1 - normalize(factors.sleepQuality.hours + factors.sleepQuality.minutes / 60, 0, 9),
    crowd: normalize(factors.crowdedness, 0, 1),
    duration: normalize(factors.timeInBusyArea.hours * 60 + factors.timeInBusyArea.minutes, 0, 180),
    checkIn: checkIn
      ? (checkIn.tirednessRating / 5 + (1 - checkIn.environmentComfort / 5) + (1 - checkIn.moodRating / 5)) / 3
      : 0,
  };
  const { weights, primaryTrigger } = getAdaptiveWeights(options?.topTriggers);
  const labels: Record<FactorKey, string> = {
    heartRate: 'Elevated Heart Rate', sleep: 'Poor Sleep', crowd: 'Crowded Venue',
    duration: 'Time in Busy Area', checkIn: 'Latest Check-In',
  };
  const raw = (Object.keys(values) as FactorKey[]).reduce((sum, key) => sum + values[key] * weights[key], 0);
  const score = Math.min(1, Math.max(0, raw));
  const contributions = (Object.keys(values) as FactorKey[]).map((key) => {
    const weightedValue = values[key] * weights[key];
    return { key, label: labels[key], value: values[key], weightedValue, percentage: score ? Math.round(weightedValue / score * 100) : 0 };
  }).sort((a, b) => b.weightedValue - a.weightedValue);
  return { score, level: getRiskLevel(score), contributions, primaryTrigger, weights };
}
