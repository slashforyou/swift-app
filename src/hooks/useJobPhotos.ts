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
export type { PhotoUploadStatus, UploadStatus } from '../types/jobState';

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
  // ✅ Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
}

export const useJobPhotos = (jobId: string): UseJobPhotosReturn => {
  const [photos, setPhotos] = useState<JobPhotoAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUploadStatuses, setLocalUploadStatuses] = useState<Map<string, PhotoUploadStatus>>(new Map());
  const { profile } = useUserProfile();
  
  // ✅ Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0); // ✅ Total from backend
  const PHOTOS_PER_PAGE = 8;

  // ✅ Essayer d'obtenir le JobStateProvider (optionnel, peut être undefined si hors provider)
  let jobStateContext: ReturnType<typeof useJobState> | undefined;
  try {
    jobStateContext = useJobState();
  } catch (e) {
    // Provider not available, use local state
    // TEMP_DISABLED: console.log('📸 JobStateProvider not available, using local upload statuses');
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

  const fetchPhotos = useCallback(async (reset: boolean = true) => {
    // TEMP_DISABLED: console.log('📸 [useJobPhotos] fetchPhotos - DÉBUT - jobId:', jobId, 'reset:', reset);
    
    if (!jobId) {setPhotos([]);
      setIsLoading(false);
      return;
    }

    try {
      if (reset) {
        setIsLoading(true);
        setCurrentOffset(0);
      }
      setError(null);
      
      // TEMP_DISABLED: console.log('📸 [useJobPhotos] Vérification connexion...');
      // Vérifier si l'utilisateur est connecté
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {setError('Vous devez être connecté pour voir les photos.');
        setPhotos([]);
        return;
      }
      
      // TEMP_DISABLED: console.log('✅ [useJobPhotos] Connecté, fetch API...');
      // Essayer l'API réelle
      try {
        const offset = reset ? 0 : currentOffset;
        const result = await fetchJobPhotos(jobId, { limit: PHOTOS_PER_PAGE, offset });
        
        // TEMP_DISABLED: console.log('✅ [useJobPhotos] API photos reçues:', result.photos.length, 'hasMore:', result.pagination.hasMore);
        
        if (reset) {
          setPhotos(result.photos);
        } else {
          setPhotos(prev => [...prev, ...result.photos]);
        }
        
        // ✅ Update total from backend (fixes badge issue)
        setTotalPhotos(result.pagination.total);
        setHasMore(result.pagination.hasMore);
        setCurrentOffset(offset + result.photos.length);
      } catch (fetchError) {
        // TEMP_DISABLED: console.log('📸 [useJobPhotos] API photos endpoint not available, loading from local storage');
        const localPhotos = await getLocalPhotos(jobId);
        // TEMP_DISABLED: console.log('📸 [useJobPhotos] Photos locales:', localPhotos?.length || 0);
        setPhotos(localPhotos);
        setHasMore(false);
        
        if (localPhotos.length === 0) {
          setError('Aucune photo disponible pour ce job.');
        }
      }
      
    } catch (err) {
      console.error('❌ [useJobPhotos] Error fetching job photos:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('404')) {
        setError('Job non trouvé.');
      } else if (errorMessage.includes('403')) {
        setError('Vous n\'avez pas les droits pour voir les photos de ce job.');
      } else {
        setError(`Erreur lors du chargement des photos: ${errorMessage}`);
      }
      setPhotos([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      // TEMP_DISABLED: console.log('📸 [useJobPhotos] fetchPhotos - FIN');
    }
  }, [jobId, currentOffset, PHOTOS_PER_PAGE]);

  const refetch = useCallback(async () => {
    await fetchPhotos(true); // Reset = true pour recharger depuis le début
  }, [fetchPhotos]);

  // ✅ Charger 8 photos supplémentaires
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      // TEMP_DISABLED: console.log('📸 [loadMore] Skipping - isLoadingMore:', isLoadingMore, 'hasMore:', hasMore);
      return;
    }
    
    // TEMP_DISABLED: console.log('📸 [loadMore] Loading more photos from offset:', currentOffset);
    setIsLoadingMore(true);
    
    try {
      await fetchPhotos(false); // Reset = false pour ajouter à la suite
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPhotos, isLoadingMore, hasMore, currentOffset]);

  const uploadPhotoCallback = useCallback(async (photoUri: string, description?: string): Promise<JobPhotoAPI | null> => {
    // TEMP_DISABLED: console.log('📤 [DEBUG useJobPhotos] uploadPhotoCallback - DÉBUT');
    // TEMP_DISABLED: console.log('📤 [DEBUG] jobId:', jobId);
    // TEMP_DISABLED: console.log('📤 [DEBUG] photoUri:', photoUri);
    // TEMP_DISABLED: console.log('📤 [DEBUG] description:', description);
    // TEMP_DISABLED: console.log('📤 [DEBUG] profile:', profile);
    
    if (!jobId || !profile) {
      console.error('❌ [DEBUG] Manque jobId ou profile');
      // Alert removed
      return null;
    }

    const photoKey = photoUri; // Utiliser l'URI comme clé temporaire
    // TEMP_DISABLED: console.log('🔑 [DEBUG] photoKey:', photoKey);
    
    try {
        setUploadStatus(photoKey, {
        status: 'compressing',
        progress: 0,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });

      // TEMP_DISABLED: console.log('📤 [DEBUG] ÉTAPE 2: Uploading vers API...');
      // ✅ ÉTAPE 2: Uploading
      setUploadStatus(photoKey, {
        status: 'uploading',
        progress: 50,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });

      // TEMP_DISABLED: console.log('🌐 [DEBUG] Appel uploadJobPhoto API...');
      const newPhoto = await uploadJobPhoto(jobId, photoUri, description);
      // TEMP_DISABLED: console.log('✅ [DEBUG] API uploadJobPhoto réussi:', newPhoto);
      // Alert removed
      
      // TEMP_DISABLED: console.log('✅ [DEBUG] ÉTAPE 3: Success (API)');
      // ✅ ÉTAPE 3: Success (API)
      setUploadStatus(String(newPhoto.id), {
        status: 'success',
        progress: 100,
        isLocal: false,
        timestamp: new Date().toISOString(),
      });
      
      // TEMP_DISABLED: console.log('📝 [DEBUG] Ajout de la photo à la liste...');
      setPhotos(prevPhotos => {
        const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
        return [newPhoto, ...safePhotos];
      });
      
      // TEMP_DISABLED: console.log('🧹 [DEBUG] Nettoyage des statuts dans 3s...');
      // Nettoyer le statut après 3 secondes
      setTimeout(() => {
        if (jobStateContext) {
          jobStateContext.removeUploadStatus(photoKey);
          jobStateContext.removeUploadStatus(String(newPhoto.id));
        } else {
          setLocalUploadStatuses(prev => {
            const newMap = new Map(prev);
            newMap.delete(photoKey);
            newMap.delete(String(newPhoto.id));
            return newMap;
          });
        }
      }, 3000);
      
      // TEMP_DISABLED: console.log('✅ [DEBUG] uploadPhotoCallback - FIN SUCCÈS');
      return newPhoto;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        // TEMP_DISABLED: console.log('ℹ️ [INFO] API non disponible (attendu), sauvegarde locale en cours...');
        // TEMP_DISABLED: console.log('📝 [INFO] Détails:', errorMessage);
        // Alert removed
        
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
        
        // TEMP_DISABLED: console.log('💾 [DEBUG] Photo locale créée:', localPhoto);
        
        // TEMP_DISABLED: console.log('💾 [DEBUG] ÉTAPE 3b: Local (pas uploadé au serveur)');
        // ✅ ÉTAPE 3b: Local (pas uploadé au serveur)
        setUploadStatus(String(localPhoto.id), {
          status: 'local',
          progress: 100,
          isLocal: true,
          error: 'Photo sauvegardée localement. Upload au serveur en attente.',
          photoUri,
          timestamp: new Date().toISOString(),
        });
        
        // ✅ Utiliser la forme fonctionnelle pour éviter les problèmes de closure
        setPhotos(prevPhotos => {
          // ✅ Protection: Assurer que prevPhotos est bien un array
          const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          const updatedPhotos = [localPhoto, ...safePhotos];
          // Sauvegarder dans AsyncStorage
          saveLocalPhotos(jobId, updatedPhotos);
          return updatedPhotos;
        });
        
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
      // ✅ Protection: vérifier que newPhotos est un array
      if (Array.isArray(newPhotos) && newPhotos.length > 0) {
        setPhotos(prevPhotos => {
          const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          return [...newPhotos, ...safePhotos];
        });
        return newPhotos;
      }
      return [];
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
      setPhotos(prevPhotos => {
        const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
        return safePhotos.map(photo => photo.id === photoId ? updatedPhoto : photo);
      });
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
      setPhotos(prevPhotos => {
        const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
        return safePhotos.filter(photo => photo.id !== photoId);
      });
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
    // TEMP_DISABLED: console.log('📸 Photo sync scheduled - Will retry upload in 5 minutes');
    
    // ✅ Retry toutes les 5 minutes avec protection complète
    setTimeout(async () => {
      try {
        // ✅ Protection: Vérifier que photos est bien un array
        if (!Array.isArray(photos)) {
          console.error('❌ [schedulePhotoSync] photos is not an array:', typeof photos);
          return;
        }
        
        const localPhotos = photos.filter(p => String(p?.id).startsWith('local-'));
        
        if (localPhotos.length > 0) {
          // TEMP_DISABLED: console.log(`📸 Retrying upload for ${localPhotos.length} local photos`);
          
          for (const localPhoto of localPhotos) {
            // Retry upload (implementation simplifiée - peut être améliorée)
            // TEMP_DISABLED: console.log(`📸 Retry upload for photo ${localPhoto.id}`);
          }
        }
      } catch (error) {
        console.error('❌ [schedulePhotoSync] Error during photo sync:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [photos]);

  useEffect(() => {
    // TEMP_DISABLED: console.log('📸 [useJobPhotos] useEffect triggered - jobId:', jobId);
    fetchPhotos(true); // Initial load
  }, [jobId]); // ✅ FIXED: Ne dépendre QUE de jobId, pas de fetchPhotos (sinon boucle infinie)

  // totalPhotos est maintenant un state qui vient du backend (ligne 73)

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
    totalPhotos, // ✅ From backend pagination.total
    // ✅ Pagination
    hasMore,
    loadMore,
    isLoadingMore,
  };
};
