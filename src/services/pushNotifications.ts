/**
 * PushNotifications Service - Gestion des notifications push Expo
 * Endpoints: /v1/users/push-token, /v1/users/notification-preferences
 *
 * @see BACKEND_REQUIREMENTS_PHASE2.md pour la documentation complète
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ServerData } from "../constants/ServerData";
import { fetchWithAuth } from "../utils/session";

// ========================================
// Types
// ========================================

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  job_reminders: boolean;
  job_updates: boolean;
  payment_alerts: boolean;
  marketing: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export interface PushTokenData {
  push_token: string;
  platform: "ios" | "android" | "web";
  device_id?: string;
  device_name?: string;
  app_version?: string;
}

interface NotificationData {
  type: string;
  job_id?: string;
  screen?: string;
  [key: string]: any;
}

// ========================================
// Configuration Expo Notifications
// ========================================

// Configuration du comportement des notifications
// Skip in Expo Go (SDK 53+ removed remote push support)
if (Constants.appOwnership !== "expo") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ========================================
// Push Token Management
// ========================================

const PUSH_DIAG_URL = "https://cobbr-app.com/swift-app/v1/logs";

const sendPushDiag = (message: string, context?: Record<string, unknown>) => {
  fetch(PUSH_DIAG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: "DEBUG", message: `[Push][diag] ${message}`, context: { screen: "push_init", platform: Platform.OS, ...context } }),
  }).catch(() => {});
};

/**
 * Demande la permission et récupère le token Expo Push
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    // Expo Go limitations (SDK 53+ removed remote notifications support)
    if (Constants.appOwnership === "expo") {
      console.log("[Push][diag] EARLY RETURN: appOwnership=expo");
      sendPushDiag("EARLY RETURN: appOwnership=expo");
      return null;
    }

    // Vérifier si c'est un device physique (pas un simulateur)
    if (!Device.isDevice) {
      console.log("[Push][diag] EARLY RETURN: Device.isDevice=false");
      sendPushDiag("EARLY RETURN: Device.isDevice=false");
      return null;
    }

    // Demander les permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log(`[Push][diag] existingStatus=${existingStatus} platform=${Platform.OS} appOwnership=${Constants.appOwnership}`);
    sendPushDiag(`existingStatus=${existingStatus}`, { appOwnership: Constants.appOwnership });

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log(`[Push][diag] requestPermissions result=${status}`);
      sendPushDiag(`requestPermissions result=${status}`);
    }

    if (finalStatus !== "granted") {
      console.log(`[Push][diag] EARLY RETURN: finalStatus=${finalStatus}`);
      sendPushDiag(`EARLY RETURN: finalStatus=${finalStatus}`);
      return null;
    }

    // Configuration spécifique Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
      });
    }

    // EAS projectId (UUID) is required by getExpoPushTokenAsync
    // Hardcoded as fallback because Constants.easConfig may be unavailable in older native builds
    const HARDCODED_PROJECT_ID = "197a33fd-1b2f-4c2e-b51b-b3ff8f976a80";
    const projectId =
      (Constants.easConfig as any)?.projectId ||
      (Constants.expoConfig as any)?.extra?.eas?.projectId ||
      HARDCODED_PROJECT_ID;

    if (!projectId || typeof projectId !== "string") {
      sendPushDiag("EARLY RETURN: projectId invalid");
      return null;
    }

    sendPushDiag(`calling getExpoPushTokenAsync with projectId=${projectId}`);

    // Récupérer le token Expo
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    sendPushDiag(`SUCCESS: token=${tokenData.data}`);
    return tokenData.data;
  } catch (error) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error("[Push][diag] ERROR in getExpoPushToken:", errMsg);
    sendPushDiag(`ERROR: ${errMsg}`, { error_stack: error instanceof Error ? error.stack : undefined });
    return null;
  }
};

/**
 * Enregistre le push token sur le serveur
 * POST /v1/users/push-token
 */
export const registerPushToken = async (
  pushToken: string,
): Promise<boolean> => {
  try {
    const tokenData: PushTokenData = {
      push_token: pushToken,
      platform: Platform.OS as "ios" | "android",
      device_name: Device.modelName || undefined,
      app_version: Constants.expoConfig?.version || "1.0.0",
    };

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/users/push-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[Push] Error registering push token:", error);
    return false;
  }
};

/**
 * Supprime le push token du serveur (logout)
 * DELETE /v1/users/push-token
 */
export const unregisterPushToken = async (
  pushToken: string,
): Promise<boolean> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/users/push-token`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ push_token: pushToken }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[Push] Error unregistering push token:", error);
    return false;
  }
};

/**
 * Initialise les push notifications et enregistre le token
 */
export const initializePushNotifications = async (): Promise<boolean> => {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return false;
    }

    const registered = await registerPushToken(token);
    if (registered) {
    }
    return registered;
  } catch (error) {
    console.error("[Push] Error initializing push notifications:", error);
    return false;
  }
};

// ========================================
// Notification Preferences
// ========================================

/**
 * Récupère les préférences de notification de l'utilisateur
 * GET /v1/users/notification-preferences
 */
export const getNotificationPreferences =
  async (): Promise<NotificationPreferences | null> => {
    try {
      const response = await fetchWithAuth(
        `${ServerData.serverUrl}v1/users/notification-preferences`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data as NotificationPreferences;
      }
      return null;
    } catch (error) {
      console.error("[Push] Error fetching notification preferences:", error);
      return null;
    }
  };

/**
 * Met à jour les préférences de notification
 * PATCH /v1/users/notification-preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/users/notification-preferences`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data as NotificationPreferences;
    }
    return null;
  } catch (error) {
    console.error("[Push] Error updating notification preferences:", error);
    return null;
  }
};

// ========================================
// Notification Listeners
// ========================================

/**
 * Ajoute un listener pour les notifications reçues quand l'app est au premier plan
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void,
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Ajoute un listener pour les interactions avec les notifications (tap)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Récupère la dernière notification qui a ouvert l'app
 */
export const getLastNotificationResponse =
  async (): Promise<Notifications.NotificationResponse | null> => {
    return await Notifications.getLastNotificationResponseAsync();
  };

/**
 * Parse les données d'une notification pour la navigation
 */
export const parseNotificationData = (
  notification: Notifications.Notification,
): NotificationData | null => {
  try {
    const data = notification.request.content.data as NotificationData;
    return data || null;
  } catch {
    return null;
  }
};

// ========================================
// Badge Management
// ========================================

/**
 * Met à jour le badge de l'app
 */
export const setBadgeCount = async (count: number): Promise<boolean> => {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error("[Push] Error setting badge count:", error);
    return false;
  }
};

/**
 * Récupère le nombre de badges actuels
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error("[Push] Error getting badge count:", error);
    return 0;
  }
};

/**
 * Efface tous les badges
 */
export const clearBadge = async (): Promise<boolean> => {
  return await setBadgeCount(0);
};

// ========================================
// Admin — Direct Push Send
// ========================================

export interface AdminSendNotificationParams {
  email: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface AdminSendNotificationResult {
  success: boolean;
  message?: string;
  tokens_reached?: number;
  error?: string;
}

/**
 * Envoie une notification push à un utilisateur via son email.
 * Requiert un JWT avec company_role = "patron".
 * POST /v1/admin/send-notification
 */
export const adminSendNotification = async (
  params: AdminSendNotificationParams,
): Promise<AdminSendNotificationResult> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/admin/send-notification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return {
      success: true,
      message: data.message,
      tokens_reached: data.tokens_reached,
    };
  } catch (error) {
    console.error("[Push] adminSendNotification error:", error);
    return { success: false, error: "Network error" };
  }
};

// ========================================
// Local Notifications (pour tests)
// ========================================

/**
 * Planifie une notification locale (utile pour rappels)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: NotificationData,
  triggerSeconds?: number,
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: triggerSeconds
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        }
      : null,
  });
  return identifier;
};

/**
 * Annule une notification planifiée
 */
export const cancelScheduledNotification = async (
  identifier: string,
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

/**
 * Annule toutes les notifications planifiées
 */
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// ========================================
// Export par défaut
// ========================================

export default {
  // Token management
  getExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  initializePushNotifications,

  // Preferences
  getNotificationPreferences,
  updateNotificationPreferences,

  // Listeners
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  parseNotificationData,

  // Badge
  setBadgeCount,
  getBadgeCount,
  clearBadge,

  // Local notifications
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
};
