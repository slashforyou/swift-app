/**
 * Toast Notification - Composant moderne avec animations fluides
 * Conforme aux normes mobiles iOS/Android - Design system intégré
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VStack, HStack } from '../primitives/Stack';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import Ionicons from '@react-native-vector-icons/ionicons';

// Types et interfaces
interface ToastProps {
    message: string;
    type: 'info' | 'success' | 'error';
    status: boolean;
}

interface ToastConfig {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    icon: string;
    iconColor: string;
}

// Configuration des types de toast
const TOAST_CONFIGS: Record<string, ToastConfig> = {
    success: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderColor: Colors.light.success,
        textColor: Colors.light.text,
        icon: 'checkmark-circle',
        iconColor: Colors.light.success,
    },
    error: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderColor: Colors.light.error,
        textColor: Colors.light.text,
        icon: 'alert-circle',
        iconColor: Colors.light.error,
    },
    info: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderColor: Colors.light.info,
        textColor: Colors.light.text,
        icon: 'information-circle',
        iconColor: Colors.light.info,
    },
};

const Toast: React.FC<ToastProps> = ({ message, type, status }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;
    
    const config = TOAST_CONFIGS[type];
    const { width: screenWidth } = Dimensions.get('window');

    // Animation simple de glissement
    useEffect(() => {
        if (status) {
            // Glissement vers le bas (entrée)
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Glissement vers le haut (sortie)
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [status]);

    if (!message) return null;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: insets.top + DESIGN_TOKENS.spacing.lg,
                left: DESIGN_TOKENS.spacing.md,
                right: DESIGN_TOKENS.spacing.md,
                zIndex: 1000,
                transform: [{ translateY }],
                pointerEvents: status ? 'auto' : 'none',
            }}
        >
            <VStack
                style={{
                    backgroundColor: config.backgroundColor,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    borderWidth: 2,
                    borderColor: config.borderColor,
                    padding: DESIGN_TOKENS.spacing.lg,
                    shadowColor: Colors.light.shadow,
                    shadowOffset: {
                        width: 0,
                        height: 4,
                    },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 8,
                    maxWidth: screenWidth - (DESIGN_TOKENS.spacing.md * 2),
                }}
            >
                <HStack gap="md" align="center">
                    {/* Icône du toast */}
                    <Ionicons 
                        name={config.icon as any} 
                        size={24} 
                        color={config.iconColor}
                        style={{ minWidth: 24 }}
                    />
                    
                    {/* Message */}
                    <VStack style={{ flex: 1 }}>
                        <Text 
                            style={{
                                color: config.textColor,
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                                fontWeight: '500',
                                flexWrap: 'wrap',
                            }}
                            numberOfLines={3}
                        >
                            {message}
                        </Text>
                    </VStack>
                </HStack>
            </VStack>
        </Animated.View>
    );
};

export default Toast;