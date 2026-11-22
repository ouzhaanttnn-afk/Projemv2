// Görsel dil: kırık beyaz zemin, koyu mürekkep, tek sıcak vurgu (terrakota), ince çizgiler.
export const colors = {
  bg: '#F6F3EE',
  surface: '#FBFAF7',
  sunken: '#EEEAE3',
  ink: '#1D1B18',
  muted: '#6F6960',
  faint: '#9D968B',
  rule: '#DCD6CB',
  ruleStrong: '#1D1B18',
  accent: '#A24F2D',
  accentPressed: '#8A4226',
  accentSoft: '#F1E4DC',
  onAccent: '#FFFFFF',
};

export const fonts = {
  serif: 'Newsreader_400Regular',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifMedium: 'Newsreader_500Medium',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemi: 'IBMPlexSans_600SemiBold',
};

export const radius = 3;
export const hairline = 1;
export const gutter = 20;
export const maxContentWidth = 560;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.ink, letterSpacing: -0.3 },
  title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, color: colors.ink, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyMuted: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18, color: colors.ink },
  kicker: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    color: colors.muted,
  },
} as const;
