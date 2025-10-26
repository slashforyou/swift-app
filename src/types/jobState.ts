/**
 * Job State Types
 * 
 * Types pour la gestion de l'état du job (étapes, progression, etc.)
 * Utilisé par le JobStateProvider pour la persistence et synchronisation
 */

/**
 * Étape du job
 */
export interface JobStep {
    id: number;
    name: string;
    description: string;
    completedAt?: string; // ISO timestamp quand l'étape a été complétée
}

/**
 * État de progression du job
 */
export interface JobProgress {
    actualStep: number; // Étape actuelle (1, 2, 3, etc.)
    steps: JobStep[]; // Liste des étapes
    totalSteps: number; // Nombre total d'étapes
    isCompleted: boolean; // Si toutes les étapes sont complétées
    completedAt?: string; // Timestamp de complétion finale
}

/**
 * État complet du job (persisté dans AsyncStorage)
 */
export interface JobState {
    jobId: string; // ID du job
    progress: JobProgress; // État de progression
    lastSyncedAt: string; // Dernière synchronisation avec l'API
    lastModifiedAt: string; // Dernière modification locale
    isDirty: boolean; // Si des modifications locales n'ont pas été sync avec l'API
}

/**
 * Actions possibles sur l'état du job
 */
export type JobStateAction =
    | { type: 'SET_STEP'; payload: number }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'COMPLETE_STEP'; payload: number }
    | { type: 'COMPLETE_JOB' }
    | { type: 'SYNC_WITH_API'; payload: JobProgress }
    | { type: 'RESET_JOB' };

/**
 * Contexte du job state
 */
export interface JobStateContextType {
    jobState: JobState | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setCurrentStep: (step: number) => Promise<void>;
    nextStep: () => Promise<void>;
    prevStep: () => Promise<void>;
    completeStep: (stepId: number) => Promise<void>;
    completeJob: () => Promise<void>;
    syncWithAPI: () => Promise<void>;
    resetJob: () => Promise<void>;
    
    // Helpers
    canGoNext: boolean;
    canGoPrevious: boolean;
    isJobCompleted: boolean;
    currentStepIndex: number; // 0-based index
    totalSteps: number;
}
