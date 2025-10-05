/**
 * Typography Components - Conformes aux meilleures pratiques
 * Hiérarchie claire, allowFontScaling par défaut, pas de troncature
 * Line-height optimisé, retour à la ligne automatique
 */

import React from 'react';
import { Text, TextProps } from 'react-native';
import { useCommonThemedStyles } from '../../constants/Styles';

interface TypographyProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  style?: TextProps['style'];
}

export const Title: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const styles = useCommonThemedStyles();
  return (
    <Text 
      style={[styles.title, style]} 
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Subtitle: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const styles = useCommonThemedStyles();
  return (
    <Text 
      style={[styles.subtitle, style]} 
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Body: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const styles = useCommonThemedStyles();
  return (
    <Text 
      style={[styles.bodyText, style]} 
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Muted: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const styles = useCommonThemedStyles();
  return (
    <Text 
      style={[styles.mutedText, style]} 
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

export default { Title, Subtitle, Body, Muted };