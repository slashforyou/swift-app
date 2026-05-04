import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface RevenueDashboard {
  total_revenue: number;
  job_count: number;
  total_jobs?: number;
  avg_job_value: number;
  by_period: { label: string; revenue: number }[];
  chart_data?: { label: string; value: number }[];
  top_clients: { client_name: string; total: number; name?: string; jobs_count?: number }[];
  growth_vs_previous: { revenue_pct: number; job_count_pct: number };
  growth_percent?: number;
}

export const getRevenueDashboard = async (
  period: "week" | "month" | "year",
  date?: string,
): Promise<RevenueDashboard> => {
  const params = new URLSearchParams({ period });
  if (date) params.append("date", date);
  const res = await authenticatedFetch(`${API}v1/dashboard/revenue?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
