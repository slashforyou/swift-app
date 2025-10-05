/**
 * Button Component - Conforme aux meilleures pratiques UI mobiles
 * Touch targets ≥48pt, hitSlop 8, états focus/pressed visibles
 * Radius 8, hauteur standardisée
 */

import React from 'react';
import { Pressable, Text, PressableProps, ViewStyle, TextStyle } from 'react-native';
import { useCommonThemedStyles, DESIGN_TOKENS } from '../../constants/Styles';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  ...props
}) => {
  const styles = useCommonThemedStyles();
  
  const buttonStyle = variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary;
  const buttonTextStyle = variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary;
  
  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.5 },
        style
      ]}
      disabled={disabled}
      hitSlop={{
        top: DESIGN_TOKENS.touch.hitSlop,
        bottom: DESIGN_TOKENS.touch.hitSlop,
        left: DESIGN_TOKENS.touch.hitSlop,
        right: DESIGN_TOKENS.touch.hitSlop,
      }}
      {...props}
    >
      <Text style={[styles.buttonText, buttonTextStyle, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

export default Button;