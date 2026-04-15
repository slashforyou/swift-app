// src/App.tsx
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    useFonts,
} from "@expo-google-fonts/space-grotesk";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Alert as NativeAlert,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./components/ErrorBoundary";
import { ENV, STRIPE_PUBLISHABLE_KEY } from "./config/environment";
import { AppAlertProvider } from "./context/AppAlertProvider";
import { NotificationsProvider } from "./context/NotificationsProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { ToastProvider } from "./context/ToastProvider";
import { VehiclesProvider } from "./context/VehiclesProvider";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { useForceUpdate } from "./hooks/useForceUpdate";
import { LocalizationProvider } from "./localization";
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

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const { status: updateStatus } = useForceUpdate();

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

  // Block the app while an OTA update is being downloaded/applied
  if (updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "ready") {
    return (
      <View style={updateStyles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={updateStyles.title}>
          {updateStatus === "checking"
            ? "Checking for updates..."
            : updateStatus === "downloading"
              ? "Downloading update..."
              : "Restarting..."}
        </Text>
        <Text style={updateStyles.subtitle}>
          Please wait, this will only take a moment.
        </Text>
      </View>
    );
  }

  const content = (
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

const updateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F8FC",
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#1E293B",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
});
