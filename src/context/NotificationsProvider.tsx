/**
 * NotificationsProvider - Gestion globale des notifications
 * Gère les notifications locales et push, les stocke dans AsyncStorage
 *
 * @author Romain Giovanni - Slashforyou
 * @created 16/01/2026
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { handleNotificationNavigation } from "../services/navRef";
import {
    deleteNotificationApi,
    fetchNotifications,
    mapServerNotification,
    markAllNotificationsReadApi,
    markNotificationRead,
} from "../services/notificationsApi";
import {
    addNotificationReceivedListener,
    addNotificationResponseListener,
    clearBadge,
    setBadgeCount,
} from "../services/pushNotifications";

// ========================================
// Types
// ========================================

export type NotificationType =
  | "job"
  | "bonus"
  | "call"
  | "system"
  | "payment"
  | "reminder"
  | "new_partnership";

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
  addNotification: (
    notification: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

// ========================================
// Context
// ========================================

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const STORAGE_KEY = "@swift_notifications";
const MAX_NOTIFICATIONS = 50; // Garder max 50 notifications

// ========================================
// Provider
// ========================================

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les notifications depuis l'API (avec fallback AsyncStorage)
  const loadNotifications = useCallback(async () => {
    try {
      // Tenter la récupération API
      const res = await fetchNotifications({ limit: 50 });
      const serverNotifs = res.notifications.map(mapServerNotification);

      // Conserver les notifications locales sans serverId (ex: push reçus avant synchro)
      setNotifications((prev) => {
        const localOnly = prev.filter((n) => !n.data?.serverId);
        const merged = [...serverNotifs, ...localOnly];
        // Dédupliquer par id
        const seen = new Set<string>();
        const deduped = merged.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
        saveNotifications(deduped);
        return deduped;
      });

      console.log(
        `🔔 [Notifications] Loaded ${serverNotifs.length} from API (${res.statistics.unread} unread)`,
      );
    } catch (apiError) {
      console.warn(
        "[Notifications] API unavailable, falling back to cache:",
        apiError,
      );
      // Fallback : lire depuis AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppNotification[];
          setNotifications(
            parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) })),
          );
        }
      } catch (cacheError) {
        console.error("[Notifications] Cache error:", cacheError);
      }
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
      console.error("[Notifications] Error saving:", error);
    }
  }, []);

  // Calculer le nombre de non-lus
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mettre à jour le badge de l'app
  useEffect(() => {
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  // Ajouter une notification
  const addNotification = useCallback(
    (notification: Omit<AppNotification, "id" | "createdAt" | "isRead">) => {
      const newNotification: AppNotification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        isRead: false,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });

      console.log("🔔 [Notifications] Added:", newNotification.title);
    },
    [saveNotifications],
  );

  // Marquer comme lu
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, data: { ...n.data, serverStatus: "read" } }
            : n,
        );
        saveNotifications(updated);
        return updated;
      });

      // Appel API si notification serveur
      const notif = (notifications as AppNotification[]).find(
        (n) => n.id === id,
      );
      const serverId = notif?.data?.serverId;
      if (serverId) {
        markNotificationRead(serverId).catch((err) =>
          console.warn("[Notifications] markAsRead API error:", err),
        );
      }
    },
    [saveNotifications, notifications],
  );

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({
        ...n,
        isRead: true,
        data: { ...n.data, serverStatus: "read" },
      }));
      saveNotifications(updated);
      return updated;
    });
    clearBadge();

    // Appel API
    markAllNotificationsReadApi().catch((err) =>
      console.warn("[Notifications] markAllAsRead API error:", err),
    );
  }, [saveNotifications]);

  // Supprimer une notification
  const removeNotification = useCallback(
    (id: string) => {
      // Récupérer le serverId AVANT de retirer de l'état
      const notif = (notifications as AppNotification[]).find(
        (n) => n.id === id,
      );
      const serverId = notif?.data?.serverId;

      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        saveNotifications(updated);
        return updated;
      });

      // Appel API si notification serveur
      if (serverId) {
        deleteNotificationApi(serverId).catch((err) =>
          console.warn("[Notifications] deleteNotification API error:", err),
        );
      }
    },
    [saveNotifications, notifications],
  );

  // Effacer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    AsyncStorage.removeItem(STORAGE_KEY);
    clearBadge();
  }, []);

  // Rafraîchir les notifications (pour le pull-to-refresh)
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    await loadNotifications();
  }, [loadNotifications]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Écouter les notifications push reçues
  useEffect(() => {
    const receivedSubscription = addNotificationReceivedListener(
      (notification) => {
        const content = notification.request.content;
        const data = content.data || {};

        if (data.serverId) {
          // La notification est déjà en base → rafraîchir depuis l'API
          refreshNotifications();
        } else {
          // Notification locale uniquement (pas encore en base)
          addNotification({
            title: content.title || "Notification",
            message: content.body || "",
            type: (data.type as NotificationType) || "system",
            data: data,
          });
          // Rafraîchir en arrière-plan pour récupérer une éventuelle version serveur
          setTimeout(() => refreshNotifications(), 3000);
        }
      },
    );

    const responseSubscription = addNotificationResponseListener((response) => {
      const notification = response.notification;
      const data = notification.request.content.data || {};

      // Naviguer vers l'écran approprié si spécifié
      if (data.screen) {
        console.log("🔔 [Notifications] Navigate to:", data.screen, data);
        handleNotificationNavigation(data as Record<string, any>);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [addNotification, refreshNotifications]);

  // Nettoyer le badge quand l'app revient au premier plan
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // Rafraîchir les notifications quand l'app revient au premier plan
        loadNotifications();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [loadNotifications]);

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
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
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
    return "À l'instant";
  } else if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Hier";
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }
};

export default NotificationsProvider;
