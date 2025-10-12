/**
 * Hook pour la gestion des photos de job
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchJobPhotos, 
  uploadJobPhoto, 
  deleteJobPhoto, 
  JobPhoto, 
  UploadPhotoRequest,
  createPhotoFromUri
} from '../services/jobPhotos';
import { isLoggedIn } from '../utils/auth';

interface UseJobPhotosReturn {
  photos: JobPhoto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadPhoto: (photoUri: string, description?: string) => Promise<JobPhoto | null>;
  removePhoto: (photoId: string) => Promise<void>;
  totalPhotos: number;
}

export const useJobPhotos = (jobId: string): UseJobPhotosReturn => {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Essayer l'API réelle, mais gérer les cas où elle n'est pas encore disponible
      try {
        const apiPhotos = await fetchJobPhotos(jobId);
        setPhotos(apiPhotos);
      } catch (apiError: any) {
        // Si l'endpoint n'existe pas (404) ou n'est pas encore implémenté (400), 
        // on utilise un tableau vide temporairement
        if (apiError.message?.includes('404') || apiError.message?.includes('400')) {
          console.log('📸 API photos endpoint not yet available');
          setPhotos([]);
        } else {
          // Pour d'autres erreurs, on remonte l'erreur
          throw apiError;
        }
      }
      
    } catch (err) {
      console.error('Error fetching job photos:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('Problème de connexion réseau.');
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

  const uploadPhoto = useCallback(async (
    photoUri: string, 
    description?: string
  ): Promise<JobPhoto | null> => {
    if (!jobId) return null;

    try {
      // Créer l'objet de requête
      const photoRequest = createPhotoFromUri(photoUri, jobId);
      if (description) {
        photoRequest.description = description;
      }

      // Essayer d'abord l'API
      try {
        const newPhoto = await uploadJobPhoto(jobId, photoRequest);
        
        // Ajouter la nouvelle photo à la liste locale
        setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
        
        return newPhoto;
      } catch (apiError: any) {
        // Si l'API n'est pas disponible, créer une photo locale temporaire
        if (apiError.message?.includes('404') || apiError.message?.includes('400')) {
          console.log('📸 API photos endpoint not available, saving locally');
          
          // Créer une photo locale temporaire
          const localPhoto: JobPhoto = {
            id: `local-photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            jobId,
            filename: `photo-${Date.now()}.jpg`,
            url: photoUri, // Utilise l'URI locale comme URL temporaire
            description: description || '',
            uploadedBy: {
              id: 'current-user',
              name: 'Vous'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Ajouter à la liste locale
          setPhotos(prevPhotos => [localPhoto, ...prevPhotos]);
          
          return localPhoto;
        } else {
          // Pour d'autres erreurs, on remonte l'erreur
          throw apiError;
        }
      }
    } catch (err) {
      console.error('Error uploading job photo:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de l'upload de la photo: ${errorMessage}`);
      return null;
    }
  }, [jobId]);

  const removePhoto = useCallback(async (photoId: string): Promise<void> => {
    if (!jobId) return;

    try {
      await deleteJobPhoto(jobId, photoId);
      
      // Retirer la photo de la liste locale
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
      
    } catch (err) {
      console.error('Error deleting job photo:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de la suppression de la photo: ${errorMessage}`);
    }
  }, [jobId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Calculs dérivés
  const totalPhotos = photos.length;

  return {
    photos,
    isLoading,
    error,
    refetch,
    uploadPhoto,
    removePhoto,
    totalPhotos,
  };
};