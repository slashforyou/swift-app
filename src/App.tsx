// src/App.tsx
import React from 'react'
import Navigation from './navigation/index'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <View style={{ flex: 1 }}>
            <Navigation />
          </View>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
