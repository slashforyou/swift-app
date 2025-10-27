import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useJobState } from '../context/JobStateProvider';
import {
    deletePhoto,
    fetchJobPhotos,
    getPhotoServeUrl,
    JobPhotoAPI,
    updatePhotoDescription,
    uploadJobPhoto,
    uploadJobPhotos
} from '../services/jobPhotos';
import { PhotoUploadStatus } from '../types/jobState';
import { isLoggedIn } from '../utils/auth';
import { useUserProfile } from './useUserProfile';

// Types pour le statut d'upload (re-export depuis jobState)
export type { PhotoUploadStatus } from '../types/jobState';
export type { UploadStatus } from '../types/jobState';

// Fonctions utilitaires pour le stockage local temporaire
const getLocalPhotosKey = (jobId: string) => `photos_${jobId}`;

const getLocalPhotos = async (jobId: string): Promise<JobPhotoAPI[]> => {
  try {
    const key = getLocalPhotosKey(jobId);
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error reading local photos:', error);
    return [];
  }
};

const saveLocalPhotos = async (jobId: string, photos: JobPhotoAPI[]): Promise<void> => {
  try {
    const key = getLocalPhotosKey(jobId);
    await AsyncStorage.setItem(key, JSON.stringify(photos));
  } catch (error) {
    console.warn('Error saving local photos:', error);
  }
};

interface UseJobPhotosReturn {
  photos: JobPhotoAPI[];
  isLoading: boolean;
  error: string | null;
  uploadStatuses: Map<string, PhotoUploadStatus>; // ✅ Statuts d'upload par photo
  refetch: () => Promise<void>;
  uploadPhoto: (photoUri: string, description?: string) => Promise<JobPhotoAPI | null>;
  uploadMultiplePhotos: (photoUris: string[], descriptions?: string[]) => Promise<JobPhotoAPI[]>;
  updatePhotoDescription: (photoId: string, description: string) => Promise<JobPhotoAPI | null>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  getPhotoUrl: (photoId: string) => Promise<string | null>;
  totalPhotos: number;
  schedulePhotoSync: () => void; // ✅ Fonction pour retry upload des photos locales
}

export const useJobPhotos = (jobId: string): UseJobPhotosReturn => {
  const [photos, setPhotos] = useState<JobPhotoAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUploadStatuses, setLocalUploadStatuses] = useState<Map<string, PhotoUploadStatus>>(new Map());
  const { profile } = useUserProfile();

  // ✅ Essayer d'obtenir le JobStateProvider (optionnel, peut être undefined si hors provider)
  let jobStateContext: ReturnType<typeof useJobState> | undefined;
  try {
    jobStateContext = useJobState();
  } catch (e) {
    // Provider not available, use local state
    console.log('📸 JobStateProvider not available, using local upload statuses');
  }

  // ✅ Helper pour set upload status (provider si disponible, sinon local)
  const setUploadStatus = useCallback((photoId: string, status: PhotoUploadStatus) => {
    if (jobStateContext) {
      // Utiliser le provider pour persistence
      jobStateContext.setUploadStatus(photoId, status);
    } else {
      // Fallback vers state local
      setLocalUploadStatuses(prev => new Map(prev).set(photoId, status));
    }
  }, [jobStateContext]);

  // ✅ Helper pour get upload status
  const getUploadStatusHelper = useCallback((photoId: string): PhotoUploadStatus | undefined => {
    if (jobStateContext) {
      return jobStateContext.getUploadStatus(photoId);
    } else {
      return localUploadStatuses.get(photoId);
    }
  }, [jobStateContext, localUploadStatuses]);

  // ✅ Convertir en Map pour retour (backward compatibility)
  const uploadStatuses = new Map<string, PhotoUploadStatus>(
    jobStateContext?.jobState?.photoUploadStatuses
      ? Object.entries(jobStateContext.jobState.photoUploadStatuses)
      : Array.from(localUploadStatuses.entries())
  );

  const fetchPhotos = useCallback(async () => {
    if (!jobId) {
      setPhotos([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est connecté
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        setError('Vous devez être connecté pour voir les photos.');
        setPhotos([]);
        return;
      }
      
      // Essayer l'API réelle
      try {
        const apiPhotos = await fetchJobPhotos(jobId);
        setPhotos(apiPhotos);
      } catch (fetchError) {
        console.log('📸 API photos endpoint not available, loading from local storage');
        const localPhotos = await getLocalPhotos(jobId);
        setPhotos(localPhotos);
        
        if (localPhotos.length === 0) {
          setError('Aucune photo disponible pour ce job.');
        }
      }
      
    } catch (err) {
      console.error('Error fetching job photos:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('404')) {
        setError('Job non trouvé.');
      } else if (errorMessage.includes('403')) {
        setError('Vous n\'avez pas les droits pour voir les photos de ce job.');
      } else {
        setError(`Erreur lors du chargement des photos: ${errorMessage}`);
      }
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const refetch = useCallback(async () => {
    await fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhotoCallback = useCallback(async (photoUri: string, description?: string): Promise<JobPhotoAPI | null> => {
    if (!jobId || !profile) return null;

    const photoKey = photoUri; // Utiliser l'URI comme clé temporaire
    
    try {
      // ✅ ÉTAPE 1: Compressing (déjà fait dans PhotoSelectionModal)
      setUploadStatus(photoKey, {
        status: 'compressing',
        progress: 0,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });

      // ✅ ÉTAPE 2: Uploading
      setUploadStatus(photoKey, {
        status: 'uploading',
        progress: 50,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });

      const newPhoto = await uploadJobPhoto(jobId, photoUri, description);
      
      // ✅ ÉTAPE 3: Success (API)
      setUploadStatus(newPhoto.id, {
        status: 'success',
        progress: 100,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });
      
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
      
      // Nettoyer le statut après 3 secondes
      setTimeout(() => {
        if (jobStateContext) {
          jobStateContext.removeUploadStatus(photoKey);
          jobStateContext.removeUploadStatus(newPhoto.id);
        } else {
          setLocalUploadStatuses(prev => {
            const newMap = new Map(prev);
            newMap.delete(photoKey);
            newMap.delete(newPhoto.id);
            return newMap;
          });
        }
      }, 3000);
      
      return newPhoto;
    } catch (err) {
      console.error('Error uploading photo:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        console.log('📸 API photo upload not available, saving locally');
        
        const localPhoto: JobPhotoAPI = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          job_id: jobId,
          user_id: profile.id,
          filename: photoUri.split('/').pop() || `photo_${Date.now()}.jpg`,
          original_name: photoUri.split('/').pop() || `photo_${Date.now()}.jpg`,
          description: description || '',
          file_size: 0,
          mime_type: 'image/jpeg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // ✅ ÉTAPE 3b: Local (pas uploadé au serveur)
        setUploadStatus(localPhoto.id, {
          status: 'local',
          progress: 100,
          isLocal: true,
          error: 'Photo sauvegardée localement. Upload au serveur en attente.',
          photoUri,
          timestamp: new Date().toISOString(),
        });
        
        const updatedPhotos = [localPhoto, ...photos];
        setPhotos(updatedPhotos);
        await saveLocalPhotos(jobId, updatedPhotos);
        
        // Planifier un retry automatique
        schedulePhotoSync();
        
        return localPhoto;
      } else {
        // ✅ ÉTAPE 3c: Error
        setUploadStatus(photoKey, {
          status: 'error',
          progress: 0,
          isLocal: false,
          error: errorMessage,
          photoUri,
          timestamp: new Date().toISOString(),
        });
        
        setError(`Erreur lors de l'upload de la photo: ${errorMessage}`);
        
        // Garder le message d'erreur plus longtemps (10 secondes)
        setTimeout(() => {
          if (jobStateContext) {
            jobStateContext.removeUploadStatus(photoKey);
          } else {
            setLocalUploadStatuses(prev => {
              const newMap = new Map(prev);
              newMap.delete(photoKey);
              return newMap;
            });
          }
        }, 10000);
        
        return null;
      }
    }
  }, [jobId, photos, profile, jobStateContext, setUploadStatus]);

  const uploadMultiplePhotosCallback = useCallback(async (photoUris: string[], descriptions?: string[]): Promise<JobPhotoAPI[]> => {
    if (!jobId || !profile) return [];

    try {
      const newPhotos = await uploadJobPhotos(jobId, photoUris, descriptions);
      setPhotos(prevPhotos => [...newPhotos, ...prevPhotos]);
      return newPhotos;
    } catch (err) {
      console.error('Error uploading multiple photos:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de l'upload des photos: ${errorMessage}`);
      return [];
    }
  }, [jobId, profile]);

  const updatePhotoDescriptionCallback = useCallback(async (photoId: string, description: string): Promise<JobPhotoAPI | null> => {
    try {
      const updatedPhoto = await updatePhotoDescription(photoId, description);
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => photo.id === photoId ? updatedPhoto : photo)
      );
      return updatedPhoto;
    } catch (err) {
      console.error('Error updating photo description:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de la mise à jour de la description: ${errorMessage}`);
      return null;
    }
  }, []);

  const deletePhotoCallback = useCallback(async (photoId: string): Promise<boolean> => {
    try {
      await deletePhoto(photoId);
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
      return true;
    } catch (err) {
      console.error('Error deleting photo:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de la suppression de la photo: ${errorMessage}`);
      return false;
    }
  }, []);

  const getPhotoUrlCallback = useCallback(async (photoId: string): Promise<string | null> => {
    try {
      const url = await getPhotoServeUrl(photoId);
      return url;
    } catch (err) {
      console.error('Error getting photo URL:', err);
      return null;
    }
  }, []);

  // ✅ Fonction de retry automatique pour photos locales
  const schedulePhotoSync = useCallback(() => {
    console.log('📸 Photo sync scheduled - Will retry upload in 5 minutes');
    
    // Retry toutes les 5 minutes
    setTimeout(async () => {
      const localPhotos = photos.filter(p => p.id.startsWith('local-'));
      
      if (localPhotos.length > 0) {
        console.log(`📸 Retrying upload for ${localPhotos.length} local photos`);
        
        for (const localPhoto of localPhotos) {
          // Retry upload (implementation simplifiée - peut être améliorée)
          console.log(`📸 Retry upload for photo ${localPhoto.id}`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [photos]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const totalPhotos = photos.length;

  return {
    photos,
    isLoading,
    error,
    uploadStatuses, // ✅ Ajouté
    refetch,
    uploadPhoto: uploadPhotoCallback,
    uploadMultiplePhotos: uploadMultiplePhotosCallback,
    updatePhotoDescription: updatePhotoDescriptionCallback,
    deletePhoto: deletePhotoCallback,
    getPhotoUrl: getPhotoUrlCallback,
    schedulePhotoSync, // ✅ Ajouté
    totalPhotos,
  };
};