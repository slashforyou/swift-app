/**
 * Hook pour gérer le chronométrage des jobs
 * Persiste les données entre les sessions et calcule les temps par étape
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JobStepTime {
    step: number;
    stepName: string;
    startTime: number;
    endTime?: number;
    duration?: number; // en millisecondes
}

export interface JobTimerData {
    jobId: string;
    startTime: number; // Timestamp du début du job (step 0 -> 1)
    currentStep: number;
    stepTimes: JobStepTime[];
    isRunning: boolean;
    totalElapsed: number; // Temps total en millisecondes
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

export const useJobTimer = (jobId: string, currentStep: number = 0) => {
    const [timerData, setTimerData] = useState<JobTimerData | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

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
                        isRunning: false,
                        totalElapsed: 0
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
                    isRunning: false,
                    totalElapsed: 0
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

        // Démarrer la nouvelle étape (sauf si c'est la fin - step 6)
        if (newStep < 6) {
            updatedStepTimes.push({
                step: newStep,
                stepName: JOB_STEPS[newStep as keyof typeof JOB_STEPS] || `Étape ${newStep}`,
                startTime: now
            });
        }

        const updatedData: JobTimerData = {
            ...timerData,
            currentStep: newStep,
            stepTimes: updatedStepTimes,
            isRunning: newStep < 6, // Arrêter le timer à l'étape 6
            totalElapsed: newStep >= 6 ? now - timerData.startTime : timerData.totalElapsed
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
    }, [timerData, saveTimerData]);

    // Calculer le temps total écoulé
    const getTotalElapsed = useCallback(() => {
        if (!timerData || !timerData.isRunning) {
            return timerData?.totalElapsed || 0;
        }
        return currentTime - timerData.startTime;
    }, [timerData, currentTime]);

    // Formater le temps en HH:mm
    const formatTime = useCallback((milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }, []);

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

    // Charger les données au montage
    useEffect(() => {
        loadTimerData();
    }, [loadTimerData]);

    // Démarrer automatiquement si on passe de 0 à 1+
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
        formatTime,
        calculateCost,
        startTimer,
        advanceStep,
        isRunning: timerData?.isRunning || false,
        currentStep: timerData?.currentStep || 0,
        HOURLY_RATE_AUD
    };
};