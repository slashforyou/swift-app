// services/calendar.ts
import { getAuthHeaders } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

const API = ServerData.serverUrl;

export interface CalendarDay {
  date: string; // Format: YYYY-MM-DD
  jobCount: number;
  jobs: Array<{
    id: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    clientName: string;
    startTime: string;
    estimatedDuration?: number;
  }>;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
}

export interface CalendarOverview {
  currentMonth: CalendarMonth;
  stats: {
    totalJobsThisMonth: number;
    completedJobsThisMonth: number;
    upcomingJobs: number;
    overdueJobs: number;
  };
  upcomingJobs: Array<{
    id: string;
    date: string;
    clientName: string;
    status: string;
    priority: string;
  }>;
}

/**
 * Récupère la vue d'ensemble du calendrier
 */
export async function fetchCalendarOverview(): Promise<CalendarOverview> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/calendar`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch calendar data' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch calendar data`);
  }

  const data = await res.json();
  return data.calendar || data;
}

/**
 * Récupère les jobs pour une date spécifique
 */
export async function fetchJobsForDate(date: string): Promise<CalendarDay> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/calendar/date/${date}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch jobs for date' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch jobs for date`);
  }

  const data = await res.json();
  return data.day || data;
}

/**
 * Récupère les données du calendrier pour un mois spécifique
 */
export async function fetchCalendarMonth(year: number, month: number): Promise<CalendarMonth> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/calendar/month/${year}/${month}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch calendar month' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch calendar month`);
  }

  const data = await res.json();
  return data.month || data;
}