/**
 * MIGRATION GUIDE - Ancien vers Nouveau Design System
 * 
 * Ce fichier sert de pont pour migrer progressivement l'ancien système
 * vers le nouveau design system centralisé.
 */

import { DESIGN_TOKENS } from './tokens';

// ===================
// MAPPING ANCIEN -> NOUVEAU
// ===================

/**
 * Migration des anciens DESIGN_TOKENS dispersés
 */
export const MIGRATION_MAP = {
  // Ancien système dans monthScreen.tsx et autres
  spacing: {
    xs: DESIGN_TOKENS.spacing.xs,     // 4
    sm: DESIGN_TOKENS.spacing.sm,     // 8  
    md: DESIGN_TOKENS.spacing.md,     // 12
    lg: DESIGN_TOKENS.spacing.lg,     // 16
    xl: DESIGN_TOKENS.spacing.xl,     // 24
    xxl: DESIGN_TOKENS.spacing.xxxl,   // 32 (using xxxl as per tokens.ts)
  },
  
  // Ancien système radius
  radius: {
    sm: DESIGN_TOKENS.radius.sm,      // 4
    md: DESIGN_TOKENS.radius.md,      // 8
    lg: DESIGN_TOKENS.radius.lg,      // 12
    xl: DESIGN_TOKENS.radius.xl,      // 16
  },
  
  // Migration des shadows (soft -> sm, medium -> md, strong -> lg)
  shadows: {
    soft: DESIGN_TOKENS.shadows.sm,
    medium: DESIGN_TOKENS.shadows.md,
    strong: DESIGN_TOKENS.shadows.lg,
  },
} as const;

// ===================
// UTILITAIRES DE MIGRATION
// ===================

/**
 * Convertit l'ancien format DESIGN_TOKENS vers le nouveau
 */
export const migrateOldDesignTokens = (oldTokens: any) => {
  console.warn('[Design System] Utilisation d\'anciens design tokens détectée. Migrez vers le nouveau système centralisé.');
  
  return {
    spacing: MIGRATION_MAP.spacing,
    radius: MIGRATION_MAP.radius,
    shadows: MIGRATION_MAP.shadows,
    // Ajoutez d'autres mappings selon les besoins
  };
};

/**
 * Hook temporaire pour la transition
 * @deprecated Utilisez directement les tokens du design system
 */
export const useLegacyDesignTokens = () => {
  console.warn('[Design System] useLegacyDesignTokens est déprécié. Utilisez les tokens du design system directement.');
  return MIGRATION_MAP;
};

// ===================
// EXPORTS COMPATIBILITÉ
// ===================

/**
 * Export temporaire pour compatibilité avec l'ancien système
 * @deprecated Utilisez le nouveau design system
 */
export const LEGACY_DESIGN_TOKENS = {
  spacing: MIGRATION_MAP.spacing,
  radius: MIGRATION_MAP.radius,
  shadows: MIGRATION_MAP.shadows,
  typography: {
    title: DESIGN_TOKENS.typography.title,
    subtitle: DESIGN_TOKENS.typography.subtitle,
    body: DESIGN_TOKENS.typography.body,
    caption: DESIGN_TOKENS.typography.caption,
    h4: DESIGN_TOKENS.typography.h4,
    bodySmall: DESIGN_TOKENS.typography.bodySmall,
  },
} as const;