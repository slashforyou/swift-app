/**
 * Employee Dashboard service
 * Fetches personal stats, job history and weekly hours for the logged-in employee.
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

export interface EmployeeStats {
  totalJobs: number;
  completedJobs: number;
  totalHours: number;
  totalXp: number;
}

export interface EmployeeJobEntry {
  id: number;
  code: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  address: string | null;
  client_name: string | null;
  duration_hours: number | null;
}

export interface EmployeeJobHistory {
  entries: EmployeeJobEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeHourEntry {
  work_date: string; // YYYY-MM-DD
  hours: number;
}

export interface EmployeeHours {
  startDate: string;
  endDate: string;
  entries: EmployeeHourEntry[];
}

export interface EmployeeDashboardData {
  stats: EmployeeStats;
  jobHistory: EmployeeJobHistory;
  hours: EmployeeHours;
}

export async function fetchEmployeeDashboard(options?: {
  page?: number;
  start?: string;
  end?: string;
}): Promise<EmployeeDashboardData> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.start) params.set('start', options.start);
  if (options?.end) params.set('end', options.end);

  const qs = params.toString();
  const url = `${API}v1/employee/dashboard${qs ? `?${qs}` : ''}`;

  const res = await authenticatedFetch(url, { method: 'GET' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch employee dashboard' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error('Invalid response from employee dashboard API');
  }

  return data.data as EmployeeDashboardData;
}
