/**
 * AlertMessage - Composant moderne pour afficher les messages d'alerte
 * Supporte différents types: success, error, warning, info
 * Avec animations et styles améliorés pour une meilleure UX
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface AlertMessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    visible: boolean;
    onDismiss?: () => void;
    autoHide?: boolean;
    duration?: number;
    /** Style amélioré pour les erreurs critiques */
    prominent?: boolean;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
    type,
    title,
    message,
    visible,
    onDismiss,
    autoHide = true,
    duration = 4000,
    prominent = false,
}) => {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Animation d'entrée
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Shake animation pour les erreurs
            if (type === 'error' && prominent) {
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]).start();
            }
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.95);
        }
    }, [visible, type, prominent, fadeAnim, scaleAnim, shakeAnim]);

    useEffect(() => {
        if (visible && autoHide && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, autoHide, onDismiss, duration]);

    if (!visible) return null;

    const getAlertColors = () => {
        const isProminent = prominent || type === 'error';
        
        switch (type) {
            case 'success':
                return {
                    background: colors.success + '20',
                    border: colors.success,
                    text: colors.success,
                    icon: '✓',
                    iconBg: colors.success,
                };
            case 'error':
                return {
                    background: isProminent ? colors.error + '25' : colors.error + '15',
                    border: colors.error,
                    text: colors.error,
                    icon: '✕',
                    iconBg: colors.error,
                };
            case 'warning':
                return {
                    background: colors.warning + '20',
                    border: colors.warning,
                    text: colors.warning,
                    icon: '⚠',
                    iconBg: colors.warning,
                };
            case 'info':
            default:
                return {
                    background: colors.info + '20',
                    border: colors.info,
                    text: colors.info,
                    icon: 'ℹ',
                    iconBg: colors.info,
                };
        }
    };

    const alertColors = getAlertColors();
    const isError = type === 'error';

    return (
        <Animated.View 
            style={[
                styles.container,
                isError && styles.errorContainer,
                {
                    backgroundColor: alertColors.background,
                    borderColor: alertColors.border,
                    borderWidth: isError ? 2 : 1,
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateX: shakeAnim },
                    ],
                }
            ]}
        >
            <View style={styles.content}>
                <View style={[
                    styles.iconContainer, 
                    { backgroundColor: alertColors.iconBg },
                    isError && styles.errorIconContainer
                ]}>
                    <Text style={[
                        styles.icon, 
                        { color: colors.background },
                        isError && styles.errorIcon
                    ]}>
                        {alertColors.icon}
                    </Text>
                </View>
                
                <View style={styles.textContainer}>
                    {title && (
                        <Text style={[
                            styles.title, 
                            { color: alertColors.text },
                            isError && styles.errorTitle
                        ]}>
                            {title}
                        </Text>
                    )}
                    <Text style={[
                        styles.message, 
                        { color: isError ? colors.text : colors.textSecondary },
                        isError && styles.errorMessage
                    ]}>
                        {message}
                    </Text>
                </View>
            </View>

            {onDismiss && (
                <Pressable 
                    onPress={onDismiss} 
                    style={styles.dismissButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={[styles.dismissText, { color: alertColors.text }]}>
                        ✕
                    </Text>
                </Pressable>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        marginVertical: DESIGN_TOKENS.spacing.md,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    errorContainer: {
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
        marginVertical: DESIGN_TOKENS.spacing.lg,
        shadowOpacity: 0.25,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: DESIGN_TOKENS.spacing.md,
    },
    errorIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    icon: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorIcon: {
        fontSize: 18,
    },
    textContainer: {
        flex: 1,
        paddingTop: 2,
    },
    title: {
        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
        marginBottom: 4,
    },
    errorTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
    },
    message: {
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
    },
    errorMessage: {
        fontSize: 15,
        lineHeight: 22,
    },
    dismissButton: {
        position: 'absolute',
        top: DESIGN_TOKENS.spacing.sm,
        right: DESIGN_TOKENS.spacing.sm,
        padding: DESIGN_TOKENS.spacing.xs,
    },
    dismissText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AlertMessage;