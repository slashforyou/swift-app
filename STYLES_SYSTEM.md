# 🎨 Système de Styles Communs - Swift App

## Vue d'ensemble

Ce système fournit un ensemble complet de styles réutilisables pour maintenir une interface utilisateur cohérente dans toute l'application. Il respecte nos principes de design :

- **Palette Orange/Blue-Grey** : Orange primary avec nuances blue-grey
- **Ombres douces** : Jamais d'ombres dures, toujours subtiles
- **Pas de noir pur** : Règle stricte, on utilise notre blue-grey foncé (#233551)
- **Responsive** : Adaptation automatique aux différentes tailles d'écran
- **Théming** : Support complet light/dark mode

## 🚀 Utilisation Rapide

```tsx
import { useCommonThemedStyles } from '../hooks/useCommonStyles';

const MyComponent = () => {
  const { colors, styles } = useCommonThemedStyles();
  
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Mon Titre</Text>
      <Text style={styles.body}>Mon contenu</Text>
    </View>
  );
};
```

## 📦 Styles Disponibles

### Conteneurs
- `container` - Container principal avec background thématique
- `containerCentered` - Container centré avec padding
- `containerSafeArea` - Container avec safe area
- `contentContainer` - Container de contenu avec padding
- `scrollContainer` - Container pour ScrollView
- `card` - Carte avec ombre medium
- `cardElevated` - Carte avec ombre forte
- `panel` - Panneau simple avec ombre douce

### Typographie
- `h1, h2, h3, h4` - Titres hiérarchisés
- `body, bodyLarge, bodySmall` - Corps de texte
- `textMuted, textSecondary` - Textes atténués
- `textCenter, textBold, textSemiBold` - Utilitaires de texte

### Boutons
- `buttonPrimary` - Bouton orange principal
- `buttonPrimaryLarge` - Version large du bouton principal
- `buttonSecondary` - Bouton secondaire (background tertiaire)
- `buttonOutline` - Bouton outline orange
- `buttonIcon` - Bouton circulaire pour icônes
- `buttonIconLarge` - Version large du bouton icône

### Formulaires
- `input` - Champ de saisie standard
- `inputFocused` - Champ focalisé (bordure orange)
- `inputError` - Champ avec erreur (bordure rouge)
- `label` - Label de champ
- `labelRequired` - Label requis (couleur orange)

### Listes
- `listItem` - Élément de liste avec ombre
- `listItemContent` - Contenu d'un élément de liste
- `listItemTitle` - Titre d'élément de liste
- `listItemSubtitle` - Sous-titre d'élément de liste

### Statuts
- `statusSuccess` - Message de succès (vert)
- `statusWarning` - Message d'attention (jaune)
- `statusError` - Message d'erreur (rouge)
- `statusInfo` - Message d'information (bleu)

### Navigation
- `tabBar` - Barre d'onglets avec ombre
- `navigationHeader` - Header de navigation

### Modals et Overlays
- `overlay` - Overlay semi-transparent
- `modal` - Container de modal
- `modalHeader` - Header de modal
- `modalContent` - Contenu de modal
- `modalActions` - Zone d'actions de modal

### Utilitaires
- `flex1, flexRow, flexColumn` - Flexbox
- `alignCenter, justifyCenter, justifyBetween` - Alignement
- `centerContent, rowBetween, rowCenter` - Combinaisons courantes
- `marginTop, marginBottom, paddingVertical, etc.` - Espacement

## 🎯 Composants avec Styles Intégrés

### HomeButton Amélioré
```tsx
<HomeButton 
  title="Mon Bouton" 
  onPress={() => {}}
  variant="primary" // primary | secondary | outline
  size="default" // default | large
  disabled={false}
/>
```

## 📱 Responsive Design

Le système s'adapte automatiquement :
- **Écrans < 350px** : Tailles de police réduites
- **Écrans normaux** : Tailles standards
- **Padding intelligent** : S'adapte à la largeur d'écran
- **Container max-width** : Limite à 600px sur grands écrans

## 🌈 Système de Couleurs

```tsx
colors.primary          // #FF6A4A (Orange principal)
colors.text            // #233551 (Blue-grey foncé, jamais noir pur)
colors.textSecondary    // #516386 (Blue-grey moyen)
colors.background       // #F6F8FC (Background clair)
colors.backgroundSecondary // #EDF1F8 (Cards/panels)
colors.success          // #22C55E (Vert succès)
colors.warning          // #F59E0B (Jaune attention)
colors.error           // #EF4444 (Rouge erreur)
colors.info            // #3B82F6 (Bleu info)
```

## 🎭 Ombres Prédéfinies

```tsx
import { SHADOWS } from '../constants/Styles';

// Utilisation dans vos styles personnalisés
const myStyle = {
  ...SHADOWS.soft,    // Ombre légère
  ...SHADOWS.medium,  // Ombre standard
  ...SHADOWS.strong,  // Ombre prononcée
  ...SHADOWS.floating // Ombre de survol
};
```

## 📏 Valeurs Responsives

```tsx
import { RESPONSIVE } from '../constants/Styles';

const myStyle = {
  padding: RESPONSIVE.md,          // 16px
  fontSize: RESPONSIVE.fontBase,   // Adaptatif selon l'écran
  borderRadius: RESPONSIVE.radiusMedium, // 8px
};
```

## ✨ Bonnes Pratiques

1. **Toujours utiliser les styles communs** plutôt que créer des styles custom
2. **Combiner les styles** avec l'opérateur spread : `[styles.card, styles.marginTop]`
3. **Respecter la hiérarchie** des titres (h1 > h2 > h3 > h4)
4. **Utiliser les couleurs thématiques** plutôt que hardcoder
5. **Tester en light/dark mode** pour vérifier la cohérence

## 🔧 Extension du Système

Pour ajouter de nouveaux styles communs :

1. Modifier `src/constants/Styles.ts`
2. Ajouter le nouveau style dans `createCommonStyles`
3. Documenter ici
4. Tester en responsive et dans les deux thèmes

## 🎨 Exemples Complets

Voir le fichier `src/screens/StylesExampleScreen.tsx` pour des exemples concrets d'utilisation de tous les styles disponibles.

---

**Note** : Ce système garantit une interface professionnelle, cohérente et agréable à utiliser. L'orange est utilisé avec parcimonie pour les éléments interactifs importants, et nos ombres douces créent une hiérarchie visuelle subtile.