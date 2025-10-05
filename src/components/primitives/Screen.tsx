/**
 * Screen Primitive - Conforme aux meilleures pratiques UI mobiles
 * Applique automatiquement Safe Areas + gutters horizontaux
 * Remplace les wrappers d'écran manuels
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCommonThemedStyles } from '../../constants/Styles';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'centered' | 'scroll';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  variant = 'default',
  edges = ['top', 'bottom', 'left', 'right']
}) => {
  const styles = useCommonThemedStyles();
  
  const screenStyle = [
    styles.screen,
    variant === 'centered' && styles.centerContent,
    style
  ];
  
  return (
    <SafeAreaView style={screenStyle} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

export default Screen;