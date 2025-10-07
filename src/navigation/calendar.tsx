import React from 'react'
import { NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

// Components
import MonthCalendarScreen from '../screens/calendar/monthScreen'
import YearCalendarScreen from '../screens/calendar/yearScreen'
import MultipleYearsScreen from '../screens/calendar/multipleYearsScreen'
import DayScreen from '../screens/calendar/dayScreen'
import TopMenu from '../components/top_menu/top_menu'
import LoadingDots from '../components/ui/LoadingDots'

// Hooks & Utils
import { useAuthGuard } from '../hooks/useSession'
import { useCalendarData } from '../hooks/useCalendar'
import { getCalendarDateRange } from '../utils/dateUtils'
import { useCommonThemedStyles } from '../hooks/useCommonStyles'
import { useAuthCheck } from '../utils/checkAuth'
import { Colors } from '../constants/Colors'

// Types
type RootStackParamList = {
  Connection: undefined;
  Calendar: undefined;
}

type CalendarStackParamList = {
  Month: undefined;
  Year: undefined;
  MultipleYears: undefined;
  Day: undefined;
}

interface CalendarNavigationProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const CalendarStack = createNativeStackNavigator<CalendarStackParamList>()

/**
 * Calendar Navigation Component
 * Manages calendar stack navigation with authentication and data loading
 */
export default function CalendarNavigation({ navigation }: CalendarNavigationProps) {
  // Authentication check with loading UI
  const authCheck = useAuthCheck(navigation, "Loading calendar")
  
  // Calendar data management with auto-loading - calculer les dates une seule fois
  const [dateRange] = React.useState(() => getCalendarDateRange())
  const calendar = useCalendarData(dateRange.start, dateRange.end, authCheck.isAuthenticated === true)

  // Get themed styles and colors
  const { colors, styles: commonStyles } = useCommonThemedStyles()
  
  // Combine common styles with custom navigation styles
  const customStyles = StyleSheet.create({
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.overlayDark,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    errorBanner: {
      ...commonStyles.statusError,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderRadius: 0, // Override border radius for banner
    },
    bannerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerButton: {
      ...commonStyles.buttonSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    dismissButton: {
      ...commonStyles.buttonIcon,
      backgroundColor: colors.errorLight,
      width: 32,
      height: 32,
      borderRadius: 16,
    },
  })

  // Show loading screen while checking authentication
  if (authCheck.isLoading) {
    return authCheck.LoadingComponent;
  }

  // Show authentication error
  if (authCheck.error) {
    return (
      <View style={commonStyles.containerCentered}>
        <Text style={[commonStyles.h3, { color: colors.error, textAlign: 'center' }]}>Authentication Error: {authCheck.error}</Text>
        <TouchableOpacity style={[commonStyles.buttonPrimary, commonStyles.marginTop]} onPress={() => navigation.navigate('Connection' as any)}>
          <Text style={commonStyles.buttonPrimaryText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Don't render if not authenticated (useAuthGuard will handle redirect)
  if (!authCheck.isAuthenticated) {
    return null
  }

  return (
    <View style={commonStyles.container}>
      <TopMenu navigation={navigation} />
      
      {/* Show calendar data loading overlay */}
      {calendar.isLoading && (
        <View style={customStyles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <LoadingDots 
            text="Loading" 
            style={{ 
              fontSize: 14,
              color: colors.text,
              marginLeft: 8 
            }} 
            interval={500} 
          />
        </View>
      )}
      
      {/* Show calendar data error */}
      {calendar.error && (
        <View style={customStyles.errorBanner}>
          <View style={customStyles.bannerContent}>
            <Text style={[commonStyles.body, { flex: 1, marginRight: 8 }]}>{calendar.error}</Text>
            <TouchableOpacity 
              onPress={calendar.refresh} 
              style={customStyles.bannerButton}
            >
              <Text style={commonStyles.buttonSecondaryText}>Retry</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            onPress={calendar.clearError}
            style={customStyles.dismissButton}
          >
            <Text style={[commonStyles.h3, { color: colors.background }]}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <NavigationIndependentTree>
        <CalendarStack.Navigator 
          initialRouteName="Month" 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <CalendarStack.Screen 
            name="Month" 
            component={MonthCalendarScreen}
            options={{
              title: 'Monthly View',
            }}
          />
          <CalendarStack.Screen 
            name="Year" 
            component={YearCalendarScreen}
            options={{
              title: 'Yearly View',
            }}
          />
          <CalendarStack.Screen 
            name="MultipleYears" 
            component={MultipleYearsScreen}
            options={{
              title: 'Multi-Year View',
            }}
          />
          <CalendarStack.Screen 
            name="Day" 
            component={DayScreen}
            options={{
              title: 'Daily View',
            }}
          />
        </CalendarStack.Navigator>
      </NavigationIndependentTree>
    </View>
  )
}