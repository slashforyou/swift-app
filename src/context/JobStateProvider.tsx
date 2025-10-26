/**
 * JobStateProvider - Context pour la gestion de l'état du job
 * 
 * Fournit:
 * - Persistence de l'état (AsyncStorage)
 * - Synchronisation avec l'API
 * - Source unique de vérité pour currentStep
 * - Actions pour modifier l'état
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { JobState, JobStateAction, JobStateContextType, JobProgress } from '../types/jobState';
import { loadJobState, saveJobState, deleteJobState } from '../utils/jobStateStorage';

const JobStateContext = createContext<JobStateContextType | undefined>(undefined);

interface JobStateProviderProps {
    children: React.ReactNode;
    jobId: string;
    initialProgress?: JobProgress; // Données initiales depuis l'API
}

export const JobStateProvider: React.FC<JobStateProviderProps> = ({
    children,
    jobId,
    initialProgress,
}) => {
    const [jobState, setJobState] = useState<JobState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger l'état au montage
    useEffect(() => {
        loadState();
    }, [jobId]);

    /**
     * Charge l'état depuis AsyncStorage ou utilise initialProgress
     */
    const loadState = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Essayer de charger depuis le storage
            const stored = await loadJobState(jobId);

            if (stored) {
                console.log(`📦 Loaded job state from storage: step ${stored.progress.actualStep}`);
                setJobState(stored);
            } else if (initialProgress) {
                // Créer un nouvel état avec les données initiales
                const newState: JobState = {
                    jobId,
                    progress: initialProgress,
                    lastSyncedAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: false,
                };
                
                console.log(`📦 Created new job state: step ${newState.progress.actualStep}`);
                setJobState(newState);
                await saveJobState(newState);
            } else {
                throw new Error('No stored state and no initial progress provided');
            }
        } catch (err) {
            console.error('Error loading job state:', err);
            setError(err instanceof Error ? err.message : 'Failed to load job state');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Réduit une action sur l'état
     */
    const reduceState = (state: JobState, action: JobStateAction): JobState => {
        switch (action.type) {
            case 'SET_STEP': {
                const newStep = action.payload;
                if (newStep < 1 || newStep > state.progress.totalSteps) {
                    console.warn(`Invalid step: ${newStep}`);
                    return state;
                }

                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        actualStep: newStep,
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'NEXT_STEP': {
                const nextStep = state.progress.actualStep + 1;
                if (nextStep > state.progress.totalSteps) {
                    console.warn('Already at last step');
                    return state;
                }

                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        actualStep: nextStep,
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'PREV_STEP': {
                const prevStep = state.progress.actualStep - 1;
                if (prevStep < 1) {
                    console.warn('Already at first step');
                    return state;
                }

                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        actualStep: prevStep,
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'COMPLETE_STEP': {
                const stepId = action.payload;
                const updatedSteps = state.progress.steps.map(step =>
                    step.id === stepId
                        ? { ...step, completedAt: new Date().toISOString() }
                        : step
                );

                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        steps: updatedSteps,
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'COMPLETE_JOB': {
                const completedAt = new Date().toISOString();
                const updatedSteps = state.progress.steps.map(step => ({
                    ...step,
                    completedAt: step.completedAt || completedAt,
                }));

                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        steps: updatedSteps,
                        isCompleted: true,
                        completedAt,
                    },
                    lastModifiedAt: completedAt,
                    isDirty: true,
                };
            }

            case 'SYNC_WITH_API': {
                return {
                    ...state,
                    progress: action.payload,
                    lastSyncedAt: new Date().toISOString(),
                    isDirty: false,
                };
            }

            case 'RESET_JOB': {
                return {
                    ...state,
                    progress: {
                        ...state.progress,
                        actualStep: 1,
                        isCompleted: false,
                        completedAt: undefined,
                        steps: state.progress.steps.map(step => ({
                            ...step,
                            completedAt: undefined,
                        })),
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            default:
                return state;
        }
    };

    /**
     * Dispatch une action et sauvegarde l'état
     */
    const dispatch = async (action: JobStateAction) => {
        if (!jobState) {
            console.warn('Cannot dispatch: jobState is null');
            return;
        }

        const newState = reduceState(jobState, action);
        setJobState(newState);
        await saveJobState(newState);
        
        console.log(`📦 Job state updated: ${action.type}, step ${newState.progress.actualStep}`);
    };

    // Actions exposées au contexte
    const setCurrentStep = useCallback(async (step: number) => {
        await dispatch({ type: 'SET_STEP', payload: step });
    }, [jobState]);

    const nextStep = useCallback(async () => {
        await dispatch({ type: 'NEXT_STEP' });
    }, [jobState]);

    const prevStep = useCallback(async () => {
        await dispatch({ type: 'PREV_STEP' });
    }, [jobState]);

    const completeStep = useCallback(async (stepId: number) => {
        await dispatch({ type: 'COMPLETE_STEP', payload: stepId });
    }, [jobState]);

    const completeJob = useCallback(async () => {
        await dispatch({ type: 'COMPLETE_JOB' });
    }, [jobState]);

    const syncWithAPI = useCallback(async () => {
        if (!jobState) return;

        try {
            // TODO: Appeler l'API pour sync l'état
            // const apiProgress = await fetchJobProgress(jobId);
            // await dispatch({ type: 'SYNC_WITH_API', payload: apiProgress });
            
            console.log('📡 Sync with API (TODO: implement API call)');
        } catch (err) {
            console.error('Error syncing with API:', err);
            setError(err instanceof Error ? err.message : 'Sync failed');
        }
    }, [jobState, jobId]);

    const resetJob = useCallback(async () => {
        await dispatch({ type: 'RESET_JOB' });
    }, [jobState]);

    // Helpers
    const canGoNext = jobState ? jobState.progress.actualStep < jobState.progress.totalSteps : false;
    const canGoPrevious = jobState ? jobState.progress.actualStep > 1 : false;
    const isJobCompleted = jobState?.progress.isCompleted || false;
    const currentStepIndex = jobState ? jobState.progress.actualStep - 1 : 0;
    const totalSteps = jobState?.progress.totalSteps || 0;

    const value: JobStateContextType = {
        jobState,
        isLoading,
        error,
        setCurrentStep,
        nextStep,
        prevStep,
        completeStep,
        completeJob,
        syncWithAPI,
        resetJob,
        canGoNext,
        canGoPrevious,
        isJobCompleted,
        currentStepIndex,
        totalSteps,
    };

    return (
        <JobStateContext.Provider value={value}>
            {children}
        </JobStateContext.Provider>
    );
};

/**
 * Hook pour utiliser le JobStateContext
 */
export const useJobState = (): JobStateContextType => {
    const context = useContext(JobStateContext);
    
    if (!context) {
        throw new Error('useJobState must be used within a JobStateProvider');
    }
    
    return context;
};
