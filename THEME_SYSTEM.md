# 🎨 Swift App Color System

## 📋 Overview

The color system has been completely refactored to support light/dark themes with a comprehensive palette of semantic colors.

## 🚀 Setup

### 1. ThemeProvider

The app is now wrapped in a `ThemeProvider` that manages the global theme state:

```tsx
// src/app.tsx
import { ThemeProvider } from './context/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <Navigation />
      </View>
    </ThemeProvider>
  )
}
```

### 2. Color Palette

Colors are defined in `src/constants/Colors.ts` with light and dark versions:

```typescript
export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    textSecondary: '#666666',
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    
    // Primary colors
    primary: '#007bff',
    primaryDark: '#0056b3',
    
    // Status colors
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    
    // UI elements
    border: '#e0e0e0',
    shadow: '#000000',
    
    // Interactive elements
    buttonPrimary: '#007bff',
    buttonPrimaryText: '#ffffff',
    // ... and many others
  },
  dark: {
    // Dark version of all colors
    text: '#ECEDEE',
    background: '#151718',
    primary: '#4dabf7',
    // ...
  }
}
```

## 🛠️ Usage

### 1. useThemedStyles Hook (Recommended)

```tsx
import { useThemedStyles } from '@/hooks/useThemeColor'
import { Colors } from '@/src/constants/Colors'

const MyComponent = () => {
  const styles = useThemedStyles(createStyles)
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
    </View>
  )
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
})
```

### 2. useThemeColors Hook

To access colors directly:

```tsx
import { useThemeColors } from '@/hooks/useThemeColor'

const MyComponent = () => {
  const colors = useThemeColors()
  
  return (
    <ActivityIndicator color={colors.primary} />
  )
}
```

### 3. useTheme Hook (Complete Context)

```tsx
import { useTheme } from '@/src/context/ThemeProvider'

const MyComponent = () => {
  const { theme, colors, isDark, toggleTheme } = useTheme()
  
  return (
    <TouchableOpacity onPress={toggleTheme}>
      <Text style={{ color: colors.text }}>
        Current theme: {theme}
      </Text>
    </TouchableOpacity>
  )
}
```

## 🎛️ Theme Toggle Button

### Complete ThemeToggle

```tsx
import { ThemeToggle } from '@/src/components/ui/ThemeToggle'

<ThemeToggle showText={true} size="medium" />
```

### Icon Only

```tsx
import { ThemeToggleIcon } from '@/src/components/ui/ThemeToggle'

<ThemeToggleIcon size="small" />
```

## 📱 Available Colors

### Base Colors
- `text`, `textSecondary`, `textMuted`
- `background`, `backgroundSecondary`, `backgroundTertiary`

### Primary Colors
- `primary`, `primaryDark`, `primaryLight`
- `tint`

### Status Colors
- `success`, `successLight`
- `warning`, `warningLight` 
- `error`, `errorLight`
- `info`, `infoLight`

### UI Elements
- `border`, `borderLight`
- `shadow`, `overlay`, `overlayDark`

### Interactive Elements
- `buttonPrimary`, `buttonPrimaryText`
- `buttonSecondary`, `buttonSecondaryText`
- `buttonOutline`, `buttonOutlineText`
- `buttonDisabled`, `buttonDisabledText`

### Navigation & Icons
- `icon`, `iconActive`
- `tabIconDefault`, `tabIconSelected`

### Forms
- `inputBackground`, `inputBorder`, `inputBorderFocused`
- `inputText`, `inputPlaceholder`

### Calendar
- `calendarBackground`, `calendarBorder`
- `calendarToday`, `calendarSelected`, `calendarEvent`

### Loading States
- `loadingBackground`, `loadingSpinner`

### Error Banners
- `errorBanner`, `errorBannerBorder`, `errorBannerText`
- `errorButton`, `errorButtonText`

## 🔄 Migration

### Before
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff', // ❌ Hardcoded color
  },
  text: {
    color: '#333333', // ❌ Hardcoded color
  },
})
```

### After
```tsx
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background, // ✅ Themed color
  },
  text: {
    color: colors.text, // ✅ Themed color
  },
})

const MyComponent = () => {
  const styles = useThemedStyles(createStyles)
  // ...
}
```

## 💾 Persistence

The user's chosen theme is automatically saved in `SecureStore` and restored when the app restarts.

## 🎯 Updated File Examples

- ✅ `src/navigation/calendar.tsx` - Complete system
- ✅ `src/screens/calendar/dayScreen.tsx` - Themed styles
- ✅ `src/components/top_menu/top_menu.tsx` - With theme button
- 🔄 Other files to migrate...

## 📝 Important Notes

1. **Colors for native components**: Use `useThemeColors()` or `useTheme()` for direct colors
2. **StyleSheet**: Use `useThemedStyles()` with a style creation function
3. **Fallback**: The system works even without ThemeProvider (fallback to the old system)
4. **Performance**: Styles are memoized and recalculated only when theme changes