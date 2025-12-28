/**
 * NotificationsPanel - Modal PLEIN ÉCRAN simple
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Animated, Dimensions, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen'); // 'screen' au lieu de 'window'

interface NotificationsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    notifications: Array<{
        id: string;
        title: string;
        message: string;
        time: string;
        type: 'job' | 'bonus' | 'call' | 'system';
        isRead: boolean;
    }>;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
    isVisible, 
    onClose, 
    notifications: initialNotifications 
}) => {
    const { colors } = useTheme();
    const [slideAnimation] = useState(new Animated.Value(0));
    const [notifications, setNotifications] = useState(initialNotifications);

    // Styles dynamiques basés sur le thème
    const styles = {
        modalPanel: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            overflow: 'hidden' as const,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
        },
        safeArea: {
            height: 50,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            alignItems: 'center' as const,
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },
        title: {
            fontSize: 20,
            fontWeight: '700' as const,
            color: colors.text,
        },
        closeButton: {
            padding: 8,
            borderRadius: 20,
        },
        content: {
            flex: 1,
            backgroundColor: colors.background,
        },
        emptyState: {
            padding: 40,
            alignItems: 'center' as const,
            backgroundColor: colors.background,
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center' as const,
        },
        notificationItem: {
            flexDirection: 'row' as const,
            alignItems: 'flex-start' as const,
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            position: 'relative' as const,
        },
        newBadge: {
            position: 'absolute' as const,
            top: 12,
            right: 50,
            backgroundColor: colors.success,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        newBadgeText: {
            fontSize: 10,
            fontWeight: '700' as const,
            color: colors.background,
            letterSpacing: 0.5,
        },
        notificationIcon: {
            fontSize: 24,
            marginRight: 16,
            marginTop: 2,
        },
        notificationContent: {
            flex: 1,
            paddingRight: 40,
        },
        notificationTitle: {
            fontSize: 15,
            fontWeight: '700' as const,
            color: colors.text,
            marginBottom: 4,
        },
        notificationMessage: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 6,
            lineHeight: 20,
        },
        notificationTime: {
            fontSize: 12,
            color: colors.textMuted || colors.textSecondary,
        },
        deleteButton: {
            position: 'absolute' as const,
            top: 12,
            right: 12,
            padding: 6,
            borderRadius: 15,
        },
    };

    useEffect(() => {
        if (isVisible) {
            Animated.timing(slideAnimation, {
                toValue: 1,
                duration: 400,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(slideAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [isVisible]);

    // Marquer les notifications comme lues après 3 secondes d'ouverture
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'job': return '📋';
            case 'bonus': return '⚡';
            case 'call': return '📞';
            case 'system': return '⚙️';
            default: return '📌';
        }
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    return (
        <Modal 
            visible={isVisible}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            {/* Forçons la taille absolue de l'écran */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}>
                <Pressable 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                    }}
                    onPress={onClose}
                />
                
                {/* MODAL QUI SE DÉROULE */}
                <Animated.View style={[
                    styles.modalPanel,
                    {
                        height: slideAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, SCREEN_HEIGHT * 0.9],
                        }),
                    }
                ]}>
                    {/* Safe Area */}
                    <View style={styles.safeArea} />
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🔔 Notifications</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Contenu scrollable */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Aucune notification 📭</Text>
                            </View>
                        ) : (
                            notifications.map((notif) => (
                                <View key={notif.id} style={styles.notificationItem}>
                                    {!notif.isRead && (
                                        <View style={styles.newBadge}>
                                            <Text style={styles.newBadgeText}>NOUVEAU</Text>
                                        </View>
                                    )}
                                    
                                    <Text style={styles.notificationIcon}>
                                        {getNotificationIcon(notif.type)}
                                    </Text>
                                    <View style={styles.notificationContent}>
                                        <Text style={styles.notificationTitle}>{notif.title}</Text>
                                        <Text style={styles.notificationMessage}>{notif.message}</Text>
                                        <Text style={styles.notificationTime}>{notif.time}</Text>
                                    </View>
                                    
                                    <Pressable
                                        onPress={() => removeNotification(notif.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Ionicons name="close" size={18} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};



export default NotificationsPanel;