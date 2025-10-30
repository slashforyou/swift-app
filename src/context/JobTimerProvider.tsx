/**
 * JobTimerProvider - Context centralisé pour la gestion du timer
 * Partage le même état de timer entre toutes les pages (summary, job, payment)
 */

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useJobTimer, JobTimerData } from '../hooks/useJobTimer';

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
    
    // Valeurs finales (freezées à la complétion)
    finalCost: number | null;
    finalBillableHours: number | null;
    
    // Actions
    startTimer: () => void;
    advanceStep: (step: number) => void;
    nextStep: () => void; // ✅ Helper pour avancer à l'étape suivante
    stopTimer: () => void; // ✅ Arrêter complètement (dernière étape)
    startBreak: () => void;
    stopBreak: () => void;
    
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
    onStepChange?: (newStep: number) => void; // ✅ Callback pour synchroniser avec job.step.actualStep
    onJobCompleted?: (finalCost: number, billableHours: number) => void;
}

export const JobTimerProvider: React.FC<JobTimerProviderProps> = ({
    children,
    jobId,
    currentStep,
    totalSteps = 6,
    onStepChange,
    onJobCompleted,
}) => {
    const timer = useJobTimer(jobId, currentStep, {
        totalSteps,
        onJobCompleted,
    });

    // ✅ Helper pour avancer à l'étape suivante
    const nextStep = useCallback(() => {
        if (timer.currentStep < totalSteps) {
            const newStep = timer.currentStep + 1;
            timer.advanceStep(newStep);
            
            // Notifier le parent (jobDetails) du changement d'étape
            if (onStepChange) {
                onStepChange(newStep);
            }
        }
    }, [timer.currentStep, timer.advanceStep, totalSteps, onStepChange]);

    // ✅ Helper pour arrêter le timer (dernière étape)
    const stopTimer = useCallback(() => {
        console.log('🛑 [JobTimerProvider] Stopping timer at final step');
        timer.advanceStep(totalSteps); // Avancer à la dernière étape = arrêt
        
        // Notifier le parent
        if (onStepChange) {
            onStepChange(totalSteps);
        }
    }, [timer.advanceStep, totalSteps, onStepChange]);

    // ✅ Wrapper pour advanceStep avec notification
    const advanceStepWithCallback = useCallback((step: number) => {
        timer.advanceStep(step);
        
        // Notifier le parent du changement d'étape
        if (onStepChange) {
            onStepChange(step);
        }
    }, [timer.advanceStep, onStepChange]);

    // ✅ Synchroniser avec les changements externes de currentStep (depuis jobDetails)
    useEffect(() => {
        if (currentStep !== timer.currentStep && currentStep > 0) {
            console.log('🔄 [JobTimerProvider] External step change detected:', currentStep);
            timer.advanceStep(currentStep);
        }
    }, [currentStep]);

    const value: JobTimerContextValue = {
        // Données
        timerData: timer.timerData,
        totalElapsed: timer.totalElapsed,
        billableTime: timer.billableTime,
        isRunning: timer.isRunning,
        isOnBreak: timer.isOnBreak,
        currentStep: timer.currentStep,
        totalSteps: timer.totalSteps,
        isCompleted: timer.isCompleted,
        finalCost: timer.finalCost,
        finalBillableHours: timer.finalBillableHours,
        
        // Actions
        startTimer: timer.startTimer,
        advanceStep: advanceStepWithCallback,
        nextStep,
        stopTimer,
        startBreak: timer.startBreak,
        stopBreak: timer.stopBreak,
        
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
