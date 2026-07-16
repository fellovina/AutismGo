import type { RiskLevel } from '../../lib/riskEngine';

export type StressLevel = 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';

export type DailySummary = {
  date: string;
  health: {
    riskLevel: RiskLevel;
    heartRateBpm: number;
    sleepHours: number;
    sleepMinutes: number;
    source: 'simulated' | 'wearable';
  };
  checkIn: {
    completed: boolean;
    stressLevel?: StressLevel;
  };
  activities: {
    recoveryCompleted: boolean;
    recoveryDurationMinutes: number;
    safeZonesVisited: string[];
  };
  hasRecordedActivity: boolean;
};
