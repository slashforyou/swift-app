/**
 * Company Relations Service
 *
 * Gestion du carnet de relations entre entreprises.
 * Endpoints :
 *   GET    /api/companies/lookup?code=
 *   GET    /api/companies/me/relations
 *   POST   /api/companies/me/relations
 *   PATCH  /api/companies/me/relations/:id
 *   DELETE /api/companies/me/relations/:id
 */

import { ServerData } from "../constants/ServerData";
import type {
    CompanyLookupResult,
    CompanyRelation,
    PublicTruck,
    SaveRelationRequest,
    UpdateRelationRequest,
} from "../types/jobTransfer";
import { authenticatedFetch } from "../utils/auth";
import { logger } from "./logger";

const API = ServerData.serverUrl;

// ─────────────────────────────────────────────────────────────
// Lookup par code
// ─────────────────────────────────────────────────────────────

/**
 * Rechercher une entreprise par son code unique de 8 caractères.
 * GET /api/companies/lookup?code=XXXXXXXX
 */
export async function lookupCompanyByCode(
  code: string,
): Promise<CompanyLookupResult> {
  logger.debug("[companyRelations] lookup", { code });

  const response = await authenticatedFetch(
    `${API}v1/companies/lookup?code=${encodeURIComponent(code.toUpperCase())}`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || `Lookup failed (${response.status})`);
  }

  return json.data as CompanyLookupResult;
}

// ─────────────────────────────────────────────────────────────
// Carnet
// ─────────────────────────────────────────────────────────────

/**
 * Récupère le carnet de relations de l'entreprise connectée.
 * GET /api/companies/me/relations
 */
export async function listRelations(): Promise<CompanyRelation[]> {
  logger.debug("[companyRelations] listRelations");

  const response = await authenticatedFetch(`${API}v1/companies/relations`, {
    method: "GET",
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Failed to fetch relations");
  }

  return (json.data ?? []) as CompanyRelation[];
}

/**
 * Sauvegarder une relation dans le carnet.
 * POST /api/companies/me/relations
 */
export async function saveRelation(
  body: SaveRelationRequest,
): Promise<CompanyRelation> {
  logger.debug("[companyRelations] saveRelation", body);

  const response = await authenticatedFetch(`${API}v1/companies/relations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await response.json();

  // 409 = already saved — on retourne quand même la relation
  if (!response.ok && response.status !== 409) {
    throw new Error(json?.message || "Failed to save relation");
  }

  return json.data as CompanyRelation;
}

/**
 * Mettre à jour le surnom d'une relation.
 * PATCH /api/companies/me/relations/:id
 */
export async function updateRelationNickname(
  relationId: number,
  body: UpdateRelationRequest,
): Promise<CompanyRelation> {
  logger.debug("[companyRelations] updateRelation", { relationId, body });

  const response = await authenticatedFetch(
    `${API}v1/companies/relations/${relationId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Failed to update relation");
  }

  return json.data as CompanyRelation;
}

/**
 * Supprimer une relation du carnet.
 * DELETE /api/companies/me/relations/:id
 */
export async function deleteRelation(relationId: number): Promise<void> {
  logger.debug("[companyRelations] deleteRelation", { relationId });

  const response = await authenticatedFetch(
    `${API}v1/companies/relations/${relationId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json?.message || "Failed to delete relation");
  }
}

// ─────────────────────────────────────────────────────────────
// Trucks publics d'un partenaire
// ─────────────────────────────────────────────────────────────

/**
 * Récupère les véhicules publiquement listés d'une entreprise partenaire.
 * GET /v1/companies/:companyId/public-trucks
 */
export async function fetchCompanyPublicTrucks(
  companyId: number,
): Promise<PublicTruck[]> {
  logger.debug("[companyRelations] fetchCompanyPublicTrucks", { companyId });

  const response = await authenticatedFetch(
    `${API}v1/companies/${companyId}/public-trucks`,
    { method: "GET" },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Failed to fetch partner trucks");
  }

  return (json.data ?? []) as PublicTruck[];
}
