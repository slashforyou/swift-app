/**
 * usePushNotifications Hook - Gestion des notifications push
 * Utilise le service pushNotifications pour :
 * - Initialiser les notifications
 * - Gérer les préférences utilisateur
 * - Écouter les notifications reçues
 */
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
    addNotificationReceivedListener,
    addNotificationResponseListener,
    clearBadge,
    getExpoPushToken,
    getNotificationPreferences,
    initializePushNotifications,
    NotificationPreferences,
    parseNotificationData,
    registerPushToken,
    updateNotificationPreferences,
} from "../services/pushNotifications";

interface UsePushNotificationsReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  permissionStatus: "granted" | "denied" | "undetermined";
  preferences: NotificationPreferences | null;
  pushToken: string | null;
  error: string | null;

  // Actions
  initialize: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (
    prefs: Partial<NotificationPreferences>,
  ) => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  job_reminders: true,
  job_updates: true,
  payment_alerts: true,
  marketing: false,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00:00",
  quiet_hours_end: "07:00:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const navigation = useNavigation<any>();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vérifier le statut des permissions
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status as "granted" | "denied" | "undetermined");
      return status;
    } catch {
      return "undetermined";
    }
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status as "granted" | "denied" | "undetermined");

      if (status === "granted") {
        // Récupérer et enregistrer le token
        const token = await getExpoPushToken();
        if (token) {
          setPushToken(token);
          await registerPushToken(token);
        }
        return true;
      }

      return false;
    } catch {
      setError("Failed to request notification permission");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialiser les notifications
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    try {
      setIsLoading(true);
      setError(null);

      // initializePushNotifications -> getExpoPushToken gère la demande de permission en interne
      // On ne gate plus sur le statut initial (undetermined = jamais demandé → token jamais enregistré)
      const success = await initializePushNotifications();
      if (success) {
        const token = await getExpoPushToken();
        setPushToken(token);
      }

      // Mettre à jour le statut de permission après la tentative
      await checkPermissionStatus();

      // Charger les préférences
      const prefs = await getNotificationPreferences();
      setPreferences(prefs || DEFAULT_PREFERENCES);

      setIsInitialized(true);
      return success;
    } catch {
      setError("Failed to initialize notifications");
      return false;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [isInitialized, checkPermissionStatus]);

  // Charger les préférences
  const refreshPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs || DEFAULT_PREFERENCES);
    } catch (err) {
      console.error(
        "[usePushNotifications] Error refreshing preferences:",
        err,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(
    async (newPrefs: Partial<NotificationPreferences>): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const updated = await updateNotificationPreferences(newPrefs);
        if (updated) {
          setPreferences((prev) =>
            prev
              ? { ...prev, ...newPrefs }
              : { ...DEFAULT_PREFERENCES, ...newPrefs },
          );
          return true;
        }
        return false;
      } catch {
        setError("Failed to update preferences");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Gérer la navigation depuis une notification
  const handleNotificationNavigation = useCallback(
    (data: any) => {
      if (!data) return;

      const { type, job_id, screen } = data;

      switch (type) {
        case "new_job":
        case "job_reminder":
        case "job_updated":
          if (job_id && screen === "JobDetails") {
            navigation.navigate("JobDetails", {
              jobId: job_id,
              from: "Home",
            });
          }
          break;
        case "job_assigned":
        case "job_assigned_contractor": {
          // Navigate to the calendar day of the assigned job
          const {
            handleNotificationNavigation,
          } = require("../services/navRef");
          handleNotificationNavigation({
            screen: screen || "Calendar",
            date: data.date,
            job_id,
          });
          break;
        }
        case "payment_received":
          navigation.navigate("Business", { initialTab: "Payments" });
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  // Initialisation au montage
  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écouter les notifications reçues au premier plan
  // Skip in Expo Go SDK 53+ — addPushTokenListener was removed and causes a dev overlay
  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    const subscription = addNotificationReceivedListener((notification) => {
      // Notification reçue pendant que l'app est au premier plan
      const data = parseNotificationData(notification);
    });

    return () => subscription.remove();
  }, []);

  // Écouter les interactions avec les notifications (tap)
  // Skip in Expo Go SDK 53+ — addPushTokenListener was removed and causes a dev overlay
  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    const subscription = addNotificationResponseListener((response) => {
      const notification = response.notification;
      const data = parseNotificationData(notification);

      if (data) {
        handleNotificationNavigation(data);
      }

      // Effacer le badge
      clearBadge();
    });

    return () => subscription.remove();
  }, [handleNotificationNavigation]);

  // Re-enregistrer le token quand l'app revient au premier plan
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && pushToken) {
        await registerPushToken(pushToken);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [pushToken]);

  return {
    isInitialized,
    isLoading,
    permissionStatus,
    preferences,
    pushToken,
    error,
    initialize,
    requestPermission,
    updatePreferences,
    refreshPreferences,
  };
};

export default usePushNotifications;
