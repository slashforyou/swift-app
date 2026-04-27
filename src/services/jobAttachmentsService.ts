import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface JobAttachment {
  id: number;
  job_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_kb?: number;
  label?: string;
  uploaded_by: number;
  created_at: string;
}

export const getJobAttachments = async (jobId: number): Promise<JobAttachment[]> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/attachments`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.attachments ?? data ?? [];
};

export const createJobAttachment = async (
  jobId: number,
  payload: { file_url: string; file_name: string; file_type: string; file_size_kb?: number; label?: string },
): Promise<JobAttachment> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/attachments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.attachment ?? data;
};

export const deleteJobAttachment = async (jobId: number, attachmentId: number): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};
