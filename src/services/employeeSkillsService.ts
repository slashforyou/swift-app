import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface EmployeeSkill {
  id: number;
  skill_name: string;
  skill_level: string; // "beginner" | "intermediate" | "advanced" | "expert"
  certified: boolean;
  cert_expiry_date?: string;
  notes?: string;
}

export const getEmployeeSkills = async (userId: number): Promise<EmployeeSkill[]> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/skills`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.skills ?? data ?? [];
};

export const createEmployeeSkill = async (
  userId: number,
  payload: Omit<EmployeeSkill, "id">,
): Promise<EmployeeSkill> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/skills`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.skill ?? data;
};

export const updateEmployeeSkill = async (
  userId: number,
  skillId: number,
  payload: Partial<Omit<EmployeeSkill, "id">>,
): Promise<EmployeeSkill> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/skills/${skillId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.skill ?? data;
};

export const deleteEmployeeSkill = async (userId: number, skillId: number): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/skills/${skillId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};
