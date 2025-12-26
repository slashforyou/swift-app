/**
 * useNavigation - Hook de navigation personnalisé
 */

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';

export type NavigationState = {
  currentRoute: string;
  previousRoute?: string;
  canGoBack: boolean;
};

export const useNavigation = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentRoute: 'Home',
    canGoBack: false,
  });

  const navigate = useCallback((routeName: string, params?: any) => {
    setNavigationState(prev => ({
      currentRoute: routeName,
      previousRoute: prev.currentRoute,
      canGoBack: true,
    }));
    
    // Logique de navigation simulée
    // TEMP_DISABLED: console.log(`Navigation vers: ${routeName}`, params);
  }, []);

  const goBack = useCallback(() => {
    if (navigationState.canGoBack && navigationState.previousRoute) {
      setNavigationState(prev => ({
        currentRoute: prev.previousRoute || 'Home',
        previousRoute: undefined,
        canGoBack: false,
      }));
      return true;
    }
    return false;
  }, [navigationState]);

  const reset = useCallback((routeName: string = 'Home') => {
    setNavigationState({
      currentRoute: routeName,
      canGoBack: false,
    });
  }, []);

  // Gestion du bouton retour Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return goBack();
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [goBack])
  );

  return {
    navigate,
    goBack,
    reset,
    navigationState,
    canGoBack: navigationState.canGoBack,
    currentRoute: navigationState.currentRoute,
  };
};