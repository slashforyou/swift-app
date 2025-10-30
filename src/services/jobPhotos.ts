// services/jobPhotos.ts
import { ServerData } from '../constants/ServerData';
import { getAuthHeaders } from '../utils/auth';

const API = ServerData.serverUrl;

export interface JobPhotoAPI {
  id: string | number;  // L'API retourne des numbers
  job_id?: string;
  user_id?: string;
  filename: string;
  filePath?: string;    // Chemin relatif dans Google Cloud Storage
  file_path?: string;   // Alias snake_case
  original_name?: string;
  originalFilename?: string;  // Alias camelCase
  description?: string;
  file_size?: number;
  fileSize?: number;    // Alias camelCase
  mime_type?: string;
  mimeType?: string;    // Alias camelCase
  width?: number;
  height?: number;
  dimensions?: { width: number | null; height: number | null };
  type?: string;        // before, after, other, etc.
  stage?: string;       // pickup, delivery, etc.
  isPublic?: boolean;
  hasThumbnail?: boolean;
  thumbnailPath?: string | null;
  location?: any;
  capturedAt?: string;
  created_at?: string;
  createdAt?: string;   // Alias camelCase
  updated_at?: string;
  updatedAt?: string;   // Alias camelCase
  deleted_at?: string;
  user?: { id: number; name: string };
  tags?: any[];
  metadata?: any;
}

export interface CreatePhotoRequest {
  description?: string;
}

export interface UpdatePhotoRequest {
  description?: string;
}

export interface UploadPhotoResponse {
  success: boolean;
  photo?: JobPhotoAPI;
  photos?: JobPhotoAPI[];
  message?: string;
}

/**
 * Upload une seule image à un job
 * Route: POST /swift-app/v1/job/{jobId}/image
 */
export async function uploadJobPhoto(
  jobId: string, 
  photoUri: string, 
  description?: string
): Promise<JobPhotoAPI> {
  const headers = await getAuthHeaders();
  
  // Créer FormData pour l'upload
  const formData = new FormData();
  
  // Ajouter l'image
  const filename = photoUri.split('/').pop() || `photo_${Date.now()}.jpg`;
  formData.append('image', {
    uri: photoUri,
    type: 'image/jpeg',
    name: filename,
  } as any);
  
  // Ajouter la description si fournie
  if (description) {
    formData.append('description', description);
  }

  const res = await fetch(`${API}v1/job/${jobId}/image`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to upload photo' }));
    console.error('❌ [ERROR] Upload failed:', res.status, error);
    throw new Error(error.message || `HTTP ${res.status}: Failed to upload photo`);
  }

  const response = await res.json();
  console.log('🔍 [DEBUG] Server response:', JSON.stringify(response));
  console.log('🔍 [DEBUG] Response keys:', Object.keys(response));
  
  // Le serveur retourne la photo dans response.data au lieu de response.photo
  // On transforme pour correspondre à l'interface JobPhotoAPI
  const serverData = response.data || response.photo;
  
  if (!serverData) {
    console.error('❌ [ERROR] Missing photo/data object in response');
    console.error('🔍 [DEBUG] Full response:', JSON.stringify(response, null, 2));
    throw new Error('No photo data returned from server');
  }
  
  console.log('✅ [DEBUG] Photo data received:', serverData);
  
  // Transformer la réponse serveur en format JobPhotoAPI
  const photo: JobPhotoAPI = {
    id: String(serverData.id),
    job_id: String(jobId), // On utilise le jobId de la requête
    user_id: serverData.user_id || serverData.userId || '', // À adapter selon le serveur
    filename: serverData.filename || '',
    original_name: serverData.originalFilename || serverData.original_name || '',
    description: serverData.description || '',
    file_size: serverData.fileSize || serverData.file_size || 0,
    mime_type: serverData.mimeType || serverData.mime_type || 'image/jpeg',
    width: serverData.width,
    height: serverData.height,
    created_at: serverData.created_at || serverData.createdAt || new Date().toISOString(),
    updated_at: serverData.updated_at || serverData.updatedAt || new Date().toISOString(),
  };
  
  console.log('✅ [DEBUG] Photo normalized:', photo);
  return photo;
}

/**
 * Upload plusieurs images à un job (max 10)
 * Route: POST /swift-app/v1/job/{jobId}/images
 */
export async function uploadJobPhotos(
  jobId: string, 
  photoUris: string[], 
  descriptions?: string[]
): Promise<JobPhotoAPI[]> {
  const headers = await getAuthHeaders();
  
  if (photoUris.length > 10) {
    throw new Error('Maximum 10 photos allowed per upload');
  }
  
  // Créer FormData pour l'upload
  const formData = new FormData();
  
  // Ajouter toutes les images
  photoUris.forEach((photoUri, index) => {
    const filename = photoUri.split('/').pop() || `photo_${Date.now()}_${index}.jpg`;
    formData.append('images', {
      uri: photoUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    
    // Ajouter la description correspondante si fournie
    if (descriptions && descriptions[index]) {
      formData.append(`descriptions[${index}]`, descriptions[index]);
    }
  });

  const res = await fetch(`${API}v1/job/${jobId}/images`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to upload photos' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to upload photos`);
  }

  const data: UploadPhotoResponse = await res.json();
  return data.photos || [];
}

/**
 * Récupère toutes les photos d'un job
 * Route: GET /swift-app/v1/job/{jobId}/images
 */
export async function fetchJobPhotos(jobId: string): Promise<JobPhotoAPI[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/images`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job photos' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job photos`);
  }

  const response = await res.json();
  
  // API retourne: { success: true, data: { images: [...] } }
  return response.data?.images ||   // Format actuel API
         response.images ||         // Fallback ancien format
         [];
}

/**
 * Récupère les informations d'une photo spécifique
 * Route: GET /swift-app/v1/image/{id}
 */
export async function fetchPhotoById(photoId: string): Promise<JobPhotoAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/image/${photoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch photo`);
  }

  const data = await res.json();
  return data.image || data.photo || data;
}

/**
 * Récupère l'URL sécurisée pour afficher une photo
 * Route: GET /swift-app/v1/image/{id}/serve
 */
export async function getPhotoServeUrl(photoId: string): Promise<string> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/image/${photoId}/serve`, {
    method: 'GET',
    headers: {
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to get photo serve URL' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to get photo serve URL`);
  }

  // Cette route peut retourner soit une URL, soit rediriger directement
  if (res.url) {
    return res.url;
  }
  
  const data = await res.json();
  return data.url || data.serve_url || '';
}

/**
 * Met à jour la description d'une photo
 * Route: PATCH /swift-app/v1/image/{id}
 */
export async function updatePhotoDescription(
  photoId: string, 
  description: string
): Promise<JobPhotoAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/image/${photoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to update photo`);
  }

  const data = await res.json();
  return data.image || data.photo || data;
}

/**
 * Supprime une photo (soft delete)
 * Route: DELETE /swift-app/v1/image/{id}
 */
export async function deletePhoto(photoId: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/image/${photoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to delete photo`);
  }
}

/**
 * Restaure une photo supprimée
 * Route: PATCH /swift-app/v1/image/{id}/restore
 */
export async function restorePhoto(photoId: string): Promise<JobPhotoAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/image/${photoId}/restore`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to restore photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to restore photo`);
  }

  const data = await res.json();
  return data.image || data.photo || data;
}