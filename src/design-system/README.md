# Guide d'utilisation du Design System

## Vue d'ensemble

Le design system centralisé de l'application Swift App fournit un ensemble cohérent de composants, tokens et hooks pour une expérience utilisateur unifiée.

## 🎨 Structure

```
src/design-system/
├── index.ts           # Point d'entrée principal
├── components.ts      # Export de tous les composants UI
└── tokens/
    └── index.ts       # Tokens de design centralisés
```

## 📦 Import rapide

### Import de tous les composants
```typescript
import { 
  Button, 
  Card, 
  Input, 
  Screen,
  Typography,
  BusinessCard,
  DESIGN_TOKENS,
  useTheme,
  useDesignSystem
} from '@/src/design-system/components';
```

### Import des tokens seuls
```typescript
import { DESIGN_TOKENS } from '@/src/design-system';
```

## 🧩 Composants disponibles

### 1. Button - Bouton avec variants
```typescript
import { Button } from '@/src/design-system/components';

// Usage
<Button 
  variant="primary"    // primary | secondary | outline | ghost
  size="medium"        // small | medium | large
  onPress={handlePress}
>
  Action
</Button>
```

### 2. Card - Surface container
```typescript
import { Card } from '@/src/design-system/components';

// Usage
<Card 
  variant="elevated"   // default | elevated | outlined | flat
  padding="large"      // small | medium | large
>
  <Text>Contenu</Text>
</Card>
```

### 3. Input - Champ de saisie
```typescript
import { Input } from '@/src/design-system/components';

// Usage
<Input 
  variant="outlined"   // default | outlined | filled
  size="medium"        // small | medium | large
  label="Nom d'utilisateur"
  error="Champ requis"
  placeholder="Saisissez votre nom"
  value={value}
  onChangeText={setValue}
/>
```

### 4. Screen - Container d'écran
```typescript
import { Screen } from '@/src/design-system/components';

// Usage
<Screen 
  variant="padded"     // default | padded | scroll
  safeAreaEdges={['top', 'bottom']}
>
  <Text>Contenu de l'écran</Text>
</Screen>
```

### 5. Typography - Hiérarchie de texte
```typescript
import { 
  Display, 
  Heading1, 
  Heading2, 
  Title, 
  Body, 
  Caption 
} from '@/src/design-system/components';

// Usage
<Display>Titre principal</Display>
<Heading1>Titre de section</Heading1>
<Title>Sous-titre</Title>
<Body>Texte de contenu</Body>
<Caption>Note ou métadonnée</Caption>
```

### 6. BusinessCard - Carte business
```typescript
import { BusinessCard } from '@/src/design-system/components';

// Usage
<BusinessCard 
  variant="default"    // default | compact | featured | minimal | detailed
  business={businessData}
  onPress={handlePress}
/>
```

## 🎯 Design Tokens

### Spacing (8 niveaux)
```typescript
const { spacing } = DESIGN_TOKENS;

// Usage dans styles
{
  padding: spacing.md,        // 16px
  margin: spacing.xl,         // 24px
  gap: spacing.sm,           // 8px
}
```

### Typography (12 variants)
```typescript
const { typography } = DESIGN_TOKENS;

// Usage dans styles
{
  ...typography.heading1,     // fontSize: 32, fontWeight: '700'
  ...typography.body,         // fontSize: 16, fontWeight: '400'
  ...typography.caption,      // fontSize: 12, fontWeight: '400'
}
```

### Radius (5 niveaux)
```typescript
const { radius } = DESIGN_TOKENS;

// Usage dans styles
{
  borderRadius: radius.md,    // 8px
  borderRadius: radius.full,  // 999px (rond)
}
```

### Shadows (6 + spécialisées)
```typescript
const { shadows } = DESIGN_TOKENS;

// Usage dans styles
{
  ...shadows.medium,          // Ombre moyenne
  ...shadows.card,           // Ombre pour cartes
  ...shadows.button,         // Ombre pour boutons
}
```

## 🎨 Thème et couleurs

### Hook useTheme
```typescript
import { useTheme } from '@/src/design-system/components';

const MyComponent = () => {
  const { theme, colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        Mode: {theme}
      </Text>
    </View>
  );
};
```

### Hook useDesignSystem (tout-en-un)
```typescript
import { useDesignSystem } from '@/src/design-system/components';

const MyComponent = () => {
  const { tokens, colors, spacing, typography } = useDesignSystem();
  
  return (
    <View style={{ 
      backgroundColor: colors.background,
      padding: spacing.lg,
      borderRadius: tokens.radius.md 
    }}>
      <Text style={{ 
        ...typography.heading2,
        color: colors.text 
      }}>
        Design System
      </Text>
    </View>
  );
};
```

## 📱 Responsive et adaptabilité

### Gutters automatiques
```typescript
const { layout } = DESIGN_TOKENS;

// Les composants Screen utilisent automatiquement :
{
  paddingHorizontal: layout.gutters.horizontal, // 20px
  paddingVertical: layout.gutters.vertical,     // 16px
}
```

### Touch targets
```typescript
const { touch } = DESIGN_TOKENS;

// Zones tactiles optimisées
{
  minHeight: touch.target.minimum,    // 44px (iOS standard)
  height: touch.target.recommended,   // 48px (Material Design)
}
```

## 🚀 Bonnes pratiques

### 1. Utilisez toujours les composants du design system
```typescript
// ✅ Bon
import { Button } from '@/src/design-system/components';
<Button variant="primary">Action</Button>

// ❌ Éviter
import { TouchableOpacity } from 'react-native';
<TouchableOpacity style={{ backgroundColor: '#007AFF' }}>
  <Text>Action</Text>
</TouchableOpacity>
```

### 2. Préférez les tokens aux valeurs hardcodées
```typescript
// ✅ Bon
import { DESIGN_TOKENS } from '@/src/design-system';
{
  margin: DESIGN_TOKENS.spacing.lg,
  borderRadius: DESIGN_TOKENS.radius.md,
}

// ❌ Éviter
{
  margin: 20,
  borderRadius: 8,
}
```

### 3. Utilisez le hook useTheme pour les couleurs
```typescript
// ✅ Bon
const { colors } = useTheme();
{
  backgroundColor: colors.background,
  color: colors.text,
}

// ❌ Éviter
{
  backgroundColor: '#FFFFFF',
  color: '#000000',
}
```

### 4. Respectez la hiérarchie typographique
```typescript
// ✅ Bon
<Display>Titre principal</Display>
<Heading1>Section</Heading1>
<Body>Contenu</Body>

// ❌ Éviter
<Text style={{ fontSize: 32, fontWeight: 'bold' }}>Titre</Text>
<Text style={{ fontSize: 24, fontWeight: '600' }}>Section</Text>
<Text style={{ fontSize: 16 }}>Contenu</Text>
```

## 🔄 Migration des composants existants

### Avant (ancien système)
```typescript
import { View, Text, TouchableOpacity } from 'react-native';

<TouchableOpacity style={{
  backgroundColor: '#007AFF',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
}}>
  <Text style={{
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  }}>
    Action
  </Text>
</TouchableOpacity>
```

### Après (design system)
```typescript
import { Button } from '@/src/design-system/components';

<Button variant="primary" size="medium" onPress={handlePress}>
  Action
</Button>
```

## 🎯 Prochaines étapes

1. **Migration progressive** : Remplacer les composants un par un
2. **Tests visuels** : Vérifier que tout fonctionne en mode sombre/clair
3. **Documentation** : Mettre à jour les guides d'utilisation
4. **Optimisation** : Ajuster les tokens selon les retours utilisateurs

---

*Ce design system est évolutif. N'hésitez pas à proposer des améliorations !*