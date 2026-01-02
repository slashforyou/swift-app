/**
 * Lazy Loading Utilities for React Native Screens
 * Enables code splitting and faster initial load times
 * 
 * Usage:
 * const LazyProfile = lazyScreen(() => import('../screens/profile'));
 * <LazyProfile />
 */

import React, { ComponentType, Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LazyScreenOptions {
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Minimum delay before showing (prevents flash) */
  minimumDelay?: number;
}

/**
 * Default loading fallback component
 */
export const DefaultLoadingFallback: React.FC<{ color?: string }> = ({ 
  color = '#007AFF' // Default iOS blue
}) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={color} />
  </View>
);

/**
 * Creates a lazy-loaded screen component with Suspense wrapper
 * 
 * @param importFunc - Dynamic import function
 * @param options - Loading options
 * @returns Lazy component with automatic Suspense wrapper
 * 
 * @example
 * const LazyProfileScreen = lazyScreen(() => import('../screens/profile'));
 * // Use in navigation:
 * <Stack.Screen name="Profile" component={LazyProfileScreen} />
 */
export function lazyScreen<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyScreenOptions = {}
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFunc);
  const { fallback } = options;

  // Return a wrapper component that includes Suspense
  const LazyScreenWrapper: React.FC<React.ComponentProps<T>> = (props) => {
    return (
      <Suspense fallback={fallback || <DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Set display name for debugging
  LazyScreenWrapper.displayName = `Lazy(${importFunc.toString().match(/import\(['"](.+)['"]\)/)?.[1] || 'Screen'})`;

  return LazyScreenWrapper;
}

/**
 * Creates a lazy component with a minimum loading delay
 * Prevents "flash" of loading state for fast loads
 */
export function lazyWithDelay<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  minimumDelay: number = 200
): React.LazyExoticComponent<T> {
  return lazy(() =>
    Promise.all([
      importFunc(),
      new Promise((resolve) => setTimeout(resolve, minimumDelay)),
    ]).then(([module]) => module)
  );
}

/**
 * Preload a lazy component (useful for prefetching)
 * Call this when you expect the user to navigate soon
 * 
 * @example
 * // On hover or focus of a navigation element
 * onHoverStart={() => preloadScreen(() => import('../screens/profile'))}
 */
export function preloadScreen<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  importFunc().catch(() => {
    // Silently fail - preloading is optional
    if (__DEV__) {
      console.warn('Failed to preload screen');
    }
  });
}

/**
 * Higher-order component for adding loading boundary
 */
export function withLoadingBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  LoadingComponent: React.ReactNode = <DefaultLoadingFallback />
): React.FC<P> {
  const WithLoadingBoundary: React.FC<P> = (props) => (
    <Suspense fallback={LoadingComponent}>
      <WrappedComponent {...props} />
    </Suspense>
  );

  WithLoadingBoundary.displayName = `WithLoadingBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithLoadingBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default {
  lazyScreen,
  lazyWithDelay,
  preloadScreen,
  withLoadingBoundary,
  DefaultLoadingFallback,
};
