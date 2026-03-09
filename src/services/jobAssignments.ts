/**
 * Job Assignments Service
 *
 * Gestion des affectations de ressources (staff + véhicules) sur les jobs.
 * Spec : docs/AVAILABILITY_ASSIGNMENT_SPEC.md
 *
 * Endpoints :
 *   GET    /v1/jobs/:jobId/assignments
 *   POST   /v1/jobs/:jobId/assignments
 *   DELETE /v1/jobs/:jobId/assignments/:assignmentId
 *   PATCH  /v1/jobs/:jobId/assignments/:assignmentId/respond
 *   GET    /v1/companies/:companyId/resources/availability
 *   GET    /v1/users/me/assignments
 */

import { ServerData } from "../constants/ServerData";
import type {
    CompanyAvailabilityResponse,
    CreateJobAssignmentRequest,
    JobAssignment,
    ListAssignmentsResponse,
    RespondToAssignmentRequest,
} from "../types/jobAssignment";
import { authenticatedFetch } from "../utils/auth";
import { logger } from "./logger";

const API = ServerData.serverUrl;

// ─────────────────────────────────────────────────────────────
// GET /v1/jobs/:jobId/assignments
// ─────────────────────────────────────────────────────────────

/**
 * Liste toutes les affectations d'un job avec statuts.
 */
export async function listAssignments(
  jobId: string | number,
): Promise<ListAssignmentsResponse> {
  logger.debug("[jobAssignments] listAssignments", { jobId });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/assignments`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.message || `Failed to fetch assignments (${response.status})`,
    );
  }

  return json as ListAssignmentsResponse;
}

// ─────────────────────────────────────────────────────────────
// POST /v1/jobs/:jobId/assignments
// ─────────────────────────────────────────────────────────────

/**
 * Créer une affectation sur un job.
 * Vérifie la disponibilité et, si staff, envoie une push notification.
 */
export async function createAssignment(
  jobId: string | number,
  body: CreateJobAssignmentRequest,
): Promise<{
  data: JobAssignment;
  conflict: unknown;
  staffing_status: string;
}> {
  logger.debug("[jobAssignments] createAssignment", { jobId, body });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/assignments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error || `Failed to create assignment (${response.status})`,
    );
  }

  return json;
}

// ─────────────────────────────────────────────────────────────
// DELETE /v1/jobs/:jobId/assignments/:assignmentId
// ─────────────────────────────────────────────────────────────

/**
 * Annuler une affectation (avant confirmation).
 * Accessible uniquement par la company assignante.
 */
export async function deleteAssignment(
  jobId: string | number,
  assignmentId: number,
): Promise<void> {
  logger.debug("[jobAssignments] deleteAssignment", { jobId, assignmentId });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/assignments/${assignmentId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(
      json?.error || `Failed to delete assignment (${response.status})`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /v1/jobs/:jobId/assignments/:assignmentId/respond
// ─────────────────────────────────────────────────────────────

/**
 * Le staff répond à une demande d'affectation (confirmer ou décliner).
 */
export async function respondToAssignment(
  jobId: string | number,
  assignmentId: number,
  body: RespondToAssignmentRequest,
): Promise<{ message: string; staffing_status: string }> {
  logger.debug("[jobAssignments] respondToAssignment", {
    jobId,
    assignmentId,
    body,
  });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/assignments/${assignmentId}/respond`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error || `Failed to respond to assignment (${response.status})`,
    );
  }

  return json;
}

// ─────────────────────────────────────────────────────────────
// GET /v1/companies/:companyId/resources/availability
// ─────────────────────────────────────────────────────────────

/**
 * Disponibilité de toutes les ressources d'une entreprise pour un créneau.
 */
export async function fetchResourceAvailability(
  companyId: number,
  startAt: string,
  endAt: string,
  resourceType?: "staff" | "vehicle",
): Promise<CompanyAvailabilityResponse> {
  logger.debug("[jobAssignments] fetchResourceAvailability", {
    companyId,
    startAt,
    endAt,
  });

  const params = new URLSearchParams({ start_at: startAt, end_at: endAt });
  // Only append resource_type when explicitly specified; omitting it returns both vehicles and staff
  if (resourceType) params.append("resource_type", resourceType);

  const response = await authenticatedFetch(
    `${API}v1/companies/${companyId}/resources/availability?${params}`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    const detail = json?.details ? ` — ${json.details}` : "";
    throw new Error(
      (json?.error || `Failed to fetch availability (${response.status})`) +
        detail,
    );
  }

  return json as CompanyAvailabilityResponse;
}

// ─────────────────────────────────────────────────────────────
// GET /v1/users/me/assignments
// ─────────────────────────────────────────────────────────────

/**
 * Toutes les affectations `pending` de l'utilisateur connecté.
 * Utilisé pour la page "Jobs à confirmer".
 */
export async function fetchMyAssignments(): Promise<JobAssignment[]> {
  logger.debug("[jobAssignments] fetchMyAssignments");

  const response = await authenticatedFetch(`${API}v1/users/me/assignments`, {
    method: "GET",
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error || `Failed to fetch my assignments (${response.status})`,
    );
  }

  return json.data as JobAssignment[];
}
