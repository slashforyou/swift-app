# 🎨 Système de Couleurs Swift App

## 📋 Vue d'ensemble

Le système de couleurs a été entièrement refactorisé pour supporter les thèmes light/dark avec une palette complète de couleurs sémantiques.

## 🚀 Configuration

### 1. ThemeProvider

L'app est maintenant wrappée dans un `ThemeProvider` qui gère l'état global du thème :

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

### 2. Palette de couleurs

Les couleurs sont définies dans `src/constants/Colors.ts` avec des versions light et dark :

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
    // ... et beaucoup d'autres
  },
  dark: {
    // Version sombre de toutes les couleurs
    text: '#ECEDEE',
    background: '#151718',
    primary: '#4dabf7',
    // ...
  }
}
```

## 🛠️ Utilisation

### 1. Hook useThemedStyles (Recommandé)

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

### 2. Hook useThemeColors

Pour accéder aux couleurs directement :

```tsx
import { useThemeColors } from '@/hooks/useThemeColor'

const MyComponent = () => {
  const colors = useThemeColors()
  
  return (
    <ActivityIndicator color={colors.primary} />
  )
}
```

### 3. Hook useTheme (Contexte complet)

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

## 🎛️ Bouton de changement de thème

### ThemeToggle complet

```tsx
import { ThemeToggle } from '@/src/components/ui/ThemeToggle'

<ThemeToggle showText={true} size="medium" />
```

### Icône seulement

```tsx
import { ThemeToggleIcon } from '@/src/components/ui/ThemeToggle'

<ThemeToggleIcon size="small" />
```

## 📱 Couleurs disponibles

### Couleurs de base
- `text`, `textSecondary`, `textMuted`
- `background`, `backgroundSecondary`, `backgroundTertiary`

### Couleurs primaires
- `primary`, `primaryDark`, `primaryLight`
- `tint`

### Couleurs de statut
- `success`, `successLight`
- `warning`, `warningLight` 
- `error`, `errorLight`
- `info`, `infoLight`

### Éléments UI
- `border`, `borderLight`
- `shadow`, `overlay`, `overlayDark`

### Éléments interactifs
- `buttonPrimary`, `buttonPrimaryText`
- `buttonSecondary`, `buttonSecondaryText`
- `buttonOutline`, `buttonOutlineText`
- `buttonDisabled`, `buttonDisabledText`

### Navigation & Icônes
- `icon`, `iconActive`
- `tabIconDefault`, `tabIconSelected`

### Formulaires
- `inputBackground`, `inputBorder`, `inputBorderFocused`
- `inputText`, `inputPlaceholder`

### Calendrier
- `calendarBackground`, `calendarBorder`
- `calendarToday`, `calendarSelected`, `calendarEvent`

### États de chargement
- `loadingBackground`, `loadingSpinner`

### Bannières d'erreur
- `errorBanner`, `errorBannerBorder`, `errorBannerText`
- `errorButton`, `errorButtonText`

## 🔄 Migration

### Avant
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff', // ❌ Couleur hardcodée
  },
  text: {
    color: '#333333', // ❌ Couleur hardcodée
  },
})
```

### Après
```tsx
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background, // ✅ Couleur thématique
  },
  text: {
    color: colors.text, // ✅ Couleur thématique
  },
})

const MyComponent = () => {
  const styles = useThemedStyles(createStyles)
  // ...
}
```

## 💾 Persistance

Le thème choisi par l'utilisateur est automatiquement sauvegardé dans `SecureStore` et restauré au redémarrage de l'app.

## 🎯 Exemples de fichiers mis à jour

- ✅ `src/navigation/calendar.tsx` - Système complet
- ✅ `src/screens/calendar/dayScreen.tsx` - Styles thématiques
- ✅ `src/components/top_menu/top_menu.tsx` - Avec bouton de thème
- 🔄 Autres fichiers à migrer...

## 📝 Notes importantes

1. **Couleurs pour composants natifs** : Utilisez `useThemeColors()` ou `useTheme()` pour les couleurs directes
2. **StyleSheet** : Utilisez `useThemedStyles()` avec une fonction de création de styles
3. **Fallback** : Le système fonctionne même sans ThemeProvider (fallback vers l'ancien système)
4. **Performance** : Les styles sont mémorisés et recalculés seulement lors du changement de thème