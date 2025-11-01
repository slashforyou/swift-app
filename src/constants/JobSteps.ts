/**
 * JobSteps - Configuration centralisée des étapes de job
 * Système flexible pour gérer différents types de jobs avec steps dynamiques
 */

// ============================================================================
// TYPES D'ÉTAPES
// ============================================================================

export enum StepType {
    // Étapes obligatoires (tous les jobs)
    DEPARTURE = 'DEPARTURE',              // Départ du dépôt
    FIRST_ADDRESS = 'FIRST_ADDRESS',      // Première adresse
    LAST_ADDRESS = 'LAST_ADDRESS',        // Dernière adresse
    COMPLETION = 'COMPLETION',            // Fin du job
    
    // Étapes optionnelles (selon type de job)
    LOADING = 'LOADING',                  // Chargement initial (container, boxes...)
    TRANSIT = 'TRANSIT',                  // Trajet entre deux adresses
    INTERMEDIATE_ADDRESS = 'INTERMEDIATE_ADDRESS', // Adresse intermédiaire
    RETURN_TO_DEPOT = 'RETURN_TO_DEPOT',  // Retour au dépôt
    STORAGE = 'STORAGE',                  // Mise en storage au dépôt
    UNLOADING = 'UNLOADING',              // Déchargement
}

// ============================================================================
// CONFIGURATION DES ÉTAPES
// ============================================================================

export interface JobStepConfig {
    id: string;
    type: StepType;
    name: string;                         // Nom affiché
    shortName?: string;                   // Nom court pour UI compacte
    description: string;                  // Description détaillée
    icon: string;                         // Icône Ionicons
    color: string;                        // Couleur de l'étape
    isOptional: boolean;                  // Peut être ignorée
    allowMultiple: boolean;               // Peut avoir plusieurs instances (ex: transit)
    requiresSignature: boolean;           // Nécessite signature pour passer à la suivante
    estimatedDuration?: number;           // Durée estimée en minutes
}

// ============================================================================
// DÉFINITIONS DES ÉTAPES
// ============================================================================

export const STEP_DEFINITIONS: Record<StepType, JobStepConfig> = {
    [StepType.DEPARTURE]: {
        id: 'departure',
        type: StepType.DEPARTURE,
        name: 'Départ',
        shortName: 'Départ',
        description: 'Départ du dépôt ou point de départ',
        icon: 'rocket-outline',
        color: '#10B981', // Vert
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 0,
    },
    
    [StepType.LOADING]: {
        id: 'loading',
        type: StepType.LOADING,
        name: 'Chargement',
        shortName: 'Chargement',
        description: 'Chargement des meubles, boxes ou container au dépôt',
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
        name: 'Première adresse',
        shortName: '1ère adresse',
        description: 'Arrivée à la première adresse - chargement ou déchargement selon le job',
        icon: 'location-outline',
        color: '#3B82F6', // Bleu
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.TRANSIT]: {
        id: 'transit',
        type: StepType.TRANSIT,
        name: 'Trajet',
        shortName: 'Trajet',
        description: 'Trajet entre deux adresses (peut être ajouté plusieurs fois)',
        icon: 'car-outline',
        color: '#8B5CF6', // Violet
        isOptional: true,
        allowMultiple: true, // ✅ Peut avoir plusieurs trajets
        requiresSignature: false,
        estimatedDuration: 20,
    },
    
    [StepType.INTERMEDIATE_ADDRESS]: {
        id: 'intermediate_address',
        type: StepType.INTERMEDIATE_ADDRESS,
        name: 'Adresse intermédiaire',
        shortName: 'Adresse',
        description: 'Adresse supplémentaire entre la première et la dernière',
        icon: 'location-outline',
        color: '#06B6D4', // Cyan
        isOptional: true,
        allowMultiple: true, // ✅ Peut avoir plusieurs adresses intermédiaires
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.LAST_ADDRESS]: {
        id: 'last_address',
        type: StepType.LAST_ADDRESS,
        name: 'Dernière adresse',
        shortName: 'Dernière',
        description: 'Arrivée à la dernière adresse - finalisation du déménagement',
        icon: 'checkmark-circle-outline',
        color: '#EC4899', // Rose
        isOptional: false,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 60,
    },
    
    [StepType.RETURN_TO_DEPOT]: {
        id: 'return_to_depot',
        type: StepType.RETURN_TO_DEPOT,
        name: 'Retour au dépôt',
        shortName: 'Retour',
        description: 'Trajet de retour entre la dernière adresse et le dépôt',
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
        name: 'Mise en storage',
        shortName: 'Storage',
        description: 'Mise en box/storage des meubles au dépôt',
        icon: 'filing-outline',
        color: '#EF4444', // Rouge
        isOptional: true,
        allowMultiple: false,
        requiresSignature: false,
        estimatedDuration: 45,
    },
    
    [StepType.UNLOADING]: {
        id: 'unloading',
        type: StepType.UNLOADING,
        name: 'Déchargement',
        shortName: 'Déchargement',
        description: 'Déchargement des meubles à une adresse',
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
        name: 'Fin du job',
        shortName: 'Fin',
        description: 'Job terminé - déclenchement de la facturation',
        icon: 'flag-outline',
        color: '#10B981', // Vert
        isOptional: false,
        allowMultiple: false,
        requiresSignature: true, // ✅ Nécessite signature avant paiement
        estimatedDuration: 0,
    },
};

// ============================================================================
// TEMPLATES DE JOBS
// ============================================================================

export enum JobTemplate {
    SIMPLE_MOVE = 'SIMPLE_MOVE',           // Déménagement simple A → B
    MULTI_STOP = 'MULTI_STOP',             // Plusieurs adresses
    WITH_STORAGE = 'WITH_STORAGE',         // Avec mise en storage
    CONTAINER_MOVE = 'CONTAINER_MOVE',     // Déménagement container
    DELIVERY_ONLY = 'DELIVERY_ONLY',       // Livraison simple
}

export interface JobStepTemplate {
    name: string;
    description: string;
    steps: StepType[];
}

export const JOB_TEMPLATES: Record<JobTemplate, JobStepTemplate> = {
    [JobTemplate.SIMPLE_MOVE]: {
        name: 'Déménagement simple',
        description: 'Déménagement direct d\'une adresse à une autre',
        steps: [
            StepType.DEPARTURE,
            StepType.FIRST_ADDRESS,
            StepType.TRANSIT,
            StepType.LAST_ADDRESS,
            StepType.COMPLETION,
        ],
    },
    
    [JobTemplate.MULTI_STOP]: {
        name: 'Plusieurs adresses',
        description: 'Déménagement avec plusieurs points de chargement/déchargement',
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
        name: 'Avec storage',
        description: 'Déménagement avec mise en box au dépôt',
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
        name: 'Déménagement container',
        description: 'Chargement container au dépôt puis livraison',
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
        name: 'Livraison simple',
        description: 'Livraison depuis le dépôt',
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
// UTILITAIRES
// ============================================================================

/**
 * Obtenir la configuration complète d'une étape
 */
export const getStepConfig = (type: StepType): JobStepConfig => {
    return STEP_DEFINITIONS[type];
};

/**
 * Obtenir toutes les étapes d'un template
 */
export const getTemplateSteps = (template: JobTemplate): JobStepConfig[] => {
    const templateConfig = JOB_TEMPLATES[template];
    return templateConfig.steps.map(stepType => STEP_DEFINITIONS[stepType]);
};

/**
 * Créer des steps depuis un tableau de types
 */
export const createStepsFromTypes = (stepTypes: StepType[]): JobStepConfig[] => {
    return stepTypes.map(type => STEP_DEFINITIONS[type]);
};

/**
 * Vérifier si un job a une étape spécifique
 */
export const hasStepType = (steps: JobStepConfig[], type: StepType): boolean => {
    return steps.some(step => step.type === type);
};

/**
 * Obtenir l'index d'une étape par son type
 */
export const getStepIndexByType = (steps: JobStepConfig[], type: StepType): number => {
    return steps.findIndex(step => step.type === type);
};

/**
 * Vérifier si une signature est requise pour l'étape actuelle
 */
export const isSignatureRequired = (steps: JobStepConfig[], currentStepIndex: number): boolean => {
    if (currentStepIndex >= steps.length) return false;
    return steps[currentStepIndex].requiresSignature;
};

/**
 * Calculer la durée totale estimée d'un job
 */
export const calculateTotalEstimatedDuration = (steps: JobStepConfig[]): number => {
    return steps.reduce((total, step) => total + (step.estimatedDuration || 0), 0);
};

/**
 * Formater le nom d'une étape avec son numéro
 */
export const formatStepName = (step: JobStepConfig, index: number, total: number): string => {
    return `${index + 1}/${total} - ${step.shortName || step.name}`;
};

/**
 * Obtenir la couleur d'une étape
 */
export const getStepColor = (step: JobStepConfig): string => {
    return step.color;
};

/**
 * Obtenir l'icône d'une étape
 */
export const getStepIcon = (step: JobStepConfig): string => {
    return step.icon;
};
