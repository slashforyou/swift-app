import React from 'react'
import { NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MonthCalendarScreen from '../screens/calendar/monthScreen'
import YearCalendarScreen from '../screens/calendar/yearScreen'
import { View } from 'react-native'
import TopMenu from '../components/top_menu/top_menu'
import MultipleYearsScreen from '../screens/calendar/multipleYearsScreen'
import DayScreen from '../screens/calendar/dayScreen'

const CalendarStack = createNativeStackNavigator()

export default function CalendarNavigation({ navigation }: any) {
  return (
    <View style={{ flex: 1 }}>
      <TopMenu navigation={navigation} />
      <NavigationIndependentTree>
        <CalendarStack.Navigator initialRouteName="Month" screenOptions={{ headerShown: false }}>
          <CalendarStack.Screen name="Month" component={MonthCalendarScreen} />
          <CalendarStack.Screen name="Year" component={YearCalendarScreen} />
          <CalendarStack.Screen name="MultipleYears" component={MultipleYearsScreen} />
          <CalendarStack.Screen name="Day" component={DayScreen} />
        </CalendarStack.Navigator>
    </NavigationIndependentTree>
    </View>
  )
}
