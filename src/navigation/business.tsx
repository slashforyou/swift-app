import React from 'react'
import { NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

// Components
import { BusinessInfoScreen, StaffCrewScreen, TrucksScreen, JobsBillingScreen } from '../screens/business'
import LoadingDots from '../components/ui/LoadingDots'

// Hooks & Utils
import { useAuthGuard } from '../hooks/useSession'
import { useCommonThemedStyles } from '../constants/Styles'
import { useTheme } from '../context/ThemeProvider'
import { useAuthCheck } from '../utils/checkAuth'
import { Colors } from '../constants/Colors'
import { useLocalization } from '../localization/useLocalization'

// Types
type RootStackParamList = {
  Connection: undefined;
  Business: undefined;
}

type BusinessStackParamList = {
  BusinessInfo: undefined;
  StaffCrew: undefined;
  Trucks: undefined;
  JobsBilling: undefined;
}

interface BusinessNavigationProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const BusinessStack = createNativeStackNavigator<BusinessStackParamList>()

/**
 * Business Navigation Component
 * Manages business stack navigation with authentication and data loading
 */
export default function BusinessNavigation({ navigation }: BusinessNavigationProps) {
  const { t } = useLocalization();
  
  // Authentication check with loading UI
  const authCheck = useAuthCheck(navigation, t('business.navigation.loadingBusiness'))

  // Get themed styles and colors
  const commonStyles = useCommonThemedStyles()
  const { colors } = useTheme()
  
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
        <Text style={[commonStyles.h3, { color: colors.error, textAlign: 'center' }]}>{t('business.navigation.authenticationError')}: {authCheck.error}</Text>
        <TouchableOpacity style={[commonStyles.buttonPrimary, commonStyles.marginTop]} onPress={() => navigation.navigate('Connection' as any)}>
          <Text style={commonStyles.buttonPrimaryText}>{t('business.navigation.goToLogin')}</Text>
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
      <NavigationIndependentTree>
        <BusinessStack.Navigator 
          initialRouteName="BusinessInfo" 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <BusinessStack.Screen 
            name="BusinessInfo" 
            component={BusinessInfoScreen}
            options={{
              title: t('business.navigation.businessInfo'),
            }}
          />
          <BusinessStack.Screen 
            name="StaffCrew" 
            component={StaffCrewScreen}
            options={{
              title: t('business.navigation.staffCrew'),
            }}
          />
          <BusinessStack.Screen 
            name="Trucks" 
            component={TrucksScreen}
            options={{
              title: t('business.navigation.trucks'),
            }}
          />
          <BusinessStack.Screen 
            name="JobsBilling" 
            component={JobsBillingScreen}
            options={{
              title: t('business.navigation.jobsBilling'),
            }}
          />
        </BusinessStack.Navigator>
      </NavigationIndependentTree>
    </View>
  )
}
