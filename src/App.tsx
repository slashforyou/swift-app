// src/App.tsx
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    useFonts,
} from "@expo-google-fonts/space-grotesk";
import React, { useEffect } from "react";
import {
    Alert as NativeAlert,
    View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./components/ErrorBoundary";
import MascotLoading from "./components/ui/MascotLoading";
import { OfflineBanner } from "./components/OfflineBanner";
import { OnboardingTourOverlay } from "./components/onboarding/OnboardingTourOverlay";
import { ENV, STRIPE_PUBLISHABLE_KEY } from "./config/environment";
import { AppAlertProvider } from "./context/AppAlertProvider";
import { NotificationsProvider } from "./context/NotificationsProvider";
import { OnboardingSpotlightProvider } from "./context/OnboardingSpotlightContext";
import { OnboardingTourProvider } from "./context/OnboardingTourContext";
import { ThemeProvider, useTheme } from "./context/ThemeProvider";
import { ToastProvider } from "./context/ToastProvider";
import { VehiclesProvider } from "./context/VehiclesProvider";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { useForceUpdate, UpdateStatus } from "./hooks/useForceUpdate";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { LocalizationProvider, useTranslation } from "./localization";
import Navigation from "./navigation/index";
import { appAlert } from "./services/appAlert";
import "./services/logger"; // Initialize global error handlers early
import { initializePushNotifications } from "./services/pushNotifications";
import { logInfo, simpleSessionLogger } from "./services/simpleSessionLogger";
import "./services/testCommunication"; // Initialize test communication
import "./services/testReporter"; // Initialize test reporter
import { performanceMonitor } from "./utils/performanceMonitoring";

// StripeProvider: load conditionally to support Expo Go (no native Stripe module)
let StripeProvider: React.ComponentType<{ publishableKey: string; children: React.ReactNode }> | null = null;
try {
  StripeProvider = require("@stripe/stripe-react-native").StripeProvider; // eslint-disable-line @typescript-eslint/no-require-imports
} catch {
  // Native Stripe module unavailable (Expo Go) — skip
}

// Marquer le début du démarrage de l'app
performanceMonitor.markAppStart();

NativeAlert.alert = appAlert.alert;

// OTA update screen — rendered inside LocalizationProvider + ThemeProvider
const OTAUpdateScreen: React.FC<{ status: UpdateStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title =
    status === "checking"
      ? t("updates.checking")
      : status === "downloading"
        ? t("updates.downloading")
        : t("updates.ready");
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MascotLoading text={title} />
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const { status: updateStatus } = useForceUpdate();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    // Marquer le premier rendu
    performanceMonitor.markFirstRender();

    // Initialiser le session logger au démarrage
    simpleSessionLogger.setupGlobalErrorCapture();
    logInfo("SwiftApp started successfully", "app-startup");

    // Log des informations de démarrage utiles
    logInfo(`Environment: ${ENV.name}`, "env-init");
    logInfo(
      `Stripe Provider initialized with key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`,
      "stripe-init",
    );

    // Initialiser les push notifications (Phase 2)
    initializePushNotifications()
      .then((success) => {
        if (success) {
          logInfo("Push notifications initialized successfully", "push-init");
        }
      })
      .catch((error) => {
        // Silently fail - notifications are optional
      });

    // Marquer l'app comme interactive après initialisation
    setTimeout(() => {
      performanceMonitor.markInteractive();
    }, 100);

    return () => {
      logInfo("Cobbr shutting down", "app-shutdown");
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const content = (
    <LocalizationProvider>
      <ThemeProvider>
        {(updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "ready") ? (
          <OTAUpdateScreen status={updateStatus} />
        ) : (
          <NotificationsProvider>
          <PermissionsProvider autoLoad={false}>
            <VehiclesProvider>
              <ToastProvider>
                <AppAlertProvider>
                  <ErrorBoundary>
                    <OnboardingTourProvider>
                      <OnboardingSpotlightProvider>
                        <View style={{ flex: 1 }}>
                          <Navigation />
                          <OnboardingTourOverlay />
                          <OfflineBanner isConnected={isConnected} />
                        </View>
                      </OnboardingSpotlightProvider>
                    </OnboardingTourProvider>
                  </ErrorBoundary>
                </AppAlertProvider>
              </ToastProvider>
            </VehiclesProvider>
          </PermissionsProvider>
        </NotificationsProvider>
        )}
      </ThemeProvider>
    </LocalizationProvider>
  );

  return (
    <SafeAreaProvider>
      {StripeProvider ? (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          {content}
        </StripeProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}

