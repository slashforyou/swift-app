import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface EmployeeRating {
  id: number;
  employee_id: number;
  rated_by?: number;
  rated_by_name?: string;
  stars: number; // 1-5
  comment?: string;
  job_id?: number;
  job_code?: string;
  created_at: string;
}

export interface RatingsSummary {
  employee_id: number;
  average_stars: number;
  total_ratings: number;
  distribution: { stars: number; count: number }[];
}

export const getEmployeeRatings = async (userId: number): Promise<EmployeeRating[]> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/ratings`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.ratings ?? data ?? [];
};

export const createEmployeeRating = async (
  userId: number,
  payload: { stars: number; comment?: string; job_id?: number },
): Promise<EmployeeRating> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/ratings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.rating ?? data;
};

export const getRatingsSummary = async (userId: number): Promise<RatingsSummary> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/ratings/summary`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.summary ?? data;
};
