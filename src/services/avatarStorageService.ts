import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (userId: string) => `profile:local-avatar:${userId}`;

export async function getLocalAvatarUri(userId: string): Promise<string | null> {
  const uri = await AsyncStorage.getItem(keyFor(userId));
  if (!uri) return null;
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) return uri;
  } catch (error) {
    console.warn('Unable to read local profile photo', error);
  }
  await AsyncStorage.removeItem(keyFor(userId));
  return null;
}

export async function saveLocalAvatar(userId: string, sourceUri: string, mimeType: string) {
  const FileSystem = await import('expo-file-system/legacy');
  if (!FileSystem.documentDirectory) throw new Error('Persistent device storage is unavailable.');
  const directory = `${FileSystem.documentDirectory}profile-photos/${userId}/`;
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const destination = `${directory}avatar.${extension}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const previous = await AsyncStorage.getItem(keyFor(userId));
  if (previous && previous !== destination) {
    await FileSystem.deleteAsync(previous, { idempotent: true });
  }
  await FileSystem.deleteAsync(destination, { idempotent: true });
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  await AsyncStorage.setItem(keyFor(userId), destination);
  return destination;
}

export async function removeLocalAvatar(userId: string) {
  const uri = await AsyncStorage.getItem(keyFor(userId));
  if (uri) {
    const FileSystem = await import('expo-file-system/legacy');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
  await AsyncStorage.removeItem(keyFor(userId));
}
