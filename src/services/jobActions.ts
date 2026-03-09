/**
 * jobActions.ts
 *
 * Service pour récupérer l'historique des actions d'un job.
 * GET /swift-app/v1/jobs/:id/actions
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ActionSeverity = "info" | "success" | "warning" | "critical";

export interface JobAction {
  id: number;
  action: string;
  label: string;
  icon: string;
  severity: ActionSeverity;
  timestamp: string; // ISO datetime
  user: string;
  actor_role: string;
  permission_level: string;
  old_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown> | null;
  details: string;
}

export interface JobActionsResponse {
  success: boolean;
  job: {
    id: number;
    code: string;
    status: string;
  };
  actions: JobAction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────

export async function fetchJobActions(
  jobId: string | number,
  opts?: { limit?: number; offset?: number; action_type?: string },
): Promise<JobActionsResponse> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.action_type) params.set("action_type", opts.action_type);

  const query = params.toString() ? `?${params}` : "";
  const response = await authenticatedFetch(
    `${API}v1/jobs/${jobId}/actions${query}`,
    { method: "GET" },
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(
      (json as { message?: string }).message ||
        `Failed to fetch job actions (${response.status})`,
    );
  }

  return response.json() as Promise<JobActionsResponse>;
}
