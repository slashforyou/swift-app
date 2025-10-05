/**
 * Enhanced theme color hook with comprehensive color support
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ColorName, ColorScheme, getColorWithOpacity } from '@/src/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme, useThemeColors as useColors } from '../src/context/ThemeProvider';

/**
 * Get a specific theme color (legacy support)
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
) {
  try {
    // Try to use the new ThemeProvider context first
    const { theme, colors } = useTheme();
    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    } else {
      return colors[colorName];
    }
  } catch {
    // Fallback to the old system if ThemeProvider is not available
    const theme = useColorScheme() ?? 'light';
    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    } else {
      return Colors[theme][colorName];
    }
  }
}

/**
 * Get all theme colors for current scheme
 */
export function useThemeColors() {
  try {
    return useColors();
  } catch {
    // Fallback to the old system
    const theme = useColorScheme() ?? 'light';
    return Colors[theme];
  }
}

/**
 * Get current color scheme
 */
export function useCurrentTheme(): ColorScheme {
  try {
    const { theme } = useTheme();
    return theme;
  } catch {
    return useColorScheme() ?? 'light';
  }
}

/**
 * Get a color with opacity
 */
export function useColorWithOpacity(colorName: ColorName, opacity: number) {
  const colors = useThemeColors();
  return getColorWithOpacity(colors[colorName], opacity);
}

/**
 * Hook for getting multiple themed colors at once
 */
export function useThemedColors<T extends Record<string, ColorName>>(
  colorMap: T
): Record<keyof T, string> {
  const colors = useThemeColors();
  
  const result = {} as Record<keyof T, string>;
  
  for (const [key, colorName] of Object.entries(colorMap)) {
    result[key as keyof T] = colors[colorName];
  }
  
  return result;
}

/**
 * Create themed styles hook
 */
export function useThemedStyles<T>(
  stylesFn: (colors: typeof Colors.light) => T
): T {
  const colors = useThemeColors();
  return stylesFn(colors);
}
