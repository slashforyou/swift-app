/**
 * Job Transfer Service
 *
 * Création et gestion des délégations de job entre entreprises.
 * Endpoints :
 *   POST   /api/jobs/:jobId/transfers
 *   GET    /api/jobs/:jobId/transfers
 *   PATCH  /api/jobs/:jobId/transfers/:id/respond
 *   DELETE /api/jobs/:jobId/transfers/:id
 *   GET    /api/companies/me/incoming-transfers
 */

import { ServerData } from "../constants/ServerData";
import type {
    CreateJobTransferRequest,
    JobTransfer,
    RespondToTransferRequest,
} from "../types/jobTransfer";
import { authenticatedFetch } from "../utils/auth";
import { logger } from "./logger";

const API = ServerData.serverUrl;

// ─────────────────────────────────────────────────────────────
// Créer un transfert
// ─────────────────────────────────────────────────────────────

/**
 * Créer une délégation sur un job.
 * POST /api/jobs/:jobId/transfers
 * Accessible uniquement par le propriétaire du job.
 */
export async function createTransfer(
  jobId: string,
  body: CreateJobTransferRequest,
): Promise<JobTransfer> {
  logger.debug("[jobTransfer] createTransfer", { jobId, body });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/transfers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.message || `Failed to create transfer (${response.status})`,
    );
  }

  return json.data as JobTransfer;
}

// ─────────────────────────────────────────────────────────────
// Lister les transferts d'un job
// ─────────────────────────────────────────────────────────────

/**
 * Lister les transferts d'un job.
 * GET /api/jobs/:jobId/transfers
 */
export async function listTransfers(jobId: string): Promise<JobTransfer[]> {
  logger.debug("[jobTransfer] listTransfers", { jobId });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/transfers`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Failed to fetch transfers");
  }

  return (json.data ?? []) as JobTransfer[];
}

// ─────────────────────────────────────────────────────────────
// Répondre à un transfert
// ─────────────────────────────────────────────────────────────

/**
 * Accepter ou refuser un transfert.
 * PATCH /api/jobs/:jobId/transfers/:transferId/respond
 * Accessible uniquement par le cessionnaire.
 */
export async function respondToTransfer(
  jobId: string,
  transferId: number,
  body: RespondToTransferRequest,
): Promise<JobTransfer> {
  logger.debug("[jobTransfer] respondToTransfer", { jobId, transferId, body });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/transfers/${transferId}/respond`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.message || `Failed to respond to transfer (${response.status})`,
    );
  }

  return json.data as JobTransfer;
}

// ─────────────────────────────────────────────────────────────
// Annuler un transfert
// ─────────────────────────────────────────────────────────────

/**
 * Annuler un transfert en attente.
 * DELETE /api/jobs/:jobId/transfers/:transferId
 * Accessible uniquement par la cédante, seulement si status = 'pending'.
 */
export async function cancelTransfer(
  jobId: string,
  transferId: number,
): Promise<void> {
  logger.debug("[jobTransfer] cancelTransfer", { jobId, transferId });

  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/transfers/${transferId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(
      json?.message || `Failed to cancel transfer (${response.status})`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Transferts entrants
// ─────────────────────────────────────────────────────────────

/**
 * Récupère les transferts entrants (pending) pour l'entreprise connectée.
 * GET /api/companies/me/incoming-transfers
 * Utilisé pour le badge et la liste "Jobs à valider".
 */
export async function getIncomingTransfers(): Promise<JobTransfer[]> {
  logger.debug("[jobTransfer] getIncomingTransfers");

  const response = await authenticatedFetch(
    `${API}v1/companies/me/incoming-transfers`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Failed to fetch incoming transfers");
  }

  return (json.data ?? []) as JobTransfer[];
}
