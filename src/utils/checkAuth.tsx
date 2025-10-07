/**
 * checkAuth - Utility function for authentication verification
 * Shows animated loading during auth check and redirects to login if not authenticated
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthGuard } from '../hooks/useSession';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import LoadingDots from '../components/ui/LoadingDots';

interface AuthCheckResult {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  LoadingComponent: React.ReactNode | null;
}

type NavigationType = NativeStackNavigationProp<any>;

/**
 * Custom hook that handles authentication checking with loading UI
 * @param navigation - React Navigation prop for redirecting
 * @param loadingText - Custom loading text (default: "Checking authentication")
 * @returns Authentication state and loading component
 */
export const useAuthCheck = (
  navigation: NavigationType,
  loadingText: string = "Checking authentication"
): AuthCheckResult => {
  const session = useAuthGuard(navigation);
  const { colors, styles: commonStyles } = useCommonThemedStyles();

  const LoadingComponent = session.isLoading ? (
    <View style={commonStyles.containerCentered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <LoadingDots 
        text={loadingText}
        style={{ 
          fontSize: 16,
          color: colors.text,
          marginTop: 16,
          textAlign: 'center'
        }} 
        interval={500} 
      />
    </View>
  ) : null;

  return {
    isLoading: session.isLoading,
    isAuthenticated: session.isAuthenticated || false,
    error: session.error || null,
    LoadingComponent
  };
};

/**
 * Higher-order component that wraps a screen with authentication check
 * @param WrappedComponent - The component to wrap with auth check
 * @param loadingText - Custom loading text for this screen
 * @returns Component with authentication protection
 */
export const withAuthCheck = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingText: string = "Loading"
) => {
  return (props: P & { navigation: NavigationType }) => {
    const authCheck = useAuthCheck(props.navigation, loadingText);
    
    // Show loading while checking authentication
    if (authCheck.isLoading) {
      return authCheck.LoadingComponent;
    }

    // Don't render if not authenticated (useAuthGuard handles redirect)
    if (!authCheck.isAuthenticated) {
      return null;
    }

    // Render the wrapped component if authenticated
    return <WrappedComponent {...props} />;
  };
};

/**
 * Simple function-based auth check for inline usage
 * @param navigation - Navigation prop
 * @param loadingText - Custom loading text
 * @returns Auth check result with loading component
 */
export const checkAuth = (
  navigation: NavigationType,
  loadingText: string = "Checking authentication"
): AuthCheckResult => {
  return useAuthCheck(navigation, loadingText);
};

export default useAuthCheck;