// src/App.tsx
import React from 'react'
import Navigation from './navigation/index'
import { Text, View } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <Navigation />
    </View>
  )
}
