/**
 * weeklyHours.ts — Service pour le quota d'heures hebdomadaires
 * Endpoint: GET /v1/company/:companyId/weekly-hours
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface WorkerWeeklyHours {
  worker_id: number;
  name: string;
  avatar_url?: string | null;
  hours_this_week: number;
  quota_hours: number;
  over_quota: boolean;
}

export interface WeeklyHoursResponse {
  success: boolean;
  week_offset: number;
  week_start: string;
  week_end: string;
  workers: WorkerWeeklyHours[];
}

export async function fetchWeeklyHours(
  companyId: number | string,
  weekOffset = 0,
): Promise<WeeklyHoursResponse> {
  const url = `${API}v1/company/${companyId}/weekly-hours?week_offset=${weekOffset}`;
  const res = await authenticatedFetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
