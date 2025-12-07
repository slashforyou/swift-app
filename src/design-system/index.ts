/**
 * DESIGN SYSTEM - Point d'entrée central
 * Swift App - Système de design unifié et moderne
 */

// Colors system (existant)
export { Colors, getColorWithOpacity } from '../constants/Colors';
export type { ColorName, ColorScheme } from '../constants/Colors';

// Theme Provider (utiliser l'ancien pour l'instant)  
export { ThemeProvider, useTheme } from '../context/ThemeProvider';

// Design Tokens - Export simple sans conflit
export { DESIGN_TOKENS } from './tokens';
