/**
 * MonthlyInvoiceService — API calls for monthly invoice management
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============================================================================
// TYPES
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoicePeriodType = 'monthly' | 'weekly' | 'fortnightly';

export interface InvoiceClient {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  total_jobs: number;
}

export interface MonthlyInvoice {
  id: number;
  invoice_number: string;
  company_id: number;
  company_name: string;
  company_display_name: string;
  client_id: number | null;
  client_name: string | null;
  period_type: InvoicePeriodType;
  period_start: string;
  period_end: string;
  total_jobs: number;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyInvoiceDetail extends MonthlyInvoice {
  company_email: string | null;
  company_phone: string | null;
  company_abn: string | null;
  company_logo_url: string | null;
  company_primary_color: string | null;
  items: MonthlyInvoiceItem[];
}

export interface MonthlyInvoiceItem {
  id: number;
  invoice_id: number;
  job_id: number;
  job_code: string | null;
  job_date: string | null;
  description: string | null;
  billing_mode: string | null;
  hours_worked: number | null;
  hourly_rate: number | null;
  amount: number;
}

// ============================================================================
// API CALLS
// ============================================================================

export async function fetchInvoiceClients(): Promise<InvoiceClient[]> {
  const res = await authenticatedFetch(
    `${API}v1/billing/monthly-invoices/clients`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch clients');
  return data.data;
}

export async function generateMonthlyInvoice(
  year: number,
  month: number,
  periodType: InvoicePeriodType = 'monthly',
  weekStart?: string,
  clientId?: number | null
): Promise<MonthlyInvoice | null> {
  const body: Record<string, unknown> = { period_type: periodType };
  if (periodType === 'monthly') {
    body.year = year;
    body.month = month;
  } else {
    body.week_start = weekStart;
  }
  if (clientId) {
    body.client_id = clientId;
  }

  const res = await authenticatedFetch(
    `${API}v1/billing/monthly-invoices/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  // Handle "no jobs" gracefully
  if (data.empty) return null;
  if (!data.success) throw new Error(data.error || 'Failed to generate invoice');
  return data.data;
}

export async function fetchMonthlyInvoices(params?: {
  status?: InvoiceStatus;
  year?: number;
  page?: number;
  limit?: number;
}): Promise<{
  data: MonthlyInvoice[];
  pagination: { total: number; page: number; limit: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.year) query.set('year', String(params.year));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `${API}v1/billing/monthly-invoices${qs ? `?${qs}` : ''}`;
  const res = await authenticatedFetch(url);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.error || 'Failed to fetch invoices');
  return { data: data.data, pagination: data.pagination };
}

export async function fetchMonthlyInvoiceDetail(
  invoiceId: number
): Promise<MonthlyInvoiceDetail> {
  const res = await authenticatedFetch(
    `${API}v1/billing/monthly-invoices/${invoiceId}`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch invoice');
  return data.data;
}

export async function updateMonthlyInvoice(
  invoiceId: number,
  updates: { status?: InvoiceStatus; notes?: string | null }
): Promise<MonthlyInvoice> {
  const res = await authenticatedFetch(
    `${API}v1/billing/monthly-invoices/${invoiceId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update invoice');
  return data.data;
}

export async function sendMonthlyInvoice(
  invoiceId: number
): Promise<{ message: string }> {
  const res = await authenticatedFetch(
    `${API}v1/billing/monthly-invoices/${invoiceId}/send`,
    { method: 'POST' }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to send invoice');
  return { message: data.message };
}
