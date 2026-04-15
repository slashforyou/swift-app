/**
 * JobSteps - Centralised configuration for job steps
 * Flexible system to manage different job types with dynamic steps
 */

import { SegmentType } from '../types/jobSegment';

// ============================================================================
// STEP TYPES
// ============================================================================

export enum StepType {
    // Mandatory steps (all jobs)
    DEPARTURE = 'DEPARTURE',              // Depart from depot
    FIRST_ADDRESS = 'FIRST_ADDRESS',      // First address
    LAST_ADDRESS = 'LAST_ADDRESS',        // Last address
    COMPLETION = 'COMPLETION',            // Job completion
    
    // Optional steps (depending on job type)
    LOADING = 'LOADING',                  // Initial loading (container, boxes...)
    TRANSIT = 'TRANSIT',                  // Transit between two addresses
    INTERMEDIATE_ADDRESS = 'INTERMEDIATE_ADDRESS', // Intermediate address
    RETURN_TO_DEPOT = 'RETURN_TO_DEPOT',  // Return to depot
    STORAGE = 'STORAGE',                  // Storage at depot
    UNLOADING = 'UNLOADING',              // Unloading
}

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export interface JobStepConfig {
    id: string;
    type: StepType;
    name: string;                         // Display name
    shortName?: string;                   // Short name for compact UI
    description: string;                  // Detailed description
    icon: string;                         // Ionicons icon
    color: string;                        // Step color
    isOptional: boolean;                  // Can be skipped
    allowMultiple: boolean;               // Can have multiple instances (e.g. transit)
    requiresSignature: boolean;           // Requires signature to proceed to next
    estimatedDuration?: number;           // Estimated duration in minutes
}

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

export const STEP_DEFINITIONS: Record<StepType, JobStepConfig> = {
    [StepType.DEPARTURE]: {
        id: 'departure',
        type: StepType.DEPARTURE,
        name: 'Departure',
        shortName: 'Departure',
        description: 'Departure from depot or starting point',
        icon: 'rocket-outline',
        color: '#10B981', // Green
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 0,
    },
    
    [StepType.LOADING]: {
        id: 'loading',
        type: StepType.LOADING,
        name: 'Loading',
        shortName: 'Loading',
        description: 'Loading furniture, boxes or container at depot',
        icon: 'cube-outline',
        color: '#F59E0B', // Orange
        isOptional: true,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 30,
    },
    
    [StepType.FIRST_ADDRESS]: {
        id: 'first_address',
        type: StepType.FIRST_ADDRESS,
        name: 'First address',
        shortName: '1st address',
        description: 'Arrival at first address - loading or unloading depending on job',
        icon: 'location-outline',
        color: '#3B82F6', // Blue
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.TRANSIT]: {
        id: 'transit',
        type: StepType.TRANSIT,
        name: 'Transit',
        shortName: 'Transit',
        description: 'Transit between two addresses (can be added multiple times)',
        icon: 'car-outline',
        color: '#8B5CF6', // Violet
        isOptional: true,
        allowMultiple: true,
        requiresSignature: false,
        estimatedDuration: 20,
    },
    
    [StepType.INTERMEDIATE_ADDRESS]: {
        id: 'intermediate_address',
        type: StepType.INTERMEDIATE_ADDRESS,
        name: 'Intermediate address',
        shortName: 'Address',
        description: 'Additional address between first and last',
        icon: 'location-outline',
        color: '#06B6D4', // Cyan
        isOptional: true,
        allowMultiple: true,
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.LAST_ADDRESS]: {
        id: 'last_address',
        type: StepType.LAST_ADDRESS,
        name: 'Last address',
        shortName: 'Last',
        description: 'Arrival at last address - finalising the move',
        icon: 'checkmark-circle-outline',
        color: '#EC4899', // Pink
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.RETURN_TO_DEPOT]: {
        id: 'return_to_depot',
        type: StepType.RETURN_TO_DEPOT,
        name: 'Return to depot',
        shortName: 'Return',
        description: 'Return trip from last address to depot',
        icon: 'arrow-undo-outline',
        color: '#6366F1', // Indigo
        isOptional: true,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 30,
    },
    
    [StepType.STORAGE]: {
        id: 'storage',
        type: StepType.STORAGE,
        name: 'Storage',
        shortName: 'Storage',
        description: 'Storing furniture in boxes/storage at depot',
        icon: 'filing-outline',
        color: '#EF4444', // Red
        isOptional: true,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 45,
    },
    
    [StepType.UNLOADING]: {
        id: 'unloading',
        type: StepType.UNLOADING,
        name: 'Unloading',
        shortName: 'Unloading',
        description: 'Unloading furniture at an address',
        icon: 'download-outline',
        color: '#14B8A6', // Teal
        isOptional: true,
        allowMultiple: true,
        requiresSignature: false,
        estimatedDuration: 45,
    },
    
    [StepType.COMPLETION]: {
        id: 'completion',
        type: StepType.COMPLETION,
        name: 'Job complete',
        shortName: 'Done',
        description: 'Job completed - billing triggered',
        icon: 'flag-outline',
        color: '#10B981', // Green
        isOptional: false,
        allowMultiple: false,
        requiresSignature: true,
        estimatedDuration: 0,
    },
};

// ============================================================================
// JOB TEMPLATES
// ============================================================================

export enum JobTemplate {
    SIMPLE_MOVE = 'SIMPLE_MOVE',           // Simple move A → B
    MULTI_STOP = 'MULTI_STOP',             // Multiple addresses
    WITH_STORAGE = 'WITH_STORAGE',         // With storage
    CONTAINER_MOVE = 'CONTAINER_MOVE',     // Container move
    DELIVERY_ONLY = 'DELIVERY_ONLY',       // Simple delivery
}

export interface JobStepTemplate {
    name: string;
    description: string;
    steps: StepType[];
}

export const JOB_TEMPLATES: Record<JobTemplate, JobStepTemplate> = {
    [JobTemplate.SIMPLE_MOVE]: {
        name: 'Simple move',
        description: 'Direct move from one address to another',
        steps: [
            StepType.DEPARTURE,
            StepType.FIRST_ADDRESS,
            StepType.TRANSIT,
            StepType.LAST_ADDRESS,
            StepType.COMPLETION,
        ],
    },
    
    [JobTemplate.MULTI_STOP]: {
        name: 'Multiple addresses',
        description: 'Move with multiple loading/unloading points',
        steps: [
            StepType.DEPARTURE,
            StepType.FIRST_ADDRESS,
            StepType.TRANSIT,
            StepType.INTERMEDIATE_ADDRESS,
            StepType.TRANSIT,
            StepType.LAST_ADDRESS,
            StepType.COMPLETION,
        ],
    },
    
    [JobTemplate.WITH_STORAGE]: {
        name: 'With storage',
        description: 'Move with storage at depot',
        steps: [
            StepType.DEPARTURE,
            StepType.FIRST_ADDRESS,
            StepType.TRANSIT,
            StepType.LAST_ADDRESS,
            StepType.RETURN_TO_DEPOT,
            StepType.STORAGE,
            StepType.COMPLETION,
        ],
    },
    
    [JobTemplate.CONTAINER_MOVE]: {
        name: 'Container move',
        description: 'Container loading at depot then delivery',
        steps: [
            StepType.DEPARTURE,
            StepType.LOADING,
            StepType.TRANSIT,
            StepType.FIRST_ADDRESS,
            StepType.UNLOADING,
            StepType.RETURN_TO_DEPOT,
            StepType.COMPLETION,
        ],
    },
    
    [JobTemplate.DELIVERY_ONLY]: {
        name: 'Simple delivery',
        description: 'Delivery from depot',
        steps: [
            StepType.DEPARTURE,
            StepType.LOADING,
            StepType.TRANSIT,
            StepType.FIRST_ADDRESS,
            StepType.COMPLETION,
        ],
    },
};

// ============================================================================
// STEPTYPE → SEGMENTTYPE MAPPING
// ============================================================================

export const STEP_TO_SEGMENT_MAP: Record<StepType, SegmentType> = {
    [StepType.DEPARTURE]: 'travel',
    [StepType.FIRST_ADDRESS]: 'location',
    [StepType.LAST_ADDRESS]: 'location',
    [StepType.INTERMEDIATE_ADDRESS]: 'location',
    [StepType.TRANSIT]: 'travel',
    [StepType.LOADING]: 'loading',
    [StepType.UNLOADING]: 'loading',
    [StepType.STORAGE]: 'storage',
    [StepType.RETURN_TO_DEPOT]: 'travel',
    [StepType.COMPLETION]: 'location',
};

// ============================================================================
// UTILITIES
// ============================================================================

export const getStepConfig = (type: StepType): JobStepConfig => {
    return STEP_DEFINITIONS[type];
};

export const getTemplateSteps = (template: JobTemplate): JobStepConfig[] => {
    const templateConfig = JOB_TEMPLATES[template];
    return templateConfig.steps.map(stepType => STEP_DEFINITIONS[stepType]);
};

export const createStepsFromTypes = (stepTypes: StepType[]): JobStepConfig[] => {
    return stepTypes.map(type => STEP_DEFINITIONS[type]);
};

export const hasStepType = (steps: JobStepConfig[], type: StepType): boolean => {
    return steps.some(step => step.type === type);
};

/**
 * Get the index of a step by its type
 */
export const getStepIndexByType = (steps: JobStepConfig[], type: StepType): number => {
    return steps.findIndex(step => step.type === type);
};

export const isSignatureRequired = (steps: JobStepConfig[], currentStepIndex: number): boolean => {
    if (currentStepIndex >= steps.length) return false;
    return steps[currentStepIndex].requiresSignature;
};

export const calculateTotalEstimatedDuration = (steps: JobStepConfig[]): number => {
    return steps.reduce((total, step) => total + (step.estimatedDuration || 0), 0);
};

export const formatStepName = (step: JobStepConfig, index: number, total: number): string => {
    return `${index + 1}/${total} - ${step.shortName || step.name}`;
};

export const getStepColor = (step: JobStepConfig): string => {
    return step.color;
};

export const getStepIcon = (step: JobStepConfig): string => {
    return step.icon;
};
