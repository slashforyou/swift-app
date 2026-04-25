/**
 * OnboardingBubble — contextual speech bubble that points to the current
 * onboarding step's UI target, using absolute screen coordinates published
 * by OnboardingSpotlightContext.
 *
 * UX:
 *  - No "Next" button. The user advances by actually interacting with the UI.
 *  - × close button → hides the bubble for the current step (via context).
 *  - Skip link (with confirmation) → terminates the tour.
 *  - Progress bar (no "Step X of Y" wording) to avoid overwhelming users.
 *
 * Placement:
 *  - Below the target if target sits in the top half of the screen.
 *  - Above otherwise.
 *  - Horizontal center clamped to the screen with a small margin.
 *  - Real bubble height is measured via onLayout and the position is
 *    recomputed, so the arrow & body sit flush against the target.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    AccessibilityInfo,
    Animated,
    Dimensions,
    Easing,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { ONBOARDING_CONFIG } from "../../constants/onboarding";
import {
    TargetLayout,
    useOnboardingSpotlight,
} from "../../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

const BUBBLE_WIDTH = Math.min(320, Dimensions.get("window").width - 32);
const SIDE_MARGIN = 16;
const GAP = 14; // gap between target and bubble
const ARROW_SIZE = 10;
const TOTAL_STEPS = ONBOARDING_CONFIG.TOTAL_STEPS;

interface Props {
  emoji: string;
  title: string;
  description: string;
  /** Accessible label describing the current step (e.g. "Step 3 of 15"). */
  stepLabel: string;
}

export const OnboardingBubble: React.FC<Props> = ({
  emoji,
  title,
  description,
  stepLabel,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: winW, height: winH } = useWindowDimensions();
  const { currentStep } = useOnboardingTour();
  const { targets, bubbleHiddenForStep, hideCurrentBubble } =
    useOnboardingSpotlight();

  const target: TargetLayout | undefined = targets[currentStep];

  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Entrance animation: the bubble scales up from a tiny dot to full size.
  const grow = useRef(new Animated.Value(0)).current;
  const hasAnimatedRef = useRef(false);

  const stepKey = currentStep;
  React.useEffect(() => {
    setMeasuredHeight(null);
    grow.setValue(0);
    hasAnimatedRef.current = false;
  }, [stepKey, grow]);

  React.useEffect(() => {
    if (measuredHeight === null) return;
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    const growAnim = Animated.timing(grow, {
      toValue: 1,
      duration: 380,
      delay: 60,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    });
    growAnim.start();
    return () => {
      growAnim.stop();
    };
  }, [measuredHeight, grow]);

  // Auto-dismiss countdown. Tapping the bubble pins it (cancels the timer)
  // until the user navigates away, presses the trigger element, or closes (×).
  const [pinned, setPinned] = useState(false);
  const countdown = useRef(new Animated.Value(1)).current;
  const targetKey = target ? `${target.x}:${target.y}:${target.width}:${target.height}` : "none";

  React.useEffect(() => {
    setPinned(false);
    countdown.setValue(1);
  }, [stepKey, countdown]);

  React.useEffect(() => {
    if (!target) return;
    if (bubbleHiddenForStep === currentStep) return;
    if (pinned) return;
    countdown.setValue(1);
    const anim = Animated.timing(countdown, {
      toValue: 0,
      duration: ONBOARDING_CONFIG.BUBBLE_AUTO_DISMISS_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    const timer = setTimeout(() => {
      hideCurrentBubble();
    }, ONBOARDING_CONFIG.BUBBLE_AUTO_DISMISS_MS);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
  }, [stepKey, targetKey, bubbleHiddenForStep, currentStep, hideCurrentBubble, target, pinned, countdown]);

  const handleBubbleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    // Only record the FIRST measured height. Subsequent layout events (e.g.
    // the bubble growing as letters are revealed) are ignored so the bubble
    // doesn't jump around while the typewriter effect runs.
    setMeasuredHeight((prev) => (prev === null ? h : prev));
  }, []);

  const layout = useMemo(() => {
    if (!target) return null;
    const bubbleWidth = Math.min(BUBBLE_WIDTH, winW - SIDE_MARGIN * 2);
    const targetCenterX = target.x + target.width / 2;
    const targetMidY = target.y + target.height / 2;

    // Place below target if target is in top half, otherwise above.
    const placeBelow = targetMidY < winH / 2;
    const estimatedH = measuredHeight ?? 160;

    let left = targetCenterX - bubbleWidth / 2;
    if (left < SIDE_MARGIN) left = SIDE_MARGIN;
    if (left + bubbleWidth > winW - SIDE_MARGIN) {
      left = winW - SIDE_MARGIN - bubbleWidth;
    }

    let top = placeBelow
      ? target.y + target.height + GAP
      : target.y - GAP - estimatedH;

    // Clamp vertically so the bubble never escapes the screen.
    if (top < SIDE_MARGIN) top = SIDE_MARGIN;
    if (top + estimatedH > winH - SIDE_MARGIN) {
      top = Math.max(SIDE_MARGIN, winH - SIDE_MARGIN - estimatedH);
    }

    const arrowLeft = Math.max(
      16,
      Math.min(
        bubbleWidth - 16 - ARROW_SIZE * 2,
        targetCenterX - left - ARROW_SIZE,
      ),
    );

    return { left, top, width: bubbleWidth, placeBelow, arrowLeft };
  }, [target, winW, winH, measuredHeight]);

  if (!target || !layout || bubbleHiddenForStep === currentStep) return null;

  const handlePin = () => {
    if (!pinned) setPinned(true);
  };

  const handleClose = () => {
    hideCurrentBubble();
    AccessibilityInfo.announceForAccessibility?.(
      t("onboardingTour.bubbleDismissed"),
    );
  };

  const progressPct = Math.max(
    0,
    Math.min(1, (currentStep - 1) / (TOTAL_STEPS - 1)),
  );
  void progressPct; // legacy — kept for a11y stepLabel only

  // Always-light palette so the bubble pops in dark mode too.
  const BUBBLE_BG = "#FFFFFF";
  const BUBBLE_BORDER = "#E5E7EB"; // gray-200
  const TEXT_PRIMARY = "#111827"; // gray-900
  const TEXT_SECONDARY = "#4B5563"; // gray-600
  const TRACK_BG = "#E5E7EB";

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="auto"
        onLayout={handleBubbleLayout}
        style={[
          styles.bubble,
          {
            left: layout.left,
            top: layout.top,
            width: layout.width,
            backgroundColor: BUBBLE_BG,
            borderColor: BUBBLE_BORDER,
            opacity: measuredHeight === null ? 0 : 1,
            // Anchor the scale origin towards the arrow side so it grows
            // from the target, not from the center.
            transform: [
              {
                scale: grow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 1],
                }),
              },
            ],
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={stepLabel}
      >
        {/* arrow */}
        <View
          pointerEvents="none"
          style={[
            styles.arrow,
            layout.placeBelow ? styles.arrowUp : styles.arrowDown,
            {
              left: layout.arrowLeft,
              borderBottomColor: layout.placeBelow ? BUBBLE_BG : "transparent",
              borderTopColor: layout.placeBelow ? "transparent" : BUBBLE_BG,
              [layout.placeBelow ? "top" : "bottom"]: -ARROW_SIZE,
            },
          ]}
        />

        {/* Top row: countdown bar + close */}
        <View style={styles.topRow}>
          <View
            style={[styles.progressTrack, { backgroundColor: TRACK_BG }]}
            accessibilityLabel={stepLabel}
          >
            {pinned ? null : (
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: countdown.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            )}
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("onboardingTour.closeBubble")}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={18} color={TEXT_SECONDARY} />
          </Pressable>
        </View>

        {/* body — tapping pins the bubble (cancels auto-dismiss) */}
        <Pressable
          onPress={handlePin}
          accessibilityRole="button"
          accessibilityLabel={t("onboardingTour.bubbleDismissed")}
          style={styles.body}
        >
          <Text style={styles.emoji} accessible={false}>
            {emoji}
          </Text>
          <View style={styles.textArea}>
            <Text
              style={[styles.title, { color: TEXT_PRIMARY }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            <Text style={[styles.description, { color: TEXT_SECONDARY }]}>
              {description}
            </Text>
          </View>
        </Pressable>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  arrowUp: {
    borderBottomWidth: ARROW_SIZE,
  },
  arrowDown: {
    borderTopWidth: ARROW_SIZE,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  closeBtn: {
    padding: 2,
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DESIGN_TOKENS.spacing.md,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  textArea: {
    flex: 1,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  skipRow: {
    alignSelf: "flex-end",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
