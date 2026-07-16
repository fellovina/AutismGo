import { SimulatedFactors } from './riskEngine';

export type SimulationPreset = 'Calm' | 'Mild Stress' | 'High Risk' | 'Random';
const random = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

export function getSimulationPreset(preset: SimulationPreset): SimulatedFactors {
  if (preset === 'Calm') return { heartRateBpm: 72, sleepQuality: { hours: 8, minutes: 15 }, crowdedness: 0.1, timeInBusyArea: { hours: 0, minutes: 15 } };
  if (preset === 'Mild Stress') return { heartRateBpm: 94, sleepQuality: { hours: 6, minutes: 20 }, crowdedness: 0.55, timeInBusyArea: { hours: 1, minutes: 5 } };
  if (preset === 'High Risk') return { heartRateBpm: 128, sleepQuality: { hours: 3, minutes: 45 }, crowdedness: 0.9, timeInBusyArea: { hours: 2, minutes: 35 } };
  const sleepMinutes = random(0, 600);
  const busyMinutes = random(0, 180);
  return { heartRateBpm: random(60, 140), sleepQuality: { hours: Math.floor(sleepMinutes / 60), minutes: sleepMinutes % 60 }, crowdedness: Number(Math.random().toFixed(2)), timeInBusyArea: { hours: Math.floor(busyMinutes / 60), minutes: busyMinutes % 60 } };
}

export const DEFAULT_FACTORS = getSimulationPreset('Calm');
