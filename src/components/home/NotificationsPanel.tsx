/**
 * NotificationsPanel - Modal PLEIN ÉCRAN simple
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Animated, Dimensions, Modal, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../constants/Styles';

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
    const [slideAnimation] = useState(new Animated.Value(0));
    const [notifications, setNotifications] = useState(initialNotifications);

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
                            <Ionicons name="close" size={24} color="#666666" />
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
                                        <Ionicons name="close" size={18} color="#999999" />
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

const styles = StyleSheet.create({
    modalPanel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    safeArea: {
        height: 50,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    newBadge: {
        position: 'absolute',
        top: 12,
        right: 50, // Décalé pour laisser place au bouton de suppression
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'white',
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
        fontWeight: '700',
        color: '#000000',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 6,
        lineHeight: 20,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999999',
    },
    deleteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 6,
        borderRadius: 15,
    },
});

export default NotificationsPanel;