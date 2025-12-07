// src/App.tsx
import React from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { VehiclesProvider } from './context/VehiclesProvider'
import { LocalizationProvider } from './localization'
import Navigation from './navigation/index'

export default function App() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  )
}
