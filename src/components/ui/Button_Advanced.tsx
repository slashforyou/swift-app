/**
 * Button Component Avancé - Système de boutons complet avec Design Tokens
 * Variants, tailles, états et interactions cohérentes
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { RADIUS, SEMANTIC_SPACING, SHADOWS, TYPOGRAPHY } from '../../design-system/tokens';
import { Body, Label } from './Typography_Advanced';

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  iconOnly?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
  testID?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconOnly = false,
  fullWidth = false,
  style,
  textStyle,
  loadingText,
  testID,
  onPress,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  // Configuration des tailles
  const sizeConfig = {
    xs: {
      paddingVertical: SEMANTIC_SPACING.xs,
      paddingHorizontal: SEMANTIC_SPACING.sm,
      fontSize: TYPOGRAPHY.fontSize.xs,
      iconSize: 14,
      minHeight: 28,
    },
    sm: {
      paddingVertical: SEMANTIC_SPACING.sm,
      paddingHorizontal: SEMANTIC_SPACING.md,
      fontSize: TYPOGRAPHY.fontSize.sm,
      iconSize: 16,
      minHeight: 32,
    },
    md: {
      paddingVertical: SEMANTIC_SPACING.md,
      paddingHorizontal: SEMANTIC_SPACING.lg,
      fontSize: TYPOGRAPHY.fontSize.base,
      iconSize: 18,
      minHeight: 40,
    },
    lg: {
      paddingVertical: SEMANTIC_SPACING.lg,
      paddingHorizontal: SEMANTIC_SPACING.xl,
      fontSize: TYPOGRAPHY.fontSize.md,
      iconSize: 20,
      minHeight: 48,
    },
    xl: {
      paddingVertical: SEMANTIC_SPACING.xl,
      paddingHorizontal: SEMANTIC_SPACING['2xl'],
      fontSize: TYPOGRAPHY.fontSize.lg,
      iconSize: 24,
      minHeight: 56,
    },
  };

  const config = sizeConfig[size];

  // Configuration des variantes
  const getVariantStyles = () => {
    const isPressed = false; // Sera géré par le state du Pressable
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled 
            ? colors.interactiveDisabled 
            : isPressed 
              ? colors.interactivePressed 
              : colors.interactive,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: disabled ? undefined : SHADOWS.sm,
        };
        
      case 'secondary':
        return {
          backgroundColor: disabled 
            ? colors.backgroundTertiary 
            : isPressed 
              ? colors.backgroundTertiary 
              : colors.backgroundSecondary,
          borderColor: colors.border,
          borderWidth: 1,
          textColor: disabled ? colors.textMuted : colors.text,
          shadow: undefined,
        };
        
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? colors.borderLight : colors.interactive,
          borderWidth: 1,
          textColor: disabled ? colors.textMuted : colors.interactive,
          shadow: undefined,
        };
        
      case 'ghost':
        return {
          backgroundColor: isPressed ? colors.backgroundTertiary : 'transparent',
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: disabled ? colors.textMuted : colors.interactive,
          shadow: undefined,
        };
        
      case 'destructive':
        return {
          backgroundColor: disabled 
            ? colors.interactiveDisabled 
            : isPressed 
              ? colors.errorDark 
              : colors.error,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: disabled ? undefined : SHADOWS.sm,
        };
        
      case 'success':
        return {
          backgroundColor: disabled 
            ? colors.interactiveDisabled 
            : isPressed 
              ? colors.successDark 
              : colors.success,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: disabled ? undefined : SHADOWS.sm,
        };
        
      case 'warning':
        return {
          backgroundColor: disabled 
            ? colors.interactiveDisabled 
            : isPressed 
              ? colors.warningDark 
              : colors.warning,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: disabled ? undefined : SHADOWS.sm,
        };
        
      case 'info':
        return {
          backgroundColor: disabled 
            ? colors.interactiveDisabled 
            : isPressed 
              ? colors.infoDark 
              : colors.info,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: disabled ? undefined : SHADOWS.sm,
        };
        
      default:
        return {
          backgroundColor: colors.interactive,
          borderColor: 'transparent',
          borderWidth: 1,
          textColor: colors.textInverted,
          shadow: SHADOWS.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Styles du bouton
  const buttonStyles: ViewStyle = {
    ...config,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: config.minHeight,
    opacity: disabled && !loading ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    ...(variantStyles.shadow || {}),
  };

  // Styles du texte
  const textStyles: TextStyle = {
    fontSize: config.fontSize,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: variantStyles.textColor,
    textAlign: 'center',
  };

  // Contenu du bouton
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variantStyles.textColor}
            style={loadingText ? styles.loadingSpinner : undefined}
          />
          {loadingText && (
            <Label style={[textStyles, styles.loadingText]}>
              {loadingText}
            </Label>
          )}
        </View>
      );
    }

    if (iconOnly && (leftIcon || rightIcon)) {
      const iconName = leftIcon || rightIcon;
      return (
        <Ionicons 
          name={iconName!} 
          size={config.iconSize} 
          color={variantStyles.textColor} 
        />
      );
    }

    const displayText = children || title;

    return (
      <View style={styles.contentContainer}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={config.iconSize} 
            color={variantStyles.textColor}
            style={styles.leftIcon}
          />
        )}
        
        {displayText && (
          <Body style={[textStyles, textStyle]}>
            {displayText}
          </Body>
        )}
        
        {rightIcon && (
          <Ionicons 
            name={rightIcon} 
            size={config.iconSize} 
            color={variantStyles.textColor}
            style={styles.rightIcon}
          />
        )}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ 
        disabled: disabled || loading,
        busy: loading,
      }}
      accessibilityLabel={typeof children === 'string' ? children : title}
      {...props}
    >
      {renderContent()}
    </Pressable>
  );
};

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export const DestructiveButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="destructive" {...props} />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
);

export const WarningButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="warning" {...props} />
);

export const InfoButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="info" {...props} />
);

// Bouton icône seulement
export const IconButton: React.FC<ButtonProps> = (props) => (
  <Button iconOnly {...props} />
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  leftIcon: {
    marginRight: SEMANTIC_SPACING.sm,
  },
  
  rightIcon: {
    marginLeft: SEMANTIC_SPACING.sm,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingSpinner: {
    marginRight: SEMANTIC_SPACING.sm,
  },
  
  loadingText: {
    // Style sera appliqué via textStyles
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default Button;