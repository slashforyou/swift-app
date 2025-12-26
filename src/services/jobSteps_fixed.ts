/**
 * Service pour la gestion de l'avancement des étapes de job
 * 
 * 🚨 STATUT: L'API backend pour la mise à jour des étapes n'est PAS encore implémentée
 * 📋 TESTS EFFECTUÉS: Tous les endpoints possibles retournent 404 Not Found
 */

// 🧪 UTILISONS TEMPORAIREMENT L'API DE PRODUCTION pour les tests
// puisque c'est celle qui fonctionne pour le profil
const API = 'https://altivo.fr/swift-app';

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
 * 
 * 🚨 ATTENTION: L'API backend n'est pas encore implémentée !
 * Tous les endpoints testés retournent 404 Not Found.
 * 
 * 📋 ENDPOINTS TESTÉS (tous 404):
 * - https://altivo.fr/swift-app/v1/job/{id}/step
 * - https://altivo.fr/swift-app/v1/jobs/{id}/step  
 * - https://altivo.fr/swift-app/api/v1/jobs/{id}/step
 * - https://altivo.fr/swift-app/job/{id}/step
 * 
 * 📋 PAYLOADS TESTÉS:
 * - {"current_step": X}
 * - {"step": X, "timestamp": ISO, "notes": "..."}
 * - {"step": X}
 * 
 * 🎯 RECOMMANDATION BACKEND:
 * Implémenter: PATCH https://altivo.fr/swift-app/v1/jobs/{jobId}/step
 * Payload recommandé: {"current_step": number, "notes"?: string}
 */
export async function updateJobStep(jobId: string, targetStep: number, notes?: string): Promise<void> {
    // TEMP_DISABLED: console.log('📊 [UPDATE JOB STEP] Starting update:', {
        // jobId,
        // targetStep,
        // notes
    // });

    // 🚨 MODE MOCK TEMPORAIRE - Remove when backend is implemented
    // TEMP_DISABLED: console.log('🧪 [UPDATE JOB STEP] MOCK MODE: Backend API not implemented yet');
    // TEMP_DISABLED: console.log('📋 [UPDATE JOB STEP] Would call: PATCH /v1/jobs/' + jobId + '/step');
    // TEMP_DISABLED: console.log('📋 [UPDATE JOB STEP] Would send:', {
        // current_step: targetStep,
        // notes: notes || undefined
    // });
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // TEMP_DISABLED: console.log('✅ [UPDATE JOB STEP] MOCK SUCCESS: Step update simulated');
    return;

    /* 
    // 🔧 CODE RÉEL À UTILISER QUAND L'API SERA IMPLÉMENTÉE:
    
    const headers = await getAuthHeaders();
    // TEMP_DISABLED: console.log('🔐 [UPDATE JOB STEP] Auth headers:', headers ? 'Present' : 'Missing');
    
    const endpoint = `${API}/v1/jobs/${jobId}/step`;
    const payload = {
        current_step: targetStep,
        notes: notes || undefined
    };

    // TEMP_DISABLED: console.log('📡 [UPDATE JOB STEP] Calling:', { endpoint, payload });

    const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify(payload),
    });

    // TEMP_DISABLED: console.log('📡 [UPDATE JOB STEP] Response:', res.status, res.statusText);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [UPDATE JOB STEP] Error:', errorData);
        throw new Error(`Failed to update job step: ${res.status} ${res.statusText}`);
    }

    const responseData = await res.json().catch(() => ({}));
    // TEMP_DISABLED: console.log('✅ [UPDATE JOB STEP] Success:', responseData);
    */
}

/**
 * Récupère l'étape actuelle d'un job
 */
export async function getJobStep(jobId: string): Promise<JobStepUpdate | null>);    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retourner des données fictives
    const mockStep: JobStepUpdate = {
        step: 1,
        timestamp: new Date().toISOString(),
        notes: 'Step data from mock'
    };
    
    // TEMP_DISABLED: console.log('✅ [GET JOB STEP] MOCK SUCCESS:', mockStep);
    return mockStep;

    /* 
    // 🔧 CODE RÉEL À UTILISER QUAND L'API SERA IMPLÉMENTÉE:
    
    const headers = await getAuthHeaders();
    const endpoint = `${API}/v1/jobs/${jobId}/step`;

    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });

    if (!res.ok) {
        if (res.status === 404) {
            return null; // Pas d'étape trouvée
        }
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [GET JOB STEP] Error:', errorData);
        throw new Error(`Failed to get job step: ${res.status} ${res.statusText}`);
    }

    const stepData = await res.json();
    // TEMP_DISABLED: console.log('✅ [GET JOB STEP] Success:', stepData);
    return stepData;
    */
}

/**
 * Liste toutes les étapes d'un job
 */
export async function getJobStepHistory(jobId: string): Promise<JobStepUpdate[]>);    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Retourner un historique fictif
    const mockHistory: JobStepUpdate[] = [
        {
            step: 1,
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
            notes: 'Job started'
        },
        {
            step: 2,
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30min ago
            notes: 'In progress'
        }
    ];
    
    // TEMP_DISABLED: console.log('✅ [GET JOB STEP HISTORY] MOCK SUCCESS:', mockHistory);
    return mockHistory;

    /* 
    // 🔧 CODE RÉEL À UTILISER QUAND L'API SERA IMPLÉMENTÉE:
    
    const headers = await getAuthHeaders();
    const endpoint = `${API}/v1/jobs/${jobId}/steps`;

    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [GET JOB STEP HISTORY] Error:', errorData);
        throw new Error(`Failed to get job step history: ${res.status} ${res.statusText}`);
    }

    const historyData = await res.json();
    // TEMP_DISABLED: console.log('✅ [GET JOB STEP HISTORY] Success:', historyData);
    return historyData.steps || [];
    */
}