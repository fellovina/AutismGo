// Calming, low-stimulation palette — deliberately avoids harsh, high-saturation
// colors since this app is designed for sensory-sensitive users.

export const colors = {
  background: '#F1F7FF',
  surface: '#FFFFFF',
  primary: '#5B3FD1',
  primaryDark: '#4329AA',
  secondary: '#15A6A6',
  text: '#1F2340',
  textMuted: '#5E6480',
  border: '#C8D7F0',
  error: '#C83D62',
  chipBackground: '#E7E1FF',
  chipSelected: '#5B3FD1',
  lavender: '#E9E3FF',
  sky: '#DDF2FF',
  mint: '#DDF8ED',
  sunshine: '#FFF1B8',
  coral: '#FFE0E5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
};
