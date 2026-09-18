import { useColorScheme } from "react-native";
import { type AppPalette, darkPalette, lightPalette } from "./palettes";

export { darkPalette, lightPalette } from "./palettes";

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Harder edges make the app feel like a physical municipal sorting label,
// rather than another rounded AI chat/dashboard template.
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: "Atkinson_700Bold",
    fontSize: 36,
    lineHeight: 39,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: "Atkinson_700Bold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: "Atkinson_600SemiBold",
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: "Atkinson_400Regular",
    fontSize: 17,
    lineHeight: 24,
  },
  small: {
    fontFamily: "Atkinson_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: "Atkinson_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  mono: {
    fontFamily: "IBMPlexMono_600SemiBold",
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.8,
  },
} as const;

export const controls = {
  minimumTouchTarget: 44,
  buttonMinHeight: 56,
  inputMinHeight: 60,
} as const;

export const interaction = {
  pressedOpacity: 0.76,
  disabledOpacity: 0.48,
} as const;

export const motion = {
  quick: 120,
  standard: 180,
} as const;

export const elevation = {
  none: 0,
  raised: 2,
} as const;

export function useAppTheme(): { palette: AppPalette; isDark: boolean } {
  const isDark = useColorScheme() === "dark";
  return { palette: isDark ? darkPalette : lightPalette, isDark };
}
