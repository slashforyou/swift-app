/**
 * Lazy Loading Utilities for React Native Screens
 * Enables code splitting and faster initial load times
 *
 * Usage:
 * const LazyProfile = lazyScreen(() => import('../screens/profile'));
 * <LazyProfile />
 */

import React, {
    ComponentType,
    Suspense,
    lazy,
    useEffect,
    useState,
} from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../localization";

// Mascot loading image
const mascotLoadingImage = require("../../assets/images/mascot/mascotte_loading.png");

interface LazyScreenOptions {
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Minimum delay before showing (prevents flash) */
  minimumDelay?: number;
}

/**
 * Animated dots component for thought bubble
 * Pattern: "   " -> ".  " -> ".. " -> "..." -> " .." -> "  ." -> repeat
 */
const ThoughtBubbleDots: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const dotPatterns = [
    "   ", // step 0
    ".  ", // step 1
    ".. ", // step 2
    "...", // step 3
    " ..", // step 4
    "  .", // step 5
  ];

  return (
    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        letterSpacing: 2,
      }}
    >
      {dotPatterns[step]}
    </Text>
  );
};

/**
 * Default loading fallback component with mascot
 */
export const DefaultLoadingFallback: React.FC<{ color?: string }> = ({
  color = "#007AFF", // Default iOS blue
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.mascotContainer}>
        <Image
          source={mascotLoadingImage}
          style={styles.mascotImage}
          resizeMode="contain"
        />
        {/* Dots positioned at top of image (in thought bubble) */}
        <View style={styles.dotsContainer}>
          <ThoughtBubbleDots />
        </View>
      </View>
      <Text style={[styles.loadingText, { color }]}>
        {t("common.loading") || "Loading"}
      </Text>
    </View>
  );
};

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
  options: LazyScreenOptions = {},
): React.FC<React.ComponentProps<T>> {
  // Extract a readable name from the import for debugging
  const screenName =
    importFunc.toString().match(/import\(['"](.+)['"]\)/)?.[1] || "Screen";

  const LazyComponent = lazy(() =>
    importFunc()
      .then((mod) => {
        if (!mod || typeof mod.default !== "function") {
          console.error(
            `[LazyScreen] Module "${screenName}" resolved but default export is ${typeof mod?.default}. ` +
              `This usually means the module threw during evaluation. Module keys: ${mod ? Object.keys(mod).join(", ") : "null"}`,
          );
          // Return a fallback error component so React doesn't crash
          return {
            default: (() => {
              const ErrorFallback = () => null;
              ErrorFallback.displayName = `ErrorFallback(${screenName})`;
              return ErrorFallback;
            })() as unknown as T,
          };
        }
        return mod;
      })
      .catch((err) => {
        console.error(`[LazyScreen] Import failed for "${screenName}":`, err);
        throw err;
      }),
  );
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
  LazyScreenWrapper.displayName = `Lazy(${screenName})`;

  return LazyScreenWrapper;
}

/**
 * Creates a lazy component with a minimum loading delay
 * Prevents "flash" of loading state for fast loads
 */
export function lazyWithDelay<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  minimumDelay: number = 200,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    Promise.all([
      importFunc(),
      new Promise((resolve) => setTimeout(resolve, minimumDelay)),
    ]).then(([module]) => module),
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
  importFunc: () => Promise<{ default: T }>,
): void {
  importFunc().catch(() => {
    // Silently fail - preloading is optional
    if (__DEV__) {
    }
  });
}

/**
 * Higher-order component for adding loading boundary
 */
export function withLoadingBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  LoadingComponent: React.ReactNode = <DefaultLoadingFallback />,
): React.FC<P> {
  const WithLoadingBoundary: React.FC<P> = (props) => (
    <Suspense fallback={LoadingComponent}>
      <WrappedComponent {...props} />
    </Suspense>
  );

  WithLoadingBoundary.displayName = `WithLoadingBoundary(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithLoadingBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  mascotContainer: {
    position: "relative",
    alignItems: "center",
  },
  mascotImage: {
    width: 200,
    height: 200,
  },
  dotsContainer: {
    position: "absolute",
    top: 8, // 8px from top of image
    left: 0,
    right: 0,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default {
  lazyScreen,
  lazyWithDelay,
  preloadScreen,
  withLoadingBoundary,
  DefaultLoadingFallback,
};
