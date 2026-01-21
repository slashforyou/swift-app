/**
 * ⚠️ ATTENTION - FICHIER PROTÉGÉ ⚠️
 * =================================
 * Ce composant gère le panneau des notifications avec animations fluides.
 * Avant toute modification, veuillez demander confirmation :
 * "Souhaitez-vous vraiment modifier ce fichier ?"
 * 
 * NotificationsPanel - Panneau de notifications avec slide animation
 * Supporte les modes Light et Dark
 * Utilise NotificationsProvider pour les vraies notifications
 * 
 * @author Romain Giovanni - Slashforyou
 * @lastModified 16/01/2026
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import {
    formatRelativeTime,
    NotificationType,
    useNotifications
} from '../../context/NotificationsProvider';
import { useTheme } from '../../context/ThemeProvider';
import { useTranslation } from '../../localization';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');

interface NotificationsPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
    isVisible, 
    onClose, 
}) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        removeNotification,
        clearAllNotifications,
    } = useNotifications();
    
    // Animations
    const slideAnimation = useRef(new Animated.Value(0)).current;
    const backdropAnimation = useRef(new Animated.Value(0)).current;
    
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Ouvrir avec animation
    const openPanel = useCallback(() => {
        setIsModalVisible(true);
        Animated.parallel([
            Animated.timing(backdropAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.spring(slideAnimation, {
                toValue: 1,
                friction: 8,
                tension: 65,
                useNativeDriver: true,
            }),
        ]).start();
    }, [backdropAnimation, slideAnimation]);

    // Fermer avec animation
    const closePanel = useCallback(() => {
        // Marquer tout comme lu à la fermeture
        markAllAsRead();
        
        Animated.parallel([
            Animated.timing(backdropAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.in(Easing.cubic),
            }),
            Animated.timing(slideAnimation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.in(Easing.cubic),
            }),
        ]).start(() => {
            setIsModalVisible(false);
            onClose();
        });
    }, [backdropAnimation, slideAnimation, onClose, markAllAsRead]);

    useEffect(() => {
        if (isVisible) {
            openPanel();
        }
    }, [isVisible, openPanel]);

    const getNotificationIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
        switch (type) {
            case 'job': 
                return { name: 'briefcase', color: colors.primary };
            case 'bonus': 
                return { name: 'flash', color: '#FFD700' };
            case 'call': 
                return { name: 'call', color: colors.success };
            case 'payment': 
                return { name: 'card', color: colors.success };
            case 'reminder': 
                return { name: 'alarm', color: colors.warning };
            case 'system': 
            default: 
                return { name: 'notifications', color: colors.textSecondary };
        }
    };

    const handleRemoveNotification = (id: string) => {
        removeNotification(id);
    };

    if (!isModalVisible && !isVisible) return null;

    return (
        <Modal 
            visible={isModalVisible}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            onRequestClose={closePanel}
        >
            <View style={{ flex: 1 }}>
                {/* Backdrop animé */}
                <Animated.View 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        opacity: backdropAnimation,
                    }}
                >
                    <Pressable 
                        style={{ flex: 1 }}
                        onPress={closePanel}
                    />
                </Animated.View>
                
                {/* Panel qui slide depuis le haut */}
                <Animated.View 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        maxHeight: SCREEN_HEIGHT * 0.85,
                        backgroundColor: colors.background,
                        borderBottomLeftRadius: DESIGN_TOKENS.radius.xl,
                        borderBottomRightRadius: DESIGN_TOKENS.radius.xl,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 20,
                        transform: [{
                            translateY: slideAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-SCREEN_HEIGHT * 0.85, 0],
                            }),
                        }],
                    }}
                >
                    {/* Safe Area Top */}
                    <View style={{ height: insets.top, backgroundColor: colors.background }} />
                    
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                        paddingVertical: DESIGN_TOKENS.spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="notifications" size={24} color={colors.primary} />
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: colors.text,
                            }}>
                                Notifications
                            </Text>
                            {unreadCount > 0 && (
                                <View style={{
                                    backgroundColor: colors.error,
                                    borderRadius: 12,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    minWidth: 24,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: 'white',
                                    }}>
                                        {unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        <Pressable 
                            onPress={closePanel}
                            style={({ pressed }) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                                justifyContent: 'center',
                                alignItems: 'center',
                            })}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </Pressable>
                    </View>

                    {/* Liste des notifications */}
                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={{ 
                            paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {notifications.length === 0 ? (
                            <View style={{
                                paddingVertical: DESIGN_TOKENS.spacing.xxl,
                                alignItems: 'center',
                            }}>
                                <Ionicons 
                                    name="notifications-off-outline" 
                                    size={64} 
                                    color={colors.textMuted} 
                                />
                                <Text style={{
                                    fontSize: 16,
                                    color: colors.textSecondary,
                                    marginTop: DESIGN_TOKENS.spacing.md,
                                    textAlign: 'center',
                                }}>
                                    Aucune notification
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notif, index) => {
                                const iconInfo = getNotificationIcon(notif.type);
                                
                                return (
                                    <Pressable
                                        key={notif.id}
                                        onPress={() => {
                                            // Action sur la notification
                                            console.log('📩 Notification pressed:', notif.id);
                                        }}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                            paddingVertical: DESIGN_TOKENS.spacing.md,
                                            backgroundColor: pressed 
                                                ? colors.backgroundTertiary 
                                                : !notif.isRead 
                                                    ? colors.primary + '08'
                                                    : colors.background,
                                            borderBottomWidth: index < notifications.length - 1 ? 1 : 0,
                                            borderBottomColor: colors.border,
                                        })}
                                    >
                                        {/* Icône */}
                                        <View style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            backgroundColor: iconInfo.color + '15',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: DESIGN_TOKENS.spacing.md,
                                        }}>
                                            <Ionicons 
                                                name={iconInfo.name} 
                                                size={22} 
                                                color={iconInfo.color} 
                                            />
                                        </View>
                                        
                                        {/* Contenu */}
                                        <View style={{ flex: 1, marginRight: DESIGN_TOKENS.spacing.md }}>
                                            <View style={{ 
                                                flexDirection: 'row', 
                                                alignItems: 'center', 
                                                marginBottom: 4,
                                                gap: 8,
                                            }}>
                                                <Text style={{
                                                    fontSize: 15,
                                                    fontWeight: notif.isRead ? '500' : '700',
                                                    color: colors.text,
                                                    flex: 1,
                                                }}>
                                                    {notif.title}
                                                </Text>
                                                {!notif.isRead && (
                                                    <View style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: colors.primary,
                                                    }} />
                                                )}
                                            </View>
                                            <Text style={{
                                                fontSize: 14,
                                                color: colors.textSecondary,
                                                lineHeight: 20,
                                                marginBottom: 6,
                                            }}>
                                                {notif.message}
                                            </Text>
                                            <Text style={{
                                                fontSize: 12,
                                                color: colors.textMuted,
                                            }}>
                                                {formatRelativeTime(notif.createdAt)}
                                            </Text>
                                        </View>
                                        
                                        {/* Bouton supprimer */}
                                        <Pressable
                                            onPress={() => handleRemoveNotification(notif.id)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            style={({ pressed }) => ({
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: pressed ? colors.error + '20' : 'transparent',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            })}
                                        >
                                            <Ionicons 
                                                name="trash-outline" 
                                                size={18} 
                                                color={colors.textMuted} 
                                            />
                                        </Pressable>
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                    
                    {/* Barre de glissement (indicateur visuel) */}
                    <View style={{
                        position: 'absolute',
                        bottom: DESIGN_TOKENS.spacing.sm,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.border,
                        }} />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default NotificationsPanel;