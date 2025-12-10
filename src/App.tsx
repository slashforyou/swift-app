// src/App.tsx
import { StripeProvider } from '@stripe/stripe-react-native'
import React from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { VehiclesProvider } from './context/VehiclesProvider'
import { LocalizationProvider } from './localization'
import Navigation from './navigation/index'

// Configuration Stripe (test keys pour le développement)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51OsLQ8DYjI2sE1B1Gxw8SJ9xqJBAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'; // Remplacer par vraie clé test

export default function App() {
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
