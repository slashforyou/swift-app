# DESIGN SYSTEM CENTRALISÉ - Guide d'Utilisation

> **Version** : 1.0.0  
> **Date** : 6 Décembre 2025  
> **Statut** : ✅ Production Ready

## 📁 Structure du Design System

```
src/design-system/
├── tokens/
│   └── index.ts         # DESIGN_TOKENS centralisés
├── migration.ts         # Utilitaires migration ancien système  
└── index.ts            # Point d'entrée principal
```

## 🚀 Import et Utilisation

### **Import Principal**
```typescript
// Import du design system complet
import { DESIGN_TOKENS, Colors, useTheme } from '../design-system';

// Import sélectif des tokens
import { SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../design-system';
```

### **Utilisation dans un Composant**
```typescript
// Exemple d'utilisation complète
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DESIGN_TOKENS, useTheme } from '../../design-system';

export const MyComponent = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mon Titre
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: DESIGN_TOKENS.spacing.lg,      // 16px
    borderRadius: DESIGN_TOKENS.radius.md,   // 8px
    ...DESIGN_TOKENS.shadows.card,          // Ombre carte
  },
  title: {
    ...DESIGN_TOKENS.typography.title,      // fontSize: 20, lineHeight: 26, fontWeight: '600'
    marginBottom: DESIGN_TOKENS.spacing.md, // 12px
  },
});
```

## 🎨 Design Tokens Disponibles

### **1. SPACING - Système d'Espacement**
```typescript
DESIGN_TOKENS.spacing = {
  xs: 4,      // Ajustements fins, dividers
  sm: 8,      // Espacement minimal entre éléments
  md: 12,     // Espacement texte/valeur, padding interne
  lg: 16,     // Espacement standard, gutters
  xl: 24,     // Espacement sections
  xxl: 32,    // Espacement grandes sections  
  xxxl: 40,   // Espacement majeur
  xxxxl: 48,  // Espacement très large
}
```

**Usages Recommandés :**
- `xs` : Borders, dividers fins
- `sm` : Padding interne de petits composants
- `md` : Espacement entre texte et valeurs
- `lg` : **Standard** - Padding principal, gutters
- `xl` : Espacement entre sections
- `xxl+` : Grandes séparations de layout

### **2. TYPOGRAPHY - Hiérarchie Typographique**
```typescript
DESIGN_TOKENS.typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },  // Titres majeurs
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' },       // Titres principaux
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '600' },       // Sous-titres
  h3: { fontSize: 20, lineHeight: 26, fontWeight: '600' },       // Titres sections
  h4: { fontSize: 18, lineHeight: 24, fontWeight: '600' },       // Sous-sections
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },    // Alias h3
  subtitle: { fontSize: 17, lineHeight: 22, fontWeight: '500' }, // Sous-titres
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },     // Texte standard
  bodyLarge: { fontSize: 17, lineHeight: 24, fontWeight: '400' }, // Texte large
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' }, // Texte petit
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },   // Légendes
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '600' },  // Labels
}
```

### **3. RADIUS - Rayons de Bordure**
```typescript
DESIGN_TOKENS.radius = {
  none: 0,     // Pas de rayon
  xs: 2,       // Borders fins
  sm: 4,       // Petits éléments, badges
  md: 8,       // **Standard** - Boutons, inputs
  lg: 12,      // Cartes, containers
  xl: 16,      // Grandes cartes
  xxl: 20,     // Containers principaux
  xxxl: 24,    // Modales, panels
  round: 999,  // Boutons ronds, avatars
}
```

### **4. SHADOWS - Système d'Ombres**
```typescript
DESIGN_TOKENS.shadows = {
  none: { /* Pas d'ombre */ },
  xs: { /* Ombre très légère */ },
  sm: { /* Ombre légère */ },
  md: { /* **Standard** - Ombre moyenne */ },
  lg: { /* Ombre forte */ },
  xl: { /* Ombre très forte */ },
  // Ombres spécialisées
  button: { /* Ombres pour boutons */ },
  card: { /* Ombres pour cartes */ },
  modal: { /* Ombres pour modales */ },
}
```

### **5. TOUCH - Targets Tactiles**
```typescript
DESIGN_TOKENS.touch = {
  minSize: 44,      // Minimum Apple/Google Guidelines
  comfortable: 48,  // **Standard** - Boutons principaux
  large: 56,        // Boutons proéminents, FAB
  hitSlop: 8,       // Extension zone tactile invisible
}
```

### **6. LAYOUT - Système de Layout**
```typescript
DESIGN_TOKENS.layout = {
  gutters: {
    horizontal: 16,  // Marges latérales standards
    vertical: 16,    // Marges verticales
  },
  breakpoints: {
    small: 320,      // iPhone SE
    medium: 375,     // iPhone standard  
    large: 414,      // iPhone Pro Max
    tablet: 768,     // iPad portrait
  },
  screen: {
    width: screenWidth,   // Largeur dynamique
    height: screenHeight, // Hauteur dynamique
  },
}
```

## 🎯 Patterns d'Utilisation Recommandés

### **Layout Standard**
```typescript
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: DESIGN_TOKENS.layout.gutters.horizontal,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  card: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.lg,
    ...DESIGN_TOKENS.shadows.card,
    backgroundColor: colors.backgroundTertiary,
  },
});
```

### **Boutons Standards**
```typescript
const buttonStyles = StyleSheet.create({
  primary: {
    height: DESIGN_TOKENS.touch.comfortable,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
    ...DESIGN_TOKENS.shadows.button,
    backgroundColor: colors.primary,
  },
  secondary: {
    height: DESIGN_TOKENS.touch.comfortable,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundTertiary,
  },
});
```

### **Typography Responsive**
```typescript
const textStyles = StyleSheet.create({
  title: {
    ...DESIGN_TOKENS.typography.h3,
    color: colors.text,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  body: {
    ...DESIGN_TOKENS.typography.body,
    color: colors.text,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
});
```

## 🔄 Migration de l'Ancien Système

### **Avant (Ancien)**
```typescript
// ❌ Ancien système dispersé
const DESIGN_TOKENS = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16 },
};
```

### **Après (Nouveau)**
```typescript
// ✅ Nouveau système centralisé
import { DESIGN_TOKENS } from '../../design-system';
// Plus besoin de redéfinir les tokens !
```

### **Mapping Automatique**
- ✅ `monthScreen.tsx` - Migré
- ✅ `yearScreen.tsx` - Migré  
- ✅ `multipleYearsScreen.tsx` - Migré
- ✅ `Styles.ts` - Utilise le système centralisé

## 🎯 Avantages du Système Centralisé

### **✅ Cohérence**
- **Tokens unifiés** à travers toute l'app
- **Pas de duplication** de valeurs
- **Design cohérent** automatiquement maintenu

### **✅ Maintenance**
- **Point unique** pour modifier les tokens  
- **Propagation automatique** des changements
- **Refactoring facile** et sûr

### **✅ Performance** 
- **Tree-shaking** des tokens non utilisés
- **Bundle size optimisé**
- **Imports sélectifs** possibles

### **✅ Developer Experience**
- **Auto-completion** TypeScript complète
- **Validation à la compilation** 
- **Documentation intégrée** dans le code

## 🚀 Prochaines Étapes

1. **Migration massive** - Adapter tous les composants restants
2. **Composants primitifs** - Button, Card, Input unifiés  
3. **Storybook** - Documentation visuelle interactive
4. **Tests visuels** - Validation automatique du design system

---

**🎯 Le design system est maintenant centralisé et prêt pour l'adoption massive !**