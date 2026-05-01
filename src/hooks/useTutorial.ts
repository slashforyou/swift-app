import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;
const STORAGE_KEY = "tutorial_completed";
const STEP_KEY = "tutorial_current_step";
const TOTAL_STEPS = 5;

interface UseTutorialReturn {
  showTutorial: boolean;
  currentStep: number;
  nextStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

export function useTutorial(): UseTutorialReturn {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const completed = await AsyncStorage.getItem(STORAGE_KEY);
        if (completed === "true") {
          setInitialized(true);
          return;
        }
        const step = await AsyncStorage.getItem(STEP_KEY);
        setCurrentStep(step ? parseInt(step, 10) : 0);
        setShowTutorial(true);
      } catch {
        // AsyncStorage failure — don't block app
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const persist = useCallback(async (step: number) => {
    try {
      await AsyncStorage.setItem(STEP_KEY, String(step));
    } catch {}
  }, []);

  const markComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
      await AsyncStorage.removeItem(STEP_KEY);
      // Persist to backend
      await authenticatedFetch(`${API}v1/users/me`, {
        method: "PATCH",
        body: JSON.stringify({ tutorial_completed: true }),
      });
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= TOTAL_STEPS) {
        setShowTutorial(false);
        markComplete();
        return prev;
      }
      persist(next);
      return next;
    });
  }, [markComplete, persist]);

  const skipTutorial = useCallback(() => {
    setShowTutorial(false);
    markComplete();
  }, [markComplete]);

  const completeTutorial = useCallback(() => {
    setShowTutorial(false);
    markComplete();
  }, [markComplete]);

  const resetTutorial = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(STEP_KEY);
    } catch {}
    setCurrentStep(0);
    setShowTutorial(true);
  }, []);

  return {
    showTutorial: initialized && showTutorial,
    currentStep,
    nextStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
  };
}
