/**
 * Job Steps Utilities - Fonctions utilitaires partagées pour la gestion des étapes de job
 */

export interface JobStep {
    id: number;
    name?: string;
    title?: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    icon: string;
    estimatedDuration?: string;
}

/**
 * Génère les étapes du job de manière cohérente
 */
export const generateJobSteps = (job: any): JobStep[] => {
    const currentStep = job?.step?.actualStep || job?.current_step || 1;
    const workflowData = job?.workflow;
    
    return [
        {
            id: 1,
            name: '🚀 Démarrer le job',
            title: '🚀 Démarrer le job',
            description: 'Initialisation et préparation du déménagement',
            status: currentStep >= 1 ? 'completed' : 'pending',
            icon: 'play-circle',
            estimatedDuration: '15 min'
        },
        {
            id: 2,
            name: '🚗 Je suis en route',
            title: '🚗 Je suis en route',
            description: workflowData?.pickup_address?.formatted || 'En route vers l\'adresse de collecte',
            status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
            icon: 'car',
            estimatedDuration: '30 min'
        },
        {
            id: 3,
            name: '📍 Arrivé chez le client',
            title: '📍 Arrivé chez le client',
            description: 'Collecte et chargement des objets',
            status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
            icon: 'location',
            estimatedDuration: '60 min'
        },
        {
            id: 4,
            name: '🚛 En route prochaine adresse',
            title: '🚛 En route prochaine adresse',
            description: workflowData?.dropoff_address?.formatted || 'Transport vers l\'adresse de livraison',
            status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
            icon: 'navigate',
            estimatedDuration: '45 min'
        },
        {
            id: 5,
            name: '✅ Job terminé',
            title: '✅ Job terminé',
            description: 'Livraison effectuée et job finalisé',
            status: currentStep >= 5 ? 'completed' : currentStep === 4 ? 'current' : 'pending',
            icon: 'checkmark-circle',
            estimatedDuration: '30 min'
        }
    ];
};

/**
 * Calcule le pourcentage de progression
 */
export const calculateProgressPercentage = (job: any): number => {
    const currentStep = job?.step?.actualStep || job?.current_step || 1;
    const maxSteps = 5;
    
    if (job?.progress) {
        return typeof job.progress === 'number' ? job.progress : parseFloat(job.progress);
    }
    
    // Utiliser la même logique que pour les animations
    return Math.round(((currentStep - 1) / Math.max(1, (maxSteps - 1))) * 100);
};

/**
 * Calcule la progression pour les animations (0-1)
 */
export const calculateAnimationProgress = (job: any): number => {
    const currentStep = job?.step?.actualStep || job?.current_step || 1;
    const maxSteps = 5;
    
    if (job?.progress) {
        const progress = typeof job.progress === 'number' ? job.progress : parseFloat(job.progress);
        return progress / 100;
    }
    
    return (currentStep - 1) / Math.max(1, (maxSteps - 1));
};

/**
 * Obtient l'étape actuelle
 */
export const getCurrentStep = (job: any): number => {
    return job?.step?.actualStep || job?.current_step || 1;
};

/**
 * Obtient l'index de l'étape actuelle (pour les arrays 0-indexés)
 */
export const getCurrentStepIndex = (job: any): number => {
    const steps = generateJobSteps(job);
    const currentIndex = steps.findIndex(step => step.status === 'current');
    return currentIndex >= 0 ? currentIndex : getCurrentStep(job) - 1;
};

/**
 * Vérifie si une étape est cliquable
 */
export const isStepClickable = (stepId: number, job: any): boolean => {
    const currentStep = getCurrentStep(job);
    return stepId <= 5 && (stepId === currentStep + 1 || stepId < currentStep);
};

/**
 * Obtient le nom d'une étape par son ID
 */
export const getStepName = (stepId: number, job: any): string => {
    const steps = generateJobSteps(job);
    return steps.find(s => s.id === stepId)?.name || `Étape ${stepId}`;
};