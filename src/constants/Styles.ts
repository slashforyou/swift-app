/**
 * Common Styles System for Swift App - REFACTORED
 * Conformes aux meilleures pratiques UI mobiles iOS/Android
 * Grille de 8pt, Safe Areas, Touch targets ≥44pt, Typography optimisée
 */

import { Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { Colors } from './Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Design tokens - Basés sur les meilleures pratiques UI mobiles
const DESIGN_TOKENS = {
  // Spacing scale - Grille de 8pt avec ajustements fins de 4pt
  spacing: {
    xs: 4,   // ajustements fins
    sm: 8,   // espacement minimal entre éléments
    md: 12,  // espacement texte/valeur
    lg: 16,  // espacement standard entre composants
    xl: 24,  // espacement sections
    xxl: 32, // espacement grandes sections
    xxxl: 40, // espacement majeur
  },
  
  // Typography scale - Hiérarchie claire avec line-height optimal
  typography: {
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
    caption: { 
      fontSize: 13, 
      lineHeight: 18, // ratio ~1.38
      fontWeight: '400' as const 
    },
    // Aliases pour compatibilité
    h4: { 
      fontSize: 17, 
      lineHeight: 22,
      fontWeight: '500' as const 
    },
    bodySmall: { 
      fontSize: 13, 
      lineHeight: 18,
      fontWeight: '400' as const 
    },
  },
  
  // Border radius scale
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20, // Pour les modales et grandes cartes
  },
  
  // Shadow presets - Aliasés pour compatibilité avec les écrans calendar
  shadows: {
    sm: {
      shadowColor: '#020617',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
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
  },
  
  // Touch targets - Conformité aux guidelines Apple/Material
  touch: {
    minSize: 44, // minimum pour accessibilité
    comfortable: 48, // taille recommandée pour boutons
    hitSlop: 8, // extension zone tactile invisible
  },
  
  // Container gutters - Marges latérales globales
  gutters: {
    horizontal: 16, // selon meilleures pratiques
    vertical: 16,
  },
};

// Shadow presets - Selon spécifications du thème de référence  
const SHADOWS = {
  soft: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  strong: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Styles primitifs - Conformes aux meilleures pratiques UI mobiles
const LAYOUT_PRIMITIVES = {
  screen: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.gutters.horizontal,
    // paddingTop et paddingBottom seront appliqués via SafeAreaView
  },
  fullWidth: {
    alignSelf: 'stretch' as const,
  },
  centerContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

const STACK_PRIMITIVES = {
  vStack: (gap: number = DESIGN_TOKENS.spacing.lg) => ({
    gap,
    flexDirection: 'column' as const,
  }),
  hStack: (gap: number = DESIGN_TOKENS.spacing.md) => ({
    gap,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  }),
};

const CARD_PRIMITIVES = {
  base: {
    backgroundColor: Colors.light.backgroundTertiary, // sera overridden par le thème
    borderRadius: DESIGN_TOKENS.radius.lg,
    padding: DESIGN_TOKENS.spacing.lg,
    ...SHADOWS.medium,
  },
};

const TEXT_PRIMITIVES = {
  title: {
    ...DESIGN_TOKENS.typography.title,
    color: Colors.light.text, // sera overridden par le thème
    allowFontScaling: true,
  },
  subtitle: {
    ...DESIGN_TOKENS.typography.subtitle,
    color: Colors.light.text,
    allowFontScaling: true,
  },
  body: {
    ...DESIGN_TOKENS.typography.body,
    color: Colors.light.text,
    allowFontScaling: true,
  },
  muted: {
    ...DESIGN_TOKENS.typography.caption,
    color: Colors.light.textMuted,
    allowFontScaling: true,
  },
};

const BUTTON_PRIMITIVES = {
  primary: {
    height: DESIGN_TOKENS.touch.comfortable,
    borderRadius: DESIGN_TOKENS.radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...SHADOWS.medium,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  secondary: {
    height: DESIGN_TOKENS.touch.comfortable,
    borderRadius: DESIGN_TOKENS.radius.md,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
};

const INPUT_PRIMITIVES = {
  base: {
    height: DESIGN_TOKENS.touch.comfortable,
    borderRadius: DESIGN_TOKENS.radius.md,
    backgroundColor: Colors.light.backgroundTertiary,
    borderColor: Colors.light.border,
    borderWidth: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.typography.body,
  },
};

// Export des primitives pour utilisation directe
export { BUTTON_PRIMITIVES, CARD_PRIMITIVES, DESIGN_TOKENS, INPUT_PRIMITIVES, LAYOUT_PRIMITIVES, STACK_PRIMITIVES, TEXT_PRIMITIVES };

export const createCommonStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // ===================
  // LAYOUT PRIMITIVES - Conformes aux meilleures pratiques
  // ===================
  
  // Screen wrapper - applique SafeArea + gutters
  screen: {
    ...LAYOUT_PRIMITIVES.screen,
    backgroundColor: colors.background,
  },
  
  fullWidth: LAYOUT_PRIMITIVES.fullWidth,
  centerContent: LAYOUT_PRIMITIVES.centerContent,
  
  // Stacks - Remplacent les anciennes méthodes de spacing
  vStack: STACK_PRIMITIVES.vStack(),
  vStackTight: STACK_PRIMITIVES.vStack(DESIGN_TOKENS.spacing.sm),
  vStackLoose: STACK_PRIMITIVES.vStack(DESIGN_TOKENS.spacing.xl),
  
  hStack: STACK_PRIMITIVES.hStack(),
  hStackTight: STACK_PRIMITIVES.hStack(DESIGN_TOKENS.spacing.sm),
  hStackLoose: STACK_PRIMITIVES.hStack(DESIGN_TOKENS.spacing.lg),
  
  // ===================
  // CARDS & CONTAINERS
  // ===================
  
  card: {
    ...CARD_PRIMITIVES.base,
    backgroundColor: colors.backgroundTertiary,
  },
  
  panel: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.lg,
    ...SHADOWS.soft,
  },
  
  // ===================
  // TYPOGRAPHY - Hiérarchie claire
  // ===================
  
  title: {
    ...TEXT_PRIMITIVES.title,
    color: colors.text,
  },
  
  subtitle: {
    ...TEXT_PRIMITIVES.subtitle,
    color: colors.text,
  },
  
  bodyText: {
    ...TEXT_PRIMITIVES.body,
    color: colors.text,
  },
  
  mutedText: {
    ...TEXT_PRIMITIVES.muted,
    color: colors.textMuted,
  },
  
  // ===================
  // BUTTONS - Touch targets conformes
  // ===================
  
  buttonPrimary: {
    ...BUTTON_PRIMITIVES.primary,
    backgroundColor: colors.primary,
  },
  
  buttonSecondary: {
    ...BUTTON_PRIMITIVES.secondary,
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.border,
  },
  
  buttonText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
  },
  
  buttonTextPrimary: {
    color: colors.buttonPrimaryText,
  },
  
  buttonTextSecondary: {
    color: colors.text,
  },
  
  // ===================
  // INPUTS
  // ===================
  
  inputBase: {
    ...INPUT_PRIMITIVES.base,
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.inputText,
  },
  
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    borderWidth: 2,
  },
  
  // ===================
  // LEGACY SUPPORT (à migrer progressivement)
  // ===================
  
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.gutters.horizontal,
  },
  
  // ===================
  // UTILITIES
  // ===================
  
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: DESIGN_TOKENS.spacing.md,
  },
  
  spacingXS: { height: DESIGN_TOKENS.spacing.xs },
  spacingSM: { height: DESIGN_TOKENS.spacing.sm },
  spacingMD: { height: DESIGN_TOKENS.spacing.md },
  spacingLG: { height: DESIGN_TOKENS.spacing.lg },
  spacingXL: { height: DESIGN_TOKENS.spacing.xl },
  
  // ===================
  // LEGACY STYLES - Compatibility (à migrer vers les nouveaux)
  // ===================
  
  // Layout utilities
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  itemsCenter: {
    alignItems: 'center',
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  // Spacing utilities
  marginTop: { marginTop: DESIGN_TOKENS.spacing.lg },
  marginBottom: { marginBottom: DESIGN_TOKENS.spacing.lg },
  padding16: { padding: DESIGN_TOKENS.spacing.lg },
  
  // Content containers
  contentContainer: {
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.lg,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  
  // Typography legacy
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  
  bodySmall: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  
  // Buttons legacy
  button: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonIcon: {
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonPrimaryText: {
    color: colors.buttonPrimaryText,
    fontWeight: '600',
    fontSize: 15,
  },
  
  buttonSecondaryText: {
    color: colors.buttonSecondaryText,
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Outline button styles
  buttonOutline: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  
  buttonOutlineText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Large button styles
  buttonPrimaryLarge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonPrimary,
  },
  
  buttonPrimaryTextLarge: {
    color: colors.buttonPrimaryText,
    fontWeight: '600',
    fontSize: 17,
  },
  
  // List items legacy
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.md,
  },
  
  listItemTitle: {
    ...DESIGN_TOKENS.typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  
  listItemSubtitle: {
    ...DESIGN_TOKENS.typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  
  // Status styles
  statusError: {
    backgroundColor: colors.errorBanner,
    borderColor: colors.errorBannerBorder,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.md,
  },
  
  // Touch improvements - hitSlop sera appliqué directement sur les composants Pressable
});// Hook pour utilisation facile

export const useCommonThemedStyles = () => {
  const { colors } = useTheme();
  return createCommonStyles(colors);
};

// Alias pour compatibilité
export const useCommonStyles = useCommonThemedStyles;