/**
 * NotificationsProvider - Gestion globale des notifications
 * Gère les notifications locales et push, les stocke dans AsyncStorage
 * 
 * @author Romain Giovanni - Slashforyou
 * @created 16/01/2026
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    addNotificationReceivedListener,
    addNotificationResponseListener,
    clearBadge,
    setBadgeCount,
} from '../services/pushNotifications';

// ========================================
// Types
// ========================================

export type NotificationType = 'job' | 'bonus' | 'call' | 'system' | 'payment' | 'reminder';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
    data?: Record<string, any>;
}

interface NotificationsContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
    refreshNotifications: () => Promise<void>;
}

// ========================================
// Context
// ========================================

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const STORAGE_KEY = '@swift_notifications';
const MAX_NOTIFICATIONS = 50; // Garder max 50 notifications

// ========================================
// Provider
// ========================================

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les notifications depuis AsyncStorage
    const loadNotifications = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as AppNotification[];
                // Convertir les dates string en Date
                const withDates = parsed.map(n => ({
                    ...n,
                    createdAt: new Date(n.createdAt),
                }));
                setNotifications(withDates);
            }
        } catch (error) {
            console.error('[Notifications] Error loading:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sauvegarder les notifications dans AsyncStorage
    const saveNotifications = useCallback(async (notifs: AppNotification[]) => {
        try {
            // Limiter le nombre de notifications
            const limited = notifs.slice(0, MAX_NOTIFICATIONS);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        } catch (error) {
            console.error('[Notifications] Error saving:', error);
        }
    }, []);

    // Calculer le nombre de non-lus
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Mettre à jour le badge de l'app
    useEffect(() => {
        setBadgeCount(unreadCount);
    }, [unreadCount]);

    // Ajouter une notification
    const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
        const newNotification: AppNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            isRead: false,
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            saveNotifications(updated);
            return updated;
        });

        console.log('🔔 [Notifications] Added:', newNotification.title);
    }, [saveNotifications]);

    // Marquer comme lu
    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => 
                n.id === id ? { ...n, isRead: true } : n
            );
            saveNotifications(updated);
            return updated;
        });
    }, [saveNotifications]);

    // Marquer tout comme lu
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, isRead: true }));
            saveNotifications(updated);
            return updated;
        });
        clearBadge();
    }, [saveNotifications]);

    // Supprimer une notification
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            saveNotifications(updated);
            return updated;
        });
    }, [saveNotifications]);

    // Effacer toutes les notifications
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        AsyncStorage.removeItem(STORAGE_KEY);
        clearBadge();
    }, []);

    // Rafraîchir les notifications (pour le pull-to-refresh)
    const refreshNotifications = useCallback(async () => {
        await loadNotifications();
    }, [loadNotifications]);

    // Charger au montage
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Écouter les notifications push reçues
    useEffect(() => {
        const receivedSubscription = addNotificationReceivedListener((notification) => {
            const content = notification.request.content;
            const data = content.data || {};
            
            addNotification({
                title: content.title || 'Notification',
                message: content.body || '',
                type: (data.type as NotificationType) || 'system',
                data: data,
            });
        });

        const responseSubscription = addNotificationResponseListener((response) => {
            const notification = response.notification;
            const data = notification.request.content.data || {};
            
            // Naviguer vers l'écran approprié si spécifié
            if (data.screen) {
                console.log('🔔 [Notifications] Navigate to:', data.screen);
                // La navigation sera gérée par le composant qui utilise ce contexte
            }
        });

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }, [addNotification]);

    // Nettoyer le badge quand l'app revient au premier plan
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // Optionnel: recharger les notifications
                // loadNotifications();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                addNotification,
                markAsRead,
                markAllAsRead,
                removeNotification,
                clearAllNotifications,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

// ========================================
// Hook
// ========================================

export const useNotifications = (): NotificationsContextType => {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};

// ========================================
// Helper pour formater le temps relatif
// ========================================

export const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return 'À l\'instant';
    } else if (diffMinutes < 60) {
        return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
        return 'Hier';
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    } else {
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
};

export default NotificationsProvider;
