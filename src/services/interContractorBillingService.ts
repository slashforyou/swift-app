/**
 * InterContractorBillingService — API calls for inter-contractor billing tracking
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============================================================================
// TYPES
// ============================================================================

export type BillingStatus = 'not_billed' | 'invoiced' | 'paid' | 'overdue';
export type BillingDirection = 'payable' | 'receivable';

export interface BillingTransfer {
  id: number;
  job_id: number;
  job_code: string | null;
  job_status: string;
  job_date: string;
  sender_company_id: number;
  recipient_company_id: number;
  sender_company_name: string;
  sender_display_name: string;
  recipient_company_name: string;
  recipient_display_name: string;
  delegated_role: string;
  delegated_role_label: string | null;
  pricing_type: 'flat' | 'hourly' | 'daily';
  pricing_amount: number;
  currency: string;
  billing_status: BillingStatus;
  invoiced_at: string | null;
  paid_at: string | null;
  payment_due_date: string | null;
  payment_reference: string | null;
  payment_notes: string | null;
  direction: BillingDirection;
  created_at: string;
  responded_at: string | null;
}

export interface BillingStats {
  payable: BillingStatGroup;
  receivable: BillingStatGroup;
}

export interface BillingStatGroup {
  total_count: number;
  total_amount: number | null;
  not_billed_amount: number | null;
  not_billed_count: number;
  invoiced_amount: number | null;
  invoiced_count: number;
  paid_amount: number | null;
  paid_count: number;
  overdue_amount: number | null;
  overdue_count: number;
}

// ============================================================================
// API CALLS
// ============================================================================

export async function fetchBillingStats(): Promise<BillingStats> {
  const res = await authenticatedFetch(`${API}v1/billing/inter-contractor/stats`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch billing stats');
  return data.data;
}

export async function fetchBillingTransfers(params?: {
  status?: BillingStatus;
  direction?: BillingDirection;
  page?: number;
  limit?: number;
}): Promise<{ data: BillingTransfer[]; pagination: { total: number; page: number; limit: number } }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.direction) query.set('direction', params.direction);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `${API}v1/billing/inter-contractor${qs ? `?${qs}` : ''}`;
  const res = await authenticatedFetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch billing transfers');
  return { data: data.data, pagination: data.pagination };
}

export async function updateBillingTransfer(
  transferId: number,
  updates: {
    billing_status?: BillingStatus;
    payment_due_date?: string | null;
    payment_reference?: string | null;
    payment_notes?: string | null;
  }
): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/billing/inter-contractor/${transferId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update billing status');
}
