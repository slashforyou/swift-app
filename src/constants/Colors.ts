/**
 * Comprehensive color system for Swift App (Moving/Logistics)
 * Orange primary with blue-grey neutrals - Light & Dark modes
 * Modern, professional palette suitable for logistics and moving services
 */

export const Colors = {
  light: {
    // Base colors (neutral_slate_bluish palette)
    text: '#233551', // neutral_slate_bluish.900
    textSecondary: '#516386', // neutral_slate_bluish.700
    textMuted: '#6C7FA1', // neutral_slate_bluish.600
    background: '#F6F8FC', // neutral_slate_bluish.50
    backgroundSecondary: '#EDF1F8', // neutral_slate_bluish.100
    backgroundTertiary: '#DCE4F0', // neutral_slate_bluish.200
    
    // Primary brand colors (primary_orange palette)
    primary: '#FF6A4A', // primary_orange.500
    primaryDark: '#CC452F', // primary_orange.700
    primaryLight: '#FF8F73', // primary_orange.400
    
    // Accent colors
    tint: '#3B82F6', // info_blue.500
    
    // Status colors (support palette)
    success: '#22C55E', // support.success.500
    successLight: '#4ADE80', // support.success.400
    warning: '#F59E0B', // support.warning.500
    warningLight: '#FBBF24', // support.warning.400
    error: '#EF4444', // support.danger.500
    errorLight: '#F87171', // support.danger.400
    info: '#3B82F6', // info_blue.500
    infoLight: '#60A5FA', // info_blue.400
    
    // UI Elements
    border: '#DCE4F0', // neutral_slate_bluish.200
    borderLight: '#EDF1F8', // neutral_slate_bluish.100
    shadow: '#233551', // neutral_slate_bluish.900
    overlay: 'rgba(246, 248, 252, 0.95)', // background with opacity
    overlayDark: 'rgba(35, 53, 81, 0.5)', // text with opacity
    
    // Navigation & Icons
    icon: '#8B9EBB', // neutral_slate_bluish.500
    iconActive: '#FF6A4A', // primary
    tabIconDefault: '#8B9EBB', // neutral_slate_bluish.500
    tabIconSelected: '#FF6A4A', // primary
    
    // Interactive elements
    buttonPrimary: '#FF6A4A', // primary
    buttonPrimaryText: '#FFFFFF', // on-primary
    buttonSecondary: '#EDF1F8', // surface-2 (neutral_slate_bluish.100)
    buttonSecondaryText: '#233551', // text-primary
    buttonOutline: 'transparent',
    buttonOutlineText: '#FF6A4A', // primary
    buttonDisabled: '#DCE4F0', // border
    buttonDisabledText: '#8B9EBB', // neutral_slate_bluish.500
    
    // Form elements
    inputBackground: '#FFFFFF', // surface
    inputBorder: '#DCE4F0', // border
    inputBorderFocused: '#60A5FA', // ring (info_blue.400)
    inputText: '#233551', // text-primary
    inputPlaceholder: '#6C7FA1', // text-muted
    
    // Calendar specific
    calendarBackground: '#FFFFFF', // surface
    calendarBorder: '#DCE4F0', // border
    calendarToday: '#FF6A4A', // primary
    calendarSelected: '#F0553A', // primary-hover
    calendarEvent: '#22C55E', // success
    
    // Loading and states
    loadingBackground: 'rgba(237, 241, 248, 0.95)', // backgroundSecondary with opacity
    loadingSpinner: '#FF6A4A', // primary
    
    // Error banners
    errorBanner: '#FFF6F2', // primary_orange.50 (light error background)
    errorBannerBorder: '#F87171', // support.danger.400
    errorBannerText: '#EF4444', // support.danger.500
    errorButton: '#EF4444', // error
    errorButtonText: '#FFFFFF',
  },
  dark: {
    // Base colors (dark theme palette)
    text: '#F5F7FB', // text-primary
    textSecondary: '#C8D0E0', // text-secondary
    textMuted: '#9AA7BF', // text-muted
    background: '#0F1420', // background
    backgroundSecondary: '#0B101B', // surface-2
    backgroundTertiary: '#121826', // surface/card
    
    // Primary brand colors
    primary: '#FF6A4A', // primary (same as light)
    primaryDark: '#CC452F', // primary-pressed
    primaryLight: '#FF8F73', // lighter variant
    
    // Accent colors
    tint: '#6EA8FF', // accent
    
    // Status colors (support palette - 400 variants for dark)
    success: '#4ADE80', // support.success.400
    successLight: '#22C55E', // support.success.500
    warning: '#FBBF24', // support.warning.400
    warningLight: '#F59E0B', // support.warning.500
    error: '#F87171', // support.danger.400
    errorLight: '#EF4444', // support.danger.500
    info: '#60A5FA', // info_blue.400
    infoLight: '#3B82F6', // info_blue.500
    
    // UI Elements
    border: '#223049', // border
    borderLight: '#121826', // surface
    shadow: '#000000',
    overlay: 'rgba(15, 20, 32, 0.95)', // background with opacity
    overlayDark: 'rgba(0, 0, 0, 0.8)',
    
    // Navigation & Icons
    icon: '#9AA7BF', // text-muted
    iconActive: '#FF6A4A', // primary
    tabIconDefault: '#9AA7BF', // text-muted
    tabIconSelected: '#F5F7FB', // text-primary
    
    // Interactive elements
    buttonPrimary: '#FF6A4A', // primary
    buttonPrimaryText: '#FFFFFF', // on-primary
    buttonSecondary: '#0B101B', // surface-2
    buttonSecondaryText: '#F5F7FB', // text-primary
    buttonOutline: 'transparent',
    buttonOutlineText: '#FF6A4A', // primary
    buttonDisabled: '#223049', // border
    buttonDisabledText: '#9AA7BF', // text-muted
    
    // Form elements
    inputBackground: '#121826', // surface
    inputBorder: '#223049', // border
    inputBorderFocused: '#3B82F6', // ring
    inputText: '#F5F7FB', // text-primary
    inputPlaceholder: '#9AA7BF', // text-muted
    
    // Calendar specific
    calendarBackground: '#121826', // surface
    calendarBorder: '#223049', // border
    calendarToday: '#FF6A4A', // primary
    calendarSelected: '#F0553A', // primary-hover
    calendarEvent: '#4ADE80', // success
    
    // Loading and states
    loadingBackground: 'rgba(11, 16, 27, 0.95)', // surface-2 with opacity
    loadingSpinner: '#FF6A4A', // primary
    
    // Error banners
    errorBanner: '#121826', // surface (subtle dark error background)
    errorBannerBorder: '#F87171', // support.danger.400
    errorBannerText: '#F87171', // support.danger.400
    errorButton: '#F87171', // error
    errorButtonText: '#0F1420', // background (dark text on light button)
  },
};

// Type definitions for better TypeScript support
export type ColorScheme = 'light' | 'dark';
export type ColorName = keyof typeof Colors.light;

// Helper function to get colors with opacity
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return color.replace(/[\d\.]+\)$/g, `${opacity})`);
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  return color;
};
