/**
 * employeeScheduleService.ts — Planning hebdomadaire par employé
 *
 * Endpoint: GET /v1/staff/:userId/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

export interface ScheduledJob {
  id: number;
  code: string;
  title: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  estimatedDuration: number | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  clientName: string;
  assignmentRole: string | null;
  assignmentStatus: string | null;
}

export interface ScheduleDay {
  date: string; // YYYY-MM-DD
  jobs: ScheduledJob[];
}

export interface EmployeeScheduleData {
  employee: { id: number; firstName: string; lastName: string } | null;
  from: string;
  to: string;
  days: ScheduleDay[];
  totalJobs: number;
}

/** Formate une date JS en YYYY-MM-DD */
export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calcule le lundi de la semaine contenant `date` */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Calcule le dimanche de la semaine contenant `date` */
export function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export async function fetchEmployeeSchedule(
  userId: number,
  from: Date,
  to: Date,
): Promise<EmployeeScheduleData> {
  const params = new URLSearchParams({
    from: toYMD(from),
    to: toYMD(to),
  });
  const response = await authenticatedFetch(
    `${API}staff/${userId}/schedule?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Unknown error');
  }
  return json.data as EmployeeScheduleData;
}
