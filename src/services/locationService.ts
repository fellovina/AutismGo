import * as Location from 'expo-location';
import { Coordinates } from '../features/safeZone/types';

export type LocationPermissionState = 'granted' | 'denied' | 'undetermined';

export async function getLocationPermission(): Promise<LocationPermissionState> {
  const response = await Location.getForegroundPermissionsAsync();
  return response.status;
}

export async function requestLocationPermission(): Promise<LocationPermissionState> {
  const response = await Location.requestForegroundPermissionsAsync();
  return response.status;
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
