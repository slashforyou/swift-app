// src/App.tsx
import React from 'react'
import Navigation from './navigation/index'
import { View } from 'react-native'
import { ThemeProvider } from './context/ThemeProvider'

export default function App() {
  
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <Navigation />
      </View>
    </ThemeProvider>
  )
}
