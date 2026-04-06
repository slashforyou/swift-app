/**
 * Job Segment API Service — Appels API pour les segments de job
 * Gère la communication avec les endpoints backend :
 * - init / get / start / complete segments
 * - employee assignments
 * - return trip + flat rate options
 * - time breakdown
 */

import { ServerData } from '../constants/ServerData';
import type {
    FlatRateOption,
    JobSegmentInstance,
    JobTimeBreakdown,
} from '../types/jobSegment';
import { fetchWithAuth } from '../utils/session';

const BASE = `${ServerData.serverUrl}v1`;

// ============================================================================
// SEGMENTS
// ============================================================================

/**
 * Initialise les segments d'un job depuis un template
 */
export async function initJobSegments(
  jobId: string | number,
  templateId: string | number,
): Promise<JobSegmentInstance[]> {
  const response = await fetchWithAuth(`${BASE}/jobs/${jobId}/segments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to init segments');
  return data.segments;
}

/**
 * Récupère les segments d'un job avec leurs assignations
 */
export async function getJobSegments(
  jobId: string | number,
): Promise<JobSegmentInstance[]> {
  const response = await fetchWithAuth(`${BASE}/jobs/${jobId}/segments`, {
    method: 'GET',
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to get segments');
  return data.segments;
}

/**
 * Démarre un segment (timestamp côté serveur)
 */
export async function startSegmentApi(
  jobId: string | number,
  segmentId: string | number,
): Promise<{ startedAt: string }> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/segments/${segmentId}/start`,
    { method: 'POST' },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to start segment');
  return { startedAt: data.startedAt };
}

/**
 * Termine un segment (calcul de durée côté serveur)
 */
export async function completeSegmentApi(
  jobId: string | number,
  segmentId: string | number,
): Promise<{ completedAt: string; durationMs: number }> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/segments/${segmentId}/complete`,
    { method: 'POST' },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to complete segment');
  return { completedAt: data.completedAt, durationMs: data.durationMs };
}

// ============================================================================
// EMPLOYEE ASSIGNMENTS
// ============================================================================

export interface EmployeeAssignmentInput {
  employeeId: string | number;
  role: string;
  hourlyRate?: number;
}

/**
 * Assigne des employés à un segment
 */
export async function assignEmployeesToSegment(
  jobId: string | number,
  segmentId: string | number,
  employees: EmployeeAssignmentInput[],
): Promise<void> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/segments/${segmentId}/employees`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees }),
    },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to assign employees');
}

// ============================================================================
// RETURN TRIP & FLAT RATE OPTIONS
// ============================================================================

/**
 * Met à jour la durée du trajet retour
 */
export async function updateReturnTripApi(
  jobId: string | number,
  minutes: number,
): Promise<void> {
  const response = await fetchWithAuth(`${BASE}/jobs/${jobId}/return-trip`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to update return trip');
}

/**
 * Récupère les options forfaitaires d'un job
 */
export async function getFlatRateOptions(
  jobId: string | number,
): Promise<FlatRateOption[]> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/flat-rate-options`,
    { method: 'GET' },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to get flat rate options');
  return data.options;
}

/**
 * Met à jour les options forfaitaires d'un job
 */
export async function updateFlatRateOptions(
  jobId: string | number,
  options: { label: string; price: number }[],
): Promise<void> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/flat-rate-options`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options }),
    },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to update flat rate options');
}

// ============================================================================
// TIME BREAKDOWN
// ============================================================================

/**
 * Récupère le récapitulatif complet post-job depuis le serveur
 */
export async function fetchJobTimeBreakdown(
  jobId: string | number,
): Promise<JobTimeBreakdown> {
  const response = await fetchWithAuth(
    `${BASE}/jobs/${jobId}/time-breakdown`,
    { method: 'GET' },
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to get time breakdown');

  const b = data.breakdown;

  // Map backend response to frontend JobTimeBreakdown type
  return {
    jobId: b.jobId,
    billingMode: b.billingMode,
    totalDurationMs: b.totalDurationMs,
    billableDurationMs: b.billableDurationMs,
    nonBillableDurationMs: b.totalDurationMs - b.billableDurationMs,
    segments: (b.segments || []).map((s: any) => ({
      segmentId: s.id,
      label: s.label,
      type: s.type,
      durationMs: s.durationMs,
      isBillable: s.isBillable,
      employees: s.employees || [],
      segmentCost: s.segmentCost,
    })),
    employees: (b.employeeSummaries || []).map((e: any) => ({
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      role: e.role,
      totalWorkedMs: e.totalDurationMs,
      billableWorkedMs: e.totalDurationMs,
      hourlyRate: e.hourlyRate,
      totalCost: e.totalCost,
      segments: [],
    })),
    hourlyCost: b.flatRateBreakdown ? 0 : b.totalCost,
    // Flat rate fields
    flatRateAmount: b.flatRateBreakdown?.baseAmount,
    flatRateMaxHours: b.flatRateBreakdown?.maxIncludedHours,
    flatRateOverageHours: b.flatRateBreakdown?.overageHours,
    flatRateOverageCost: b.flatRateBreakdown?.overageCost,
    selectedOptions: b.flatRateBreakdown?.selectedOptions,
    optionsTotalCost: b.flatRateBreakdown?.optionsTotal,
    totalCost: b.totalCost,
  };
}
