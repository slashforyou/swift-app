// services/jobNotes.ts
import { ServerData } from "../constants/ServerData";
import { getAuthHeaders } from "../utils/auth";

const API = ServerData.serverUrl;

export interface JobNoteAPI {
  id: string;
  job_id: string;
  title: string;
  content: string;
  note_type: "general" | "important" | "client" | "internal";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobNoteRequest {
  title: string;
  content: string;
  note_type?: JobNoteAPI["note_type"];
  created_by?: string;
}

export interface UpdateJobNoteRequest {
  title?: string;
  content?: string;
}

/**
 * Récupère toutes les notes d'un job
 * Route: GET /swift-app/v1/job/:jobId/notes
 */
export async function fetchJobNotes(
  jobId: string,
  limit?: number,
  offset?: number,
): Promise<JobNoteAPI[]> {
  const headers = await getAuthHeaders();

  // Construire les query params si fournis
  const queryParams = new URLSearchParams();
  if (limit !== undefined) queryParams.append("limit", limit.toString());
  if (offset !== undefined) queryParams.append("offset", offset.toString());
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  const res = await fetch(`${API}v1/job/${jobId}/notes${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch job notes" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to fetch job notes`,
    );
  }

  const data = await res.json();
  return data.notes || data || [];
}

/**
 * Récupère une note spécifique par son ID
 * Route: GET /swift-app/v1/job/:jobId/notes/:noteId
 *
 * ✅ Session 10 FIX: Route mise à jour pour correspondre au backend
 */
export async function fetchJobNoteById(
  jobId: string,
  noteId: string,
): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch job note" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to fetch job note`,
    );
  }

  const data = await res.json();
  return data.note || data;
}

/**
 * Ajoute une note à un job
 * Route: POST /swift-app/v1/job/:jobId/notes
 * Payload: { title, content, note_type, created_by }
 */
export async function addJobNote(
  jobId: string,
  noteData: CreateJobNoteRequest,
): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();

  // ✅ FIX JOB-04: Préparer le payload - created_by est optionnel si le backend le déduit du token
  const payload: Record<string, any> = {
    title: noteData.title,
    content: noteData.content,
    note_type: noteData.note_type || "general",
  };

  // Ajouter created_by seulement s'il est fourni et valide
  if (noteData.created_by && noteData.created_by !== "current-user") {
    payload.created_by = noteData.created_by;
  }

  console.log("📤 [jobNotes] Sending note to API:", { jobId, payload });

  const res = await fetch(`${API}v1/job/${jobId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to add job note" }));
    console.error("❌ [jobNotes] API error:", res.status, error);
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to add job note`,
    );
  }

  const data = await res.json();
  console.log("✅ [jobNotes] Note created:", data);
  return data.note || data;
}

/**
 * Met à jour une note de job
 * Route: PATCH /swift-app/v1/job/:jobId/notes/:noteId
 * Payload: { title, content, note_type }
 *
 * ✅ Session 10 FIX: Route mise à jour pour correspondre au backend
 */
export async function updateJobNote(
  jobId: string,
  noteId: string,
  noteData: UpdateJobNoteRequest,
): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to update job note" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to update job note`,
    );
  }

  const data = await res.json();
  return data.note || data;
}

/**
 * Supprime une note de job
 * Route: DELETE /swift-app/v1/job/:jobId/notes/:noteId
 */
export async function deleteJobNote(
  jobId: string,
  noteId: string,
): Promise<void> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to delete job note" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to delete job note`,
    );
  }
}
