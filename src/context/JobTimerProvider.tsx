/**
 * JobTimerProvider - Context centralisé pour la gestion du timer
 * Partage le même état de timer entre toutes les pages (summary, job, payment)
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { JobTimerData, useJobTimer } from "../hooks/useJobTimer";
import { syncTimerToBackend } from "../services/jobSteps";
import { timerLogger } from "../utils/logger";

interface JobTimerContextValue {
  // Données du timer
  timerData: JobTimerData | null;
  totalElapsed: number;
  billableTime: number;
  isRunning: boolean;
  isOnBreak: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  stepTimes: any[]; // ✅ NOUVEAU: Historique des temps par étape

  // Valeurs finales (freezées à la complétion)
  finalCost: number | null;
  finalBillableHours: number | null;

  // Actions
  startTimer: () => void;
  advanceStep: (step: number) => void;
  nextStep: () => void; // ✅ Helper pour avancer à l'étape suivante
  stopTimer: () => void; // ✅ Arrêter complètement (dernière étape)
  togglePause: () => void; // ✅ V1.0: Simple Play/Pause toggle

  // Utilitaires
  formatTime: (milliseconds: number, includeSeconds?: boolean) => string;
  calculateCost: (milliseconds: number) => {
    hours: number;
    cost: number;
    rawHours: number;
  };
  HOURLY_RATE_AUD: number;
}

const JobTimerContext = createContext<JobTimerContextValue | undefined>(
  undefined,
);

interface JobTimerProviderProps {
  children: ReactNode;
  jobId: string;
  currentStep: number;
  totalSteps?: number;
  stepNames?: string[]; // ✅ NOUVEAU: Noms des steps depuis job.steps
  jobStatus?: string; // ✅ NOUVEAU: Statut du job ('completed', 'in_progress', etc.)
  onStepChange?: (newStep: number) => void; // ✅ Callback pour synchroniser avec job.step.actualStep
  onJobCompleted?: (finalCost: number, billableHours: number) => void;
}

export const JobTimerProvider: React.FC<JobTimerProviderProps> = ({
  children,
  jobId,
  currentStep,
  totalSteps = 6,
  stepNames = [], // ✅ Par défaut vide
  jobStatus, // ✅ NOUVEAU
  onStepChange,
  onJobCompleted,
}) => {
  // ✅ Ref pour éviter les loops infinis de synchronisation
  const isInternalUpdateRef = useRef(false);

  // ✅ FIX BOUCLE INFINIE #2: Tracker le dernier step synchronisé
  const lastSyncedStepRef = useRef<number>(currentStep);

  // ✅ Validation des props
  const safeJobId = jobId || "unknown";
  const safeCurrentStep = Math.max(0, currentStep || 0);
  const safeTotalSteps = Math.max(1, totalSteps || 5);

  // ✅ FIX BOUCLE INFINIE: Logger uniquement quand les valeurs changent (dans useEffect)
  useEffect(() => {
    timerLogger.step(safeJobId, safeCurrentStep, safeTotalSteps);
  }, [safeJobId, safeCurrentStep, safeTotalSteps]);

  const timer = useJobTimer(safeJobId, safeCurrentStep, {
    totalSteps: safeTotalSteps,
    stepNames, // ✅ Passer les noms des steps
    onJobCompleted,
  });

  // ✅ NOUVEAU: Arrêter le timer automatiquement si le job est completed
  useEffect(() => {
    if (jobStatus === "completed" && timer.isRunning) {
      // TEMP_DISABLED: console.log('🛑 [JobTimerProvider] Job completed detected, stopping timer');
      timer.togglePause(); // Mettre en pause
    }
  }, [jobStatus, timer.isRunning, timer.togglePause]);

  // ✅ Helper pour avancer à l'étape suivante
  const nextStep = useCallback(() => {
    console.log("⏭️ [TIMER_ACTION] nextStep called", {
      jobId: safeJobId,
      currentStep: timer.currentStep,
      targetStep: timer.currentStep + 1,
      safeTotalSteps,
    });
    try {
      if (timer.currentStep < safeTotalSteps) {
        const newStep = timer.currentStep + 1;
        console.log("🔄 [TIMER_ACTION] Advancing step...", {
          from: timer.currentStep,
          to: newStep,
        });
        isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
        timer.advanceStep(newStep);

        // Notifier le parent (jobDetails) du changement d'étape
        if (onStepChange) {
          console.log("📢 [TIMER_ACTION] Notifying parent of step change");
          onStepChange(newStep);
        }

        console.log("✅ [TIMER_ACTION] Step advanced to", newStep);

        // Reset après un court délai
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 100);
      } else {
        console.log("⚠️ [TIMER_ACTION] Cannot advance, already at last step");
      }
    } catch (error) {
      console.error("❌ [TIMER_ACTION] Error in nextStep:", error);
      timerLogger.error("nextStep", error);
      isInternalUpdateRef.current = false;
    }
  }, [
    timer.currentStep,
    timer.advanceStep,
    safeTotalSteps,
    onStepChange,
    safeJobId,
  ]);

  // ✅ Helper pour arrêter le timer (dernière étape)
  const stopTimer = useCallback(() => {
    console.log("🛑 [TIMER_ACTION] stopTimer called", {
      jobId: safeJobId,
      currentStep: timer.currentStep,
      targetStep: safeTotalSteps,
    });
    try {
      timerLogger.sync("toContext", safeTotalSteps);
      isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
      timer.advanceStep(safeTotalSteps); // Avancer à la dernière étape = arrêt

      // Notifier le parent
      if (onStepChange) {
        console.log("📢 [TIMER_ACTION] Notifying parent of job completion");
        onStepChange(safeTotalSteps);
      }

      console.log("✅ [TIMER_ACTION] Timer stopped");

      // Reset après un court délai
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);
    } catch (error) {
      console.error("❌ [TIMER_ACTION] Error in stopTimer:", error);
      timerLogger.error("stopTimer", error);
      isInternalUpdateRef.current = false;
    }
  }, [
    timer.advanceStep,
    safeTotalSteps,
    onStepChange,
    safeJobId,
    timer.currentStep,
  ]);

  // ✅ Wrapper pour advanceStep avec notification
  const advanceStepWithCallback = useCallback(
    (step: number) => {
      console.log("⏭️ [TIMER_ACTION] advanceStepWithCallback called", {
        jobId: safeJobId,
        currentStep: timer.currentStep,
        targetStep: step,
      });
      try {
        isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
        timer.advanceStep(step);

        // Notifier le parent du changement d'étape
        if (onStepChange) {
          console.log(
            "📢 [TIMER_ACTION] Notifying parent of step change to",
            step,
          );
          onStepChange(step);
        }

        console.log("✅ [TIMER_ACTION] Step advanced to", step);

        // Reset après un court délai
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 100);
      } catch (error) {
        console.error(
          "❌ [TIMER_ACTION] Error in advanceStepWithCallback:",
          error,
        );
        timerLogger.error("advanceStepWithCallback", error);
        isInternalUpdateRef.current = false;
      }
    },
    [timer.advanceStep, onStepChange, safeJobId, timer.currentStep],
  );

  // ✅ Synchroniser avec les changements externes de currentStep (depuis jobDetails)
  // IMPORTANT: Garde contre les loops infinis - ne synchronise que si vraiment différent
  useEffect(() => {
    // Ne pas synchroniser si le changement vient de nous-mêmes
    if (isInternalUpdateRef.current) {
      timerLogger.sync("fromContext", currentStep);
      return;
    }

    // ✅ FIX BOUCLE INFINIE #1: Ne pas sync si le timer n'est pas initialisé
    if (!timer.timerData) {
      return;
    }

    // ✅ FIX BOUCLE INFINIE #2: Ne pas sync si le step est déjà le même dans le timer
    if (timer.currentStep === currentStep) {
      lastSyncedStepRef.current = currentStep;
      return;
    }

    // ✅ FIX BOUCLE INFINIE #3: Ne sync que si le step a VRAIMENT changé depuis la dernière sync
    // ET que le nouveau step est SUPÉRIEUR (on ne recule pas)
    if (
      currentStep !== lastSyncedStepRef.current &&
      currentStep > 0 &&
      currentStep > timer.currentStep &&
      timer.isRunning
    ) {
      console.log(
        `🔄 [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`,
      );
      timerLogger.sync("toContext", currentStep);
      timer.advanceStep(currentStep);
      lastSyncedStepRef.current = currentStep;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, timer.timerData, timer.currentStep, timer.isRunning]); // timer.advanceStep stable

  // ✅ Auto-sync timer to API every 30 seconds when running
  // Utilise syncTimerToBackend (POST /job/:id/sync-timer) - Confirmé par backend 2 Jan 2026
  useEffect(() => {
    if (
      timer.isRunning &&
      timer.timerData &&
      !timer.isOnBreak &&
      safeJobId !== "unknown"
    ) {
      const intervalId = setInterval(() => {
        if (timer.timerData) {
          // Convertir les millisecondes en heures
          const totalHours = timer.totalElapsed / (1000 * 60 * 60);
          const billableHours = timer.billableTime / (1000 * 60 * 60);
          const breakHours =
            (timer.timerData.totalBreakTime || 0) / (1000 * 60 * 60);

          syncTimerToBackend(safeJobId, {
            totalHours,
            billableHours,
            breakHours,
            isRunning: timer.isRunning,
          })
            .then((response) => {
              if (response?.success) {
                console.log("✅ [JobTimerProvider] Auto-sync timer successful");
              }
            })
            .catch((error) => {
              console.warn(
                "⚠️ [JobTimerProvider] Auto-sync timer failed:",
                error,
              );
            });
        }
      }, 30000); // 30 seconds

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [
    timer.isRunning,
    timer.timerData,
    timer.isOnBreak,
    timer.totalElapsed,
    timer.billableTime,
    safeJobId,
  ]);

  const value: JobTimerContextValue = {
    timerData: timer.timerData,
    totalElapsed: timer.totalElapsed,
    billableTime: timer.billableTime,
    isRunning: timer.isRunning,
    isOnBreak: timer.isOnBreak,
    currentStep: timer.currentStep,
    totalSteps: timer.totalSteps,
    isCompleted: timer.isCompleted,
    stepTimes: timer.timerData?.stepTimes || [], // ✅ NOUVEAU: Exposer stepTimes
    finalCost: timer.finalCost,
    finalBillableHours: timer.finalBillableHours,

    // Actions
    startTimer: timer.startTimer,
    advanceStep: advanceStepWithCallback,
    nextStep,
    stopTimer,
    togglePause: timer.togglePause, // ✅ V1.0: Simple Play/Pause

    // Utilitaires
    formatTime: timer.formatTime,
    calculateCost: timer.calculateCost,
    HOURLY_RATE_AUD: timer.HOURLY_RATE_AUD,
  };

  return (
    <JobTimerContext.Provider value={value}>
      {children}
    </JobTimerContext.Provider>
  );
};

// ✅ Hook personnalisé pour accéder au context facilement
export const useJobTimerContext = () => {
  const context = useContext(JobTimerContext);

  if (!context) {
    throw new Error(
      "useJobTimerContext must be used within a JobTimerProvider",
    );
  }

  return context;
};
