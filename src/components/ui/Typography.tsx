/**
 * Typography Components - Design System Unifié
 * Hiérarchie typographique complète avec thématisation automatique
 * Utilise le design system centralisé pour cohérence totale
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { DESIGN_TOKENS, useTheme } from '../../design-system';

export interface TypographyProps extends Omit<TextProps, 'style'> {
  variant?: keyof typeof DESIGN_TOKENS.typography;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  
  const typographyStyle = DESIGN_TOKENS.typography[variant];
  const textColor = color || colors.text;
  
  return (
    <Text
      style={[
        {
          ...typographyStyle,
          color: textColor,
        },
        style,
      ]}
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

// Composants spécialisés pour usage simplifié
export const Display: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="display" {...props} />
);

export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Title: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="title" {...props} />
);

export const Subtitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="subtitle" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodyLarge" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodySmall" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
);

// Hook pour obtenir les styles de typography
export const useTypography = () => {
  const { colors } = useTheme();
  
  const getTypographyStyle = (variant: keyof typeof DESIGN_TOKENS.typography, color?: string) => ({
    ...DESIGN_TOKENS.typography[variant],
    color: color || colors.text,
    allowFontScaling: true,
  });
  
  return {
    typography: DESIGN_TOKENS.typography,
    getTypographyStyle,
  };
};

export default Typography;