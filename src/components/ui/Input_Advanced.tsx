/**
 * Input Component Avancé - Système d'inputs complet avec Design Tokens
 * Variants, validation, états et types d'input flexibles
 */

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { RADIUS, SEMANTIC_SPACING, TYPOGRAPHY } from '../../design-system/tokens';
import { Body, Label } from './Typography_Advanced';

// ============================================================================
// TYPES
// ============================================================================

export type InputVariant = 'default' | 'outlined' | 'filled' | 'underlined';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'focused' | 'error' | 'success' | 'disabled';

export interface InputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export interface BaseInputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  // Apparence
  variant?: InputVariant;
  size?: InputSize;
  
  // Contenu
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  
  // Icônes
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  
  // États
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  
  // Validation
  validate?: (value: string) => string | undefined;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  
  // Styles
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  
  // Comportement
  clearable?: boolean;
  onClear?: () => void;
  
  // Types spéciaux
  password?: boolean;
  multiline?: boolean;
  
  // Accessibilité
  testID?: string;
}

export interface InputProps extends BaseInputProps {}

// ============================================================================
// UTILITAIRES
// ============================================================================

const getSizeConfig = (size: InputSize) => {
  switch (size) {
    case 'sm':
      return {
        height: 36,
        paddingHorizontal: SEMANTIC_SPACING.sm,
        paddingVertical: SEMANTIC_SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.sm,
        iconSize: 16,
      };
    case 'md':
      return {
        height: 44,
        paddingHorizontal: SEMANTIC_SPACING.md,
        paddingVertical: SEMANTIC_SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.base,
        iconSize: 20,
      };
    case 'lg':
      return {
        height: 52,
        paddingHorizontal: SEMANTIC_SPACING.lg,
        paddingVertical: SEMANTIC_SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        iconSize: 24,
      };
    default:
      return getSizeConfig('md');
  }
};

// ============================================================================
// HOOKS
// ============================================================================

const useInputAnimation = () => {
  const labelAnimation = useRef(new Animated.Value(0)).current;
  const borderAnimation = useRef(new Animated.Value(0)).current;

  const animateToFocused = () => {
    Animated.parallel([
      Animated.timing(labelAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateToBlurred = (hasValue: boolean) => {
    Animated.parallel([
      Animated.timing(labelAnimation, {
        toValue: hasValue ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return {
    labelAnimation,
    borderAnimation,
    animateToFocused,
    animateToBlurred,
  };
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const Input = forwardRef<InputRef, InputProps>(({
  // Apparence
  variant = 'default',
  size = 'md',
  
  // Contenu
  label,
  placeholder,
  helperText,
  errorText,
  successText,
  value,
  
  // Icônes
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  
  // États
  error = false,
  success = false,
  disabled = false,
  required = false,
  
  // Validation
  validate,
  validateOnBlur = false,
  validateOnChange = false,
  
  // Styles
  containerStyle,
  inputStyle,
  labelStyle,
  
  // Comportement
  clearable = false,
  onClear,
  password = false,
  multiline = false,
  
  // Events
  onChangeText,
  onFocus,
  onBlur,
  
  // Accessibilité
  testID,
  
  ...props
}, ref) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationError, setValidationError] = useState<string>();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const sizeConfig = getSizeConfig(size);
  const { 
    labelAnimation, 
    borderAnimation, 
    animateToFocused, 
    animateToBlurred 
  } = useInputAnimation();

  // Expose des méthodes via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => {
      setInternalValue('');
      onChangeText?.('');
      onClear?.();
    },
    isFocused: () => isFocused,
  }));

  // État courant de l'input
  const getCurrentState = (): InputState => {
    if (disabled) return 'disabled';
    if (error || validationError) return 'error';
    if (success) return 'success';
    if (isFocused) return 'focused';
    return 'default';
  };

  const currentState = getCurrentState();
  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue.length > 0;

  // Validation
  const performValidation = (text: string) => {
    if (validate) {
      const errorMessage = validate(text);
      setValidationError(errorMessage);
      return !errorMessage;
    }
    return true;
  };

  // Handlers
  const handleChangeText = (text: string) => {
    setInternalValue(text);
    onChangeText?.(text);
    
    if (validateOnChange) {
      performValidation(text);
    }
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateToFocused();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    animateToBlurred(hasValue);
    
    if (validateOnBlur) {
      performValidation(currentValue);
    }
    
    onBlur?.(e);
  };

  const handleClear = () => {
    setInternalValue('');
    onChangeText?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Styles selon variante et état
  const getVariantStyles = () => {
    const baseStyle: ViewStyle = {
      borderRadius: RADIUS.md,
      minHeight: multiline ? sizeConfig.height * 2 : sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      paddingVertical: sizeConfig.paddingVertical,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: isFocused ? 2 : 1,
          borderColor: getStateColor(),
          backgroundColor: 'transparent',
        };
        
      case 'filled':
        return {
          ...baseStyle,
          borderWidth: 0,
          borderBottomWidth: isFocused ? 2 : 1,
          borderBottomColor: getStateColor(),
          backgroundColor: colors.backgroundSecondary,
          borderRadius: RADIUS.md,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
        
      case 'underlined':
        return {
          ...baseStyle,
          borderWidth: 0,
          borderBottomWidth: isFocused ? 2 : 1,
          borderBottomColor: getStateColor(),
          backgroundColor: 'transparent',
          borderRadius: 0,
          paddingHorizontal: 0,
        };
        
      default:
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: getStateColor(),
          backgroundColor: colors.background,
        };
    }
  };

  const getStateColor = () => {
    switch (currentState) {
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'focused':
        return colors.interactive;
      case 'disabled':
        return colors.borderLight;
      default:
        return colors.border;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    return colors.text;
  };

  // Message à afficher
  const getDisplayMessage = () => {
    if (validationError) return { text: validationError, color: colors.error };
    if (errorText) return { text: errorText, color: colors.error };
    if (successText) return { text: successText, color: colors.success };
    if (helperText) return { text: helperText, color: colors.textSecondary };
    return null;
  };

  const displayMessage = getDisplayMessage();

  // Icônes à droite
  const getRightIcons = () => {
    const icons: React.ReactNode[] = [];

    // Bouton clear
    if (clearable && hasValue && !disabled) {
      icons.push(
        <TouchableOpacity
          key="clear"
          onPress={handleClear}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name="close-circle" 
            size={sizeConfig.iconSize} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      );
    }

    // Bouton password toggle
    if (password) {
      icons.push(
        <TouchableOpacity
          key="password-toggle"
          onPress={togglePasswordVisibility}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name={isPasswordVisible ? "eye-off" : "eye"} 
            size={sizeConfig.iconSize} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      );
    }

    // Icône custom à droite
    if (rightIcon && !clearable && !password) {
      icons.push(
        <TouchableOpacity
          key="right-icon"
          onPress={onRightIconPress}
          style={styles.iconButton}
          disabled={!onRightIconPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name={rightIcon} 
            size={sizeConfig.iconSize} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      );
    }

    return icons;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Label style={[
            styles.label,
            { color: currentState === 'error' ? colors.error : colors.textSecondary },
            labelStyle
          ]}>
            {label}
            {required && <Body style={{ color: colors.error }}>*</Body>}
          </Label>
        </View>
      )}

      {/* Input Container */}
      <View style={[
        getVariantStyles(),
        disabled && styles.disabled,
        styles.inputContainer
      ]}>
        {/* Icône gauche */}
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftIconPress}
            style={styles.leftIcon}
            disabled={!onLeftIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons 
              name={leftIcon} 
              size={sizeConfig.iconSize} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        )}

        {/* TextInput */}
        <TextInput
          ref={inputRef}
          value={currentValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && !isPasswordVisible}
          multiline={multiline}
          editable={!disabled}
          style={[
            styles.textInput,
            {
              fontSize: sizeConfig.fontSize,
              color: getTextColor(),
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle
          ]}
          {...props}
        />

        {/* Icônes droite */}
        <View style={styles.rightIcons}>
          {getRightIcons()}
        </View>
      </View>

      {/* Message d'aide/erreur */}
      {displayMessage && (
        <Body style={[
          styles.helperText,
          { color: displayMessage.color }
        ]}>
          {displayMessage.text}
        </Body>
      )}
    </View>
  );
});

Input.displayName = 'Input';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

export const OutlinedInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input variant="outlined" {...props} />
);

export const FilledInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input variant="filled" {...props} />
);

export const UnderlinedInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input variant="underlined" {...props} />
);

export const PasswordInput: React.FC<Omit<InputProps, 'password'>> = (props) => (
  <Input password {...props} />
);

export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'>> = (props) => (
  <Input leftIcon="search" clearable {...props} />
);

export const TextArea: React.FC<Omit<InputProps, 'multiline'>> = (props) => (
  <Input multiline {...props} />
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: SEMANTIC_SPACING.xs,
  },
  
  labelContainer: {
    marginBottom: SEMANTIC_SPACING.xs,
  },
  
  label: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: undefined, // Laisse RN gérer la hauteur de ligne
  },
  
  leftIcon: {
    marginRight: SEMANTIC_SPACING.sm,
  },
  
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SEMANTIC_SPACING.sm,
  },
  
  iconButton: {
    padding: SEMANTIC_SPACING.xs,
    marginLeft: SEMANTIC_SPACING.xs,
  },
  
  helperText: {
    marginTop: SEMANTIC_SPACING.xs,
    marginLeft: SEMANTIC_SPACING.xs,
  },
  
  disabled: {
    opacity: 0.6,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default Input;