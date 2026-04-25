/**
 * OnboardingTourOverlay — renders the contextual UI for each onboarding step.
 *
 * Responsibilities:
 *  - Step 1      : render the welcome modal (unchanged).
 *  - Steps 2-13, 15 : render the OnboardingSpotlight ring + OnboardingBubble
 *                   pointing at the current target. No "Next" button anywhere:
 *                   the user advances by actually interacting with the UI
 *                   (advanceToStep / notifyWizardStep are wired at the call sites).
 *  - Step 14     : centered congrats card (no target exists). A single CTA
 *                   closes the card and moves the user to step 15.
 */
import React, { useEffect } from "react";
import { AccessibilityInfo, Keyboard } from "react-native";
import { ONBOARDING_CONFIG } from "../../constants/onboarding";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useTranslation } from "../../localization";
import { OnboardingBubble } from "./OnboardingBubble";
import { OnboardingWelcomeModal } from "./OnboardingWelcomeModal";

const TOTAL_STEPS = ONBOARDING_CONFIG.TOTAL_STEPS;

interface StepConfig {
  emoji: string;
  titleKey: string;
  descKey: string;
}

const STEP_CONFIG: Record<number, StepConfig> = {
  2:  { emoji: "📅", titleKey: "step2Title",  descKey: "step2Description" },
  3:  { emoji: "📆", titleKey: "step3Title",  descKey: "step3Description" },
  4:  { emoji: "➕", titleKey: "step4Title",  descKey: "step4Description" },
  5:  { emoji: "👤", titleKey: "step5Title",  descKey: "step5Description" },
  6:  { emoji: "🏷️", titleKey: "step6Title",  descKey: "step6Description" },
  7:  { emoji: "📍", titleKey: "step7Title",  descKey: "step7Description" },
  8:  { emoji: "🗓️", titleKey: "step8Title",  descKey: "step8Description" },
  9:  { emoji: "📝", titleKey: "step9Title",  descKey: "step9Description" },
  10: { emoji: "💰", titleKey: "step10Title", descKey: "step10Description" },
  11: { emoji: "✅", titleKey: "step11Title", descKey: "step11Description" },
  12: { emoji: "🎉", titleKey: "step12Title", descKey: "step12Description" },
  // Steps 13–19: Job details intro tour
  13: { emoji: "🗂️", titleKey: "step13Title", descKey: "step13Description" },
  14: { emoji: "⚡", titleKey: "step14Title", descKey: "step14Description" },
  15: { emoji: "⏱️", titleKey: "step15Title", descKey: "step15Description" },
  16: { emoji: "🚐", titleKey: "step16Title", descKey: "step16Description" },
  17: { emoji: "📋", titleKey: "step17Title", descKey: "step17Description" },
  18: { emoji: "📝", titleKey: "step18Title", descKey: "step18Description" },
  19: { emoji: "💳", titleKey: "step19Title", descKey: "step19Description" },
  // Steps 20–26: Assign resource flow (renumbered from 13–19)
  20: { emoji: "🚐", titleKey: "step20Title", descKey: "step20Description" },
  21: { emoji: "👷", titleKey: "step21Title", descKey: "step21Description" },
  22: { emoji: "👥", titleKey: "step22Title", descKey: "step22Description" },
  23: { emoji: "🧑‍💼", titleKey: "step23Title", descKey: "step23Description" },
  24: { emoji: "🎉", titleKey: "step24Title", descKey: "step24Description" },
  25: { emoji: "💳", titleKey: "step25Title", descKey: "step25Description" },
  26: { emoji: "👥", titleKey: "step26Title", descKey: "step26Description" },
};

const WIZARD_STEPS: readonly number[] = [5, 6, 7, 8, 9, 10, 11];

export const OnboardingTourOverlay: React.FC = () => {
  const { t } = useTranslation();
  const { currentStep, isActive, isStep1Ready } = useOnboardingTour();

  // Keep keyboard dismissed during wizard steps so the spotlight/bubble stay visible.
  useEffect(() => {
    if (isActive && WIZARD_STEPS.includes(currentStep)) {
      Keyboard.dismiss();
    }
  }, [isActive, currentStep]);

  // Announce step title to screen readers when it changes.
  useEffect(() => {
    if (!isActive || currentStep < 2 || currentStep > TOTAL_STEPS) return;
    const cfg = STEP_CONFIG[currentStep];
    if (!cfg) return;
    const title = t(`onboardingTour.${cfg.titleKey}` as never);
    AccessibilityInfo.announceForAccessibility?.(String(title));
  }, [currentStep, isActive, t]);

  if (!isActive) return null;

  const stepLabel = t("onboardingTour.stepOf")
    .replace("{current}", String(currentStep))
    .replace("{total}", String(TOTAL_STEPS));

  // Step 1: welcome modal only.
  if (currentStep === 1) {
    return <OnboardingWelcomeModal visible={isStep1Ready} />;
  }

  if (currentStep < 2 || currentStep > TOTAL_STEPS) return null;

  const config = STEP_CONFIG[currentStep];
  if (!config) return null;

  const title = t(`onboardingTour.${config.titleKey}` as never);
  const description = t(`onboardingTour.${config.descKey}` as never);

  // Steps 2–13, 15, 17: contextual bubble pointing at the current target.
  // Rendered as an absolute overlay (no Modal) so touches pass through to
  // the highlighted UI and the user can actually interact with it.
  return (
    <OnboardingBubble
      emoji={config.emoji}
      title={String(title)}
      description={String(description)}
      stepLabel={stepLabel}
    />
  );
};
