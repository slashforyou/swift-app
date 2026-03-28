// src/App.tsx
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { StripeProvider } from "@stripe/stripe-react-native";
import React, { useEffect } from "react";
import { Alert as NativeAlert, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./components/ErrorBoundary";
import { ENV, STRIPE_PUBLISHABLE_KEY } from "./config/environment";
import { AppAlertProvider } from "./context/AppAlertProvider";
import { NotificationsProvider } from "./context/NotificationsProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { ToastProvider } from "./context/ToastProvider";
import { VehiclesProvider } from "./context/VehiclesProvider";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { LocalizationProvider } from "./localization";
import Navigation from "./navigation/index";
import { appAlert } from "./services/appAlert";
import { initializePushNotifications } from "./services/pushNotifications";
import { logInfo, simpleSessionLogger } from "./services/simpleSessionLogger";
import "./services/logger"; // Initialize global error handlers early
import "./services/testCommunication"; // Initialize test communication
import "./services/testReporter"; // Initialize test reporter
import { performanceMonitor } from "./utils/performanceMonitoring";

// Marquer le début du démarrage de l'app
performanceMonitor.markAppStart();

NativeAlert.alert = appAlert.alert;

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

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

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <LocalizationProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <PermissionsProvider autoLoad={false}>
                <VehiclesProvider>
                  <ToastProvider>
                    <AppAlertProvider>
                      <ErrorBoundary>
                        <View style={{ flex: 1 }}>
                          <Navigation />
                        </View>
                      </ErrorBoundary>
                    </AppAlertProvider>
                  </ToastProvider>
                </VehiclesProvider>
              </PermissionsProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
