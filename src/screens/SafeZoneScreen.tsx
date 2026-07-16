import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import SafeZoneCard, { formatDistance } from '../components/SafeZoneCard';
import { PrimaryButton, RecoveryScreen } from '../features/recovery/RecoveryUI';
import type { Coordinates, SafeZonePlace } from '../features/safeZone/types';
import {
  getCurrentCoordinates,
  getLocationPermission,
  requestLocationPermission,
  type LocationPermissionState,
} from '../services/locationService';
import { findNearbySafeZones, singaporeMapBounds } from '../services/safeZoneService';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'SafeZone'>;
type SearchState = 'idle' | 'loading' | 'success' | 'error';

function markerIcon(category: SafeZonePlace['category']) {
  if (category === 'MRT Station') return 'train';
  if (category === 'Mall') return 'shopping';
  if (category === 'Library') return 'bookshelf';
  if (category === 'Garden') return 'flower-outline';
  return 'tree-outline';
}

function xFor(longitude: number) {
  return ((longitude - singaporeMapBounds.minLongitude) /
    (singaporeMapBounds.maxLongitude - singaporeMapBounds.minLongitude)) * 100;
}

function yFor(latitude: number) {
  return (1 - (latitude - singaporeMapBounds.minLatitude) /
    (singaporeMapBounds.maxLatitude - singaporeMapBounds.minLatitude)) * 100;
}

function formatUpdated(value?: string) {
  if (!value) return 'Update time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Update time unavailable';
  return `Updated ${date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

function DetailChip({ icon, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) {
  return <View style={styles.detailChip}><MaterialCommunityIcons name={icon} size={16} color={colors.primary}/><Text style={styles.detailChipText}>{label}</Text></View>;
}

export default function SafeZoneScreen({ navigation }: Props) {
  const [permission, setPermission] = useState<LocationPermissionState>('undetermined');
  const [state, setState] = useState<SearchState>('idle');
  const [places, setPlaces] = useState<SafeZonePlace[]>([]);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SafeZonePlace | null>(null);
  const controller = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setState('loading');
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      nextController.abort();
      setState('error');
    }, 25000);

    try {
      const nextOrigin = await getCurrentCoordinates();
      const results = await findNearbySafeZones(nextOrigin, nextController.signal);
      if (!nextController.signal.aborted) {
        setOrigin(nextOrigin);
        setPlaces(results);
        setSelectedPlace(results[0] ?? null);
        setState('success');
      }
    } catch (error) {
      if (!nextController.signal.aborted) {
        console.warn('Safe Zone search failed', error);
        setState('error');
      } else if (timedOut) {
        console.warn('Safe Zone search timed out');
      }
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getLocationPermission()
      .then((status) => {
        if (!mounted) return;
        setPermission(status);
        if (status === 'granted') search();
      })
      .catch(() => mounted && setState('error'));
    return () => {
      mounted = false;
      controller.current?.abort();
    };
  }, [search]);

  const grant = async () => {
    try {
      const status = await requestLocationPermission();
      setPermission(status);
      if (status === 'granted') await search();
    } catch {
      setPermission('denied');
    }
  };

  const nearest = places[0] ?? null;
  const mrtCount = useMemo(() => places.filter((place) => place.category === 'MRT Station').length, [places]);
  const mallCount = useMemo(() => places.filter((place) => place.category === 'Mall').length, [places]);

  return (
    <RecoveryScreen title="Safe Zone" onBack={() => navigation.goBack()}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="map-marker-star" size={36} color={colors.primary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.title}>Singapore Safe Zone Map</Text>
          <Text style={styles.copy}>
            Browse MRT stations and malls from your Supabase data, then tap any marker to see its crowd and location details.
          </Text>
        </View>
      </View>

      {permission !== 'granted' ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="crosshairs-gps" size={52} color={colors.primary} />
          <Text style={styles.stateTitle}>We need your location to show the nearest safe zone in Singapore.</Text>
          <PrimaryButton label="Grant Permission" icon="map-marker-check-outline" onPress={grant} />
          <Pressable onPress={() => navigation.popToTop()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Maybe Later</Text>
          </Pressable>
        </View>
      ) : state === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateTitle}>Loading MRT and mall locations from Supabase…</Text>
        </View>
      ) : state === 'error' ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cloud-alert-outline" size={54} color={colors.error} />
          <Text style={styles.stateTitle}>We couldn’t load the Singapore safe zone map from Supabase.</Text>
          <PrimaryButton label="Retry" icon="refresh" onPress={search} />
          <Pressable onPress={() => navigation.goBack()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Go Back</Text>
          </Pressable>
        </View>
      ) : places.length === 0 && state === 'success' ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="map-search-outline" size={54} color={colors.primary} />
          <Text style={styles.stateTitle}>No Singapore MRT or mall records with coordinates were found in Supabase.</Text>
          <PrimaryButton label="Refresh" icon="refresh" onPress={search} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Nearest Safe Zone</Text>
              <Text style={styles.statValue}>{nearest ? nearest.name : 'Unavailable'}</Text>
              <Text style={styles.statMeta}>{nearest ? formatDistance(nearest.distanceMeters) : 'No distance yet'}</Text>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.miniValue}>{mrtCount}</Text>
              <Text style={styles.miniLabel}>MRT</Text>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.miniValue}>{mallCount}</Text>
              <Text style={styles.miniLabel}>Malls</Text>
            </View>
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <View>
                <Text style={styles.mapTitle}>Singapore Overview</Text>
                <Text style={styles.mapCaption}>Tap any icon for live place details from Supabase.</Text>
              </View>
              <Pressable onPress={search} style={styles.refresh} accessibilityRole="button" accessibilityLabel="Refresh nearby places">
                <MaterialCommunityIcons name="refresh" size={23} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.mapCanvas}>
              <View style={styles.mapBackdropA} />
              <View style={styles.mapBackdropB} />
              <View style={styles.islandGlow} />
              {origin ? (
                <View
                  style={[
                    styles.userMarker,
                    {
                      left: `${xFor(origin.longitude)}%`,
                      top: `${yFor(origin.latitude)}%`,
                    },
                  ]}
                >
                  <View style={styles.userPulse} />
                  <View style={styles.userDot} />
                </View>
              ) : null}

              {places.map((place) => {
                const selected = selectedPlace?.id === place.id;
                return (
                  <Pressable
                    key={place.id}
                    onPress={() => setSelectedPlace(place)}
                    style={[
                      styles.marker,
                      selected && styles.markerSelected,
                      {
                        left: `${xFor(place.longitude)}%`,
                        top: `${yFor(place.latitude)}%`,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${place.name} ${place.category}`}
                  >
                    <MaterialCommunityIcons
                      name={markerIcon(place.category)}
                      size={16}
                      color={selected ? '#FFFFFF' : place.category === 'MRT Station' ? '#1D6F9E' : '#7E4B1F'}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <DetailChip icon="circle" label="You" />
              <DetailChip icon="train" label="MRT Station" />
              <DetailChip icon="shopping" label="Mall" />
            </View>
          </View>

          {selectedPlace ? (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedIcon}>
                  <MaterialCommunityIcons name={markerIcon(selectedPlace.category)} size={26} color={colors.primary} />
                </View>
                <View style={styles.selectedHeading}>
                  <Text style={styles.selectedName}>{selectedPlace.name}</Text>
                  <Text style={styles.selectedMeta}>{selectedPlace.category} · {formatDistance(selectedPlace.distanceMeters)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <DetailChip icon="account-group-outline" label={`${selectedPlace.crowdLevel} crowd`} />
                <DetailChip icon="volume-low" label={selectedPlace.quietness} />
                <DetailChip icon="clock-outline" label={selectedPlace.openingStatus === 'Unknown' ? 'Hours unknown' : `${selectedPlace.openingStatus} now`} />
              </View>

              {selectedPlace.address ? <Text style={styles.detailText}>{selectedPlace.address}</Text> : null}
              {selectedPlace.durationMinutes ? <Text style={styles.detailText}>Typical duration in record: {selectedPlace.durationMinutes} minutes</Text> : null}
              <Text style={styles.detailText}>{formatUpdated(selectedPlace.lastUpdated)}</Text>

              <View style={styles.actions}>
                <PrimaryButton label="View Safe Zone Details" icon="map-marker-radius-outline" onPress={() => navigation.navigate('SafeZoneDetail', { place: selectedPlace })} />
              </View>
            </View>
          ) : null}

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Nearest Places</Text>
              <Text style={styles.count}>{places.length} Supabase locations, nearest first</Text>
            </View>
          </View>

          <View style={styles.list}>
            {places.slice(0, 12).map((place) => (
              <SafeZoneCard
                key={place.id}
                place={place}
                onPress={() => {
                  setSelectedPlace(place);
                  navigation.navigate('SafeZoneDetail', { place });
                }}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </RecoveryScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.mint,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroText: { flex: 1 },
  title: { ...typography.title, fontSize: 23 },
  copy: { ...typography.subtitle, lineHeight: 22, marginTop: spacing.xs },
  center: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    ...typography.subtitle,
    maxWidth: 430,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  secondary: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  secondaryText: { ...typography.label, color: colors.primary },
  content: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  statMini: {
    width: 92,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  statLabel: { ...typography.subtitle, fontSize: 12, textTransform: 'uppercase' },
  statValue: { ...typography.label, fontSize: 18, marginTop: 6 },
  statMeta: { ...typography.subtitle, fontSize: 13, marginTop: 3 },
  miniValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  miniLabel: { ...typography.subtitle, fontSize: 12 },
  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    gap: spacing.md,
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapTitle: { ...typography.label, fontSize: 19 },
  mapCaption: { ...typography.subtitle, fontSize: 13, marginTop: 4 },
  refresh: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  mapCanvas: {
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#CFEAFA',
    position: 'relative',
  },
  mapBackdropA: {
    position: 'absolute',
    left: -30,
    top: 24,
    width: 250,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DFF3DC',
    transform: [{ rotate: '-12deg' }],
  },
  mapBackdropB: {
    position: 'absolute',
    right: -20,
    bottom: 8,
    width: 220,
    height: 130,
    borderRadius: 70,
    backgroundColor: '#DCE7FF',
    transform: [{ rotate: '10deg' }],
  },
  islandGlow: {
    position: 'absolute',
    left: '11%',
    right: '9%',
    top: '19%',
    bottom: '17%',
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7CBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.08 }],
  },
  userMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(21,166,166,0.25)',
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F5FA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  detailChipText: { ...typography.label, fontSize: 12, color: colors.textMuted },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    gap: spacing.md,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectedIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  selectedHeading: { flex: 1 },
  selectedName: { ...typography.label, fontSize: 18 },
  selectedMeta: { ...typography.subtitle, fontSize: 14, marginTop: 3 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailText: { ...typography.body, fontSize: 14, color: colors.textMuted },
  actions: { marginTop: spacing.xs },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  listTitle: { ...typography.label, fontSize: 19 },
  count: { ...typography.subtitle, fontSize: 13, marginTop: 3 },
  list: { gap: spacing.md },
});
