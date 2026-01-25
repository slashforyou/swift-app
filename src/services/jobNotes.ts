// services/jobNotes.ts
import { ServerData } from "../constants/ServerData";
import { getAuthHeaders } from "../utils/auth";

const API = ServerData.serverUrl;

export interface JobNoteAPI {
  id: string | number; // API retourne number, local retourne string avec "local-"
  job_id: string | number;
  title: string;
  content: string;
  note_type: "general" | "important" | "client" | "internal";
  created_by: string | number;
  created_at: string;
  updated_at: string;

  // Creator information (API v1.1.0) - if available
  created_by_first_name?: string;
  created_by_last_name?: string;
  created_by_email?: string;
  
  // Read status (API v1.1.0+)
  is_read?: boolean;
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

export interface FetchJobNotesResponse {
  notes: JobNoteAPI[];
  total: number;
  unread_count: number;
}

/**
 * Récupère toutes les notes d'un job
 * Route: GET /swift-app/v1/job/:jobId/notes
 */
export async function fetchJobNotes(
  jobId: string,
  limit?: number,
  offset?: number,
): Promise<FetchJobNotesResponse> {
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
  
  // Backend retourne: { success, notes, total, unread_count }
  return {
    notes: data.notes || [],
    total: data.total || 0,
    unread_count: data.unread_count || 0,
  };
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

  const url = `${API}v1/job/${jobId}/notes`;
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  console.log("📤 [jobNotes] POST Request:", { 
    url,
    jobId: `${jobId} (${typeof jobId})`,
    payload,
    headers: {
      hasAuth: !!headers.Authorization,
      authHeader: headers.Authorization,
      contentType: requestHeaders["Content-Type"]
    }
  });

  const res = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
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
  
  console.log("📝 [jobNotes] Updating note:", { jobId, noteId, noteData });

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
    console.error("❌ [jobNotes] Update failed:", { status: res.status, error });
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to update job note`,
    );
  }

  const data = await res.json();
  console.log("✅ [jobNotes] Note updated:", data.note?.id || data.id);
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
  
  console.log("� [jobNotes] Auth headers for delete:", {
    hasAuthorization: !!headers.Authorization,
    authPrefix: headers.Authorization?.substring(0, 20)
  });
  console.log("🗑️ [jobNotes] Deleting note:", { 
    jobId, 
    noteId,
    noteIdType: typeof noteId,
    url: `${API}v1/job/${jobId}/notes/${noteId}`
  });

  // ⚠️ WORKAROUND: Copier exactement la structure de POST pour éviter le 401
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: "DELETE",
    headers: requestHeaders,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to delete job note" }));
    console.error("❌ [jobNotes] Delete failed:", { status: res.status, error });
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to delete job note`,
    );
  }
  
  console.log("✅ [jobNotes] Note deleted successfully");
}

/**
 * Marque une note spécifique comme lue
 * Route: POST /swift-app/v1/job/:jobId/notes/:noteId/read
 */
export async function markNoteAsRead(
  jobId: string,
  noteId: string | number,
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to mark note as read" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to mark note as read`,
    );
  }
}

/**
 * Marque toutes les notes d'un job comme lues (ou une liste spécifique)
 * Route: POST /swift-app/v1/job/:jobId/notes/read-all
 */
export async function markAllNotesAsRead(
  jobId: string,
  noteIds?: (string | number)[],
): Promise<{ marked_count: number }> {
  const headers = await getAuthHeaders();
  
  const payload = noteIds ? { note_ids: noteIds } : {};
  const url = `${API}v1/job/${jobId}/notes/read-all`;
  
  console.log('🔔 [markAllNotesAsRead] 📤 SENDING TO DATABASE:', { 
    url, 
    jobId, 
    noteCount: noteIds?.length || 'ALL',
    payload 
  });
  
  const res = await fetch(url, {
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
      .catch(() => ({ message: "Failed to mark notes as read" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to mark notes as read`,
    );
  }
  
  const data = await res.json();
  console.log('✅ [markAllNotesAsRead] ✅ DATABASE UPDATED SUCCESSFULLY:', {
    markedCount: data.marked_count || 0,
    jobId
  });
  return { marked_count: data.marked_count || 0 };
}
