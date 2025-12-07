/**
 * DESIGN TOKENS CENTRALISÉS - Swift App
 * Point d'entrée unique pour tous les tokens de design
 * Conformes aux meilleures pratiques UI mobiles iOS/Android
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ===================
// SPACING SYSTEM - Grille de 8pt avec ajustements fins de 4pt
// ===================
export const SPACING = {
  xs: 4,    // ajustements fins, dividers
  sm: 8,    // espacement minimal entre éléments
  md: 12,   // espacement texte/valeur, padding interne  
  lg: 16,   // espacement standard entre composants, gutters
  xl: 24,   // espacement sections, marges importantes
  xxl: 32,  // espacement grandes sections
  xxxl: 40, // espacement majeur, separateurs de zones
  xxxxl: 48, // espacement très large pour layout principal
} as const;

// ===================
// TYPOGRAPHY SYSTEM - Hiérarchie claire avec line-height optimal
// ===================
export const TYPOGRAPHY = {
  // Titres hiérarchisés
  display: { 
    fontSize: 32, 
    lineHeight: 40, // ratio 1.25
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h1: { 
    fontSize: 28, 
    lineHeight: 36, // ratio ~1.29
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h2: { 
    fontSize: 24, 
    lineHeight: 32, // ratio ~1.33
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h3: { 
    fontSize: 20, 
    lineHeight: 26, // ratio 1.3
    fontWeight: '600' as const 
  },
  h4: { 
    fontSize: 18, 
    lineHeight: 24, // ratio ~1.33
    fontWeight: '600' as const 
  },
  
  // Corps de texte
  title: { 
    fontSize: 20, 
    lineHeight: 26, // ratio 1.3
    fontWeight: '600' as const 
  },
  subtitle: { 
    fontSize: 17, 
    lineHeight: 22, // ratio ~1.3
    fontWeight: '500' as const 
  },
  body: { 
    fontSize: 15, 
    lineHeight: 20, // ratio ~1.33
    fontWeight: '400' as const 
  },
  bodyLarge: { 
    fontSize: 17, 
    lineHeight: 24, // ratio ~1.41
    fontWeight: '400' as const 
  },
  bodySmall: { 
    fontSize: 13, 
    lineHeight: 18, // ratio ~1.38
    fontWeight: '400' as const 
  },
  caption: { 
    fontSize: 12, 
    lineHeight: 16, // ratio ~1.33
    fontWeight: '400' as const 
  },
  overline: { 
    fontSize: 11, 
    lineHeight: 16, // ratio ~1.45
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
} as const;

// ===================
// BORDER RADIUS SYSTEM - Échelle cohérente
// ===================
export const RADIUS = {
  none: 0,
  xs: 2,    // borders fins, dividers
  sm: 4,    // petits éléments, badges
  md: 8,    // boutons standard, inputs
  lg: 12,   // cartes, containers
  xl: 16,   // grandes cartes, modales
  xxl: 20,  // éléments majeurs
  xxxl: 24, // containers principaux
  round: 999, // boutons ronds, avatars
} as const;

// ===================
// TOUCH TARGET SYSTEM - Conformité Guidelines Apple/Material
// ===================
export const TOUCH = {
  minSize: 44,      // minimum pour accessibilité (Apple HIG)
  comfortable: 48,  // taille recommandée pour boutons
  large: 56,        // boutons proéminents, FAB
  hitSlop: 8,       // extension zone tactile invisible
  hitSlopLarge: 12, // extension pour petits éléments
} as const;

// ===================
// LAYOUT SYSTEM - Responsive et adaptatif
// ===================
export const LAYOUT = {
  // Gutters - Marges latérales globales
  gutters: {
    horizontal: SPACING.lg, // 16px selon meilleures pratiques
    vertical: SPACING.lg,   // 16px
  },
  
  // Breakpoints pour responsive (optionnel pour mobile)
  breakpoints: {
    small: 320,   // iPhone SE
    medium: 375,  // iPhone standard
    large: 414,   // iPhone Pro Max
    tablet: 768,  // iPad portrait
  },
  
  // Container max-width pour très grands écrans
  maxWidth: {
    content: 480,  // contenu principal sur tablettes
    modal: 400,    // modales sur tablettes
  },
  
  // Screen dimensions (dynamiques)
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
} as const;

// ===================
// SHADOW SYSTEM - Profondeurs cohérentes
// ===================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  xs: {
    shadowColor: '#020617', // dark blue-black pour cohérence
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  
  sm: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  
  md: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  
  lg: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  
  xl: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Shadows spécialisées
  button: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  card: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  modal: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// ===================
// ANIMATION SYSTEM - Durées et courbes cohérentes
// ===================
export const ANIMATION = {
  // Durées standardisées (en millisecondes)
  duration: {
    instant: 0,
    fast: 150,      // micro-interactions rapides
    normal: 250,    // transitions standard
    slow: 350,      // animations importantes
    slower: 500,    // animations complexes
  },
  
  // Courbes d'animation (easing)
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out', 
    easeInOut: 'ease-in-out',
    // Courbes iOS natives
    iosEaseIn: 'cubic-bezier(0.42, 0, 1, 1)',
    iosEaseOut: 'cubic-bezier(0, 0, 0.58, 1)',
    iosEaseInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  },
} as const;

// ===================
// Z-INDEX SYSTEM - Gestion des couches
// ===================
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
  top: 999,
} as const;

// ===================
// ALIASES & COMPATIBILITY - Pour migration progressive
// ===================
export const DESIGN_TOKENS = {
  spacing: SPACING,
  typography: TYPOGRAPHY,
  radius: RADIUS,
  touch: TOUCH,
  layout: LAYOUT,
  shadows: SHADOWS,
  animation: ANIMATION,
  zIndex: Z_INDEX,
} as const;

// Export par défaut pour compatibilité
export default DESIGN_TOKENS;

// ===================
// TYPES TYPESCRIPT
// ===================
export type SpacingKey = keyof typeof SPACING;
export type TypographyKey = keyof typeof TYPOGRAPHY;
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type AnimationDuration = keyof typeof ANIMATION.duration;
export type AnimationEasing = keyof typeof ANIMATION.easing;

// Helper type pour extraire les valeurs
export type SpacingValue = typeof SPACING[SpacingKey];
export type TypographyValue = typeof TYPOGRAPHY[TypographyKey];
export type RadiusValue = typeof RADIUS[RadiusKey];
export type ShadowValue = typeof SHADOWS[ShadowKey];