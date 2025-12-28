/**
 * AlertMessage - Composant moderne pour afficher les messages d'alerte
 * Supporte différents types: success, error, warning, info
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
}

const AlertMessage: React.FC<AlertMessageProps> = ({
    type,
    title,
    message,
    visible,
    onDismiss,
    autoHide = true,
    duration = 4000,
}) => {
    const { colors } = useTheme();

    React.useEffect(() => {
        if (visible && autoHide && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, autoHide, onDismiss, duration]);

    if (!visible) return null;

    const getAlertColors = () => {
        switch (type) {
            case 'success':
                return {
                    background: colors.success + '15',
                    border: colors.success,
                    text: colors.success,
                    icon: '✓',
                };
            case 'error':
                return {
                    background: colors.error + '15',
                    border: colors.error,
                    text: colors.error,
                    icon: '✕',
                };
            case 'warning':
                return {
                    background: colors.warning + '15',
                    border: colors.warning,
                    text: colors.warning,
                    icon: '⚠',
                };
            case 'info':
            default:
                return {
                    background: colors.info + '15',
                    border: colors.info,
                    text: colors.info,
                    icon: 'ℹ',
                };
        }
    };

    const alertColors = getAlertColors();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: alertColors.background,
                borderColor: alertColors.border,
            }
        ]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: alertColors.border }]}>
                    <Text style={[styles.icon, { color: colors.background }]}>
                        {alertColors.icon}
                    </Text>
                </View>
                
                <View style={styles.textContainer}>
                    {title && (
                        <Text style={[styles.title, { color: alertColors.text }]}>
                            {title}
                        </Text>
                    )}
                    <Text style={[styles.message, { color: colors.text }]}>
                        {message}
                    </Text>
                </View>
            </View>

            {onDismiss && (
                <Pressable onPress={onDismiss} style={styles.dismissButton}>
                    <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
                        ✕
                    </Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginVertical: DESIGN_TOKENS.spacing.sm,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: DESIGN_TOKENS.spacing.sm,
    },
    icon: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
        paddingTop: 2,
    },
    title: {
        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
        marginBottom: 2,
    },
    message: {
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
    },
    dismissButton: {
        position: 'absolute',
        top: DESIGN_TOKENS.spacing.sm,
        right: DESIGN_TOKENS.spacing.sm,
        padding: DESIGN_TOKENS.spacing.xs,
    },
    dismissText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AlertMessage;