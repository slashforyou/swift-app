/**
 * Design Tokens Complets - Système de Design Centralisé Swift App
 * Version avancée avec palette complète et système responsive
 */

// ============================================================================
// TYPOGRAPHIE SYSTÈME
// ============================================================================

export const TYPOGRAPHY = {
  // Tailles de police - Système responsive
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
    xxl: 52, // Ajout pour compatibilité legacy
  },

  // Poids de police
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } as const,

  // Hauteurs de ligne
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Familles de polices
  fontFamily: {
    body: 'System',
    heading: 'System',
    mono: 'Menlo, Monaco, Consolas, monospace',
  },
} as const;

// ============================================================================
// PALETTE DE COULEURS COMPLÈTE
// ============================================================================

export const COLORS = {
  // Couleurs primaires
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Primary principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Couleurs secondaires
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Couleurs de status
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Couleurs neutres
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const;

// ============================================================================
// ESPACEMENT SYSTÈME
// ============================================================================

export const SPACING = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  14: 28,
  16: 32,
  20: 40,
  24: 48,
  28: 56,
  32: 64,
  36: 72,
  40: 80,
  44: 88,
  48: 96,
  52: 104,
  56: 112,
  60: 120,
  64: 128,
  72: 144,
  80: 160,
  96: 192,
} as const;

// Aliases sémantiques
export const SEMANTIC_SPACING = {
  xs: SPACING[2],    // 4px
  sm: SPACING[4],    // 8px
  md: SPACING[8],    // 16px
  lg: SPACING[12],   // 24px
  xl: SPACING[16],   // 32px
  '2xl': SPACING[20], // 40px
  '3xl': SPACING[24], // 48px
  '4xl': SPACING[32], // 64px
  '5xl': SPACING[40], // 80px
  '6xl': SPACING[48], // 96px
  xxxl: SPACING[64], // 128px - pour compatibilité legacy
} as const;

// ============================================================================
// RAYONS DE BORDURE
// ============================================================================

export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ============================================================================
// OMBRES SYSTÈME
// ============================================================================

export const SHADOWS = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  base: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  lg: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },

  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },

  '2xl': {
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 16,
  },

  // Ombres spécialisées
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// ============================================================================
// ANIMATIONS & TRANSITIONS
// ============================================================================

export const ANIMATIONS = {
  // Durées
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  // Courbes d'animation (valeurs pour React Native Animated)
  easing: {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
  },

  // Presets d'animations courantes
  presets: {
    fadeIn: {
      duration: 250,
      easing: [0, 0, 0.2, 1],
    },
    slideUp: {
      duration: 300,
      easing: [0.25, 0.1, 0.25, 1],
    },
    bounce: {
      duration: 400,
      easing: [0.68, -0.55, 0.265, 1.55],
    },
  },
} as const;

// ============================================================================
// BREAKPOINTS RESPONSIVE
// ============================================================================

export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1400,
} as const;

// ============================================================================
// CONSTANTES D'INTERFACE
// ============================================================================

export const UI_CONSTANTS = {
  // Hauteurs standards
  heights: {
    header: 56,
    tabBar: 60,
    button: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },
    input: {
      sm: 32,
      md: 40,
      lg: 48,
    },
  },

  // Largeurs standards  
  widths: {
    sidebar: 280,
    modal: {
      sm: 320,
      md: 480,
      lg: 640,
      xl: 768,
    },
  },

  // Z-index système
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

// ============================================================================
// DESIGN TOKENS LEGACY (Rétrocompatibilité)
// ============================================================================

// Maintenir la compatibilité avec l'ancien système
export const DESIGN_TOKENS = {
  spacing: SEMANTIC_SPACING,
  radius: RADIUS,
  borderRadius: RADIUS, // Alias pour compatibilité avec les composants existants
  typography: {
    ...TYPOGRAPHY,
    // Variants de typographie pour compatibilité
    display: {
      fontSize: TYPOGRAPHY.fontSize['6xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      lineHeight: TYPOGRAPHY.lineHeight.tight,
    },
    h1: {
      fontSize: TYPOGRAPHY.fontSize['5xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      lineHeight: TYPOGRAPHY.lineHeight.tight,
    },
    h2: {
      fontSize: TYPOGRAPHY.fontSize['4xl'],
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      lineHeight: TYPOGRAPHY.lineHeight.tight,
    },
    h3: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    h4: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    title: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    body: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    bodyLarge: {
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    bodySmall: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    caption: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    overline: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  },
  colors: COLORS,
  shadows: SHADOWS,
  animations: ANIMATIONS,
  // Propriétés Touch pour compatibilité
  touch: {
    minSize: 44,
    hitSlop: 8,
  },
} as const;

// Export par défaut pour l'ancien système
export default DESIGN_TOKENS;