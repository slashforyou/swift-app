import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface LinkedJob {
  id: number;
  title: string;
  status: string;
  link_type: string;
  created_at: string;
}

export const getJobLinks = async (jobId: number): Promise<LinkedJob[]> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/links`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.links ?? [];
};

export const createJobLink = async (
  jobId: number,
  payload: { linked_job_id: number; link_type: string },
): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/links`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const deleteJobLink = async (jobId: number, linkedJobId: number): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/links/${linkedJobId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};
