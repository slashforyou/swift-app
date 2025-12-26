/**
 * Card Component Avancé - Système de cartes avec Design Tokens
 * Variants, élévations, interactions et layouts flexibles
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ImageBackground,
    ImageSourcePropType,
    Pressable,
    PressableProps,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { RADIUS, SEMANTIC_SPACING, SHADOWS } from '../../design-system/tokens';

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 
  | 'default' 
  | 'elevated' 
  | 'outlined' 
  | 'filled'
  | 'interactive'
  | 'glass'
  | 'gradient';

export type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseCardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  margin?: CardPadding;
  borderRadius?: keyof typeof RADIUS | number;
  shadow?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export interface StaticCardProps extends BaseCardProps {
  interactive?: false;
}

export interface InteractiveCardProps extends BaseCardProps, Omit<PressableProps, 'style' | 'children'> {
  interactive: true;
  onPress?: () => void;
  disabled?: boolean;
}

export interface GradientCardProps extends BaseCardProps {
  variant: 'gradient';
  gradientColors: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export interface ImageCardProps extends BaseCardProps {
  backgroundImage: ImageSourcePropType;
  imageStyle?: ViewStyle;
}

export type CardProps = 
  | StaticCardProps 
  | InteractiveCardProps 
  | GradientCardProps 
  | ImageCardProps;

// ============================================================================
// UTILITAIRES
// ============================================================================

const getPaddingValue = (padding: CardPadding): number => {
  switch (padding) {
    case 'none': return 0;
    case 'xs': return SEMANTIC_SPACING.xs;
    case 'sm': return SEMANTIC_SPACING.sm;
    case 'md': return SEMANTIC_SPACING.md;
    case 'lg': return SEMANTIC_SPACING.lg;
    case 'xl': return SEMANTIC_SPACING.xl;
    default: return SEMANTIC_SPACING.md;
  }
};

const getBorderRadius = (borderRadius?: keyof typeof RADIUS | number): number => {
  if (typeof borderRadius === 'number') return borderRadius;
  if (borderRadius && RADIUS[borderRadius]) return RADIUS[borderRadius];
  return RADIUS.md;
};

// ============================================================================
// HOOKS
// ============================================================================

const useCardStyles = (props: CardProps) => {
  const { colors, isDark } = useTheme();
  const {
    variant = 'default',
    padding = 'md',
    margin = 'none',
    borderRadius = 'md',
    shadow = false,
    style,
  } = props;

  // Styles de base
  const baseStyles: ViewStyle = {
    borderRadius: getBorderRadius(borderRadius),
    padding: getPaddingValue(padding),
    margin: getPaddingValue(margin),
    overflow: 'hidden',
  };

  // Styles selon la variante
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.background,
          borderWidth: 0,
        };

      case 'elevated':
        return {
          backgroundColor: colors.background,
          ...SHADOWS.md,
          borderWidth: 0,
        };

      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };

      case 'filled':
        return {
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 0,
        };

      case 'interactive':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...SHADOWS.sm,
        };

      case 'glass':
        return {
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.1)',
        };

      case 'gradient':
        return {
          borderWidth: 0,
        };

      default:
        return {
          backgroundColor: colors.background,
          borderWidth: 0,
        };
    }
  };

  // Application du shadow si demandé
  const shadowStyles = shadow && variant !== 'elevated' ? SHADOWS.sm : {};

  return StyleSheet.create({
    card: {
      ...baseStyles,
      ...getVariantStyles(),
      ...shadowStyles,
      ...style,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.6,
    },
  });
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const Card: React.FC<CardProps> = (props) => {
  const styles = useCardStyles(props);

  // Card avec gradient
  if (props.variant === 'gradient' && 'gradientColors' in props) {
    const {
      children,
      gradientColors,
      gradientStart = { x: 0, y: 0 },
      gradientEnd = { x: 1, y: 1 },
      testID,
      ...restProps
    } = props as GradientCardProps;

    return (
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        style={styles.card}
        testID={testID}
      >
        {children}
      </LinearGradient>
    );
  }

  // Card avec image de fond
  if ('backgroundImage' in props) {
    const {
      children,
      backgroundImage,
      imageStyle,
      testID,
      ...restProps
    } = props as ImageCardProps;

    return (
      <ImageBackground
        source={backgroundImage}
        style={[styles.card, imageStyle]}
        imageStyle={{ borderRadius: getBorderRadius(props.borderRadius) }}
        testID={testID}
      >
        {children}
      </ImageBackground>
    );
  }

  // Card interactive
  if (props.interactive) {
    const {
      children,
      onPress,
      disabled = false,
      testID,
      interactive,
      variant,
      padding,
      margin,
      borderRadius,
      shadow,
      style,
      ...restProps
    } = props as InteractiveCardProps;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...restProps}
      >
        {children}
      </Pressable>
    );
  }

  // Card statique (par défaut)
  const { children, testID } = props as StaticCardProps;

  return (
    <View style={styles.card} testID={testID}>
      {children}
    </View>
  );
};

// ============================================================================
// COMPOSANTS DE LAYOUT POUR CARD
// ============================================================================

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[cardStyles.header, style]}>
    {children}
  </View>
);

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[cardStyles.content, style]}>
    {children}
  </View>
);

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[cardStyles.footer, style]}>
    {children}
  </View>
);

export interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

export const CardActions: React.FC<CardActionsProps> = ({ 
  children, 
  align = 'right',
  style 
}) => {
  const justifyContent = align === 'left' ? 'flex-start' 
                       : align === 'center' ? 'center' 
                       : 'flex-end';

  return (
    <View style={[cardStyles.actions, { justifyContent }, style]}>
      {children}
    </View>
  );
};

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="elevated" {...props} />
);

export const OutlinedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="outlined" {...props} />
);

export const FilledCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="filled" {...props} />
);

export const InteractiveCard: React.FC<Omit<InteractiveCardProps, 'variant' | 'interactive'>> = (props) => (
  <Card variant="interactive" interactive {...props} />
);

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="glass" {...props} />
);

export const GradientCard: React.FC<Omit<GradientCardProps, 'variant'>> = (props) => (
  <Card variant="gradient" {...props} />
);

// ============================================================================
// STYLES POUR LAYOUTS
// ============================================================================

const cardStyles = StyleSheet.create({
  header: {
    marginBottom: SEMANTIC_SPACING.md,
  },
  
  content: {
    flex: 1,
  },
  
  footer: {
    marginTop: SEMANTIC_SPACING.md,
    paddingTop: SEMANTIC_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SEMANTIC_SPACING.sm,
    marginTop: SEMANTIC_SPACING.md,
  },
});// ============================================================================
// EXPORTS
// ============================================================================

export default Card;