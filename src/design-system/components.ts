/**
 * Design System Components - Point d'entrée unifié
 * Tous les composants UI modernisés avec le design system centralisé
 */

// ===================
// CORE UI COMPONENTS
// ===================

// Composants de base modernisés
export { default as Button, type ButtonProps } from '../components/ui/Button';
export { default as Card, type CardProps } from '../components/ui/Card';
export { default as Input, type InputProps } from '../components/ui/Input';
export { default as Screen, type ScreenProps } from '../components/ui/Screen';
export {
    Body,
    BodyLarge,
    BodySmall,
    Caption, Display,
    Heading1,
    Heading2,
    Heading3,
    Heading4, Overline, Subtitle, Title, default as Typography, useTypography,
    type TypographyProps
} from '../components/ui/Typography';

// Composants UI existants (à migrer plus tard)
export { default as AlertMessage } from '../components/ui/AlertMessage';
export { default as LoadingDots } from '../components/ui/LoadingDots';
export { default as Toast } from '../components/ui/Toast';

// ===================
// BUSINESS COMPONENTS
// ===================

// Composants business modernisés
export { default as BusinessCard, type BusinessCardProps } from '../components/business/BusinessCard_New';

// ===================
// HOOKS UTILITAIRES
// ===================

/**
 * Hook pour obtenir les styles communs du design system
 */
export const useDesignSystem = () => {
  const { DESIGN_TOKENS } = require('./index');
  const { useTheme } = require('../context/ThemeProvider');
  const { colors } = useTheme();
  
  return {
    tokens: DESIGN_TOKENS,
    colors,
    spacing: DESIGN_TOKENS.spacing,
    typography: DESIGN_TOKENS.typography,
    radius: DESIGN_TOKENS.radius,
    shadows: DESIGN_TOKENS.shadows,
  };
};

// ===================
// EXPORTS GROUPÉS
// ===================

/**
 * Export groupé de tous les tokens pour faciliter l'import
 */
export { useTheme } from '../context/ThemeProvider_Advanced';
export { DESIGN_TOKENS } from './tokens';

/**
 * Types utilitaires pour le design system
 */
export type SpacingKey = keyof typeof import('./tokens').DESIGN_TOKENS.spacing;
export type TypographyKey = keyof typeof import('./tokens').DESIGN_TOKENS.typography;
export type RadiusKey = keyof typeof import('./tokens').DESIGN_TOKENS.radius;
export type ShadowKey = keyof typeof import('./tokens').DESIGN_TOKENS.shadows;