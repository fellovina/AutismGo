// Calming, low-stimulation palette — deliberately avoids harsh, high-saturation
// colors since this app is designed for sensory-sensitive users.

export const colors = {
  background: '#F7F9FB',
  surface: '#FFFFFF',
  primary: '#5B8A9A',      // muted teal-blue
  primaryDark: '#446E7C',
  secondary: '#8FB9A8',    // soft sage green
  text: '#2D3436',
  textMuted: '#6B7280',
  border: '#E2E8EC',
  error: '#C97575',        // soft red, not harsh
  chipBackground: '#EDF2F4',
  chipSelected: '#5B8A9A',
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
