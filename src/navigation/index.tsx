import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, Button } from 'react-native'
// Make sure the file exists at ../../screens/home.tsx or ../../screens/home/index.tsx
import HomeScreen from '../screens/home'
import CalendarNavigation from './calendar'
import JobDetails from '../screens/jobDetails'
import Profile from '../screens/profile'
import Parameters from '../screens/parameters'
import ConnectionScreen from '../screens/connection'
import LoginScreen from '../screens/connectionScreens/login'
import SubscribeScreen from '../screens/connectionScreens/subscribe'
import SubscribeMailVerification from '../screens/connectionScreens/subscribeMailVerification'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Connection" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connection" component={ConnectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Subscribe" component={SubscribeScreen} />
        <Stack.Screen name="SubscribeMailVerification" component={SubscribeMailVerification} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Calendar" component={CalendarNavigation} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Parameters" component={Parameters} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
