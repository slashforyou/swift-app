/**
 * Card Primitive - Conforme aux meilleures pratiques UI
 * Surface consistante avec ombre medium, radius 12, padding 16
 * Remplace les conteneurs ad hoc dans l'application
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useCommonThemedStyles } from '../../constants/Styles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default'
}) => {
  const styles = useCommonThemedStyles();
  
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.panel, // utilise l'ombre forte
    style
  ];
  
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

export default Card;