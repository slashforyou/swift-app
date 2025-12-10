/**
 * Card Primitive - Conforme aux meilleures pratiques UI
 * Surface consistante avec ombre medium, radius 12, padding 16
 * Remplace les conteneurs ad hoc dans l'application
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { DESIGN_TOKENS, useCommonThemedStyles } from '../../constants/Styles';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'outlined';
  padding?: number | 'sm' | 'md' | 'lg' | 'xl' | 'xs'; // Support des tokens string et number
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding
}) => {
  const styles = useCommonThemedStyles();
  
  // Conversion du padding string en valeur numérique
  const paddingValue = typeof padding === 'string' 
    ? DESIGN_TOKENS.spacing[padding as keyof typeof DESIGN_TOKENS.spacing] || DESIGN_TOKENS.spacing.md 
    : padding;
  
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.panel, // utilise l'ombre forte
    paddingValue !== undefined && { padding: paddingValue },
    style
  ];
  
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

export default Card;