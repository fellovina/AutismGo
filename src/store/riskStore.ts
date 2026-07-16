import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInEntry, RiskLevel, SimulatedFactors } from '../lib/riskEngine';
import { DEFAULT_FACTORS } from '../lib/simulation';

const keys = { factors: 'risk:simulated-factors', checkIns: 'risk:check-ins', history: 'risk:history', ai: 'risk:ai-cache' };
export interface RiskHistoryEntry { timestamp: string; score: number; level: RiskLevel }

async function read<T>(key: string, fallback: T): Promise<T> {
  try { const value = await AsyncStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
export const getFactors = () => read(keys.factors, DEFAULT_FACTORS);
export const saveFactors = async (factors: SimulatedFactors) => { await AsyncStorage.setItem(keys.factors, JSON.stringify(factors)); };
export const getCheckIns = () => read<CheckInEntry[]>(keys.checkIns, []);
export const getLatestCheckIn = async () => (await getCheckIns())[0];
export async function saveLocalCheckIn(entry: CheckInEntry) { const rows = await getCheckIns(); await AsyncStorage.setItem(keys.checkIns, JSON.stringify([entry, ...rows].slice(0, 30))); }
export const getRiskHistory = () => read<RiskHistoryEntry[]>(keys.history, []);
export async function saveRiskHistory(entry: RiskHistoryEntry) { const rows = await getRiskHistory(); await AsyncStorage.setItem(keys.history, JSON.stringify([entry, ...rows].slice(0, 60))); }
export const getCachedAI = <T>(sessionKey: string) => read<T | null>(`${keys.ai}:${sessionKey}`, null);
export const cacheAI = (sessionKey: string, value: unknown) => AsyncStorage.setItem(`${keys.ai}:${sessionKey}`, JSON.stringify(value));
