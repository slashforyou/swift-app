/**
 * Hook pour gérer le chronométrage des jobs
 * Persiste les données entre les sessions et calcule les temps par étape
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { completeJob, startJob, updateJobStep } from '../services/jobSteps'; // ✅ FIX: Utiliser les endpoints qui fonctionnent
import { timerLogger } from '../utils/logger';

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

const TIMER_STORAGE_KEY = 'jobTimers';
const HOURLY_RATE_AUD = 110; // Prix fixe par heure en dollars australiens

// ✅ Définition des étapes par défaut (fallback)
// Ces steps sont utilisés si aucune configuration dynamique n'est fournie
const DEFAULT_JOB_STEPS = {
    0: 'Job pas commencé',
    1: 'Départ (entrepôt/client)',
    2: 'Arrivé première adresse',
    3: 'Départ première adresse', 
    4: 'Arrivé adresse suivante/dépôt',
    5: 'Départ dernière adresse',
    6: 'Arrivé au dépôt - Fin'
};

export const useJobTimer = (
    jobId: string, 
    currentStep: number = 0,
    options?: {
        totalSteps?: number; // ✅ Nombre total d'étapes (dynamique)
        stepNames?: string[]; // ✅ NOUVEAU: Noms des steps dynamiques depuis job.steps
        onJobCompleted?: (finalCost: number, billableHours: number) => void; // ✅ Callback de complétion
    }
) => {
    const [timerData, setTimerData] = useState<JobTimerData | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [finalCost, setFinalCost] = useState<number | null>(null); // ✅ Coût final freezé
    const [finalBillableHours, setFinalBillableHours] = useState<number | null>(null); // ✅ Heures finales freezées

    const totalSteps = options?.totalSteps || 6; // ✅ Par défaut 6, mais peut être changé
    const stepNames = options?.stepNames || []; // ✅ Steps dynamiques (optionnel)
    const onJobCompleted = options?.onJobCompleted; // ✅ Callback

    // ✅ Helper pour obtenir le nom d'un step (dynamique ou fallback)
    const getStepName = useCallback((step: number): string => {
        // Priorité 1: Utiliser stepNames dynamique si fourni
        if (stepNames.length > 0 && step >= 0 && step < stepNames.length) {
            return stepNames[step];
        }
        
        // Priorité 2: Fallback sur DEFAULT_JOB_STEPS
        return DEFAULT_JOB_STEPS[step as keyof typeof DEFAULT_JOB_STEPS] || `Étape ${step}`;
    }, [stepNames]);

    // Met à jour l'heure actuelle toutes les secondes
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Charger les données du timer depuis le storage
    const loadTimerData = useCallback(async () => {
        try {
            const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
            if (storedData) {
                const timers: Record<string, JobTimerData> = JSON.parse(storedData);
                const jobTimer = timers[jobId];
                
                if (jobTimer) {
                    // ✅ VALIDATION: Détecter incohérence step > 1 mais timer jamais démarré
                    if (currentStep > 1 && (!jobTimer.startTime || jobTimer.startTime === 0)) {
                        console.warn(`⚠️ [useJobTimer] INCOHÉRENCE DÉTECTÉE: Job à l'étape ${currentStep}/5 mais timer jamais démarré (startTime = ${jobTimer.startTime})`);
                        console.warn('⚠️ [useJobTimer] Auto-correction: Démarrage automatique du timer pour synchroniser les données');
                        
                        // Auto-start timer avec timestamp rétroactif (estimé)
                        const now = Date.now();
                        const estimatedStartTime = now - (24 * 60 * 60 * 1000); // 24h avant (estimation)
                        
                        const correctedTimer: JobTimerData = {
                            ...jobTimer,
                            startTime: estimatedStartTime,
                            isRunning: true,
                            currentStep: currentStep,
                            stepTimes: Array.from({ length: currentStep }, (_, i) => ({
                                step: i + 1,
                                stepName: getStepName(i + 1),
                                startTime: estimatedStartTime + (i * 60 * 60 * 1000), // 1h par step
                                endTime: i < currentStep - 1 ? estimatedStartTime + ((i + 1) * 60 * 60 * 1000) : undefined,
                                duration: i < currentStep - 1 ? 60 * 60 * 1000 : undefined
                            })),
                            totalElapsed: now - estimatedStartTime
                        };
                        
                        setTimerData(correctedTimer);
                        
                        // Sync to API - utiliser startJob qui fonctionne
                        startJob(jobId)
                            .then(() => console.log('✅ [useJobTimer] Timer auto-started and synced to API'))
                            .catch(() => console.error('❌ [useJobTimer] Failed to sync auto-started timer'));
                    } else {
                        setTimerData(jobTimer);
                    }
                } else {
                    // Initialiser un nouveau timer pour ce job
                    const newTimer: JobTimerData = {
                        jobId,
                        startTime: 0,
                        currentStep: currentStep,
                        stepTimes: [],
                        breakTimes: [],
                        isRunning: false,
                        isOnBreak: false,
                        totalElapsed: 0,
                        totalBreakTime: 0
                    };
                    setTimerData(newTimer);
                }
            } else {
                // Pas de données stockées, créer un nouveau timer
                const newTimer: JobTimerData = {
                    jobId,
                    startTime: 0,
                    currentStep: currentStep,
                    stepTimes: [],
                    breakTimes: [],
                    isRunning: false,
                    isOnBreak: false,
                    totalElapsed: 0,
                    totalBreakTime: 0
                };
                setTimerData(newTimer);
            }
        } catch (error) {
            console.error('Error loading timer data:', error);
        }
    }, [jobId, currentStep, getStepName]);

    // Sauvegarder les données du timer
    const saveTimerData = useCallback(async (data: JobTimerData) => {
        try {
            const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
            const timers: Record<string, JobTimerData> = storedData ? JSON.parse(storedData) : {};
            
            timers[jobId] = data;
            await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
        } catch (error) {
            console.error('Error saving timer data:', error);
        }
    }, [jobId]);

    // Démarrer le timer (quand on passe de step 0 à 1)
    const startTimer = useCallback(() => {
        if (!timerData) return;

        const now = Date.now();
        const updatedData: JobTimerData = {
            ...timerData,
            startTime: now,
            isRunning: true,
            currentStep: 1,
            stepTimes: [{
                step: 1,
                stepName: getStepName(1),
                startTime: now
            }]
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);

        // ✅ FIX: Synchroniser le démarrage avec startJob qui fonctionne
        startJob(jobId)
            .then(() => {
                console.log('✅ [useJobTimer] Timer started and synced to API');
            })
            .catch(() => {
                console.error('❌ [useJobTimer] Failed to sync timer start');
            });
    }, [timerData, saveTimerData, getStepName, jobId]);

    // Calculer le coût basé sur le temps écoulé
    const calculateCost = useCallback((milliseconds: number) => {
        const hours = milliseconds / (1000 * 60 * 60);
        
        // Règles de facturation :
        // - Minimum 2h (minimum wage)
        // - Call-out fee : 30 min
        // - Arrondir à la demi-heure près à partir de 7 min
        
        let billableHours = Math.max(hours, 2); // Minimum 2h
        
        // Ajouter le call-out fee (30 min = 0.5h)
        billableHours += 0.5;
        
        // Arrondir à la demi-heure près (7 min règle)
        const fractionalHour = billableHours % 1;
        if (fractionalHour > 0.117) { // 7 minutes = 0.117 heure
            billableHours = Math.floor(billableHours) + 0.5;
            if (fractionalHour > 0.5 && fractionalHour > 0.617) { // 37 min = 0.617 heure
                billableHours = Math.ceil(billableHours);
            }
        }
        
        return {
            hours: billableHours,
            cost: billableHours * HOURLY_RATE_AUD,
            rawHours: hours
        };
    }, []);

    // Avancer à l'étape suivante
    const advanceStep = useCallback((newStep: number) => {
        if (!timerData || !timerData.isRunning) return;

        const now = Date.now();
        const updatedStepTimes = [...timerData.stepTimes];
        
        // Terminer l'étape actuelle
        let currentStepDuration = 0;
        if (updatedStepTimes.length > 0) {
            const currentStepIndex = updatedStepTimes.length - 1;
            currentStepDuration = now - updatedStepTimes[currentStepIndex].startTime;
            updatedStepTimes[currentStepIndex] = {
                ...updatedStepTimes[currentStepIndex],
                endTime: now,
                duration: currentStepDuration
            };
        }

        // ✅ Vérifier si c'est la dernière étape (dynamique)
        const isLastStep = newStep >= totalSteps;

        // Démarrer la nouvelle étape (sauf si c'est la fin)
        if (!isLastStep) {
            updatedStepTimes.push({
                step: newStep,
                stepName: getStepName(newStep),
                startTime: now
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
            setFinalCost(costData.cost);
            setFinalBillableHours(costData.hours);
            
            // ✅ Appeler le callback de complétion
            if (onJobCompleted) {
                timerLogger.complete(jobId, costData.cost, costData.hours);
                onJobCompleted(costData.cost, costData.hours);
            }
        }

        const updatedData: JobTimerData = {
            ...timerData,
            currentStep: newStep,
            stepTimes: updatedStepTimes,
            isRunning: !isLastStep, // ✅ Arrêter le timer à la dernière étape
            totalElapsed: isLastStep ? finalElapsedTime : timerData.totalElapsed
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);

        // ✅ NOUVEAU: Synchroniser avec l'API
        if (isLastStep) {
            // Si c'est la dernière étape, compléter le job
            const costData = calculateCost(Math.max(0, finalElapsedTime - (timerData.totalBreakTime || 0)));
            const notes = `Job terminé - ${costData.hours.toFixed(2)}h facturables - ${costData.cost}€`;
            
            completeJob(jobId, notes)
                .then(() => {
                    console.log('✅ [useJobTimer] Job completed and synced to API');
                })
                .catch(() => {
                    console.error('❌ [useJobTimer] Failed to sync job completion');
                });
        } else {
            // ✅ FIX: Utiliser updateJobStep qui fonctionne au lieu de advanceStepAPI
            updateJobStep(jobId, newStep, `Avancé à l'étape ${newStep} après ${(currentStepDuration / 3600).toFixed(2)}h`)
                .then(() => {
                    console.log('✅ [useJobTimer] Step advanced and synced to API');
                })
                .catch(error => {
                    console.error('❌ [useJobTimer] Failed to sync step advancement:', error);
                });
        }
    }, [timerData, saveTimerData, totalSteps, onJobCompleted, calculateCost, jobId]);

    // Calculer le temps total écoulé - SIMPLIFIÉ
    const getTotalElapsed = useCallback(() => {
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
    const formatTime = useCallback((milliseconds: number, includeSeconds: boolean = true) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (includeSeconds) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }, []);

    // Charger les données au montage
    useEffect(() => {
        loadTimerData();
    }, [loadTimerData]);

    // ✅ V1.0 ULTRA-SIMPLIFIÉ: Toggle pause - juste flip isRunning
    const togglePause = useCallback(() => {
        if (!timerData) return;

        console.log('🔄 [togglePause] Current state:', { isRunning: timerData.isRunning, isOnBreak: timerData.isOnBreak });

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
            
            console.log('⏸️ [togglePause] PAUSE - Freezing at:', elapsedMs / 1000, 'seconds');
            setTimerData(updatedData);
            saveTimerData(updatedData);
        } else {
            // PLAY: Recalculer startTime pour reprendre
            const newStartTime = now - (timerData.totalElapsed || 0);
            const updatedData: JobTimerData = {
                ...timerData,
                isRunning: true,
                isOnBreak: false,
                startTime: newStartTime, // Ajuster pour reprendre au bon moment
            };
            
            console.log('▶️ [togglePause] PLAY - Resuming from:', timerData.totalElapsed / 1000, 'seconds');
            setTimerData(updatedData);
            saveTimerData(updatedData);
        }
    }, [timerData, saveTimerData]);

    // Calculer le temps facturable (sans les pauses) - SIMPLIFIÉ
    const getBillableTime = useCallback(() => {
        return getTotalElapsed(); // Pour l'instant, pas de distinction pause
    }, [getTotalElapsed]);

    // Démarrer automatiquement si le job a déjà commencé
    const startTimerWithJobData = useCallback((job: any) => {
        if (!timerData || timerData.isRunning || timerData.startTime > 0) return;

        // Calculer le temps de début basé sur les données du job
        let calculatedStartTime = Date.now();
        
        if (job?.job?.created_at) {
            calculatedStartTime = new Date(job.job.created_at).getTime();
        } else if (job?.created_at) {
            calculatedStartTime = new Date(job.created_at).getTime();
        }

        timerLogger.start(jobId);

        const now = Date.now();
        const updatedData: JobTimerData = {
            ...timerData,
            startTime: calculatedStartTime,
            isRunning: true,
            currentStep: Math.max(1, currentStep),
            stepTimes: [{
                step: Math.max(1, currentStep),
                stepName: getStepName(Math.max(1, currentStep)),
                startTime: calculatedStartTime
            }]
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, jobId, currentStep, saveTimerData]);

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
        // ✅ FIX #3: Prioriser currentStep des props (API) sur timerData (localStorage)
        currentStep: currentStep > 0 ? currentStep : (timerData?.currentStep || 0),
        HOURLY_RATE_AUD,
        // ✅ Nouvelles valeurs finales freezées
        finalCost, // Coût final (freezé à la complétion)
        finalBillableHours, // Heures finales (freezées à la complétion)
        isCompleted: timerData ? timerData.currentStep >= totalSteps : false, // Si le job est complété
        totalSteps, // Nombre total d'étapes
    };
};