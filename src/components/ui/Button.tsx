/**
 * Button Component - Conforme aux meilleures pratiques UI mobiles
 * Touch targets ≥48pt, hitSlop 8, états focus/pressed visibles
 * Radius 8, hauteur standardisée
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, PressableProps, Text, TextStyle, View, ViewStyle } from 'react-native';
import { DESIGN_TOKENS, useCommonThemedStyles } from '../../constants/Styles';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: string; // Nom de l'icône Ionicons
  size?: 'sm' | 'md' | 'lg' | 'large'; // Support des anciennes tailles
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  icon,
  size,
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
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={size === 'sm' ? 16 : size === 'lg' || size === 'large' ? 24 : 20} 
            color={buttonTextStyle.color} 
            style={{ marginRight: title ? 8 : 0 }}
          />
        )}
        {title && (
          <Text style={[styles.buttonText, buttonTextStyle, textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default Button;