/**
 * Common Styles System for Swift App 
 * LEGACY - Version stable sans design system centralisé
 */

import { Dimensions, StyleSheet } from 'react-native';
import { Colors } from './Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Legacy constants - Valeurs directes
export const SPACING = {
  xs: 4,
  sm: 8, 
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TOUCH_TARGETS = {
  comfortable: 48,
  minSize: 44,
  large: 56,
};

export const RADIUS = {
  sm: 8,
  md: 12, 
  lg: 16,
};

export const TYPOGRAPHY_SIZES = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  h2: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
  h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 29 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
};

export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Styles primitifs legacy
export const LAYOUT_PRIMITIVES = {
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
};

export const BUTTON_PRIMITIVES = {
  primary: {
    height: TOUCH_TARGETS.comfortable,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...SHADOWS.md,
    paddingHorizontal: SPACING.lg,
  },
  secondary: {
    height: TOUCH_TARGETS.comfortable,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.lg,
  },
};

export const INPUT_PRIMITIVES = {
  default: {
    height: TOUCH_TARGETS.comfortable,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: SPACING.lg,
    backgroundColor: Colors.light.background,
    ...TYPOGRAPHY_SIZES.body,
    color: Colors.light.text,
  },
};

// Function pour créer les styles avec thème
const createCommonStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // Layout
  screen: {
    ...LAYOUT_PRIMITIVES.screen,
    backgroundColor: colors.background,
  },
  container: {
    ...LAYOUT_PRIMITIVES.container,
  },
  
  // Buttons
  primaryButton: {
    ...BUTTON_PRIMITIVES.primary,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    ...BUTTON_PRIMITIVES.secondary,
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.border,
  },
  
  // Inputs
  textInput: {
    ...INPUT_PRIMITIVES.default,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
  },
});// Export des styles par défaut
export const CommonStyles = createCommonStyles(Colors.light);

// Export de la fonction pour thématisation
export const createCommonThemedStyles = createCommonStyles;

// Export d'un DESIGN_TOKENS legacy pour compatibilité totale
export const DESIGN_TOKENS = {
  spacing: SPACING,
  touch: TOUCH_TARGETS,
  radius: RADIUS,
  typography: TYPOGRAPHY_SIZES,
  shadows: SHADOWS,
};