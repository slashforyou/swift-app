/**
 * Service pour la gestion de l'avancement des étapes de job
 */
import { getAuthHeaders } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

const API = ServerData.serverUrl;

export interface JobStepUpdate {
    step: number;
    timestamp: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    notes?: string;
}

/**
 * Met à jour l'étape actuelle d'un job
 */
export async function updateJobStep(jobId: string, targetStep: number, notes?: string): Promise<void> {
    const headers = await getAuthHeaders();
    
    const updateData: JobStepUpdate = {
        step: targetStep,
        timestamp: new Date().toISOString(),
        notes
    };

    const res = await fetch(`${API}v1/job/${jobId}/step`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify(updateData),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update job step' }));
        throw new Error(error.message || `HTTP ${res.status}: Failed to update job step`);
    }
}

/**
 * Démarre un job (passe à l'étape 1)
 */
export async function startJob(jobId: string): Promise<void> {
    await updateJobStep(jobId, 1, 'Job démarré');
}

/**
 * Marque le job comme "en route" (étape 2)
 */
export async function markJobEnRoute(jobId: string): Promise<void> {
    await updateJobStep(jobId, 2, 'Équipe en route');
}

/**
 * Marque l'arrivée chez le client (étape 3)
 */
export async function markJobArrived(jobId: string): Promise<void> {
    await updateJobStep(jobId, 3, 'Arrivé chez le client');
}

/**
 * Marque le job comme "en transit" vers la destination (étape 4)
 */
export async function markJobInTransit(jobId: string): Promise<void> {
    await updateJobStep(jobId, 4, 'En route vers la destination');
}

/**
 * Termine le job (étape 5)
 */
export async function completeJob(jobId: string, completionNotes?: string): Promise<void> {
    await updateJobStep(jobId, 5, completionNotes || 'Job terminé avec succès');
}

/**
 * Récupère l'historique des étapes d'un job
 */
export async function getJobStepHistory(jobId: string): Promise<JobStepUpdate[]> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${API}v1/job/${jobId}/step-history`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to fetch job step history' }));
        throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job step history`);
    }

    const data = await res.json();
    return data.history || data || [];
}