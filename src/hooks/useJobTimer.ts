/**
 * Hook pour gérer le chronométrage des jobs
 * Persiste les données entre les sessions et calcule les temps par étape
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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

// Définition des étapes avec leurs noms
const JOB_STEPS = {
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
        onJobCompleted?: (finalCost: number, billableHours: number) => void; // ✅ Callback de complétion
    }
) => {
    const [timerData, setTimerData] = useState<JobTimerData | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [finalCost, setFinalCost] = useState<number | null>(null); // ✅ Coût final freezé
    const [finalBillableHours, setFinalBillableHours] = useState<number | null>(null); // ✅ Heures finales freezées

    const totalSteps = options?.totalSteps || 6; // ✅ Par défaut 6, mais peut être changé
    const onJobCompleted = options?.onJobCompleted; // ✅ Callback

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
                    setTimerData(jobTimer);
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
    }, [jobId, currentStep]);

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
                stepName: JOB_STEPS[1],
                startTime: now
            }]
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, saveTimerData]);

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
        if (updatedStepTimes.length > 0) {
            const currentStepIndex = updatedStepTimes.length - 1;
            updatedStepTimes[currentStepIndex] = {
                ...updatedStepTimes[currentStepIndex],
                endTime: now,
                duration: now - updatedStepTimes[currentStepIndex].startTime
            };
        }

        // ✅ Vérifier si c'est la dernière étape (dynamique)
        const isLastStep = newStep >= totalSteps;

        // Démarrer la nouvelle étape (sauf si c'est la fin)
        if (!isLastStep) {
            updatedStepTimes.push({
                step: newStep,
                stepName: JOB_STEPS[newStep as keyof typeof JOB_STEPS] || `Étape ${newStep}`,
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
                console.log('🎉 [JobTimer] Job completed! Calling onJobCompleted callback');
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
    }, [timerData, saveTimerData, totalSteps, onJobCompleted, calculateCost]);

    // Calculer le temps total écoulé
    const getTotalElapsed = useCallback(() => {
        if (!timerData || !timerData.isRunning) {
            return timerData?.totalElapsed || 0;
        }
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

    // Démarrer une pause
    const startBreak = useCallback(() => {
        if (!timerData || !timerData.isRunning || timerData.isOnBreak) return;

        const now = Date.now();
        const updatedData: JobTimerData = {
            ...timerData,
            isOnBreak: true,
            breakTimes: [
                ...timerData.breakTimes,
                { startTime: now }
            ]
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, saveTimerData]);

    // Arrêter une pause
    const stopBreak = useCallback(() => {
        if (!timerData || !timerData.isOnBreak) return;

        const now = Date.now();
        const updatedBreakTimes = [...timerData.breakTimes];
        const currentBreakIndex = updatedBreakTimes.length - 1;
        
        if (currentBreakIndex >= 0) {
            const currentBreak = updatedBreakTimes[currentBreakIndex];
            updatedBreakTimes[currentBreakIndex] = {
                ...currentBreak,
                endTime: now,
                duration: now - currentBreak.startTime
            };
        }

        const updatedData: JobTimerData = {
            ...timerData,
            isOnBreak: false,
            breakTimes: updatedBreakTimes,
            totalBreakTime: updatedBreakTimes.reduce((total, breakTime) => 
                total + (breakTime.duration || 0), 0
            )
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, saveTimerData]);

    // Calculer le temps facturable (sans les pauses)
    const getBillableTime = useCallback(() => {
        const totalElapsed = getTotalElapsed();
        const totalBreakTime = timerData?.totalBreakTime || 0;
        const currentBreakTime = timerData?.isOnBreak && timerData.breakTimes.length > 0 
            ? currentTime - timerData.breakTimes[timerData.breakTimes.length - 1].startTime
            : 0;
        
        return Math.max(0, totalElapsed - totalBreakTime - currentBreakTime);
    }, [getTotalElapsed, timerData, currentTime]);

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

        console.log('🕐 [JobTimer] Auto-starting timer for job:', jobId, 'calculated start:', new Date(calculatedStartTime));

        const now = Date.now();
        const updatedData: JobTimerData = {
            ...timerData,
            startTime: calculatedStartTime,
            isRunning: true,
            currentStep: Math.max(1, currentStep),
            stepTimes: [{
                step: Math.max(1, currentStep),
                stepName: JOB_STEPS[Math.max(1, currentStep) as keyof typeof JOB_STEPS] || `Étape ${currentStep}`,
                startTime: calculatedStartTime
            }]
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, jobId, currentStep, saveTimerData]);

    // Démarrer automatiquement si on passe de 0 à 1+ ou si le job a déjà commencé
    useEffect(() => {
        if (timerData && currentStep >= 1 && !timerData.isRunning && timerData.startTime === 0) {
            console.log('🕐 [JobTimer] Starting timer for job:', jobId, 'step:', currentStep);
            startTimer();
        } else if (timerData && currentStep > timerData.currentStep && timerData.isRunning) {
            console.log('🕐 [JobTimer] Advancing step for job:', jobId, 'from', timerData.currentStep, 'to', currentStep);
            advanceStep(currentStep);
        }
    }, [currentStep, timerData, startTimer, advanceStep]);

    return {
        timerData,
        totalElapsed: getTotalElapsed(),
        billableTime: getBillableTime(),
        formatTime,
        calculateCost,
        startTimer,
        startTimerWithJobData,
        advanceStep,
        startBreak,
        stopBreak,
        isRunning: timerData?.isRunning || false,
        isOnBreak: timerData?.isOnBreak || false,
        currentStep: timerData?.currentStep || 0,
        HOURLY_RATE_AUD,
        // ✅ Nouvelles valeurs finales freezées
        finalCost, // Coût final (freezé à la complétion)
        finalBillableHours, // Heures finales (freezées à la complétion)
        isCompleted: timerData ? timerData.currentStep >= totalSteps : false, // Si le job est complété
        totalSteps, // Nombre total d'étapes
    };
};