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

// Hooks & Utils
import { useAuthGuard } from '../hooks/useSession'
import { useCalendarData } from '../hooks/useCalendar'
import { getCalendarDateRange } from '../utils/dateUtils'

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
  // Authentication guard - redirects to login if not authenticated
  const session = useAuthGuard(navigation)
  
  // Calendar data management with auto-loading
  const { start, end } = getCalendarDateRange()
  const calendar = useCalendarData(start, end, session.isAuthenticated === true)

  // Show loading screen while checking session
  if (session.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    )
  }

  // Show session error
  if (session.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Authentication Error: {session.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={session.refreshSession}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Don't render if not authenticated (useAuthGuard will handle redirect)
  if (!session.isAuthenticated) {
    return null
  }

  return (
    <View style={styles.container}>
      <TopMenu navigation={navigation} />
      
      {/* Show calendar data loading overlay */}
      {calendar.isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.overlayText}>Loading calendar data...</Text>
        </View>
      )}
      
      {/* Show calendar data error */}
      {calendar.error && (
        <View style={styles.errorBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerText}>{calendar.error}</Text>
            <TouchableOpacity 
              onPress={calendar.refresh} 
              style={styles.bannerButton}
            >
              <Text style={styles.bannerButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            onPress={calendar.clearError}
            style={styles.dismissButton}
          >
            <Text style={styles.dismissButtonText}>×</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  overlayText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#d32f2f',
    marginRight: 8,
  },
  bannerButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
})