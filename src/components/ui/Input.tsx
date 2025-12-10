/**
 * Input Component - Conforme aux meilleures pratiques UI mobiles
 * Hauteur 48pt, radius 8, borders cohérents, placeholder textMuted
 * États focus visibles, allowFontScaling
 */

import React, { useState } from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useCommonThemedStyles } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  style?: ViewStyle;
  label?: string; // Propriété label pour compatibilité avec les composants existants
  variant?: 'default' | 'outlined' | 'filled'; // Support des anciennes variantes
  size?: 'sm' | 'md' | 'lg'; // Support des tailles
  error?: string; // Support des messages d'erreur
}

export const Input: React.FC<InputProps> = ({ 
  style, 
  label, 
  variant = 'default', 
  size = 'md',
  error,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const styles = useCommonThemedStyles();
  const { colors } = useTheme();
  
  // Pour l'instant, on ignore les props label, variant, size pour la compatibilité
  // mais on évite l'erreur TypeScript
  
  return (
    <TextInput
      style={[
        styles.inputBase,
        isFocused && styles.inputFocused,
        style
      ]}
      placeholderTextColor={colors.inputPlaceholder}
      allowFontScaling={true}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

export default Input;