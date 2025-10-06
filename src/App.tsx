// src/App.tsx
import React from 'react'
import Navigation from './navigation/index'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './context/ThemeProvider'

export default function App() {
  
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <Navigation />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
