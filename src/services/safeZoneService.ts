import { supabase } from '../lib/supabase';
import {
  Coordinates,
  CrowdLevel,
  OpeningStatus,
  QuietnessLevel,
  SafeZoneCategory,
  SafeZonePlace,
} from '../features/safeZone/types';

const SINGAPORE_REGION = {
  minLatitude: 1.20,
  maxLatitude: 1.47,
  minLongitude: 103.60,
  maxLongitude: 104.05,
};

type SafeZoneRow = Record<string, unknown>;

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceBetween(from: Coordinates, to: Coordinates) {
  const earthRadius = 6371000;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function numberFrom(row: SafeZoneRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function stringFrom(row: SafeZoneRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function asCrowdLevel(value: unknown): CrowdLevel {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'medium' || normalized === 'moderate') return 'Medium';
    if (normalized === 'low') return 'Low';
  }

  if (typeof value === 'number') {
    if (value >= 70) return 'High';
    if (value >= 35) return 'Medium';
    return 'Low';
  }

  return 'Unknown';
}

function quietnessFor(crowdLevel: CrowdLevel, category: SafeZoneCategory): QuietnessLevel {
  if (crowdLevel === 'Low' && category === 'MRT Station') return 'Moderately Quiet';
  if (crowdLevel === 'Low') return 'Very Quiet';
  if (crowdLevel === 'Medium') return 'Moderately Quiet';
  if (crowdLevel === 'High') return 'Unknown';
  return category === 'Mall' ? 'Moderately Quiet' : 'Unknown';
}

function openingStatusFrom(row: SafeZoneRow): OpeningStatus {
  const explicit = stringFrom(row, 'opening_status', 'status');
  if (explicit === 'Open' || explicit === 'Closed' || explicit === 'Unknown') return explicit;
  const isOpen = row.is_open;
  if (typeof isOpen === 'boolean') return isOpen ? 'Open' : 'Closed';
  const timeBased = openingStatusFromWindow(row);
  if (timeBased) return timeBased;
  return 'Unknown';
}

function parseTimeValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { hours: Math.max(0, Math.min(23, Math.trunc(value))), minutes: 0 };
  }

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return {
      hours: Math.max(0, Math.min(23, hours)),
      minutes: Math.max(0, Math.min(59, minutes)),
    };
  }

  return null;
}

function openingStatusFromWindow(row: SafeZoneRow): OpeningStatus | null {
  const start = parseTimeValue(row.start_hour);
  const end = parseTimeValue(row.end_hour);
  if (!start || !end) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  if (startMinutes === endMinutes) return 'Open';
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes ? 'Open' : 'Closed';
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes ? 'Open' : 'Closed';
}

function openingHoursFrom(row: SafeZoneRow) {
  const start = parseTimeValue(row.start_hour);
  const end = parseTimeValue(row.end_hour);
  if (!start || !end) return stringFrom(row, 'opening_hours', 'hours');

  const formatPart = (hours: number, minutes: number) =>
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return `${formatPart(start.hours, start.minutes)}-${formatPart(end.hours, end.minutes)}`;
}

function isInSingapore(latitude: number, longitude: number) {
  return (
    latitude >= SINGAPORE_REGION.minLatitude &&
    latitude <= SINGAPORE_REGION.maxLatitude &&
    longitude >= SINGAPORE_REGION.minLongitude &&
    longitude <= SINGAPORE_REGION.maxLongitude
  );
}

function mapSupabaseRow(
  row: SafeZoneRow,
  sourceTable: 'mrt_crowd_data' | 'mall_crowd_data',
  origin: Coordinates,
): SafeZonePlace | null {
  const latitude = numberFrom(row, 'latitude', 'lat', 'station_lat', 'mall_lat');
  const longitude = numberFrom(row, 'longtitude', 'longitude', 'lng', 'lon', 'station_lng', 'station_lon', 'mall_lng', 'mall_lon');
  const name = stringFrom(
    row,
    'mrt_name',
    'mall_name',
    'station_name',
    'name',
    'location_name',
    'place_name',
  );

  if (latitude === undefined || longitude === undefined || !name || !isInSingapore(latitude, longitude)) {
    return null;
  }

  const category: SafeZoneCategory = sourceTable === 'mrt_crowd_data' ? 'MRT Station' : 'Mall';
  const crowdLevel = asCrowdLevel(row.crowd_level ?? row.level ?? row.value);
  const durationMinutes = numberFrom(row, 'duration_minutes', 'duration');

  return {
    id: `${sourceTable}-${stringFrom(row, 'id') ?? name}`,
    name,
    category,
    latitude,
    longitude,
    distanceMeters: distanceBetween(origin, { latitude, longitude }),
    quietness: quietnessFor(crowdLevel, category),
    crowdLevel,
    openingStatus: openingStatusFrom(row),
    source: 'supabase',
    address: stringFrom(row, 'address', 'station_address', 'mall_address'),
    lastUpdated: stringFrom(row, 'created_at', 'updated_at', 'timestamp'),
    durationMinutes,
    openingHours: openingHoursFrom(row),
  };
}

async function fetchSafeZoneRows(table: 'mrt_crowd_data' | 'mall_crowd_data', signal?: AbortSignal) {
  let query = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as SafeZoneRow[];
}

function dedupePlaces(places: SafeZonePlace[]) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.category}:${place.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function findNearbySafeZones(
  origin: Coordinates,
  signal?: AbortSignal,
): Promise<SafeZonePlace[]> {
  const [mrtRows, mallRows] = await Promise.all([
    fetchSafeZoneRows('mrt_crowd_data', signal),
    fetchSafeZoneRows('mall_crowd_data', signal),
  ]);

  return dedupePlaces(
    [...mrtRows.map((row) => mapSupabaseRow(row, 'mrt_crowd_data', origin)), ...mallRows.map((row) => mapSupabaseRow(row, 'mall_crowd_data', origin))]
      .filter((place): place is SafeZonePlace => Boolean(place))
      .sort((first, second) => first.distanceMeters - second.distanceMeters),
  );
}

export const singaporeMapBounds = SINGAPORE_REGION;
