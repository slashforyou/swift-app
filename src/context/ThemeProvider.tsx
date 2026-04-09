import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark';

// --- Color manipulation helpers ---
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
}

function deriveCompanyColors(baseColor: string) {
  return {
    primary: baseColor,
    primaryLight: adjustBrightness(baseColor, 50),
    primaryHover: adjustBrightness(baseColor, -15),
    primaryPressed: adjustBrightness(baseColor, -35),
    iconActive: baseColor,
    tabIconSelected: baseColor,
    buttonPrimary: baseColor,
    buttonOutlineText: baseColor,
    calendarToday: baseColor,
    calendarSelected: adjustBrightness(baseColor, -15),
    loadingSpinner: baseColor,
  };
}

interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors.light;
  isDark: boolean;
  toggleTheme: () => void;
  companyColor: string | null;
  setCompanyColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState<Theme | null>(null);
  const [companyColor, setCompanyColorState] = useState<string | null>(null);
  
  const theme: Theme = themeOverride ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
  const isDark = theme === 'dark';

  // Load company color from SecureStore on mount
  useEffect(() => {
    SecureStore.getItemAsync('company_primary_color').then(stored => {
      if (stored && /^#[0-9a-f]{6}$/i.test(stored)) {
        setCompanyColorState(stored);
      }
    }).catch(() => {});
  }, []);

  const setCompanyColor = useCallback((color: string | null) => {
    setCompanyColorState(color);
    if (color) {
      SecureStore.setItemAsync('company_primary_color', color).catch(() => {});
    } else {
      SecureStore.deleteItemAsync('company_primary_color').catch(() => {});
    }
  }, []);

  const colors = useMemo(() => {
    const base = Colors[theme];
    if (!companyColor) return base;
    const overrides = deriveCompanyColors(companyColor);
    return { ...base, ...overrides } as typeof base;
  }, [theme, companyColor]);

  const toggleTheme = () => {
    setThemeOverride(prev => {
      const currentTheme = prev ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
      return currentTheme === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme, companyColor, setCompanyColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook pour obtenir les couleurs facilement
export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};