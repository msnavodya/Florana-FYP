// Define mobile theme values for Tokens styling.
// Shared color palette used across screens, cards, and controls.
export const colors = {
  background: "#7360A0",
  backgroundAccent: "#A391CB",
  backgroundDeep: "#331A47",
  surface: "#FFFFFF",
  surfaceMuted: "#F5EEFC",
  text: "#24183D",
  textMuted: "#6A5E86",
  primary: "#7C5CFF",
  primaryDark: "#5A3FE0",
  accent: "#C4A3FF",
  accentSoft: "#E6D7FF",
  border: "rgba(120, 95, 177, 0.2)",
  danger: "#8F2D56",
  success: "#4E9D74",
  white: "#FFFFFF",
  shadow: "rgba(35, 23, 53, 0.18)",
} as const;

// Spacing scale used for consistent gaps and padding.
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// Viewport thresholds for compact layouts and framed previews.
export const viewport = {
  compactWidth: 350,
  phoneWidth: 390,
  compactHeight: 640,
  frameWidth: 390,
  frameHeight: 844,
} as const;

// Common corner radii for cards, pills, and screen shells.
export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

// Reusable shadow recipes for soft cards and elevated panels.
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 6,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;
