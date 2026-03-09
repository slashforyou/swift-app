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
        console.warn("[Push] Failed to initialize:", error);
      });

    // Marquer l'app comme interactive après initialisation
    setTimeout(() => {
      performanceMonitor.markInteractive();
    }, 100);

    // Signal to Copilot that app is ready for testing
    if (__DEV__) {
      setTimeout(() => {
        logInfo("🤖 APP READY FOR COPILOT TESTING", "copilot-ready");
        console.log("🚀 COPILOT: App is ready for automated testing!");
        console.log("📡 Available commands: global.copilotAPI.*");
        console.log("📊 Performance summary:", performanceMonitor.getSummary());
      }, 2000); // Wait for full app initialization
    }

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
                      <View style={{ flex: 1 }}>
                        <Navigation />
                      </View>
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
