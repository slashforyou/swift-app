/**
 * OnboardingSpotlight — highlights the UI target of the active onboarding step
 * using ABSOLUTE screen coordinates (measureInWindow), not parent-relative.
 *
 * Usage:
 *   const target = useOnboardingTarget(step);
 *   <Pressable ref={target.ref} onLayout={target.onLayout} ... />
 *
 * Also exposes:
 *   - bubbleHiddenForStep: the step for which the user closed the bubble
 *   - hideCurrentBubble(): called by the bubble's close (×) button
 *   - targetForStep(step): read current absolute layout for a step
 *
 * Non-blocking by design (`pointerEvents="none"`) — the user can still tap the target.
 */
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    View,
} from "react-native";
import { ONBOARDING_CONFIG } from "../constants/onboarding";
import { useOnboardingTour } from "./OnboardingTourContext";
import { useTheme } from "./ThemeProvider";

export interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightContextType {
  setTarget: (step: number, layout: TargetLayout | null) => void;
  targets: Record<number, TargetLayout | undefined>;
  bubbleHiddenForStep: number | null;
  hideCurrentBubble: () => void;
  /**
   * Monotonic counter incremented whenever a NEW target is registered for
   * the current step (i.e. a fresh host/modal mounted the target). The
   * overlay uses this to key its Modal and thus re-stack on top of any
   * wizard/native Modal that opened during the step.
   */
  stackVersion: number;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(
  undefined,
);

export const OnboardingSpotlightProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isStepUnseen, setVisibleStep, markStepSeen, welcomeShown } = useOnboardingTour();
  const [targets, setTargets] = useState<Record<number, TargetLayout | undefined>>({});
  const [bubbleHiddenForStep, setBubbleHiddenForStep] = useState<number | null>(null);
  const [stackVersion, setStackVersion] = useState(0);

  // Compute the visible step: the smallest registered step that is unseen.
  // The welcome modal owns step 1; bubbles only kick in once it's dismissed.
  const visibleStep = useMemo(() => {
    if (!welcomeShown) return 0;
    const candidates = Object.keys(targets)
      .map(Number)
      .filter((step) => Number.isFinite(step) && step >= 2 && targets[step])
      .filter((step) => isStepUnseen(step))
      .sort((a, b) => a - b);
    return candidates[0] ?? 0;
  }, [targets, isStepUnseen, welcomeShown]);

  // Publish the visible step to the tour context (which exposes it as currentStep).
  useEffect(() => {
    setVisibleStep(visibleStep as 0 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26);
  }, [visibleStep, setVisibleStep]);

  // When the visible step changes, reset the per-step "hidden by ×" flag.
  useEffect(() => {
    setBubbleHiddenForStep((prev) => (prev === visibleStep ? prev : null));
  }, [visibleStep]);

  const setTarget = useCallback((step: number, layout: TargetLayout | null) => {
    setTargets((prev) => {
      const current = prev[step];
      if (!layout) {
        if (!current) return prev;
        const next = { ...prev };
        delete next[step];
        return next;
      }
      if (
        current &&
        current.x === layout.x &&
        current.y === layout.y &&
        current.width === layout.width &&
        current.height === layout.height
      ) {
        return prev;
      }
      // Fresh target registration for this step → bump stack version so the
      // overlay can re-mount and end up on top of any wizard that just opened.
      if (!current) {
        setStackVersion((v) => v + 1);
      }
      return { ...prev, [step]: layout };
    });
  }, []);

  // Closing the bubble (×) marks the step as permanently seen — it won't return.
  const hideCurrentBubble = useCallback(() => {
    if (visibleStep > 0) {
      setBubbleHiddenForStep(visibleStep);
      markStepSeen(visibleStep);
    }
  }, [visibleStep, markStepSeen]);

  const value = useMemo(
    () => ({
      setTarget,
      targets,
      bubbleHiddenForStep,
      hideCurrentBubble,
      stackVersion,
    }),
    [setTarget, targets, bubbleHiddenForStep, hideCurrentBubble, stackVersion],
  );

  return (
    <SpotlightContext.Provider value={value}>
      {children}
    </SpotlightContext.Provider>
  );
};

function useSpotlightContext(): SpotlightContextType {
  const ctx = useContext(SpotlightContext);
  if (!ctx) {
    throw new Error(
      "useSpotlight must be used inside OnboardingSpotlightProvider",
    );
  }
  return ctx;
}

/**
 * Hook: registers a ref+onLayout pair that reports the element's ABSOLUTE
 * screen position to the spotlight registry.
 *
 * Attach BOTH returned values:
 *   <Pressable ref={t.ref} onLayout={t.onLayout} ... />
 */
export function useOnboardingTarget(step: number): {
  ref: React.RefObject<View | null>;
  onLayout: () => void;
} {
  const { setTarget } = useSpotlightContext();
  const { isStepUnseen } = useOnboardingTour();
  const ref = useRef<View>(null);
  const isUnseen = isStepUnseen(step);

  const measure = useCallback(() => {
    // RAF ensures layout has been committed before measuring.
    requestAnimationFrame(() => {
      const node = ref.current;
      if (!node || typeof node.measureInWindow !== "function") return;
      node.measureInWindow((x, y, width, height) => {
        if (
          typeof x !== "number" ||
          typeof y !== "number" ||
          !width ||
          !height
        ) {
          return;
        }
        setTarget(step, { x, y, width, height });
      });
    });
  }, [setTarget, step]);

  // Only register/measure the target if the step has not been seen yet.
  // Once the bubble has appeared and been dismissed (or the user advanced),
  // the step is marked seen and we stop polling — the bubble will never return.
  useEffect(() => {
    if (!isUnseen) {
      setTarget(step, null);
      return;
    }
    measure();
    const id = setInterval(measure, 200);
    return () => {
      clearInterval(id);
      // Unregister the target when the host component unmounts (navigation
      // away) so the spotlight stops considering this step as available.
      setTarget(step, null);
    };
  }, [isUnseen, step, measure, setTarget]);

  useEffect(() => {
    return () => {
      setTarget(step, null);
    };
  }, [setTarget, step]);

  return { ref, onLayout: measure };
}

export function useOnboardingSpotlight(): SpotlightContextType {
  return useSpotlightContext();
}

/**
 * The visual spotlight: a pulsing ring absolutely positioned over the current step's target.
 * Render once inside the OnboardingTourOverlay tree.
 */
export const OnboardingSpotlight: React.FC = () => {
  const { colors } = useTheme();
  const { currentStep, isActive } = useOnboardingTour();
  const { targets } = useSpotlightContext();

  const pulse = useRef(new Animated.Value(0)).current;

  const layout = isActive ? targets[currentStep] : undefined;

  useEffect(() => {
    if (!layout) {
      pulse.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: ONBOARDING_CONFIG.SPOTLIGHT_PULSE_MS / 2,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: ONBOARDING_CONFIG.SPOTLIGHT_PULSE_MS / 2,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [layout, pulse]);

  if (!layout) return null;

  const padding = 6;
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0.5] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.ring,
          {
            left: layout.x - padding,
            top: layout.y - padding,
            width: layout.width + padding * 2,
            height: layout.height + padding * 2,
            borderColor: colors.primary,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 16,
  },
});
