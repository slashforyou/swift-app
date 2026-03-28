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
import { ServerData } from '../constants/ServerData';
import { JobProgress, JobState, JobStateAction, JobStateContextType, PhotoUploadStatus } from '../types/jobState';
import { loadJobState, saveJobState } from '../utils/jobStateStorage';
import { fetchWithAuth } from '../utils/session';

/**
 * Récupère les données de progression d'un job depuis l'API
 * Utilise GET /v1/job/:id pour récupérer current_step et status
 */
async function fetchJobProgressFromAPI(jobId: string): Promise<{ currentStep: number; totalSteps: number; status: string } | null> {
    try {
        const response = await fetchWithAuth(`${ServerData.serverUrl}v1/job/${jobId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
            return null;
        }

        const job = data.data;
        return {
            currentStep: job.current_step || job.step || 1,
            totalSteps: job.total_steps || 5, // Default to 5 if not specified
            status: job.status || 'pending'
        };
    } catch (error) {
        console.error('[syncWithAPI] Error fetching job progress:', error);
        return null;
    }
}

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
                setJobState(stored);
            } else if (initialProgress) {
                // Créer un nouvel état avec les données initiales
                const newState: JobState = {
                    jobId,
                    progress: initialProgress,
                    photoUploadStatuses: {}, // ✅ Initialiser vide
                    lastSyncedAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: false,
                };
                
                setJobState(newState);
                await saveJobState(newState);
            } else {
                // ✅ Créer un état par défaut au lieu de throw error
                const defaultState: JobState = {
                    jobId,
                    progress: {
                        actualStep: 1,
                        totalSteps: 5,
                        steps: [],
                        isCompleted: false,
                    },
                    photoUploadStatuses: {},
                    lastSyncedAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: false,
                };
                
                setJobState(defaultState);
                await saveJobState(defaultState);
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
                    photoUploadStatuses: {}, // ✅ Reset upload statuses aussi
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'SET_UPLOAD_STATUS': {
                const { photoId, status } = action.payload;
                return {
                    ...state,
                    photoUploadStatuses: {
                        ...state.photoUploadStatuses,
                        [photoId]: status,
                    },
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'REMOVE_UPLOAD_STATUS': {
                const photoId = action.payload;
                const { [photoId]: removed, ...rest } = state.photoUploadStatuses;
                return {
                    ...state,
                    photoUploadStatuses: rest,
                    lastModifiedAt: new Date().toISOString(),
                    isDirty: true,
                };
            }

            case 'CLEAR_UPLOAD_STATUSES': {
                return {
                    ...state,
                    photoUploadStatuses: {},
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
            // ✅ Fallback silencieux - pas besoin de warning car c'est géré
            return;
        }

        const newState = reduceState(jobState, action);
        setJobState(newState);
        await saveJobState(newState);
        
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
            
            // ✅ Appeler l'API pour récupérer l'état actuel du job
            const apiData = await fetchJobProgressFromAPI(jobId);
            
            if (!apiData) {
                return;
            }


            // ✅ Créer la progression à partir des données de l'API
            const apiProgress: JobProgress = {
                actualStep: apiData.currentStep,
                totalSteps: apiData.totalSteps,
                steps: jobState.progress.steps, // Conserver les étapes existantes
                isCompleted: apiData.status === 'completed' || apiData.currentStep >= apiData.totalSteps,
                completedAt: apiData.status === 'completed' ? new Date().toISOString() : undefined,
            };

            // ✅ Dispatcher la synchronisation
            await dispatch({ type: 'SYNC_WITH_API', payload: apiProgress });
        } catch (err) {
            console.error('❌ [syncWithAPI] Error syncing with API:', err);
            setError(err instanceof Error ? err.message : 'Sync failed');
        }
    }, [jobState, jobId]);

    const resetJob = useCallback(async () => {
        await dispatch({ type: 'RESET_JOB' });
    }, [jobState]);

    // ✅ Actions pour photos
    const setUploadStatus = useCallback(async (photoId: string, status: PhotoUploadStatus) => {
        await dispatch({ type: 'SET_UPLOAD_STATUS', payload: { photoId, status } });
    }, [jobState]);

    const removeUploadStatus = useCallback(async (photoId: string) => {
        await dispatch({ type: 'REMOVE_UPLOAD_STATUS', payload: photoId });
    }, [jobState]);

    const clearUploadStatuses = useCallback(async () => {
        await dispatch({ type: 'CLEAR_UPLOAD_STATUSES' });
    }, [jobState]);

    const getUploadStatus = useCallback((photoId: string): PhotoUploadStatus | undefined => {
        return jobState?.photoUploadStatuses[photoId];
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
        setUploadStatus, // ✅
        removeUploadStatus, // ✅
        clearUploadStatuses, // ✅
        getUploadStatus, // ✅
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
