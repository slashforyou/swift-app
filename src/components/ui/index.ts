/**
 * Index centralisé - Export unifié du Design System
 * Point d'entrée unique pour tous les composants UI avancés
 */

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export {
    ANIMATIONS, COLORS, RADIUS, SEMANTIC_SPACING, SHADOWS, SPACING, TYPOGRAPHY
} from '../../design-system/tokens';

// ============================================================================
// THEME PROVIDER
// ============================================================================

export {
    ThemeProvider,
    useTheme, type ThemeColors,
    type ThemeContextType, type ThemeMode
} from '../../context/ThemeProvider_Advanced';

// ============================================================================
// TYPOGRAPHY COMPONENTS
// ============================================================================

export {
    // Composant de base
    BaseText,
    // Composants de corps
    Body,
    BodyLarge,
    BodySmall, Caption,
    Code,
    // Composants de titre
    Display, ErrorText, H1, H2, H3, H4, H5, H6, Heading, InfoText,
    // Composants spécialisés
    Label, Link, SuccessText,
    WarningText
} from './Typography_Advanced';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

export {
    // Composant principal
    Button, DestructiveButton, GhostButton, IconButton, InfoButton, OutlineButton,
    // Variants spécialisés
    PrimaryButton,
    SecondaryButton, SuccessButton,
    WarningButton,
    // Types
    type ButtonProps, type ButtonSize, type ButtonVariant
} from './Button_Advanced';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

export {
    // Composant principal
    Card, CardActions, CardContent,
    CardFooter,
    // Layout components
    CardHeader,
    // Variants spécialisés
    ElevatedCard, FilledCard, GlassCard,
    GradientCard, InteractiveCard, OutlinedCard, type CardPadding,
    // Types
    type CardProps,
    type CardVariant
} from './Card_Advanced';

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

export {
    FilledInput,
    // Composant principal
    Input,

    // Variants spécialisés
    OutlinedInput, PasswordInput,
    SearchInput,
    TextArea, UnderlinedInput,
    // Types
    type InputProps,
    type InputRef, type InputSize,
    type InputState, type InputVariant
} from './Input_Advanced';

// ============================================================================
// CONSTANTES DE DESIGN
// ============================================================================

/**
 * Constantes utiles pour le développement
 */
export const DESIGN_CONSTANTS = {
  // Tailles d'écran
  SCREEN_SIZES: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
  },
  
  // Z-index standardisés
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1010,
    MODAL: 1020,
    POPOVER: 1030,
    TOAST: 1040,
    TOOLTIP: 1050,
  },
  
  // Timing d'animations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
  },
  
  // Breakpoints
  BREAKPOINTS: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  },
} as const;

// ============================================================================
// TYPES GÉNÉRAUX
// ============================================================================

// Types utilitaires pour les composants
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading' | 'focused';

// ============================================================================
// METADATA
// ============================================================================

export const DESIGN_SYSTEM_VERSION = '1.0.0';
export const DESIGN_SYSTEM_INFO = {
  version: DESIGN_SYSTEM_VERSION,
  components: {
    typography: 15,
    buttons: 9,
    cards: 7,
    inputs: 6,
    total: 37,
  },
  tokens: {
    colors: 50,
    spacing: 20,
    typography: 12,
    shadows: 5,
    radius: 6,
    total: 93,
  },
  themes: ['light', 'dark', 'auto'],
  accessibility: 'WCAG 2.1 AA',
  typescript: true,
  testing: 'Jest + RNTL ready',
} as const;