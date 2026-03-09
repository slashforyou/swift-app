/**
 * Hook pour gérer le chronométrage des jobs
 * Persiste les données entre les sessions et calcule les temps par étape
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    completeJob,
    getTimerFromBackend,
    syncStepToBackend,
    updateJobStep,
} from "../services/jobSteps";
import { timerLogger } from "../utils/logger";

// ✅ Import du service de pricing centralisé
import {
    DEFAULT_PRICING_CONFIG,
    PricingService,
    type JobPricingConfig,
    type PricingResult,
} from "../services/pricing";

// ✅ Imports depuis la configuration centralisée des steps
import {
    calculateTotalSteps,
    generateStepsFromAddresses,
} from "../constants/JobStepsConfig";

// ✅ FIX SESSION 10: Ajouter realJobId comme paramètre optionnel

export interface JobStepTime {
  step: number;
  stepName: string;
  startTime: number;
  endTime?: number;
  duration?: number; // en millisecondes
}

export interface JobBreakTime {
  startTime: number;
  endTime?: number;
  duration?: number; // en millisecondes
}

export interface JobTimerData {
  jobId: string;
  startTime: number; // Timestamp du début du job (step 0 -> 1)
  currentStep: number;
  stepTimes: JobStepTime[];
  breakTimes: JobBreakTime[]; // Périodes de pause
  isRunning: boolean;
  isOnBreak: boolean; // État de pause actuel
  totalElapsed: number; // Temps total en millisecondes
  totalBreakTime: number; // Temps total de pause en millisecondes
}

const TIMER_STORAGE_KEY = "jobTimers";

export const useJobTimer = (
  jobId: string,
  currentStep: number = 0,
  options?: {
    realJobId?: number | string; // ✅ FIX SESSION 10: Vrai ID numérique du job
    totalSteps?: number; // ✅ Nombre total d'étapes (dynamique)
    stepNames?: string[]; // ✅ NOUVEAU: Noms des steps dynamiques depuis job.steps
    addresses?: any[]; // ✅ NOUVEAU: Adresses pour calcul dynamique
    pricingConfig?: Partial<JobPricingConfig>; // ✅ NOUVEAU: Configuration de pricing
    onJobCompleted?: (finalCost: number, billableHours: number) => void; // ✅ Callback de complétion
    jobStatus?: string; // ✅ FIX: Statut du job ('completed', 'in_progress', etc.)
  },
) => {
  const [timerData, setTimerData] = useState<JobTimerData | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [finalCost, setFinalCost] = useState<number | null>(null); // ✅ Coût final freezé
  const [finalBillableHours, setFinalBillableHours] = useState<number | null>(
    null,
  ); // ✅ Heures finales freezées

  // ✅ Calcul dynamique du nombre de steps basé sur les adresses
  const addresses = options?.addresses || [];
  const addressCount = addresses.length || 2; // Minimum 2 adresses
  const totalSteps =
    options?.totalSteps || calculateTotalSteps(addressCount, true);

  // ✅ Génération dynamique des noms de steps
  const dynamicSteps = useMemo(
    () =>
      generateStepsFromAddresses(
        addresses.length > 0
          ? addresses
          : [{ street: "Adresse 1" }, { street: "Adresse 2" }],
        true,
      ),
    [addresses],
  );

  const stepNames = useMemo(
    () => options?.stepNames || dynamicSteps.map((s) => s.name),
    [options?.stepNames, dynamicSteps],
  ); // ✅ Mémorisé
  const onJobCompleted = options?.onJobCompleted; // ✅ Callback

  // ✅ FIX BOUCLE INFINIE: Ref pour currentStep (évite les re-renders)
  const currentStepRef = useRef(currentStep);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // ✅ Helper pour obtenir le nom d'un step (dynamique depuis JobStepsConfig)
  const getStepName = useCallback(
    (step: number): string => {
      // Priorité 1: Utiliser stepNames fourni
      if (stepNames.length > 0 && step >= 0 && step < stepNames.length) {
        return stepNames[step];
      }

      // Priorité 2: Utiliser les steps dynamiques générés
      const stepConfig = dynamicSteps.find((s) => s.id === step);
      if (stepConfig) {
        return stepConfig.name;
      }

      // Fallback
      return `Étape ${step}`;
    },
    [stepNames, dynamicSteps],
  );

  // ✅ FIX BOUCLE INFINIE: Ref pour getStepName (évite recréation de loadTimerData)
  const getStepNameRef = useRef(getStepName);
  useEffect(() => {
    getStepNameRef.current = getStepName;
  }, [getStepName]);

  // Met à jour l'heure actuelle toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Ref pour éviter les chargements multiples
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastJobIdRef = useRef<string | null>(null);

  // Charger les données du timer depuis le storage
  const loadTimerData = useCallback(async () => {
    // ✅ FIX BOUCLE INFINIE: Éviter les chargements multiples
    if (isLoadingRef.current) {
      console.log("⏳ [useJobTimer] Already loading, skipping...");
      return;
    }

    // ✅ FIX: Si déjà chargé pour ce job, ne pas recharger
    if (hasLoadedRef.current && lastJobIdRef.current === jobId) {
      console.log("✅ [useJobTimer] Already loaded for this job, skipping...");
      return;
    }

    isLoadingRef.current = true;
    lastJobIdRef.current = jobId;

    try {
      // ✅ NOUVEAU: D'abord essayer de récupérer l'état depuis le backend
      // GET /job/:id/timer - Confirmé par backend 2 Jan 2026
      const backendResponse = await getTimerFromBackend(jobId);

      if (backendResponse.success && backendResponse.data?.timer) {
        const backendTimer = backendResponse.data.timer;
        console.log(
          "✅ [useJobTimer] Timer restored from backend:",
          backendTimer,
        );

        // Convertir les heures backend en données locales
        const now = Date.now();
        const totalElapsedMs = backendTimer.totalHours * 60 * 60 * 1000;
        const totalBreakTimeMs = backendTimer.breakHours * 60 * 60 * 1000;
        const estimatedStartTime = backendTimer.isRunning
          ? now - totalElapsedMs
          : 0;

        // ✅ FIX: Utiliser la ref pour éviter les dépendances
        const stepValue = currentStepRef.current;

        const restoredTimer: JobTimerData = {
          jobId,
          startTime: estimatedStartTime,
          currentStep: stepValue,
          stepTimes: [], // Ne peut pas être restauré depuis le backend
          breakTimes: [],
          isRunning: backendTimer.isRunning,
          isOnBreak: false,
          totalElapsed: totalElapsedMs,
          totalBreakTime: totalBreakTimeMs,
        };

        setTimerData(restoredTimer);
        hasLoadedRef.current = true;
        isLoadingRef.current = false;
        return; // Succès, pas besoin de fallback
      }

      // Fallback: Charger depuis AsyncStorage si backend échoue
      console.log("📱 [useJobTimer] Falling back to local storage");
      const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);

      // ✅ FIX: Utiliser la ref pour éviter les dépendances
      const stepValue = currentStepRef.current;

      if (storedData) {
        const timers: Record<string, JobTimerData> = JSON.parse(storedData);
        const jobTimer = timers[jobId];

        if (jobTimer) {
          // ✅ VALIDATION: Détecter incohérence step > 1 mais timer jamais démarré
          if (
            stepValue > 1 &&
            (!jobTimer.startTime || jobTimer.startTime === 0)
          ) {
            console.warn(
              `⚠️ [useJobTimer] INCOHÉRENCE DÉTECTÉE: Job à l'étape ${stepValue}/5 mais timer jamais démarré (startTime = ${jobTimer.startTime})`,
            );
            console.warn(
              "⚠️ [useJobTimer] Auto-correction: Démarrage automatique du timer pour synchroniser les données",
            );

            // Auto-start timer avec timestamp rétroactif (estimé)
            const now = Date.now();
            const estimatedStartTime = now - 24 * 60 * 60 * 1000; // 24h avant (estimation)

            const correctedTimer: JobTimerData = {
              ...jobTimer,
              startTime: estimatedStartTime,
              isRunning: true,
              currentStep: stepValue,
              stepTimes: Array.from({ length: stepValue }, (_, i) => ({
                step: i + 1,
                stepName: getStepNameRef.current(i + 1),
                startTime: estimatedStartTime + i * 60 * 60 * 1000, // 1h par step
                endTime:
                  i < stepValue - 1
                    ? estimatedStartTime + (i + 1) * 60 * 60 * 1000
                    : undefined,
                duration: i < stepValue - 1 ? 60 * 60 * 1000 : undefined,
              })),
              totalElapsed: now - estimatedStartTime,
            };

            setTimerData(correctedTimer);

            // Sync to API - utiliser updateJobStep pour démarrer
            updateJobStep(jobId, 1, "Timer auto-started", options?.realJobId)
              .then(() => {
                // TEMP_DISABLED: console.log('✅ [useJobTimer] Timer auto-started and synced to API');
              })
              .catch(() =>
                console.error(
                  "❌ [useJobTimer] Failed to sync auto-started timer",
                ),
              );
          } else {
            setTimerData(jobTimer);
          }
        } else {
          // Initialiser un nouveau timer pour ce job
          const newTimer: JobTimerData = {
            jobId,
            startTime: 0,
            currentStep: stepValue,
            stepTimes: [],
            breakTimes: [],
            isRunning: false,
            isOnBreak: false,
            totalElapsed: 0,
            totalBreakTime: 0,
          };
          setTimerData(newTimer);
        }
      } else {
        // Pas de données stockées, créer un nouveau timer
        const newTimer: JobTimerData = {
          jobId,
          startTime: 0,
          currentStep: stepValue,
          stepTimes: [],
          breakTimes: [],
          isRunning: false,
          isOnBreak: false,
          totalElapsed: 0,
          totalBreakTime: 0,
        };
        setTimerData(newTimer);
      }

      hasLoadedRef.current = true;
    } catch (error) {
      isLoadingRef.current = false;
      console.error("Error loading timer data:", error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [jobId]); // ✅ FIX BOUCLE INFINIE: Seulement jobId - on utilise les refs pour le reste

  // Sauvegarder les données du timer
  const saveTimerData = useCallback(
    async (data: JobTimerData) => {
      try {
        const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        const timers: Record<string, JobTimerData> = storedData
          ? JSON.parse(storedData)
          : {};

        timers[jobId] = data;
        await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
      } catch (error) {
        console.error("Error saving timer data:", error);
      }
    },
    [jobId],
  );

  // Démarrer le timer (quand on passe de step 0 à 1)
  const startTimer = useCallback(() => {
    if (!timerData) return;

    const now = Date.now();
    const updatedData: JobTimerData = {
      ...timerData,
      startTime: now,
      isRunning: true,
      currentStep: 1,
      stepTimes: [
        {
          step: 1,
          stepName: getStepName(1),
          startTime: now,
        },
      ],
    };

    setTimerData(updatedData);
    saveTimerData(updatedData);

    // ✅ FIX: Synchroniser le démarrage avec updateJobStep
    updateJobStep(jobId, 1, "Timer started", options?.realJobId)
      .then(() => {
        // TEMP_DISABLED: console.log('✅ [useJobTimer] Timer started and synced to API');
      })
      .catch(() => {
        console.error("❌ [useJobTimer] Failed to sync timer start");
      });
  }, [timerData, saveTimerData, getStepName, jobId]);

  // ✅ NOUVEAU: Utiliser le service de pricing centralisé
  // La config peut venir des options ou utiliser les défauts
  const pricingConfig: Partial<JobPricingConfig> = useMemo(
    () => ({
      hourlyRate:
        options?.pricingConfig?.hourlyRate || DEFAULT_PRICING_CONFIG.hourlyRate,
      travelRate: options?.pricingConfig?.travelRate,
      minimumHours:
        options?.pricingConfig?.minimumHours ??
        DEFAULT_PRICING_CONFIG.minimumHours,
      callOutFee: options?.pricingConfig?.callOutFee ?? 0, // Pas de call-out par défaut
      roundToHalfHour:
        options?.pricingConfig?.roundToHalfHour ??
        DEFAULT_PRICING_CONFIG.roundToHalfHour,
      travelTimeIsBillable:
        options?.pricingConfig?.travelTimeIsBillable ?? true,
      pauseTimeIsBillable: false, // Les pauses ne sont JAMAIS facturables
    }),
    [options?.pricingConfig],
  );

  // Calculer le coût basé sur le temps écoulé (utilise le service centralisé)
  const calculateCost = useCallback(
    (milliseconds: number): PricingResult => {
      const pauseTimeMs = timerData?.totalBreakTime || 0;
      return PricingService.calculateSimplePrice(
        milliseconds,
        pauseTimeMs,
        pricingConfig,
      );
    },
    [pricingConfig, timerData?.totalBreakTime],
  );

  // Taux horaire pour compatibilité (export depuis la config)
  const HOURLY_RATE_AUD =
    pricingConfig.hourlyRate || DEFAULT_PRICING_CONFIG.hourlyRate;

  // Avancer à l'étape suivante
  const advanceStep = useCallback(
    (newStep: number) => {
      // ✅ FIX: Permettre l'avancement même si le timer n'est pas en cours
      // On vérifie seulement que timerData existe, pas qu'il soit running
      if (!timerData) {
        console.warn(
          "⚠️ [useJobTimer] advanceStep called but timerData is null",
        );
        return;
      }

      console.log("🔄 [useJobTimer] advanceStep called", {
        newStep,
        currentStep: timerData.currentStep,
        isRunning: timerData.isRunning,
        totalSteps,
      });

      const now = Date.now();
      const updatedStepTimes = [...timerData.stepTimes];

      // Terminer l'étape actuelle
      let currentStepDuration = 0;
      if (updatedStepTimes.length > 0) {
        const currentStepIndex = updatedStepTimes.length - 1;
        currentStepDuration =
          now - updatedStepTimes[currentStepIndex].startTime;
        updatedStepTimes[currentStepIndex] = {
          ...updatedStepTimes[currentStepIndex],
          endTime: now,
          duration: currentStepDuration,
        };
      }

      // ✅ Vérifier si c'est la dernière étape (dynamique)
      const isLastStep = newStep >= totalSteps;

      // Démarrer la nouvelle étape (sauf si c'est la fin)
      if (!isLastStep) {
        updatedStepTimes.push({
          step: newStep,
          stepName: getStepName(newStep),
          startTime: now,
        });
      }

      // ✅ Calculer les valeurs finales si c'est la dernière étape
      let finalElapsedTime = timerData.totalElapsed;
      if (isLastStep) {
        finalElapsedTime = now - timerData.startTime;

        // Calculer le temps facturable final (sans pauses)
        const totalBreakTime = timerData.totalBreakTime || 0;
        const billableTime = Math.max(0, finalElapsedTime - totalBreakTime);

        // Calculer le coût final
        const costData = calculateCost(billableTime);
        setFinalCost(costData.total);
        setFinalBillableHours(costData.billableHours);

        // ✅ Appeler le callback de complétion
        if (onJobCompleted) {
          timerLogger.complete(jobId, costData.total, costData.billableHours);
          onJobCompleted(costData.total, costData.billableHours);
        }
      }

      const updatedData: JobTimerData = {
        ...timerData,
        currentStep: newStep,
        stepTimes: updatedStepTimes,
        isRunning: !isLastStep, // ✅ Arrêter le timer à la dernière étape
        totalElapsed: isLastStep ? finalElapsedTime : timerData.totalElapsed,
      };

      setTimerData(updatedData);
      saveTimerData(updatedData);

      // ✅ NOUVEAU: Synchroniser avec l'API
      if (isLastStep) {
        // Si c'est la dernière étape, compléter le job
        completeJob(jobId, options?.realJobId)
          .then(() => {
            // TEMP_DISABLED: console.log('✅ [useJobTimer] Job completed and synced to API');
          })
          .catch(() => {
            console.error("❌ [useJobTimer] Failed to sync job completion");
          });
      } else {
        // ✅ NOUVEAU: Utiliser syncStepToBackend (PUT /job/:id/step) - Confirmé par backend
        syncStepToBackend(jobId, newStep, options?.realJobId)
          .then((response) => {
            if (response.success) {
              console.log(`✅ [useJobTimer] Step ${newStep} synced to backend`);
            } else {
              // Fallback sur l'ancienne API si la nouvelle échoue
              console.warn(
                "⚠️ [useJobTimer] syncStepToBackend failed, using fallback",
              );
              updateJobStep(
                jobId,
                newStep,
                `Avancé à l'étape ${newStep}`,
                options?.realJobId,
              );
            }
          })
          .catch((error) => {
            console.error("❌ [useJobTimer] Failed to sync step:", error);
            // Fallback silencieux
            updateJobStep(
              jobId,
              newStep,
              `Avancé à l'étape ${newStep}`,
              options?.realJobId,
            ).catch(() => {});
          });
      }
    },
    [
      timerData,
      saveTimerData,
      totalSteps,
      onJobCompleted,
      calculateCost,
      jobId,
      getStepName,
    ],
  );

  // Calculer le temps total écoulé - SIMPLIFIÉ
  // ✅ FIX: Ne pas calculer si step 0 (job pas démarré)
  const getTotalElapsed = useCallback(() => {
    // Step 0 = job pas démarré, pas de temps
    if (currentStepRef.current === 0) {
      return 0;
    }

    if (!timerData || timerData.startTime === 0) {
      return 0;
    }

    // Si en pause, retourner le temps freezé
    if (!timerData.isRunning) {
      return timerData.totalElapsed || 0;
    }

    // Si actif, calculer depuis startTime
    return currentTime - timerData.startTime;
  }, [timerData, currentTime]);

  // Formater le temps en HH:mm:ss
  const formatTime = useCallback(
    (milliseconds: number, includeSeconds: boolean = true) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (includeSeconds) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    },
    [],
  );

  // Charger les données au montage
  useEffect(() => {
    loadTimerData();
  }, [loadTimerData]);

  // ✅ V1.0 ULTRA-SIMPLIFIÉ: Toggle pause - juste flip isRunning
  const togglePause = useCallback(() => {
    if (!timerData) return;

    // TEMP_DISABLED: console.log('🔄 [togglePause] Current state:', { isRunning: timerData.isRunning, isOnBreak: timerData.isOnBreak });

    const now = Date.now();

    if (timerData.isRunning) {
      // PAUSE: Freeze le temps actuel
      const elapsedMs = now - timerData.startTime;
      const updatedData: JobTimerData = {
        ...timerData,
        isRunning: false,
        isOnBreak: true,
        totalElapsed: elapsedMs, // Freeze le temps
      };

      // TEMP_DISABLED: console.log('⏸️ [togglePause] PAUSE - Freezing at:', elapsedMs / 1000, 'seconds');
      setTimerData(updatedData);
      saveTimerData(updatedData);
    } else {
      const newStartTime = now - (timerData.totalElapsed || 0);
      const updatedData: JobTimerData = {
        ...timerData,
        isRunning: true,
        isOnBreak: false,
        startTime: newStartTime, // Ajuster pour reprendre au bon moment
      };

      // TEMP_DISABLED: console.log('▶️ [togglePause] PLAY - Resuming from:', timerData.totalElapsed / 1000, 'seconds');
      setTimerData(updatedData);
      saveTimerData(updatedData);
    }
  }, [timerData, saveTimerData]);

  // Calculer le temps facturable (sans les pauses) - SIMPLIFIÉ
  const getBillableTime = useCallback(() => {
    return getTotalElapsed(); // Pour l'instant, pas de distinction pause
  }, [getTotalElapsed]);

  // Démarrer automatiquement si le job a déjà commencé
  const startTimerWithJobData = useCallback(
    (job: any) => {
      if (!timerData || timerData.isRunning || timerData.startTime > 0) return;

      // Calculer le temps de début basé sur les données du job
      let calculatedStartTime = Date.now();

      if (job?.job?.created_at) {
        calculatedStartTime = new Date(job.job.created_at).getTime();
      } else if (job?.created_at) {
        calculatedStartTime = new Date(job.created_at).getTime();
      }

      timerLogger.start(jobId);

      const updatedData: JobTimerData = {
        ...timerData,
        startTime: calculatedStartTime,
        isRunning: true,
        currentStep: Math.max(1, currentStep),
        stepTimes: [
          {
            step: Math.max(1, currentStep),
            stepName: getStepName(Math.max(1, currentStep)),
            startTime: calculatedStartTime,
          },
        ],
      };

      setTimerData(updatedData);
      saveTimerData(updatedData);
    },
    [timerData, jobId, currentStep, saveTimerData, getStepName],
  );

  // ✅ FIX: Ne PAS démarrer automatiquement - laisse le contrôle explicite à l'utilisateur
  // Commenté pour éviter le démarrage automatique intempestif
  /*
    useEffect(() => {
        if (timerData && currentStep >= 1 && !timerData.isRunning && timerData.startTime === 0) {
            timerLogger.start(jobId);
            startTimer();
        } else if (timerData && currentStep > timerData.currentStep && timerData.isRunning) {
            timerLogger.step(jobId, currentStep, totalSteps);
            advanceStep(currentStep);
        }
    }, [currentStep, timerData, startTimer, advanceStep]);
    */

  return {
    timerData,
    totalElapsed: getTotalElapsed(),
    billableTime: getBillableTime(),
    formatTime,
    calculateCost,
    startTimer,
    startTimerWithJobData,
    advanceStep,
    togglePause, // ✅ V1.0: Simple Play/Pause toggle
    isRunning: timerData?.isRunning || false,
    isOnBreak: timerData?.isOnBreak || false,
    // ✅ FIX: Prioriser timerData.currentStep (état local) pour refléter les clics utilisateur
    // La prop currentStep est utilisée seulement si timerData n'existe pas ou n'a pas de step
    currentStep: timerData?.currentStep ?? currentStep,
    HOURLY_RATE_AUD,
    // ✅ Nouvelles valeurs finales freezées
    finalCost, // Coût final (freezé à la complétion)
    finalBillableHours, // Heures finales (freezées à la complétion)
    // ✅ FIX: isCompleted doit aussi tenir compte du status backend "completed"
    isCompleted:
      options?.jobStatus === "completed" ||
      (timerData ? timerData.currentStep >= totalSteps : false),
    totalSteps, // Nombre total d'étapes
  };
};
