/**
 * 👥 CREW SERVICE
 * 
 * Service pour gérer l'assignation du crew (staff) sur les jobs.
 * Utilise les endpoints:
 * - GET    /v1/job/:id/crew       - Liste du crew assigné
 * - POST   /v1/job/:id/crew       - Assigner un membre du staff
 * - PATCH  /v1/job/:id/crew/:crewId - Modifier assignation
 * - DELETE /v1/job/:id/crew/:crewId - Retirer du crew
 * 
 * @see BACKEND_REQUIREMENTS_PHASE2.md pour les détails API
 */

import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';
import type { CrewMember } from './jobDetails';
import { logger } from './logger';

const API = ServerData.serverUrl;

// ========================================
// TYPES
// ========================================

export interface AssignCrewRequest {
  staff_id: string;
  role?: 'driver' | 'helper' | 'supervisor' | 'technician';
}

export interface UpdateCrewRequest {
  role?: 'driver' | 'helper' | 'supervisor' | 'technician';
  status?: 'assigned' | 'confirmed' | 'en-route' | 'on-site' | 'completed';
}

export interface CrewApiResponse {
  success: boolean;
  data?: CrewMember;
  crew?: CrewMember[];
  message?: string;
  error?: string;
}

// ========================================
// CREW SERVICE FUNCTIONS
// ========================================

/**
 * Récupère le crew assigné à un job
 * GET /v1/job/:id/crew
 */
export async function getJobCrew(jobId: string): Promise<CrewMember[]> {
  try {
    logger.debug('[crewService] Fetching crew for job', { jobId });
    
    const response = await authenticatedFetch(`${API}v1/job/${jobId}/crew`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[crewService] Failed to fetch crew:', { status: response.status, error: errorText });
      throw new Error(`Failed to fetch crew: ${response.status}`);
    }

    const data = await response.json();
    logger.debug('[crewService] Crew fetched successfully:', { count: data.crew?.length || 0 });
    
    return data.crew || [];
  } catch (error) {
    logger.error('[crewService] Error fetching crew:', error);
    throw error;
  }
}

/**
 * Assigne un membre du staff à un job
 * POST /v1/job/:id/crew
 * 
 * @param jobId - ID du job
 * @param staffId - ID du staff à assigner
 * @param role - Rôle sur ce job (optionnel)
 */
export async function assignStaffToJob(
  jobId: string,
  staffId: string,
  role?: 'driver' | 'helper' | 'supervisor' | 'technician'
): Promise<CrewMember> {
  try {
    logger.info('[crewService] Assigning staff to job:', { jobId, staffId, role });
    
    const body: AssignCrewRequest = {
      staff_id: staffId,
    };
    
    if (role) {
      body.role = role;
    }

    const response = await authenticatedFetch(`${API}v1/job/${jobId}/crew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[crewService] Failed to assign staff:', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(errorData.message || errorData.error || `Failed to assign staff: ${response.status}`);
    }

    const data = await response.json();
    logger.info('[crewService] ✅ Staff assigned successfully:', { 
      jobId, 
      staffId, 
      crewMemberId: data.data?.id 
    });
    
    return data.data;
  } catch (error) {
    logger.error('[crewService] Error assigning staff:', error);
    throw error;
  }
}

/**
 * Met à jour un membre du crew sur un job
 * PATCH /v1/job/:id/crew/:crewId
 * 
 * @param jobId - ID du job
 * @param crewId - ID de l'entrée crew (pas l'ID du staff!)
 * @param updates - Modifications à appliquer
 */
export async function updateCrewMember(
  jobId: string,
  crewId: string,
  updates: UpdateCrewRequest
): Promise<CrewMember> {
  try {
    logger.info('[crewService] Updating crew member:', { jobId, crewId, updates });

    const response = await authenticatedFetch(`${API}v1/job/${jobId}/crew/${crewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[crewService] Failed to update crew member:', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(errorData.message || errorData.error || `Failed to update crew: ${response.status}`);
    }

    const data = await response.json();
    logger.info('[crewService] ✅ Crew member updated successfully');
    
    return data.data;
  } catch (error) {
    logger.error('[crewService] Error updating crew member:', error);
    throw error;
  }
}

/**
 * Retire un membre du crew d'un job
 * DELETE /v1/job/:id/crew/:crewId
 * 
 * @param jobId - ID du job
 * @param crewId - ID de l'entrée crew à supprimer
 */
export async function removeCrewMember(
  jobId: string,
  crewId: string
): Promise<void> {
  try {
    logger.info('[crewService] Removing crew member:', { jobId, crewId });

    const response = await authenticatedFetch(`${API}v1/job/${jobId}/crew/${crewId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[crewService] Failed to remove crew member:', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(errorData.message || errorData.error || `Failed to remove crew: ${response.status}`);
    }

    logger.info('[crewService] ✅ Crew member removed successfully');
  } catch (error) {
    logger.error('[crewService] Error removing crew member:', error);
    throw error;
  }
}

/**
 * Retire tous les membres du crew d'un job
 * Utile pour "unassign" complet
 */
export async function clearJobCrew(jobId: string): Promise<void> {
  try {
    logger.info('[crewService] Clearing all crew from job', { jobId });
    
    const crew = await getJobCrew(jobId);
    
    if (crew.length === 0) {
      logger.debug('[crewService] No crew to remove');
      return;
    }

    // Supprimer chaque membre
    await Promise.all(
      crew.map(member => removeCrewMember(jobId, member.id))
    );

    logger.info('[crewService] ✅ All crew removed from job');
  } catch (error) {
    logger.error('[crewService] Error clearing crew:', error);
    throw error;
  }
}

// Export par défaut pour usage simple
export default {
  getJobCrew,
  assignStaffToJob,
  updateCrewMember,
  removeCrewMember,
  clearJobCrew,
};
