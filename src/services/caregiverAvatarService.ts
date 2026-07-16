export async function persistCaregiverAvatar(userId: string, caregiverId: string, sourceUri: string, mimeType: string) {
  const FileSystem = await import('expo-file-system/legacy');
  if (!FileSystem.documentDirectory) throw new Error('Persistent device storage is unavailable.');
  const directory = `${FileSystem.documentDirectory}caregiver-photos/${userId}/`;
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const destination = `${directory}${caregiverId}.${extension}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await FileSystem.deleteAsync(destination, { idempotent: true });
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function removeCaregiverAvatar(uri?: string | null) {
  const FileSystem = await import('expo-file-system/legacy');
  if (uri?.startsWith(FileSystem.documentDirectory ?? 'file://unavailable')) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
