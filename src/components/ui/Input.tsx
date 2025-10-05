/**
 * Input Component - Conforme aux meilleures pratiques UI mobiles
 * Hauteur 48pt, radius 8, borders cohérents, placeholder textMuted
 * États focus visibles, allowFontScaling
 */

import React, { useState } from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useCommonThemedStyles } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface InputProps extends Omit<TextInputProps, 'style'> {
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const styles = useCommonThemedStyles();
  const { colors } = useTheme();
  
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