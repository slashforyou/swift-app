/**
 * Toast - Composant de notification toast pour feedbacks utilisateur
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    visible: boolean;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({
    visible,
    type,
    title,
    message,
    duration = 3000,
    onHide
}) => {
    const { colors } = useTheme();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animation d'entrée
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-hide après la durée spécifiée
            const timer = setTimeout(() => {
                // Utiliser requestAnimationFrame pour éviter useInsertionEffect warning
                requestAnimationFrame(() => {
                    hideToast();
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    const hideToast = () => {
        // Utiliser requestAnimationFrame pour éviter useInsertionEffect warning
        requestAnimationFrame(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide();
            });
        });
    };

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: colors.success,
                    icon: 'checkmark-circle',
                    iconColor: colors.background,
                };
            case 'error':
                return {
                    backgroundColor: colors.error,
                    icon: 'alert-circle',
                    iconColor: colors.background,
                };
            case 'warning':
                return {
                    backgroundColor: colors.warning,
                    icon: 'warning',
                    iconColor: colors.background,
                };
            case 'info':
                return {
                    backgroundColor: colors.info,
                    icon: 'information-circle',
                    iconColor: colors.background,
                };
            default:
                return {
                    backgroundColor: colors.primary,
                    icon: 'information-circle',
                    iconColor: colors.background,
                };
        }
    };

    const config = getToastConfig();

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            top: 50,
            left: DESIGN_TOKENS.spacing.md,
            right: DESIGN_TOKENS.spacing.md,
            zIndex: 9999,
        },
        toast: {
            backgroundColor: config.backgroundColor,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 60,
            shadowColor: colors.text,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        iconContainer: {
            marginRight: DESIGN_TOKENS.spacing.md,
        },
        textContainer: {
            flex: 1,
        },
        title: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.background,
            marginBottom: message ? 2 : 0,
        },
        message: {
            fontSize: 14,
            color: colors.background,
            opacity: 0.9,
        },
        closeButton: {
            marginLeft: DESIGN_TOKENS.spacing.sm,
            padding: DESIGN_TOKENS.spacing.xs,
        },
    });

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.toast,
                    {
                        transform: [{ translateY }],
                        opacity,
                    },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={config.icon as any}
                        size={24}
                        color={config.iconColor}
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {message && (
                        <Text style={styles.message}>{message}</Text>
                    )}
                </View>

                <Pressable
                    style={styles.closeButton}
                    onPress={hideToast}
                >
                    <Ionicons
                        name="close"
                        size={20}
                        color={colors.background}
                    />
                </Pressable>
            </Animated.View>
        </View>
    );
};

export default Toast;