/**
 * Typography Components Avancés - Système de texte complet avec Design Tokens
 * Composants typographiques cohérents et réutilisables
 */

import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { TYPOGRAPHY } from '../../design-system/tokens';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseTypographyProps extends TextProps {
  children: React.ReactNode;
  color?: string;
  size?: keyof typeof TYPOGRAPHY.fontSize;
  weight?: keyof typeof TYPOGRAPHY.fontWeight;
  align?: 'left' | 'center' | 'right' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  variant?: 'primary' | 'secondary' | 'muted' | 'inverted' | 'error' | 'success' | 'warning' | 'info';
  responsive?: boolean;
}

export interface HeadingProps extends BaseTypographyProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

// ============================================================================
// COMPOSANT DE BASE
// ============================================================================

const BaseText: React.FC<BaseTypographyProps> = ({
  children,
  style,
  color,
  size = 'base',
  weight = 'regular',
  align = 'left',
  transform = 'none',
  variant,
  responsive = false,
  ...props
}) => {
  const { colors } = useTheme();

  // Déterminer la couleur basée sur la variante
  const getTextColor = (): string => {
    if (color) return color;
    
    switch (variant) {
      case 'primary':
        return colors.text;
      case 'secondary':
        return colors.textSecondary;
      case 'muted':
        return colors.textMuted;
      case 'inverted':
        return colors.textInverted;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.text;
    }
  };

  const textStyles = [
    styles.base,
    {
      fontSize: TYPOGRAPHY.fontSize[size],
      fontWeight: TYPOGRAPHY.fontWeight[weight],
      color: getTextColor(),
      textAlign: align,
      textTransform: transform,
    },
    responsive && styles.responsive,
    style,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

// ============================================================================
// COMPOSANTS TYPOGRAPHIQUES
// ============================================================================

// Titres hiérarchiques
export const Display: React.FC<BaseTypographyProps> = ({ weight = 'bold', size = '6xl', ...props }) => (
  <BaseText weight={weight} size={size} {...props} />
);

export const Heading: React.FC<HeadingProps> = ({ level = 1, weight = 'semibold', ...props }) => {
  const sizeMap = {
    1: '5xl' as const,
    2: '4xl' as const,
    3: '3xl' as const,
    4: '2xl' as const,
    5: 'xl' as const,
    6: 'lg' as const,
  };

  return (
    <BaseText 
      size={sizeMap[level]} 
      weight={weight}
      accessibilityRole="header"
      {...props} 
    />
  );
};

export const H1: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={1} {...props} />
);

export const H2: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={2} {...props} />
);

export const H3: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={3} {...props} />
);

export const H4: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={4} {...props} />
);

export const H5: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={5} {...props} />
);

export const H6: React.FC<BaseTypographyProps> = (props) => (
  <Heading level={6} {...props} />
);

// Texte de contenu
export const Title: React.FC<BaseTypographyProps> = ({ 
  size = 'lg', 
  weight = 'semibold',
  variant = 'primary',
  ...props 
}) => (
  <BaseText size={size} weight={weight} variant={variant} {...props} />
);

export const Body: React.FC<BaseTypographyProps> = ({ 
  size = 'base', 
  weight = 'regular',
  variant = 'primary',
  ...props 
}) => (
  <BaseText size={size} weight={weight} variant={variant} {...props} />
);

export const BodyLarge: React.FC<BaseTypographyProps> = ({ 
  size = 'md', 
  weight = 'regular',
  ...props 
}) => (
  <BaseText size={size} weight={weight} {...props} />
);

export const BodySmall: React.FC<BaseTypographyProps> = ({ 
  size = 'sm', 
  weight = 'regular',
  ...props 
}) => (
  <BaseText size={size} weight={weight} {...props} />
);

export const Caption: React.FC<BaseTypographyProps> = ({ 
  size = 'sm', 
  weight = 'regular',
  variant = 'secondary',
  ...props 
}) => (
  <BaseText size={size} weight={weight} variant={variant} {...props} />
);

export const Label: React.FC<BaseTypographyProps> = ({ 
  size = 'sm', 
  weight = 'medium',
  variant = 'secondary',
  ...props 
}) => (
  <BaseText size={size} weight={weight} variant={variant} {...props} />
);

export const Overline: React.FC<BaseTypographyProps> = ({ 
  size = 'xs', 
  weight = 'medium',
  transform = 'uppercase',
  variant = 'muted',
  ...props 
}) => (
  <BaseText size={size} weight={weight} transform={transform} variant={variant} {...props} />
);

// Texte spécialisé
export const Code: React.FC<BaseTypographyProps> = ({ 
  size = 'sm',
  weight = 'regular',
  style,
  ...props 
}) => {
  const { colors } = useTheme();
  
  return (
    <BaseText 
      size={size} 
      weight={weight}
      style={[
        {
          fontFamily: TYPOGRAPHY.fontFamily.mono,
          backgroundColor: colors.backgroundTertiary,
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4,
        },
        style,
      ]}
      {...props} 
    />
  );
};

export const Link: React.FC<BaseTypographyProps> = ({ 
  variant = 'primary',
  weight = 'medium',
  style,
  ...props 
}) => {
  const { colors } = useTheme();
  
  return (
    <BaseText 
      variant={variant}
      weight={weight}
      style={[
        {
          color: colors.interactive,
          textDecorationLine: 'underline',
        },
        style,
      ]}
      {...props} 
    />
  );
};

// ============================================================================
// COMPOSANTS AVEC ÉTATS
// ============================================================================

export const ErrorText: React.FC<BaseTypographyProps> = ({ 
  variant = 'error',
  size = 'sm',
  ...props 
}) => (
  <BaseText variant={variant} size={size} {...props} />
);

export const SuccessText: React.FC<BaseTypographyProps> = ({ 
  variant = 'success',
  size = 'sm',
  ...props 
}) => (
  <BaseText variant={variant} size={size} {...props} />
);

export const WarningText: React.FC<BaseTypographyProps> = ({ 
  variant = 'warning',
  size = 'sm',
  ...props 
}) => (
  <BaseText variant={variant} size={size} {...props} />
);

export const InfoText: React.FC<BaseTypographyProps> = ({ 
  variant = 'info',
  size = 'sm',
  ...props 
}) => (
  <BaseText variant={variant} size={size} {...props} />
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  base: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
  },
  
  responsive: {
    // Styles responsive peuvent être ajoutés ici
    // Pour l'instant, conserve les tailles fixes
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Export par défaut pour rétrocompatibilité
export default {
  Display,
  Heading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Title,
  Body,
  BodyLarge,
  BodySmall,
  Caption,
  Label,
  Overline,
  Code,
  Link,
  ErrorText,
  SuccessText,
  WarningText,
  InfoText,
};

// Exports individuels
export {
    BaseText
};
