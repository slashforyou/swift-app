/**
 * ThemeProvider Avancé - Système de thématisation complet avec Design Tokens
 * Support Light/Dark/Auto avec transitions fluides
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Colors } from '../constants/Colors';

// Utilisation direct des couleurs existantes pour éviter les conflits
// TODO: Refactoriser quand le système de couleurs sera unifié

// ============================================================================
// TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Couleurs principales
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Couleurs secondaires
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundElevated: string;
  
  // Surfaces
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  
  // Textes
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverted: string;
  
  // Borders
  border: string;
  borderLight: string;
  borderStrong: string;
  
  // Status colors
  success: string;
  successLight: string;
  successDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  
  // Interactive states
  interactive: string;
  interactiveHover: string;
  interactivePressed: string;
  interactiveDisabled: string;
  
  // Overlays
  overlay: string;
  overlayLight: string;
  overlayStrong: string;
  
  // Button colors (compatibilité legacy)
  buttonPrimaryText: string;
  primaryButtonText: string;
  errorButtonBackground: string;
  errorButtonText: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// ============================================================================
// THÈMES
// ============================================================================

const lightTheme: ThemeColors = {
  // Couleurs principales
  primary: Colors.light.primary,
  primaryLight: Colors.light.primaryLight,
  primaryDark: Colors.light.primaryHover,

  // Couleurs secondaires
  secondary: Colors.light.backgroundTertiary,
  secondaryLight: Colors.light.backgroundSecondary,
  secondaryDark: Colors.light.border,
  
  // Backgrounds
  background: Colors.light.background,
  backgroundSecondary: Colors.light.backgroundSecondary,
  backgroundTertiary: Colors.light.backgroundTertiary,
  backgroundElevated: Colors.light.background,
  
  // Surfaces
  surface: Colors.light.background,
  surfaceSecondary: Colors.light.backgroundSecondary,
  surfaceElevated: Colors.light.background,
  
  // Textes
  text: Colors.light.text,
  textSecondary: Colors.light.textSecondary,
  textTertiary: Colors.light.textMuted,
  textMuted: Colors.light.textMuted,
  textInverted: Colors.light.background,
  
  // Borders
  border: Colors.light.border,
  borderLight: Colors.light.backgroundSecondary,
  borderStrong: Colors.light.border,
  
  // Status colors
  success: Colors.light.success,
  successLight: '#E6F7F1',
  successDark: '#0D7544',
  error: Colors.light.error,
  errorLight: '#FEE2E2',
  errorDark: '#B91C1C',
  warning: Colors.light.warning,
  warningLight: '#FEF3C7',
  warningDark: '#D97706',
  info: Colors.light.info || '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#1E40AF',
  
  // Interactive states
  interactive: Colors.light.primary,
  interactiveHover: Colors.light.primaryHover,
  interactivePressed: Colors.light.primaryHover,
  interactiveDisabled: Colors.light.textMuted,
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayStrong: 'rgba(0, 0, 0, 0.75)',
  
  // Button colors (compatibilité legacy)
  buttonPrimaryText: Colors.light.background,
  primaryButtonText: Colors.light.background,
  errorButtonBackground: Colors.light.error,
  errorButtonText: Colors.light.background,
};

const darkTheme: ThemeColors = {
  // Couleurs principales
  primary: Colors.dark?.primary || '#8B5CF6',
  primaryLight: Colors.dark?.primaryLight || '#A78BFA',
  primaryDark: Colors.dark?.primaryHover || '#7C3AED',
  
  // Couleurs secondaires
  secondary: Colors.dark?.backgroundTertiary || '#374151',
  secondaryLight: Colors.dark?.backgroundSecondary || '#4B5563',
  secondaryDark: Colors.dark?.border || '#6B7280',
  
  // Backgrounds
  background: Colors.dark?.background || '#111827',
  backgroundSecondary: Colors.dark?.backgroundSecondary || '#1F2937',
  backgroundTertiary: Colors.dark?.backgroundTertiary || '#374151',
  backgroundElevated: Colors.dark?.background || '#1F2937',
  
  // Surfaces
  surface: Colors.dark?.background || '#1F2937',
  surfaceSecondary: Colors.dark?.backgroundSecondary || '#374151',
  surfaceElevated: Colors.dark?.backgroundTertiary || '#374151',
  
  // Textes
  text: Colors.dark?.text || '#F9FAFB',
  textSecondary: Colors.dark?.textSecondary || '#E5E7EB',
  textTertiary: Colors.dark?.textMuted || '#9CA3AF',
  textMuted: Colors.dark?.textMuted || '#6B7280',
  textInverted: Colors.dark?.background || '#111827',
  
  // Borders
  border: Colors.dark?.border || '#374151',
  borderLight: Colors.dark?.backgroundSecondary || '#1F2937',
  borderStrong: Colors.dark?.border || '#4B5563',
  
  // Status colors
  success: Colors.dark?.success || '#10B981',
  successLight: '#065F46',
  successDark: '#34D399',
  error: Colors.dark?.error || '#EF4444',
  errorLight: '#7F1D1D',
  errorDark: '#F87171',
  warning: Colors.dark?.warning || '#F59E0B',
  warningLight: '#92400E',
  warningDark: '#FCD34D',
  info: Colors.dark?.info || '#3B82F6',
  infoLight: '#1E3A8A',
  infoDark: '#93C5FD',
  
  // Interactive states
  interactive: Colors.dark?.primary || '#8B5CF6',
  interactiveHover: Colors.dark?.primaryLight || '#A78BFA',
  interactivePressed: Colors.dark?.primaryHover || '#C4B5FD',
  interactiveDisabled: Colors.dark?.textMuted || '#4B5563',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  overlayStrong: 'rgba(0, 0, 0, 0.9)',
  
  // Button colors (compatibilité legacy)
  buttonPrimaryText: Colors.dark?.background || '#000000',
  primaryButtonText: Colors.dark?.background || '#000000',
  errorButtonBackground: Colors.dark?.error || '#EF4444',
  errorButtonText: Colors.dark?.background || '#000000',
};

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@swift_app_theme_mode';

// ============================================================================
// PROVIDER
// ============================================================================

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(() => 
    Appearance.getColorScheme()
  );

  // Calculer le thème actuel basé sur le mode et le système
  const getCurrentTheme = (): Theme => {
    let isDarkMode = false;
    
    switch (themeMode) {
      case 'light':
        isDarkMode = false;
        break;
      case 'dark':
        isDarkMode = true;
        break;
      case 'auto':
      default:
        isDarkMode = systemScheme === 'dark';
        break;
    }

    return {
      mode: isDarkMode ? 'dark' : 'light',
      colors: isDarkMode ? darkTheme : lightTheme,
    };
  };

  const theme = getCurrentTheme();

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
          setThemeMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme from storage:', error);
      }
    };

    loadSavedTheme();
  }, []);

  // Écouter les changements du système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Sauvegarder le thème sélectionné
  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  };

  // Toggle entre light et dark (ignore auto)
  const toggleTheme = () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    handleSetThemeMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    mode: themeMode,
    isDark: theme.mode === 'dark',
    colors: theme.colors,
    setThemeMode: handleSetThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ============================================================================
// EXPORTS UTILITAIRES
// ============================================================================

export { darkTheme, lightTheme };

export default ThemeProvider;