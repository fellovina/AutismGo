import { calculateRiskScore } from '../lib/riskEngine';
import { DailySummary, StressLevel } from '../features/dailySummary/types';
import { getCheckIns, getFactors, getRiskHistory } from '../store/riskStore';

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function stressFor(score: number): StressLevel {
  if (score < 0.2) return 'Very Low';
  if (score < 0.4) return 'Low';
  if (score < 0.6) return 'Moderate';
  if (score < 0.8) return 'High';
  return 'Very High';
}

export async function getDailySummary(): Promise<DailySummary> {
  const [factors, checkIns, history] = await Promise.all([
    getFactors(),
    getCheckIns(),
    getRiskHistory(),
  ]);
  const checkIn = checkIns.find(entry => isToday(entry.timestamp));
  const riskEntry = history.find(entry => isToday(entry.timestamp));
  const calculated = calculateRiskScore(factors, checkIn);
  const score = riskEntry?.score ?? calculated.score;

  return {
    date: new Date().toISOString(),
    health: {
      riskLevel: riskEntry?.level ?? calculated.level,
      heartRateBpm: factors.heartRateBpm,
      sleepHours: factors.sleepQuality.hours,
      sleepMinutes: factors.sleepQuality.minutes,
      source: 'simulated',
    },
    checkIn: {
      completed: Boolean(checkIn),
      stressLevel: checkIn ? stressFor(score) : undefined,
    },
    activities: {
      recoveryCompleted: false,
      recoveryDurationMinutes: 0,
      safeZonesVisited: [],
    },
    hasRecordedActivity: Boolean(checkIn),
  };
}
