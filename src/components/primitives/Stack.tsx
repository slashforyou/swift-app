/**
 * Stack Primitives - Conformes aux meilleures pratiques de spacing
 * Remplacent les View avec marges multiples par des gaps cohérents
 * Basés sur la grille de 8pt avec ajustements fins de 4pt
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';

interface StackProps {
  children: React.ReactNode;
  gap?: keyof typeof DESIGN_TOKENS.spacing | number;
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  style?: ViewStyle;
}

export const VStack: React.FC<StackProps> = ({
  children,
  gap = 'lg',
  align = 'stretch',
  justify = 'flex-start',
  style
}) => {
  const gapValue = typeof gap === 'string' ? DESIGN_TOKENS.spacing[gap] : gap;
  
  return (
    <View style={[
      {
        flexDirection: 'column',
        gap: gapValue,
        alignItems: align,
        justifyContent: justify,
      },
      style
    ]}>
      {children}
    </View>
  );
};

export const HStack: React.FC<StackProps> = ({
  children,
  gap = 'md',
  align = 'center',
  justify = 'flex-start',
  style
}) => {
  const gapValue = typeof gap === 'string' ? DESIGN_TOKENS.spacing[gap] : gap;
  
  return (
    <View style={[
      {
        flexDirection: 'row',
        gap: gapValue,
        alignItems: align,
        justifyContent: justify,
      },
      style
    ]}>
      {children}
    </View>
  );
};

export default { VStack, HStack };