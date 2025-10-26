import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors.light;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState<Theme | null>(null);
  
  const theme: Theme = themeOverride ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  
  const toggleTheme = () => {
    setThemeOverride(prev => {
      const currentTheme = prev ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
      return currentTheme === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme }}>
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