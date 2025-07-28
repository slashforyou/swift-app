// src/App.tsx
import React from 'react'
import Navigation from './navigation'
import { Text, View } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 24, textAlign: 'center', margin: 20 }}>
        Welcome to Swift App!
      </Text>
      <Navigation />
    </View>
  )
}
