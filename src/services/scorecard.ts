/**
 * scorecard.ts — Service API Scorecard & Reviews
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============================================================
//  TYPES
// ============================================================

export interface Checkpoint {
  code: string;
  label_fr: string;
  label_en: string;
  category: 'photos' | 'documents' | 'steps' | 'notes';
  weight: number;
  passed: boolean;
  value_text: string | null;
  checked_at: string;
}

export interface Scorecard {
  job_id: number;
  total_score: number;
  max_score: number;
  percentage: number;
  generated_at: string;
  checkpoints: Checkpoint[];
}

export interface ClientReview {
  rating_overall: number;
  rating_service: number | null;
  rating_team: number | null;
  comment: string | null;
  submitted_at: string;
}

export interface ScorecardResponse {
  success: boolean;
  scorecard: Scorecard;
  client_review: ClientReview | null;
}

// ============================================================
//  API CALLS
// ============================================================

export async function fetchJobScorecard(jobId: number | string): Promise<ScorecardResponse> {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/scorecard`, {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `fetchJobScorecard: HTTP ${res.status}`);
  return json;
}

export async function sendReviewRequest(jobId: number | string): Promise<{ success: boolean; review_url: string }> {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/review-request`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `sendReviewRequest: HTTP ${res.status}`);
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public review submission (no auth required — uses signed token)
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitReviewPayload {
  rating_overall: number;              // 1–5
  rating_service?: number;             // 1–5 optional
  rating_team?: number;                // 1–5 optional
  comment?: string;                    // max 1000 chars
}

export interface SubmitReviewResult {
  success: boolean;
  message?: string;
}

/**
 * Endpoint public — utilise un token signé envoyé par email au client.
 * Aucune authentification JWT requise.
 */
export async function submitClientReview(
  token: string,
  data: SubmitReviewPayload,
): Promise<SubmitReviewResult> {
  // Validation basique côté client pour éviter d'envoyer des données invalides
  if (!token || token.length < 8) throw new Error('Token invalide');
  if (data.rating_overall < 1 || data.rating_overall > 5) {
    throw new Error('La note globale doit être entre 1 et 5');
  }
  if (data.rating_service !== undefined && (data.rating_service < 1 || data.rating_service > 5)) {
    throw new Error('La note service doit être entre 1 et 5');
  }
  if (data.rating_team !== undefined && (data.rating_team < 1 || data.rating_team > 5)) {
    throw new Error('La note équipe doit être entre 1 et 5');
  }
  if (data.comment && data.comment.length > 1000) {
    throw new Error('Le commentaire ne peut pas dépasser 1000 caractères');
  }

  const res = await fetch(`${API}v1/review/${encodeURIComponent(token)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `submitClientReview: HTTP ${res.status}`);
  return json;
}
