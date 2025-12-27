import { NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// Components
import LoadingDots from '../components/ui/LoadingDots'
import DayScreen from '../screens/calendar/dayScreen'
import MonthCalendarScreen from '../screens/calendar/monthScreen'
import MultipleYearsScreen from '../screens/calendar/multipleYearsScreen'
import YearCalendarScreen from '../screens/calendar/yearScreen'

// Hooks & Utils
import { useCalendarData } from '../hooks/useCalendar'
import { useCommonThemedStyles } from '../hooks/useCommonStyles'
import { useLocalization } from '../localization/useLocalization'
import { useAuthCheck } from '../utils/checkAuth'
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
  route?: {
    params?: {
      screen?: 'Month' | 'Year' | 'MultipleYears' | 'Day';
      params?: {
        day?: number;
        month?: number;
        year?: number;
      };
    };
  };
}

const CalendarStack = createNativeStackNavigator<CalendarStackParamList>()

/**
 * Calendar Navigation Component
 * Manages calendar stack navigation with authentication and data loading
 */
export default function CalendarNavigation({ navigation, route }: CalendarNavigationProps) {
  const { t } = useLocalization();
  
  // Déterminer l'écran initial et les paramètres
  const initialRouteName = route?.params?.screen || 'Month';
  const initialParams = route?.params?.params;
  
  // Authentication check with loading UI
  const authCheck = useAuthCheck(navigation, t('calendar.navigation.loadingCalendar'))
  
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
        <Text style={[commonStyles.h3, { color: colors.error, textAlign: 'center' }]}>{t('calendar.navigation.authenticationError')}: {authCheck.error}</Text>
        <TouchableOpacity style={[commonStyles.buttonPrimary, commonStyles.marginTop]} onPress={() => navigation.navigate('Connection' as any)}>
          <Text style={commonStyles.buttonPrimaryText}>{t('calendar.navigation.goToLogin')}</Text>
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
      {/* Show calendar data loading overlay */}
      {calendar.isLoading && (
        <View style={customStyles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <LoadingDots 
            text={t('calendar.navigation.loading')} 
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
          initialRouteName={initialRouteName as any}
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
              title: t('calendar.navigation.monthlyView'),
            }}
          />
          <CalendarStack.Screen 
            name="Year" 
            component={YearCalendarScreen}
            options={{
              title: t('calendar.navigation.yearlyView'),
            }}
          />
          <CalendarStack.Screen 
            name="MultipleYears" 
            component={MultipleYearsScreen}
            options={{
              title: t('calendar.navigation.multiYearView'),
            }}
          />
          <CalendarStack.Screen 
            name="Day" 
            component={DayScreen}
            initialParams={initialRouteName === 'Day' ? initialParams as any : undefined}
            options={{
              title: t('calendar.navigation.dailyView'),
            }}
          />
        </CalendarStack.Navigator>
      </NavigationIndependentTree>
    </View>
  )
}