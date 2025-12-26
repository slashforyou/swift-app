import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect, useRef } from 'react'
import { testController } from '../services/testController'
// Make sure the file exists at ../../screens/home.tsx or ../../screens/home/index.tsx
import ConnectionScreen from '../screens/connection'
import LoginScreen from '../screens/connectionScreens/login'
import SubscribeScreen from '../screens/connectionScreens/subscribe'
import SubscribeMailVerification from '../screens/connectionScreens/subscribeMailVerification'
import HomeScreen from '../screens/home'
import JobDetails from '../screens/jobDetails'
import Parameters from '../screens/parameters'
import Profile from '../screens/profile'
import BusinessNavigation from './business'
import CalendarNavigation from './calendar'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Provide navigation reference to test controller
    if (navigationRef.current) {
      testController.setNavigation(navigationRef.current as any);
      
      if (__DEV__) {
        // TEMP_DISABLED: console.log('🧭 Navigation reference set in TestController');
      }
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Connection" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connection" component={ConnectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Subscribe" component={SubscribeScreen} />
        <Stack.Screen name="SubscribeMailVerification" component={SubscribeMailVerification} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Calendar" component={CalendarNavigation} />
        <Stack.Screen name="Business" component={BusinessNavigation} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Parameters" component={Parameters} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
