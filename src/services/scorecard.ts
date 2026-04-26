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
