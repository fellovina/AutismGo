export type SafeZoneCategory = 'Library' | 'Park' | 'Garden' | 'MRT Station' | 'Mall';
export type QuietnessLevel = 'Very Quiet' | 'Moderately Quiet' | 'Unknown';
export type CrowdLevel = 'Low' | 'Medium' | 'High' | 'Unknown';
export type OpeningStatus = 'Open' | 'Closed' | 'Unknown';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SafeZonePlace = Coordinates & {
  id: string;
  name: string;
  category: SafeZoneCategory;
  distanceMeters: number;
  quietness: QuietnessLevel;
  crowdLevel: CrowdLevel;
  openingStatus: OpeningStatus;
  source: 'supabase' | 'openstreetmap';
  address?: string;
  lastUpdated?: string;
  durationMinutes?: number;
  openingHours?: string;
};
