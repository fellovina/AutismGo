import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Coordinates } from '../features/safeZone/types';

export async function openDirections(destination: Coordinates, label: string) {
  const query = `${destination.latitude},${destination.longitude}`;
  const url = Platform.select({
    ios: `maps://?daddr=${query}&q=${encodeURIComponent(label)}`,
    android: `geo:0,0?q=${query}(${encodeURIComponent(label)})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  });
  if (!url) throw new Error('Directions are not supported on this device.');

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) return await Linking.openURL(url);
  } catch {
    // Fall through to the universal Google Maps URL.
  }
  return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
}
