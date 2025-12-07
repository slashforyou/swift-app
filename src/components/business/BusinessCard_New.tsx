/**
 * BusinessCard - Composant carte unifié pour toutes les pages Business
 * Utilise le design system centralisé avec variants optimisés
 */
import React from 'react';
import {
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { DESIGN_TOKENS, useTheme } from '../../design-system';

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessCardProps {
  /**
   * Variant de la carte (définit le style)
   */
  variant: 'primary' | 'dashboard' | 'action' | 'elevated' | 'outlined';
  
  /**
   * Contenu de la carte
   */
  children: React.ReactNode;
  
  /**
   * Callback quand la carte est pressée
   * Si défini, la carte devient cliquable
   */
  onPress?: () => void;
  
  /**
   * État de chargement
   */
  loading?: boolean;
  
  /**
   * État désactivé
   */
  disabled?: boolean;
  
  /**
   * Styles personnalisés (override)
   */
  style?: ViewStyle;
  
  /**
   * Styles de contenu personnalisés
   */
  contentStyle?: ViewStyle;
  
  /**
   * Padding custom
   */
  padding?: keyof typeof DESIGN_TOKENS.spacing | number;
  
  /**
   * Radius custom
   */
  radius?: keyof typeof DESIGN_TOKENS.radius | number;
  
  /**
   * Test ID pour les tests automatisés
   */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BusinessCard: React.FC<BusinessCardProps> = ({
  variant = 'primary',
  children,
  onPress,
  loading = false,
  disabled = false,
  style,
  contentStyle,
  padding = 'lg',
  radius = 'lg',
  testID,
}) => {
  const { colors } = useTheme();
  
  // Résolution des valeurs
  const paddingValue = typeof padding === 'number' 
    ? padding 
    : DESIGN_TOKENS.spacing[padding];
    
  const radiusValue = typeof radius === 'number' 
    ? radius 
    : DESIGN_TOKENS.radius[radius];
  
  // Configuration des variants
  const variantConfig = {
    primary: {
      backgroundColor: colors.primary,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: DESIGN_TOKENS.shadows.lg,
    },
    dashboard: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
      shadow: DESIGN_TOKENS.shadows.card,
    },
    action: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
      shadow: DESIGN_TOKENS.shadows.sm,
    },
    elevated: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: DESIGN_TOKENS.shadows.lg,
    },
    outlined: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
      shadow: DESIGN_TOKENS.shadows.none,
    },
  };
  
  const currentVariant = variantConfig[variant];
  const isDisabled = disabled || loading;
  
  // Styles de base
  const baseStyle = {
    backgroundColor: currentVariant.backgroundColor,
    borderRadius: radiusValue,
    padding: paddingValue,
    borderWidth: currentVariant.borderWidth,
    borderColor: currentVariant.borderColor,
    ...currentVariant.shadow,
    opacity: isDisabled ? 0.6 : 1,
  };

  // Si pas de onPress, utiliser View
  if (!onPress) {
    return (
      <View 
        style={[baseStyle, style]}
        testID={testID}
      >
        <View style={contentStyle}>
          {children}
        </View>
      </View>
    );
  }

  // Sinon utiliser TouchableOpacity
  return (
    <TouchableOpacity 
      style={[baseStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      hitSlop={{
        top: DESIGN_TOKENS.touch.hitSlop,
        bottom: DESIGN_TOKENS.touch.hitSlop,
        left: DESIGN_TOKENS.touch.hitSlop,
        right: DESIGN_TOKENS.touch.hitSlop,
      }}
    >
      <View style={contentStyle}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default BusinessCard;