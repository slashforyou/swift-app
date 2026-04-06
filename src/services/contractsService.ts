/**
 * ContractsService — API calls for modular contract clauses and job contracts
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============================================================================
// TYPES
// ============================================================================

export type ConditionType = 'always' | 'segment_type' | 'postcode' | 'city' | 'state';

export interface ClauseCondition {
  id?: number;
  clause_id?: number;
  condition_type: ConditionType;
  condition_value: string | null;
}

export interface ContractClause {
  id: number;
  title: string;
  content: string;
  clause_order: number;
  is_active: boolean;
  conditions: ClauseCondition[];
  created_at: string;
  updated_at: string;
}

export interface JobContractClause {
  id: number;
  clause_id: number | null;
  clause_title: string;
  clause_content: string;
  clause_order: number;
}

export interface JobContract {
  id: number;
  job_id: number;
  company_id: number;
  client_name: string | null;
  client_email: string | null;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  generated_at: string;
  signed_at: string | null;
  clauses: JobContractClause[];
}

// ============================================================================
// CLAUSE CRUD
// ============================================================================

export async function fetchClauses(): Promise<ContractClause[]> {
  const res = await authenticatedFetch(`${API}v1/contracts/clauses`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch clauses');
  return data.clauses;
}

export async function createClause(clause: {
  title: string;
  content: string;
  conditions?: ClauseCondition[];
}): Promise<ContractClause> {
  const res = await authenticatedFetch(`${API}v1/contracts/clauses`, {
    method: 'POST',
    body: JSON.stringify(clause),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create clause');
  return data.clause;
}

export async function updateClause(
  clauseId: number,
  updates: {
    title?: string;
    content?: string;
    is_active?: boolean;
    conditions?: ClauseCondition[];
  },
): Promise<ContractClause> {
  const res = await authenticatedFetch(`${API}v1/contracts/clauses/${clauseId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update clause');
  return data.clause;
}

export async function deleteClause(clauseId: number): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/contracts/clauses/${clauseId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete clause');
}

export async function reorderClauses(orderedIds: number[]): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/contracts/reorder`, {
    method: 'POST',
    body: JSON.stringify({ orderedIds }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reorder clauses');
}

// ============================================================================
// JOB CONTRACTS
// ============================================================================

export async function generateJobContract(jobId: number): Promise<JobContract> {
  const res = await authenticatedFetch(`${API}v1/contracts/generate/${jobId}`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate contract');
  return data.contract;
}

export async function fetchJobContract(jobId: number): Promise<JobContract | null> {
  const res = await authenticatedFetch(`${API}v1/contracts/job/${jobId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch contract');
  return data.contract;
}

export async function signJobContract(
  contractId: number,
  signatureData: string,
): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/contracts/sign/${contractId}`, {
    method: 'POST',
    body: JSON.stringify({ signatureData }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to sign contract');
}
