// src/App.tsx
import { StripeProvider } from '@stripe/stripe-react-native'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ENV, STRIPE_PUBLISHABLE_KEY } from './config/environment'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { VehiclesProvider } from './context/VehiclesProvider'
import { LocalizationProvider } from './localization'
import Navigation from './navigation/index'
import { logInfo, simpleSessionLogger } from './services/simpleSessionLogger'
import './services/testCommunication'; // Initialize test communication
import './services/testReporter'; // Initialize test reporter
import { performanceMonitor } from './utils/performanceMonitoring'

// Marquer le début du démarrage de l'app
performanceMonitor.markAppStart();

export default function App() {
  useEffect(() => {
    // Marquer le premier rendu
    performanceMonitor.markFirstRender();
    
    // Initialiser le session logger au démarrage
    simpleSessionLogger.setupGlobalErrorCapture();
    logInfo('SwiftApp started successfully', 'app-startup');
    
    // Log des informations de démarrage utiles
    logInfo(`Environment: ${ENV.name}`, 'env-init');
    logInfo(`Stripe Provider initialized with key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`, 'stripe-init');
    
    // Marquer l'app comme interactive après initialisation
    setTimeout(() => {
      performanceMonitor.markInteractive();
    }, 100);
    
    // Signal to Copilot that app is ready for testing
    if (__DEV__) {
      setTimeout(() => {
        logInfo('🤖 APP READY FOR COPILOT TESTING', 'copilot-ready');
        console.log('🚀 COPILOT: App is ready for automated testing!');
        console.log('📡 Available commands: global.copilotAPI.*');
        console.log('📊 Performance summary:', performanceMonitor.getSummary());
      }, 2000); // Wait for full app initialization
    }
    
    return () => {
      logInfo('SwiftApp shutting down', 'app-shutdown');
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <LocalizationProvider>
          <ThemeProvider>
            <VehiclesProvider>
              <ToastProvider>
                <View style={{ flex: 1 }}>
                  <Navigation />
                </View>
              </ToastProvider>
            </VehiclesProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </StripeProvider>
    </SafeAreaProvider>
  )
}
