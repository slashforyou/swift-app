/**
 * Common Styles System for Swift App
 * Centralized, responsive and reusable styles
 * Uses our color system with soft shadows and no pure black
 * Orange accents with blue-grey backgrounds
 */

import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from './Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive dimensions
const RESPONSIVE = {
  // Base spacing system (8pt grid)
  xs: 4,
  sm: 8, 
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  
  // Font sizes (responsive)
  fontTiny: screenWidth < 350 ? 10 : 12,
  fontSmall: screenWidth < 350 ? 12 : 14,
  fontBase: screenWidth < 350 ? 14 : 16,
  fontLarge: screenWidth < 350 ? 16 : 18,
  fontXL: screenWidth < 350 ? 18 : 20,
  fontXXL: screenWidth < 350 ? 20 : 24,
  fontHuge: screenWidth < 350 ? 24 : 28,
  
  // Border radius
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 12,
  radiusXL: 16,
  
  // Container widths (responsive)
  containerPadding: screenWidth < 350 ? 12 : 16,
  containerMaxWidth: Math.min(screenWidth - 32, 600),
};

// Shadow presets - Selon spécifications du thème de référence  
const SHADOWS = {
  soft: {
    shadowColor: '#020617', // Couleur de base pour shadow_soft
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // shadow_soft = rgba(2,6,23,0.08)
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#020617', // Couleur de base pour shadow_medium
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, // shadow_medium = rgba(2,6,23,0.12)
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
  floating: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const createCommonStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // ===================
  // CONTAINER STYLES
  // ===================
  
  // Main containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.containerPadding,
  },
  
  containerSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40, // Safe area simulation
  },
  
  // Content containers
  contentContainer: {
    paddingHorizontal: RESPONSIVE.containerPadding,
    paddingVertical: RESPONSIVE.md,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: RESPONSIVE.containerPadding,
    paddingBottom: RESPONSIVE.xl,
  },
  
  // Cards and panels
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: RESPONSIVE.radiusLarge,
    padding: RESPONSIVE.lg,
    marginVertical: RESPONSIVE.sm,
    ...SHADOWS.medium,
  },
  
  cardElevated: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: RESPONSIVE.radiusLarge,
    padding: RESPONSIVE.lg,
    marginVertical: RESPONSIVE.sm,
    ...SHADOWS.floating,
  },
  
  panel: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: RESPONSIVE.radiusMedium,
    padding: RESPONSIVE.md,
    marginVertical: RESPONSIVE.xs,
    ...SHADOWS.soft,
  },
  
  // ===================
  // TYPOGRAPHY STYLES
  // ===================
  
  // Headers
  h1: {
    fontSize: RESPONSIVE.fontHuge,
    fontWeight: '700',
    color: colors.text,
    lineHeight: RESPONSIVE.fontHuge * 1.2,
    marginBottom: RESPONSIVE.md,
  },
  
  h2: {
    fontSize: RESPONSIVE.fontXXL,
    fontWeight: '600',
    color: colors.text,
    lineHeight: RESPONSIVE.fontXXL * 1.3,
    marginBottom: RESPONSIVE.sm,
  },
  
  h3: {
    fontSize: RESPONSIVE.fontXL,
    fontWeight: '600',
    color: colors.text,
    lineHeight: RESPONSIVE.fontXL * 1.4,
    marginBottom: RESPONSIVE.sm,
  },
  
  h4: {
    fontSize: RESPONSIVE.fontLarge,
    fontWeight: '500',
    color: colors.text,
    lineHeight: RESPONSIVE.fontLarge * 1.4,
    marginBottom: RESPONSIVE.xs,
  },
  
  // Body text
  bodyLarge: {
    fontSize: RESPONSIVE.fontLarge,
    fontWeight: '400',
    color: colors.text,
    lineHeight: RESPONSIVE.fontLarge * 1.5,
  },
  
  body: {
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '400',
    color: colors.text,
    lineHeight: RESPONSIVE.fontBase * 1.5,
  },
  
  bodySmall: {
    fontSize: RESPONSIVE.fontSmall,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: RESPONSIVE.fontSmall * 1.5,
  },
  
  // Special text
  textMuted: {
    fontSize: RESPONSIVE.fontBase,
    color: colors.textMuted,
    lineHeight: RESPONSIVE.fontBase * 1.5,
  },
  
  textSecondary: {
    fontSize: RESPONSIVE.fontBase,
    color: colors.textSecondary,
    lineHeight: RESPONSIVE.fontBase * 1.5,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textBold: {
    fontWeight: '700',
  },
  
  textSemiBold: {
    fontWeight: '600',
  },
  
  // ===================
  // BUTTON STYLES
  // ===================
  
  // Primary buttons (orange)
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: RESPONSIVE.md,
    paddingHorizontal: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  
  buttonPrimaryLarge: {
    backgroundColor: colors.primary,
    paddingVertical: RESPONSIVE.lg,
    paddingHorizontal: RESPONSIVE.xl,
    borderRadius: RESPONSIVE.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  
  buttonPrimaryText: {
    color: colors.buttonPrimaryText,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  buttonPrimaryTextLarge: {
    color: colors.buttonPrimaryText,
    fontSize: RESPONSIVE.fontLarge,
    fontWeight: '600',
  },
  
  // Secondary buttons
  buttonSecondary: {
    backgroundColor: colors.backgroundTertiary,
    paddingVertical: RESPONSIVE.md,
    paddingHorizontal: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.soft,
  },
  
  buttonSecondaryText: {
    color: colors.text,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '500',
  },
  
  // Outline buttons
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: RESPONSIVE.md,
    paddingHorizontal: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  buttonOutlineText: {
    color: colors.primary,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  // Icon buttons
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  
  buttonIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  
  // ===================
  // FORM STYLES
  // ===================
  
  // Input fields
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: RESPONSIVE.radiusMedium,
    paddingHorizontal: RESPONSIVE.md,
    paddingVertical: RESPONSIVE.sm,
    fontSize: RESPONSIVE.fontBase,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.soft,
  },
  
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  
  // Labels
  label: {
    fontSize: RESPONSIVE.fontSmall,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: RESPONSIVE.xs,
  },
  
  labelRequired: {
    color: colors.primary,
  },
  
  // ===================
  // LIST STYLES
  // ===================
  
  // List items
  listItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: RESPONSIVE.radiusMedium,
    padding: RESPONSIVE.md,
    marginVertical: RESPONSIVE.xs / 2,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: RESPONSIVE.sm,
  },
  
  listItemTitle: {
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
    color: colors.text,
    marginBottom: RESPONSIVE.xs / 2,
  },
  
  listItemSubtitle: {
    fontSize: RESPONSIVE.fontSmall,
    color: colors.textSecondary,
  },
  
  // ===================
  // NAVIGATION STYLES
  // ===================
  
  // Tab bar
  tabBar: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20, // Safe area for home indicator
    ...SHADOWS.strong,
  },
  
  // Navigation header
  navigationHeader: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...SHADOWS.soft,
  },
  
  // ===================
  // STATUS STYLES
  // ===================
  
  // Success
  statusSuccess: {
    backgroundColor: colors.success,
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
  },
  
  statusSuccessText: {
    color: colors.backgroundSecondary,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  // Warning
  statusWarning: {
    backgroundColor: colors.warning,
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
  },
  
  statusWarningText: {
    color: colors.backgroundSecondary,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  // Error
  statusError: {
    backgroundColor: colors.error,
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
  },
  
  statusErrorText: {
    color: colors.backgroundSecondary,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  // Info
  statusInfo: {
    backgroundColor: colors.info,
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.radiusMedium,
    alignItems: 'center',
  },
  
  statusInfoText: {
    color: colors.backgroundSecondary,
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },
  
  // ===================
  // UTILITY STYLES
  // ===================
  
  // Spacing
  marginTop: { marginTop: RESPONSIVE.md },
  marginBottom: { marginBottom: RESPONSIVE.md },
  marginVertical: { marginVertical: RESPONSIVE.md },
  marginHorizontal: { marginHorizontal: RESPONSIVE.md },
  
  paddingTop: { paddingTop: RESPONSIVE.md },
  paddingBottom: { paddingBottom: RESPONSIVE.md },
  paddingVertical: { paddingVertical: RESPONSIVE.md },
  paddingHorizontal: { paddingHorizontal: RESPONSIVE.md },
  
  // Flex utilities
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  alignCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  
  // Common combinations
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ===================
  // OVERLAY & MODALS
  // ===================
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modal: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: RESPONSIVE.radiusXL,
    padding: RESPONSIVE.lg,
    marginHorizontal: RESPONSIVE.lg,
    maxWidth: RESPONSIVE.containerMaxWidth,
    width: '90%',
    ...SHADOWS.floating,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RESPONSIVE.md,
    paddingBottom: RESPONSIVE.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  modalTitle: {
    fontSize: RESPONSIVE.fontXL,
    fontWeight: '700',
    color: colors.text,
  },
  
  modalContent: {
    marginVertical: RESPONSIVE.md,
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RESPONSIVE.lg,
    gap: RESPONSIVE.sm,
  },

  // ===================
  // BASIC EXTENSIONS (Minimal additions for consistency)
  // ===================
  
  // Essential flex utilities that are commonly needed
  itemsCenter: { alignItems: 'center' },
  
  // Basic gap utility for modern layouts
  gap8: { gap: 8 },

  // Modal and overlay styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayDark, // Utilise la couleur du thème
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Additional layout styles
  rowReverse: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  padding16: {
    padding: RESPONSIVE.md,
  },

  // Button styles
  button: {
    borderRadius: RESPONSIVE.radiusMedium,
    padding: 10,
    ...SHADOWS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Primary button styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: RESPONSIVE.radiusMedium,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },

  primaryButtonText: {
    color: colors.backgroundTertiary, // Utilise couleur du thème au lieu de hardcodé
    fontSize: RESPONSIVE.fontBase,
    fontWeight: '600',
  },

  // Flex row utility
  row: {
    flexDirection: 'row',
  },

  // Signature component styles
  mask: { 
    flex: 1, 
    backgroundColor: colors.overlayDark, // Utilise couleur du thème
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  cardScrollView: { 
    flexGrow: 1, 
    justifyContent: 'center' 
  },

  title: { 
    fontSize: RESPONSIVE.fontLarge, 
    fontWeight: '700', 
    marginBottom: 12, 
    padding: 10, 
    color: colors.text 
  },

  contractBloc: { 
    padding: RESPONSIVE.lg, 
    backgroundColor: colors.backgroundSecondary, 
    borderRadius: RESPONSIVE.radiusLarge,
    marginBottom: RESPONSIVE.md,
  },

  contractBlocContent: { 
    fontSize: RESPONSIVE.fontSmall, 
    color: colors.text, 
    marginBottom: 10, 
    lineHeight: 20, 
    margin: 10 
  },

  lastLine: { 
    fontSize: RESPONSIVE.fontTiny, 
    color: colors.textSecondary, 
    marginTop: 10, 
    textAlign: 'center' 
  },

  signingBloc: { 
    backgroundColor: colors.background, 
    borderRadius: RESPONSIVE.radiusLarge, 
    width: '100%', 
    flexDirection: 'column' 
  },

  signingCanvas: { 
    flex: 1, 
    backgroundColor: colors.background, 
    height: 150 
  },

  signingCanvasContainer: { 
    height: 170, 
    overflow: 'hidden', 
    marginBottom: RESPONSIVE.lg, 
    padding: 10,
    borderRadius: RESPONSIVE.radiusMedium,
    backgroundColor: colors.backgroundTertiary,
  },

  btn: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    backgroundColor: colors.backgroundSecondary, 
    borderRadius: RESPONSIVE.radiusMedium, 
    alignItems: 'center',
    flex: 1,
  },

  btnDisabled: { 
    opacity: 0.6 
  },

  hint: { 
    marginTop: 8, 
    color: colors.textSecondary, 
    fontSize: RESPONSIVE.fontTiny 
  },

  savingBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: RESPONSIVE.lg, 
    paddingBottom: 8 
  },
});

// Export responsive values and shadows for direct use
export { RESPONSIVE, SHADOWS };

// Utility function to create themed common styles
export const useCommonStyles = (colors: typeof Colors.light) => createCommonStyles(colors);