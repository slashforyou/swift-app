/**
 * JobTimerProvider - Context centralisé pour la gestion du timer
 * Partage le même état de timer entre toutes les pages (summary, job, payment)
 *
 * ⚠️ Utilise JobStepsConfig.ts comme source unique de vérité pour les steps
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
import { calculateTotalSteps } from "../constants/JobStepsConfig";
import { JobTimerData, useJobTimer } from "../hooks/useJobTimer";
import {
    completeSegmentApi,
    startSegmentApi,
    updateReturnTripApi,
} from '../services/jobSegmentApiService';
import { syncTimerToBackend } from "../services/jobSteps";
import { type PricingResult } from "../services/pricing";
import type { JobSegmentInstance } from "../types/jobSegment";
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
  stepTimes: any[]; // ✅ Historique des temps par étape

  // Valeurs finales (freezées à la complétion)
  finalCost: number | null;
  finalBillableHours: number | null;

  // Actions
  startTimer: () => void;
  advanceStep: (step: number) => void;
  nextStep: () => void;
  stopTimer: () => void;
  togglePause: () => void;

  // Utilitaires
  formatTime: (milliseconds: number, includeSeconds?: boolean) => string;
  calculateCost: (milliseconds: number) => PricingResult;
  HOURLY_RATE_AUD: number;

  // ── Segments modulaires (optionnel — activé si segments[] fourni) ──
  segments: JobSegmentInstance[];
  currentSegment: JobSegmentInstance | null;
  segmentTimes: Record<string, number>; // segmentId → elapsed ms
  startSegment: (segmentId: string) => void;
  completeSegment: (segmentId: string) => void;
  setReturnTripDuration: (minutes: number) => void;
}

const JobTimerContext = createContext<JobTimerContextValue | undefined>(
  undefined,
);

interface JobTimerProviderProps {
  children: ReactNode;
  jobId: string;
  realJobId?: number | string;
  currentStep: number;
  totalSteps?: number;
  stepNames?: string[];
  addresses?: any[];
  jobStatus?: string;
  onStepChange?: (newStep: number) => void;
  onJobCompleted?: (finalCost: number, billableHours: number) => void;
  // ── Segments modulaires (optionnel) ──
  initialSegments?: JobSegmentInstance[];
}

export const JobTimerProvider: React.FC<JobTimerProviderProps> = ({
  children,
  jobId,
  realJobId,
  currentStep,
  totalSteps: totalStepsProp,
  stepNames = [],
  addresses = [],
  jobStatus,
  onStepChange,
  onJobCompleted,
  initialSegments,
}) => {
  // ✅ Ref pour éviter les loops infinis de synchronisation
  const isInternalUpdateRef = useRef(false);

  // ✅ FIX BOUCLE INFINIE #2: Tracker le dernier step synchronisé
  const lastSyncedStepRef = useRef<number>(currentStep);

  // ✅ Calcul dynamique du nombre de steps basé sur les adresses
  const totalSteps = useMemo(() => {
    if (totalStepsProp) return totalStepsProp;
    const addressCount = addresses.length || 2; // Minimum 2 adresses
    return calculateTotalSteps(addressCount, true);
  }, [totalStepsProp, addresses]);

  // ✅ Validation des props
  const safeJobId = jobId || "unknown";
  const safeCurrentStep = Math.max(0, currentStep || 0);
  const safeTotalSteps = Math.max(1, totalSteps || 7); // 7 steps par défaut (2 adresses + retour)

  // ✅ FIX BOUCLE INFINIE: Logger uniquement quand les valeurs changent (dans useEffect)
  useEffect(() => {
    timerLogger.step(safeJobId, safeCurrentStep, safeTotalSteps);
  }, [safeJobId, safeCurrentStep, safeTotalSteps]);

  const timer = useJobTimer(safeJobId, safeCurrentStep, {
    realJobId,
    totalSteps: safeTotalSteps,
    stepNames,
    addresses,
    onJobCompleted,
    jobStatus,
  });

  // ── Segments modulaires ──
  const [segments, setSegments] = useState<JobSegmentInstance[]>(
    initialSegments ?? [],
  );
  const [segmentTimes, setSegmentTimes] = useState<Record<string, number>>({});
  const activeSegmentIdRef = useRef<string | null>(null);
  const segmentStartRef = useRef<number | null>(null);

  // Réinitialiser les segments si initialSegments change
  useEffect(() => {
    if (initialSegments && initialSegments.length > 0) {
      setSegments(initialSegments);
    }
  }, [initialSegments]);

  // Mettre à jour le temps du segment courant (chaque seconde)
  useEffect(() => {
    if (activeSegmentIdRef.current && segmentStartRef.current && timer.isRunning && !timer.isOnBreak) {
      const id = activeSegmentIdRef.current;
      const elapsed = Date.now() - segmentStartRef.current;
      setSegmentTimes((prev) => ({ ...prev, [id]: elapsed }));
    }
  }, [timer.isRunning, timer.isOnBreak, timer.totalElapsed]); // tick chaque seconde via totalElapsed

  const currentSegment = useMemo(() => {
    if (!activeSegmentIdRef.current) return null;
    return segments.find((s) => s.id === activeSegmentIdRef.current) ?? null;
  }, [segments, segmentTimes]); // segmentTimes force refresh

  const startSegment = useCallback((segmentId: string) => {
    const now = Date.now();
    activeSegmentIdRef.current = segmentId;
    segmentStartRef.current = now;
    setSegments((prev) =>
      prev.map((s) =>
        s.id === segmentId ? { ...s, startedAt: new Date(now).toISOString() } : s,
      ),
    );
    // Persist to backend (fire-and-forget)
    if (realJobId) {
      startSegmentApi(realJobId, segmentId).catch((err) =>
        console.warn('Failed to sync startSegment to API:', err.message),
      );
    }
  }, [realJobId]);

  const completeSegment = useCallback((segmentId: string) => {
    const now = Date.now();
    const elapsed = segmentStartRef.current
      ? now - segmentStartRef.current
      : 0;

    setSegments((prev) =>
      prev.map((s) =>
        s.id === segmentId
          ? { ...s, completedAt: new Date(now).toISOString(), durationMs: elapsed }
          : s,
      ),
    );
    setSegmentTimes((prev) => ({ ...prev, [segmentId]: elapsed }));

    // Persist to backend (fire-and-forget)
    if (realJobId) {
      completeSegmentApi(realJobId, segmentId).catch((err) =>
        console.warn('Failed to sync completeSegment to API:', err.message),
      );
    }

    // Passer au segment suivant
    const currentIdx = segments.findIndex((s) => s.id === segmentId);
    const nextSeg = segments[currentIdx + 1];
    if (nextSeg) {
      activeSegmentIdRef.current = nextSeg.id;
      segmentStartRef.current = now;
      setSegments((prev) =>
        prev.map((s) =>
          s.id === nextSeg.id ? { ...s, startedAt: new Date(now).toISOString() } : s,
        ),
      );
      // Start next segment on backend
      if (realJobId) {
        startSegmentApi(realJobId, nextSeg.id).catch((err) =>
          console.warn('Failed to sync startSegment (next) to API:', err.message),
        );
      }
    } else {
      activeSegmentIdRef.current = null;
      segmentStartRef.current = null;
    }
  }, [segments, realJobId]);

  const setReturnTripDuration = useCallback((minutes: number) => {
    setSegments((prev) =>
      prev.map((s) =>
        s.isReturnTrip
          ? { ...s, configuredDurationMinutes: minutes, durationMs: minutes * 60 * 1000 }
          : s,
      ),
    );
    // Persist to backend (fire-and-forget)
    if (realJobId) {
      updateReturnTripApi(realJobId, minutes).catch((err) =>
        console.warn('Failed to sync returnTrip to API:', err.message),
      );
    }
  }, [realJobId]);

  // ✅ NOUVEAU: Arrêter le timer automatiquement si le job est completed
  useEffect(() => {
    if (jobStatus === "completed" && timer.isRunning) {
      timer.togglePause(); // Mettre en pause
    }
  }, [jobStatus, timer.isRunning, timer.togglePause]);

  // ✅ Helper pour avancer à l'étape suivante
  const nextStep = useCallback(() => {
    try {
      if (timer.currentStep < safeTotalSteps) {
        const newStep = timer.currentStep + 1;
        isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
        timer.advanceStep(newStep);

        // Notifier le parent (jobDetails) du changement d'étape
        if (onStepChange) {
          onStepChange(newStep);
        }

        // Reset après un court délai
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 100);
      } else {
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
    timer.isRunning,
    timer.timerData,
  ]);

  // ✅ Helper pour arrêter le timer (dernière étape)
  const stopTimer = useCallback(() => {
    try {
      timerLogger.sync("toContext", safeTotalSteps);
      isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
      timer.advanceStep(safeTotalSteps); // Avancer à la dernière étape = arrêt

      // Notifier le parent
      if (onStepChange) {
        onStepChange(safeTotalSteps);
      }

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
      try {
        isInternalUpdateRef.current = true; // ✅ Marquer comme update interne
        timer.advanceStep(step);

        // Notifier le parent du changement d'étape
        if (onStepChange) {
          onStepChange(step);
        }

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
            .then(() => {
              // Sync success — no action needed
            })
            .catch((error) => {
              // Non-critical: periodic sync failure, will retry
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

  // ✅ FIX PERFORMANCE: Mémoiser le context value pour éviter les re-renders inutiles
  // Les actions (fonctions) ne changent pas à chaque seconde, seulement les valeurs du timer
  const value: JobTimerContextValue = useMemo(
    () => ({
      timerData: timer.timerData,
      totalElapsed: timer.totalElapsed,
      billableTime: timer.billableTime,
      isRunning: timer.isRunning,
      isOnBreak: timer.isOnBreak,
      currentStep: timer.currentStep,
      totalSteps: timer.totalSteps,
      isCompleted: timer.isCompleted,
      stepTimes: timer.timerData?.stepTimes || [],
      finalCost: timer.finalCost,
      finalBillableHours: timer.finalBillableHours,

      // Actions
      startTimer: timer.startTimer,
      advanceStep: advanceStepWithCallback,
      nextStep,
      stopTimer,
      togglePause: timer.togglePause,

      // Utilitaires
      formatTime: timer.formatTime,
      calculateCost: timer.calculateCost,
      HOURLY_RATE_AUD: timer.HOURLY_RATE_AUD,

      // Segments modulaires
      segments,
      currentSegment,
      segmentTimes,
      startSegment,
      completeSegment,
      setReturnTripDuration,
    }),
    [
      timer.timerData,
      timer.totalElapsed,
      timer.billableTime,
      timer.isRunning,
      timer.isOnBreak,
      timer.currentStep,
      timer.totalSteps,
      timer.isCompleted,
      timer.finalCost,
      timer.finalBillableHours,
      timer.startTimer,
      advanceStepWithCallback,
      nextStep,
      stopTimer,
      timer.togglePause,
      timer.formatTime,
      timer.calculateCost,
      timer.HOURLY_RATE_AUD,
      segments,
      currentSegment,
      segmentTimes,
      startSegment,
      completeSegment,
      setReturnTripDuration,
    ],
  );

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
