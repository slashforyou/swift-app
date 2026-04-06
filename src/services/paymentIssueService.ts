/**
 * Service API pour signaler et gérer les problèmes de paiement
 */
import { ServerData } from "../constants/ServerData";
import { fetchWithAuth } from "../utils/session";

const API = ServerData.serverUrl;

export type PaymentIssueType =
  | "wrong_amount"
  | "wrong_billing_mode"
  | "missing_hours"
  | "double_charge"
  | "client_dispute"
  | "other";

export type PaymentIssueStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "rejected";

export interface PaymentIssue {
  id: number;
  job_id: number;
  reported_by: number;
  issue_type: PaymentIssueType;
  description: string | null;
  status: PaymentIssueStatus;
  resolution_note: string | null;
  resolved_by: number | null;
  created_at: string;
  resolved_at: string | null;
  reporter_first_name?: string;
  reporter_last_name?: string;
}

/** Report a payment issue on a job */
export async function reportPaymentIssue(
  jobId: number,
  issueType: PaymentIssueType,
  description?: string,
): Promise<{ success: boolean; issueId?: number }> {
  const res = await fetchWithAuth(`${API}v1/jobs/${jobId}/payment-issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      issue_type: issueType,
      description: description?.trim() || undefined,
    }),
  });
  return res.json();
}

/** Get all payment issues for a job */
export async function getPaymentIssues(
  jobId: number,
): Promise<{ success: boolean; issues: PaymentIssue[] }> {
  const res = await fetchWithAuth(`${API}v1/jobs/${jobId}/payment-issues`);
  return res.json();
}

/** Resolve or reject a payment issue (boss only) */
export async function resolvePaymentIssue(
  issueId: number,
  status: "resolved" | "rejected",
  resolutionNote?: string,
): Promise<{ success: boolean }> {
  const res = await fetchWithAuth(
    `${API}v1/payment-issues/${issueId}/resolve`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        resolution_note: resolutionNote?.trim() || undefined,
      }),
    },
  );
  return res.json();
}
