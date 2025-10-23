import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    deletePhoto,
    fetchJobPhotos,
    getPhotoServeUrl,
    JobPhotoAPI,
    updatePhotoDescription,
    uploadJobPhoto,
    uploadJobPhotos
} from '../services/jobPhotos';
import { isLoggedIn } from '../utils/auth';
import { useUserProfile } from './useUserProfile';

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
  refetch: () => Promise<void>;
  uploadPhoto: (photoUri: string, description?: string) => Promise<JobPhotoAPI | null>;
  uploadMultiplePhotos: (photoUris: string[], descriptions?: string[]) => Promise<JobPhotoAPI[]>;
  updatePhotoDescription: (photoId: string, description: string) => Promise<JobPhotoAPI | null>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  getPhotoUrl: (photoId: string) => Promise<string | null>;
  totalPhotos: number;
}

export const useJobPhotos = (jobId: string): UseJobPhotosReturn => {
  const [photos, setPhotos] = useState<JobPhotoAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUserProfile();

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

    try {
      const newPhoto = await uploadJobPhoto(jobId, photoUri, description);
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
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
        
        const updatedPhotos = [localPhoto, ...photos];
        setPhotos(updatedPhotos);
        await saveLocalPhotos(jobId, updatedPhotos);
        return localPhoto;
      } else {
        setError(`Erreur lors de l'upload de la photo: ${errorMessage}`);
        return null;
      }
    }
  }, [jobId, photos, profile]);

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

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const totalPhotos = photos.length;

  return {
    photos,
    isLoading,
    error,
    refetch,
    uploadPhoto: uploadPhotoCallback,
    uploadMultiplePhotos: uploadMultiplePhotosCallback,
    updatePhotoDescription: updatePhotoDescriptionCallback,
    deletePhoto: deletePhotoCallback,
    getPhotoUrl: getPhotoUrlCallback,
    totalPhotos,
  };
};