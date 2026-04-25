/**
 * OnboardingTourContext - Element-driven onboarding for new business owners.
 *
 * Bubbles are tied to UI elements: each bubble appears the FIRST time the user
 * encounters its target element. There is no fixed sequential order — if a
 * user opens a job without creating one first, they will still see the
 * "assign staff" bubble. If a contractor (no permission) opens a job, the
 * element won't render → no bubble at all.
 *
 * State persisted in AsyncStorage:
 *  - seenSteps: numbers the user has already seen (or interacted with)
 *  - welcomeShown: whether the welcome modal (step 1) has been dismissed
 *  - isCompleted: tour fully done (welcome + every step seen at least once)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    ONBOARDING_CONFIG,
    ONBOARDING_PATRON_ROLES,
} from "../constants/onboarding";
import { onboardingTelemetry } from "../services/onboardingTelemetry";

const STORAGE_KEY = ONBOARDING_CONFIG.STORAGE_KEY;
const MAX_STEP = ONBOARDING_CONFIG.TOTAL_STEPS;

// ⚙️ DEV: mettre à true pour toujours afficher l'onboarding (test)
const DEV_FORCE_ONBOARDING = __DEV__;

export type OnboardingStep =
  | 0   // inactive / not started
  | 1   // Welcome modal
  | 2   // Home: go to Calendar
  | 3   // Calendar/Month: select a day
  | 4   // Day view: tap + to create a job
  | 5   // Job wizard – client step
  | 6   // Job wizard – job type / organization step
  | 7   // Job wizard – addresses (after template selected)
  | 8   // Job wizard – schedule (date/time, can be changed here)
  | 9   // Job wizard – details (priority + notes)
  | 10  // Job wizard – pricing (hourly rate, rounding, etc.)
  | 11  // Job wizard – confirmation / job created
  | 12  // Day view (2nd time): tap the new job
  // ── Job details intro tour (13–19) ──
  | 13  // Job details: TabMenu – overview of the 5 tabs
  | 14  // Job details: QuickActionsSection – call/GPS/note/photo
  | 15  // Job details: JobTimerDisplay – timer & step progression
  | 16  // Job details: StaffingSection – assign vehicle & workers
  | 17  // Job details: TabMenu "job" tab
  | 18  // Job details: TabMenu "notes" tab
  | 19  // Job details: TabMenu "payment" tab
  // ── Assign resource flow (renumbered from 13–19) ──
  | 20  // Job details: StaffingSection pass-through → opens AssignResourceModal
  | 21  // Assign resource modal: Worker tab
  | 22  // Business > Staff: add partner/employee
  | 23  // Add staff wizard: choose employee (TFN) vs contractor (ABN)
  | 24  // Congrats: job fully configured
  | 25  // Stripe CTA
  | 26; // Resources page: add team member

interface OnboardingTourState {
  /** Steps the user has already seen at least once (will never be shown again). */
  seenSteps: number[];
  /** Welcome modal (step 1) has been dismissed by the user. */
  welcomeShown: boolean;
  /** Tour fully done (will not show anything anymore). */
  isCompleted: boolean;
}

interface OnboardingTourContextType {
  /**
   * Currently visible step (the bubble we should render right now), or 0 if none.
   * Set by the spotlight when targets register/unregister.
   */
  currentStep: OnboardingStep;
  isActive: boolean;
  isCompleted: boolean;
  isStep1Ready: boolean;
  /** Whether persisted state has finished loading. */
  isInitialized: boolean;
  /** Whether the welcome modal has already been shown to this user. */
  welcomeShown: boolean;
  seenSteps: number[];
  /** Returns true if the given step has not been seen yet. */
  isStepUnseen: (step: number) => boolean;
  /** Mark a step as seen (it will never be shown again). */
  markStepSeen: (step: number) => void;
  /** Called by the spotlight to announce which bubble is currently visible. */
  setVisibleStep: (step: OnboardingStep) => void;
  /** Mark the welcome modal as dismissed. */
  dismissWelcome: () => void;
  /** Notify that a wizard internal step changed (auto-marks corresponding step seen). */
  notifyWizardStep: (wizardStep: string) => void;
  /** Mark home screen as fully rendered so step 1 modal can appear */
  setStep1Ready: (ready: boolean) => void;
  /** Reset (dev/debug) */
  resetTour: () => void;

  // Backward-compat shims (no-op or aliased to new API).
  nextStep: () => void;
  advanceToStep: (step: OnboardingStep) => void;
  advanceIfOnStep: (expected: OnboardingStep) => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | undefined>(undefined);

// Wizard step → onboarding step mapping
const WIZARD_STEP_MAP: Record<string, OnboardingStep> = {
  client: 5,
  "new-client": 5,
  organization: 6,
  "template-selected": 7,
  schedule: 8,
  details: 9,
  pricing: 10,
  confirmation: 11,
};

async function loadState(): Promise<OnboardingTourState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    // New shape.
    if (Array.isArray(parsed.seenSteps)) {
      return {
        seenSteps: parsed.seenSteps.filter(
          (s: unknown) => typeof s === "number" && s >= 1 && s <= MAX_STEP,
        ),
        welcomeShown: Boolean(parsed.welcomeShown),
        isCompleted: Boolean(parsed.isCompleted),
      };
    }
    // Legacy shape: convert currentStep into seenSteps (everything below was seen).
    if (typeof parsed.currentStep === "number") {
      const seen: number[] = [];
      for (let i = 1; i < parsed.currentStep; i++) seen.push(i);
      return {
        seenSteps: seen,
        welcomeShown: parsed.currentStep > 1,
        isCompleted: Boolean(parsed.isCompleted),
      };
    }
    return null;
  } catch (error) {
    onboardingTelemetry.storageError("load", error);
    return null;
  }
}

async function saveState(state: OnboardingTourState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    onboardingTelemetry.storageError("save", error);
  }
}

async function isPatronRole(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync("user_data");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return ONBOARDING_PATRON_ROLES.includes(user?.company_role ?? "");
  } catch (error) {
    onboardingTelemetry.storageError("role_check", error);
    return false;
  }
}

interface OnboardingTourProviderProps {
  children: ReactNode;
}

export const OnboardingTourProvider: React.FC<OnboardingTourProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingTourState>({
    seenSteps: [],
    welcomeShown: false,
    isCompleted: false,
  });
  const [initialized, setInitialized] = useState(false);
  const [isStep1Ready, setIsStep1Ready] = useState(false);
  const [isPatron, setIsPatron] = useState(false);
  const [visibleStep, setVisibleStepState] = useState<OnboardingStep>(0);

  // Load persisted state on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [saved, patron] = await Promise.all([loadState(), isPatronRole()]);

      if (!mounted) return;

      setIsPatron(patron);

      if (!patron && !DEV_FORCE_ONBOARDING) {
        setIsStep1Ready(false);
        setInitialized(true);
        return;
      }

      // DEV: always restart fresh.
      if (DEV_FORCE_ONBOARDING) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        const initial: OnboardingTourState = {
          seenSteps: [],
          welcomeShown: false,
          isCompleted: false,
        };
        setState(initial);
        setIsStep1Ready(false);
        await saveState(initial);
        setInitialized(true);
        onboardingTelemetry.init(1);
        return;
      }

      if (saved?.isCompleted) {
        setState(saved);
        setIsStep1Ready(false);
        setInitialized(true);
        return;
      }

      if (saved) {
        setState(saved);
        setIsStep1Ready(saved.welcomeShown);
        onboardingTelemetry.resume(saved.seenSteps.length);
      } else {
        const initial: OnboardingTourState = {
          seenSteps: [],
          welcomeShown: false,
          isCompleted: false,
        };
        setState(initial);
        setIsStep1Ready(false);
        await saveState(initial);
        onboardingTelemetry.start();
      }
      setInitialized(true);
    })();
    return () => { mounted = false; };
  }, []);

  const isStepUnseen = useCallback((step: number) => {
    if (state.isCompleted) return false;
    if (!state.welcomeShown && step !== 1) return false;
    return !state.seenSteps.includes(step);
  }, [state.isCompleted, state.welcomeShown, state.seenSteps]);

  const markStepSeen = useCallback((step: number) => {
    setState(prev => {
      if (prev.seenSteps.includes(step)) return prev;
      const seenSteps = [...prev.seenSteps, step];
      onboardingTelemetry.stepAdvance(step, step);
      // Steps 2..MAX_STEP (welcome is tracked separately).
      const allSeen = seenSteps.length >= MAX_STEP - 1;
      const next: OnboardingTourState = {
        ...prev,
        seenSteps,
        isCompleted: prev.welcomeShown && allSeen,
      };
      saveState(next);
      return next;
    });
  }, []);

  const setVisibleStep = useCallback((step: OnboardingStep) => {
    setVisibleStepState(step);
  }, []);

  const dismissWelcome = useCallback(() => {
    setState(prev => {
      if (prev.welcomeShown) return prev;
      const next: OnboardingTourState = { ...prev, welcomeShown: true };
      saveState(next);
      return next;
    });
    setIsStep1Ready(false);
  }, []);

  const notifyWizardStep = useCallback((wizardStep: string) => {
    const targetStep = WIZARD_STEP_MAP[wizardStep];
    if (targetStep === undefined) {
      onboardingTelemetry.unmappedWizardStep(wizardStep, 0);
      return;
    }
    // Entering a wizard panel means the previous panel's bubble has been
    // acknowledged — mark step (targetStep - 1) seen, NOT the destination.
    // Without this, the destination's bubble would never appear because it
    // would already be in seenSteps before its target had a chance to show.
    const previousStep = targetStep - 1;
    if (previousStep < 2) return;
    setState(prev => {
      if (prev.isCompleted) return prev;
      if (prev.seenSteps.includes(previousStep)) return prev;
      const seenSteps = [...prev.seenSteps, previousStep];
      const next: OnboardingTourState = { ...prev, seenSteps };
      saveState(next);
      return next;
    });
  }, []);

  const resetTour = useCallback(async () => {
    onboardingTelemetry.reset();
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      onboardingTelemetry.storageError("reset", error);
    }
    setIsStep1Ready(false);
    setVisibleStepState(0);
    setState({ seenSteps: [], welcomeShown: false, isCompleted: false });
  }, []);

  const setStep1Ready = useCallback((ready: boolean) => {
    setIsStep1Ready(ready);
  }, []);

  // Backward-compat shims
  const nextStep = useCallback(() => {
    // Old call used to advance from welcome (step 1) → next.
    // New behavior: simply mark the welcome modal as shown.
    setState(prev => {
      if (prev.welcomeShown) return prev;
      const next: OnboardingTourState = { ...prev, welcomeShown: true };
      saveState(next);
      return next;
    });
    setIsStep1Ready(false);
  }, []);

  const advanceToStep = useCallback((step: OnboardingStep) => {
    // Mark the *previous* step as seen (user has moved past it).
    setState(prev => {
      if (prev.isCompleted) return prev;
      if (step <= 1) return prev;
      const previousStep = step - 1;
      if (prev.seenSteps.includes(previousStep)) return prev;
      const seenSteps = [...prev.seenSteps, previousStep];
      const next: OnboardingTourState = { ...prev, seenSteps };
      saveState(next);
      return next;
    });
  }, []);

  const advanceIfOnStep = useCallback((_expected: OnboardingStep) => {
    // No-op: bubbles are element-driven, not sequential.
  }, []);

  const isActive = useMemo(() => {
    if (!initialized) return false;
    if (state.isCompleted) return false;
    if (!isPatron && !DEV_FORCE_ONBOARDING) return false;
    return true;
  }, [initialized, state.isCompleted, isPatron]);

  // Compute "currentStep" exposed to consumers:
  //  - 1 if the welcome modal has not been shown yet (so step 1 UI renders)
  //  - otherwise, the spotlight-published visibleStep (or 0 if none registered)
  const currentStep: OnboardingStep = useMemo(() => {
    if (!isActive) return 0;
    if (!state.welcomeShown) return 1;
    return visibleStep;
  }, [isActive, state.welcomeShown, visibleStep]);

  const value = useMemo<OnboardingTourContextType>(
    () => ({
      currentStep,
      isActive,
      isCompleted: state.isCompleted,
      isStep1Ready,
      isInitialized: initialized,
      welcomeShown: state.welcomeShown,
      seenSteps: state.seenSteps,
      isStepUnseen,
      markStepSeen,
      setVisibleStep,
      dismissWelcome,
      notifyWizardStep,
      setStep1Ready,
      resetTour,
      nextStep,
      advanceToStep,
      advanceIfOnStep,
    }),
    [
      currentStep,
      isActive,
      state.isCompleted,
      state.welcomeShown,
      state.seenSteps,
      isStep1Ready,
      initialized,
      isStepUnseen,
      markStepSeen,
      setVisibleStep,
      dismissWelcome,
      notifyWizardStep,
      setStep1Ready,
      resetTour,
      nextStep,
      advanceToStep,
      advanceIfOnStep,
    ],
  );

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
    </OnboardingTourContext.Provider>
  );
};

export const useOnboardingTour = (): OnboardingTourContextType => {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) {
    throw new Error("useOnboardingTour must be used inside OnboardingTourProvider");
  }
  return ctx;
};
