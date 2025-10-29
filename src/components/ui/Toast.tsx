/**
 * Toast - Composant de notification toast pour feedbacks utilisateur
 */
import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    Animated, 
    StyleSheet,
    Dimensions,
    Pressable 
} from 'react-native';
import { useTheme } from '../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../constants/Styles';
import Ionicons from '@react-native-vector-icons/ionicons';

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
                    backgroundColor: '#10B981',
                    icon: 'checkmark-circle',
                    iconColor: '#FFFFFF',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                    icon: 'alert-circle',
                    iconColor: '#FFFFFF',
                };
            case 'warning':
                return {
                    backgroundColor: '#F59E0B',
                    icon: 'warning',
                    iconColor: '#FFFFFF',
                };
            case 'info':
                return {
                    backgroundColor: '#3B82F6',
                    icon: 'information-circle',
                    iconColor: '#FFFFFF',
                };
            default:
                return {
                    backgroundColor: colors.primary,
                    icon: 'information-circle',
                    iconColor: '#FFFFFF',
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
            shadowColor: '#000',
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
            color: '#FFFFFF',
            marginBottom: message ? 2 : 0,
        },
        message: {
            fontSize: 14,
            color: '#FFFFFF',
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
                        color="#FFFFFF"
                    />
                </Pressable>
            </Animated.View>
        </View>
    );
};

export default Toast;