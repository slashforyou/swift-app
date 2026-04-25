/**
 * OnboardingWelcomeModal - Step 1 of the patron onboarding tour.
 * Centered card with staggered reveal animation on a dimmed backdrop.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    AccessibilityInfo,
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { ONBOARDING_CONFIG } from "../../constants/onboarding";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

interface OnboardingWelcomeModalProps {
  visible: boolean;
}

export const OnboardingWelcomeModal: React.FC<OnboardingWelcomeModalProps> = ({
  visible,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { dismissWelcome } = useOnboardingTour();

  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect OS-level reduce motion preference (a11y).
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled),
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  // Animated.Values are stable across renders — useState guarantees single allocation.
  const [revealAnim] = useState(() => ({
    emoji: new Animated.Value(0),
    title: new Animated.Value(0),
    subtitle: new Animated.Value(0),
    description: new Animated.Value(0),
    preview: new Animated.Value(0),
    cta: new Animated.Value(0),
  }));

  const revealAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const resetAnimations = useCallback(() => {
    Object.values(revealAnim).forEach((v) => v.setValue(0));
  }, [revealAnim]);

  const stopAnimations = useCallback(() => {
    revealAnimRef.current?.stop();
    revealAnimRef.current = null;
  }, []);

  const revealAllInstant = useCallback(() => {
    Object.values(revealAnim).forEach((v) => v.setValue(1));
  }, [revealAnim]);

  const runEntranceAnimations = useCallback(() => {
    stopAnimations();
    resetAnimations();

    if (reduceMotion) {
      revealAllInstant();
      return;
    }

    const revealValues = [
      revealAnim.emoji,
      revealAnim.title,
      revealAnim.subtitle,
      revealAnim.description,
      revealAnim.preview,
      revealAnim.cta,
    ];

    revealAnimRef.current = Animated.stagger(
      ONBOARDING_CONFIG.WELCOME_STAGGER_MS,
      revealValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: ONBOARDING_CONFIG.WELCOME_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    revealAnimRef.current.start();
  }, [
    reduceMotion,
    resetAnimations,
    revealAllInstant,
    revealAnim,
    stopAnimations,
  ]);

  useEffect(() => {
    if (!visible) {
      stopAnimations();
      resetAnimations();
      return;
    }
    return () => {
      stopAnimations();
    };
  }, [visible, resetAnimations, stopAnimations]);

  // Theme-aware colors for dark-mode support.
  const CARD_BG = colors.backgroundTertiary;
  const TEXT_PRIMARY = colors.text;
  const TEXT_SECONDARY = colors.textSecondary;
  const SURFACE = colors.backgroundSecondary;

  const animatedRevealStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      onShow={runEntranceAnimations}
      accessibilityViewIsModal
    >
      <View
        style={styles.backdrop}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View
          style={[styles.card, { backgroundColor: CARD_BG }]}
          accessibilityRole="none"
          accessible={false}
        >
          {/* Emoji félicitations */}
          <Animated.View
            style={animatedRevealStyle(revealAnim.emoji)}
            accessible
            accessibilityLabel={t("onboardingTour.congratsTitle")}
          >
            <Text style={styles.mainEmoji}>🎉</Text>
          </Animated.View>

          {/* Titre */}
          <Animated.View style={animatedRevealStyle(revealAnim.title)}>
            <Text
              style={[styles.title, { color: TEXT_PRIMARY }]}
              accessibilityRole="header"
            >
              {t("onboardingTour.congratsTitle")}
            </Text>
          </Animated.View>
          <Animated.View style={animatedRevealStyle(revealAnim.subtitle)}>
            <Text style={[styles.subtitle, { color: TEXT_SECONDARY }]}>
              {t("onboardingTour.congratsSubtitle")}
            </Text>
          </Animated.View>

          {/* Description */}
          <Animated.View style={animatedRevealStyle(revealAnim.description)}>
            <Text style={[styles.description, { color: TEXT_SECONDARY }]}>
              {t("onboardingTour.welcomeDescription")}
            </Text>
          </Animated.View>

          {/* Aperçu des étapes */}
          <Animated.View
            style={[animatedRevealStyle(revealAnim.preview), { width: "100%" }]}
          >
            <View style={[styles.stepsPreview, { backgroundColor: SURFACE }]}>
              {[
                { emoji: "📅", text: t("onboardingTour.step3Title") },
                { emoji: "💼", text: t("onboardingTour.step4Title") },
                { emoji: "👥", text: t("onboardingTour.step13Title") },
                { emoji: "💳", text: t("onboardingTour.step18Title") },
              ].map((item, index) => (
                <View key={index} style={styles.previewRow}>
                  <Text style={styles.previewEmoji}>{item.emoji}</Text>
                  <Text style={[styles.previewText, { color: TEXT_PRIMARY }]}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Actions */}
          <Animated.View
            style={[animatedRevealStyle(revealAnim.cta), { width: "100%" }]}
          >
            <Pressable
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              onPress={dismissWelcome}
              accessibilityRole="button"
              accessibilityLabel={t("onboardingTour.welcomeCta")}
            >
              <Text style={styles.ctaText}>
                {t("onboardingTour.welcomeCta")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
  },
  card: {
    width: "100%",
    borderRadius: DESIGN_TOKENS.radius.lg,
    padding: DESIGN_TOKENS.spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  mainEmoji: {
    fontSize: 56,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  stepsPreview: {
    width: "100%",
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  previewEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  previewText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
