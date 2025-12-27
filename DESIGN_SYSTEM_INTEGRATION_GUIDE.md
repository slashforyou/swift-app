# 🎨 Design System Integration Guide - Swift App

> **Version :** 2.0.0  
> **Date :** 27 Décembre 2025  
> **Statut :** ✅ Production Ready

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Mode Sombre / Clair](#mode-sombre--clair)
4. [Design Tokens](#design-tokens)
5. [Exemples Pratiques](#exemples-pratiques)
6. [Checklist Migration](#checklist-migration)
7. [Erreurs Courantes](#erreurs-courantes)

---

## 🎯 Introduction

Le Design System de Swift-App est centralisé et supporte nativement le mode sombre. Ce guide explique comment l'utiliser correctement pour garantir une cohérence visuelle.

### Points Clés
- ✅ **Un seul import** pour tous les tokens
- ✅ **Mode sombre automatique** avec `useTheme()`
- ✅ **TypeScript** avec auto-completion complète
- ✅ **Zéro couleur hardcodée** dans les composants

---

## 🏗️ Architecture

```
src/
├── constants/
│   └── Styles.ts              # DESIGN_TOKENS (spacing, radius, typography, shadows)
├── context/
│   └── ThemeProvider.tsx      # ThemeProvider + useTheme() hook
├── design-system/
│   ├── tokens/index.ts        # Export centralisé des tokens
│   └── index.ts               # Point d'entrée principal
```

### Imports Recommandés

```typescript
// ✅ CORRECT - Import via le context
import { useTheme } from '../context/ThemeProvider';

// ✅ CORRECT - Import des tokens
import { DESIGN_TOKENS } from '../constants/Styles';

// ❌ INCORRECT - Import direct des couleurs
import { Colors } from '../constants/Styles'; // Éviter !
```

---

## 🌙 Mode Sombre / Clair

### Utilisation du Hook useTheme()

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';

export const MyComponent = () => {
  // ✅ Récupérer les couleurs du thème actif
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mode {isDark ? 'Sombre' : 'Clair'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.lg,
  },
  title: {
    ...DESIGN_TOKENS.typography.h3,
  },
});
```

### Couleurs Disponibles

```typescript
const { colors } = useTheme();

// Couleurs principales
colors.background          // Fond principal
colors.backgroundSecondary // Fond secondaire (cartes)
colors.backgroundTertiary  // Fond tertiaire

// Textes
colors.text               // Texte principal
colors.textSecondary      // Texte secondaire
colors.textMuted          // Texte discret

// Accents
colors.primary            // Couleur principale (bleu)
colors.primaryLight       // Version claire
colors.success            // Vert (succès)
colors.warning            // Orange (attention)
colors.error              // Rouge (erreur)

// Éléments UI
colors.border             // Bordures
colors.divider            // Séparateurs
colors.card               // Fond de carte
```

### Passer les Couleurs aux Sous-Composants

Si un sous-composant n'a pas accès au contexte, passez les couleurs en props :

```typescript
// Composant parent
const ParentComponent = () => {
  const { colors } = useTheme();
  
  return (
    <ChildComponent colors={colors} />
  );
};

// Sous-composant
interface ChildProps {
  colors: ReturnType<typeof useTheme>['colors'];
}

const ChildComponent = ({ colors }: ChildProps) => {
  return (
    <View style={{ backgroundColor: colors.card }}>
      <Text style={{ color: colors.text }}>Contenu</Text>
    </View>
  );
};
```

---

## 📐 Design Tokens

### Spacing (Espacement)

```typescript
DESIGN_TOKENS.spacing = {
  xs: 4,      // Ajustements fins
  sm: 8,      // Espacement minimal
  md: 12,     // Espacement moyen
  lg: 16,     // ⭐ Standard (padding, gaps)
  xl: 24,     // Espacement sections
  xxl: 32,    // Grandes sections
  xxxl: 40,   // Espacement majeur
  xxxxl: 48,  // Très large
}
```

### Typography (Typographie)

```typescript
DESIGN_TOKENS.typography = {
  display: { fontSize: 32, fontWeight: '700' },  // Gros titres
  h1: { fontSize: 28, fontWeight: '700' },       // Titres page
  h2: { fontSize: 24, fontWeight: '600' },       // Sections
  h3: { fontSize: 20, fontWeight: '600' },       // Sous-sections
  title: { fontSize: 20, fontWeight: '600' },    // Alias h3
  body: { fontSize: 15, fontWeight: '400' },     // ⭐ Texte standard
  caption: { fontSize: 12, fontWeight: '400' },  // Légendes
}
```

### Radius (Bordures arrondies)

```typescript
DESIGN_TOKENS.radius = {
  none: 0,
  xs: 2,
  sm: 4,      // Badges, petits éléments
  md: 8,      // ⭐ Boutons, inputs
  lg: 12,     // Cartes
  xl: 16,     // Grandes cartes
  round: 999, // Cercles parfaits
}
```

### Shadows (Ombres)

```typescript
DESIGN_TOKENS.shadows = {
  none: {},
  sm: { shadowOpacity: 0.1, shadowRadius: 2 },
  md: { shadowOpacity: 0.15, shadowRadius: 4 },  // ⭐ Standard
  lg: { shadowOpacity: 0.2, shadowRadius: 8 },
  card: { /* Ombre optimisée pour cartes */ },
  button: { /* Ombre pour boutons */ },
}
```

---

## 💡 Exemples Pratiques

### Exemple 1 : Écran Complet

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';

export const ExampleScreen = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Titre de l'écran
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Carte exemple
          </Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Description de la carte avec texte secondaire.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.lg,
  },
  title: {
    ...DESIGN_TOKENS.typography.h2,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  card: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.lg,
    ...DESIGN_TOKENS.shadows.card,
  },
  cardTitle: {
    ...DESIGN_TOKENS.typography.h4,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  cardBody: {
    ...DESIGN_TOKENS.typography.body,
  },
});
```

### Exemple 2 : Bouton Thématique

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const ThemedButton = ({ title, onPress, variant = 'primary' }: ButtonProps) => {
  const { colors } = useTheme();

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : 'transparent',
          borderColor: colors.primary,
          borderWidth: isPrimary ? 0 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          { color: isPrimary ? '#FFFFFF' : colors.primary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: DESIGN_TOKENS.touch.comfortable,
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    borderRadius: DESIGN_TOKENS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
  },
});
```

---

## ✅ Checklist Migration

Utilisez cette checklist pour migrer un composant vers le design system :

### 1. Imports
- [ ] Importer `useTheme` depuis `../context/ThemeProvider`
- [ ] Importer `DESIGN_TOKENS` depuis `../constants/Styles`
- [ ] Supprimer les imports de `Colors` direct

### 2. Couleurs
- [ ] Appeler `const { colors } = useTheme()` dans le composant
- [ ] Remplacer toutes les couleurs hardcodées (#xxx) par `colors.xxx`
- [ ] Vérifier en mode sombre ET clair

### 3. Tokens
- [ ] Remplacer les nombres magiques par `DESIGN_TOKENS.spacing.xxx`
- [ ] Utiliser `DESIGN_TOKENS.typography.xxx` pour les textes
- [ ] Utiliser `DESIGN_TOKENS.radius.xxx` pour les bordures

### 4. Test
- [ ] Basculer entre mode clair et sombre
- [ ] Vérifier que les contrastes sont corrects
- [ ] Tester sur différentes tailles d'écran

---

## ⚠️ Erreurs Courantes

### ❌ Couleur Hardcodée

```typescript
// ❌ INCORRECT
<View style={{ backgroundColor: '#FFFFFF' }}>

// ✅ CORRECT
<View style={{ backgroundColor: colors.background }}>
```

### ❌ Token Local Redéfini

```typescript
// ❌ INCORRECT - Redéfinition locale
const DESIGN_TOKENS = {
  spacing: { sm: 8, md: 16 }
};

// ✅ CORRECT - Import centralisé
import { DESIGN_TOKENS } from '../constants/Styles';
```

### ❌ useTheme en Dehors du Provider

```typescript
// ❌ INCORRECT - Appel en dehors du composant React
const colors = useTheme().colors; // Erreur !

// ✅ CORRECT - Appel dans le composant
const MyComponent = () => {
  const { colors } = useTheme();
  // ...
};
```

### ❌ Oublier de Passer les Couleurs

```typescript
// ❌ INCORRECT - Sous-composant sans accès aux couleurs
const ParentComponent = () => {
  const { colors } = useTheme();
  return <ChildComponent />; // ChildComponent n'a pas colors !
};

// ✅ CORRECT - Passer les couleurs en props
const ParentComponent = () => {
  const { colors } = useTheme();
  return <ChildComponent colors={colors} />;
};
```

---

## 📚 Références

- `DESIGN_SYSTEM_GUIDE.md` - Guide original détaillé
- `DESIGN_SYSTEM_MIGRATION_COMPLETE.md` - Historique de migration
- `src/constants/Styles.ts` - Code source des tokens
- `src/context/ThemeProvider.tsx` - Implémentation du thème

---

## 🎯 Résumé

| Élément | Import | Exemple |
|---------|--------|---------|
| Couleurs | `useTheme()` | `colors.primary` |
| Espacements | `DESIGN_TOKENS` | `DESIGN_TOKENS.spacing.lg` |
| Typographie | `DESIGN_TOKENS` | `DESIGN_TOKENS.typography.body` |
| Bordures | `DESIGN_TOKENS` | `DESIGN_TOKENS.radius.md` |
| Ombres | `DESIGN_TOKENS` | `DESIGN_TOKENS.shadows.card` |

---

*Document créé le 27 Décembre 2025 - Phase 1.4 Roadmap Frontend*
