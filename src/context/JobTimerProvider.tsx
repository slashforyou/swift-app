/**
 * JobTimerProvider - Context centralisé pour la gestion du timer
 * Partage le même état de timer entre toutes les pages (summary, job, payment)
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';
import { JobTimerData, useJobTimer } from '../hooks/useJobTimer';
import { timerLogger } from '../utils/logger';

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
    calculateCost: (milliseconds: number) => { hours: number; cost: number; rawHours: number };
    HOURLY_RATE_AUD: number;
}

const JobTimerContext = createContext<JobTimerContextValue | undefined>(undefined);

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
    const safeJobId = jobId || 'unknown';
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
        if (jobStatus === 'completed' && timer.isRunning) {
            // TEMP_DISABLED: console.log('🛑 [JobTimerProvider] Job completed detected, stopping timer');
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
            }
        } catch (error) {

            timerLogger.error('nextStep', error);
            isInternalUpdateRef.current = false;
        }
    }, [timer.currentStep, timer.advanceStep, safeTotalSteps, onStepChange]);

    // ✅ Helper pour arrêter le timer (dernière étape)
    const stopTimer = useCallback(() => {
        try {
            timerLogger.sync('toContext', safeTotalSteps);
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

            timerLogger.error('stopTimer', error);
            isInternalUpdateRef.current = false;
        }
    }, [timer.advanceStep, safeTotalSteps, onStepChange]);

    // ✅ Wrapper pour advanceStep avec notification
    const advanceStepWithCallback = useCallback((step: number) => {
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

            timerLogger.error('advanceStepWithCallback', error);
            isInternalUpdateRef.current = false;
        }
    }, [timer.advanceStep, onStepChange]);

    // ✅ Synchroniser avec les changements externes de currentStep (depuis jobDetails)
    // IMPORTANT: Garde contre les loops infinis - ne synchronise que si vraiment différent
    useEffect(() => {
        // Ne pas synchroniser si le changement vient de nous-mêmes
        if (isInternalUpdateRef.current) {
            timerLogger.sync('fromContext', currentStep);
            return;
        }
        
        // ✅ FIX BOUCLE INFINIE: Ne sync que si le step a VRAIMENT changé depuis la dernière sync
        if (currentStep !== lastSyncedStepRef.current && currentStep > 0 && timer.timerData) {
            // TEMP_DISABLED: console.log(`� [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`);
            timerLogger.sync('toContext', currentStep);
            timer.advanceStep(currentStep);
            lastSyncedStepRef.current = currentStep; // ✅ Sauvegarder le step synchronisé
            // TEMP_DISABLED: console.log(`✅ [JobTimerProvider] Sync completed`);
        }
    }, [currentStep]); // ✅ Dépendance UNIQUEMENT sur currentStep (pas timer.currentStep)

    // ✅ DÉSACTIVÉ TEMPORAIREMENT - Cause boucle infinie
    // Auto-sync timer to API every 30 seconds when running
    /*
    useEffect(() =>);        if (timer.isRunning && timer.timerData && !timer.isOnBreak) {
            // TEMP_DISABLED: console.log('⏱️ [JobTimerProvider] Starting auto-sync (every 30s)');
            
            const intervalId = setInterval(() =>);                syncTimerToAPI(timer.timerData!)
                    .then(response => {
                        if (response?.success) {
                            // TEMP_DISABLED: console.log('✅ [JobTimerProvider] Auto-sync successful');
                        }
                    })
                    .catch(error => {
                        console.error('❌ [JobTimerProvider] Auto-sync failed:', error);
                    });
            }, 30000); // 30 seconds
            
            return () => {
                // TEMP_DISABLED: console.log('⏱️ [JobTimerProvider] Stopping auto-sync');
                clearInterval(intervalId);
            };
        }
    }, [timer.isRunning, timer.timerData, timer.isOnBreak]);
    */

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
        throw new Error('useJobTimerContext must be used within a JobTimerProvider');
    }
    
    return context;
};
