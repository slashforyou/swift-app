import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useJobStateOptional } from "../context/JobStateProvider";
import {
    deletePhoto,
    fetchJobPhotos,
    getPhotoServeUrl,
    JobPhotoAPI,
    updatePhotoDescription,
    uploadJobPhoto,
    uploadJobPhotos,
} from "../services/jobPhotos";
import { PhotoUploadStatus } from "../types/jobState";
import { isLoggedIn } from "../utils/auth";
import { useUserProfile } from "./useUserProfile";

// Types pour le statut d'upload (re-export depuis jobState)
export type { PhotoUploadStatus, UploadStatus } from "../types/jobState";

// Fonctions utilitaires pour le stockage local temporaire
const getLocalPhotosKey = (jobId: string) => `photos_${jobId}`;

const getLocalPhotos = async (jobId: string): Promise<JobPhotoAPI[]> => {
  try {
    const key = getLocalPhotosKey(jobId);
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const saveLocalPhotos = async (
  jobId: string,
  photos: JobPhotoAPI[],
): Promise<void> => {
  try {
    const key = getLocalPhotosKey(jobId);
    await AsyncStorage.setItem(key, JSON.stringify(photos));
  } catch (error) {
    // Non-critical: cache write is optional
  }
};

interface UseJobPhotosReturn {
  photos: JobPhotoAPI[];
  isLoading: boolean;
  error: string | null;
  uploadStatuses: Map<string, PhotoUploadStatus>; // ✅ Statuts d'upload par photo
  refetch: () => Promise<void>;
  uploadPhoto: (
    photoUri: string,
    description?: string,
  ) => Promise<JobPhotoAPI | null>;
  uploadMultiplePhotos: (
    photoUris: string[],
    descriptions?: string[],
  ) => Promise<JobPhotoAPI[]>;
  updatePhotoDescription: (
    photoId: string,
    description: string,
  ) => Promise<JobPhotoAPI | null>;
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
  const [localUploadStatuses, setLocalUploadStatuses] = useState<
    Map<string, PhotoUploadStatus>
  >(new Map());
  const { profile } = useUserProfile();

  // ✅ Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0); // ✅ Total from backend
  const PHOTOS_PER_PAGE = 8;

  // ✅ Essayer d'obtenir le JobStateProvider (optionnel, peut être undefined si hors provider)
  const jobStateContext = useJobStateOptional();

  // ✅ Helper pour set upload status (provider si disponible, sinon local)
  const setUploadStatus = useCallback(
    (photoId: string, status: PhotoUploadStatus) => {
      if (jobStateContext) {
        // Utiliser le provider pour persistence
        jobStateContext.setUploadStatus(photoId, status);
      } else {
        // Fallback vers state local
        setLocalUploadStatuses((prev) => new Map(prev).set(photoId, status));
      }
    },
    [jobStateContext],
  );

  // ✅ Helper pour get upload status
  const getUploadStatusHelper = useCallback(
    (photoId: string): PhotoUploadStatus | undefined => {
      if (jobStateContext) {
        return jobStateContext.getUploadStatus(photoId);
      } else {
        return localUploadStatuses.get(photoId);
      }
    },
    [jobStateContext, localUploadStatuses],
  );

  // ✅ Convertir en Map pour retour (backward compatibility)
  const uploadStatuses = new Map<string, PhotoUploadStatus>(
    jobStateContext?.jobState?.photoUploadStatuses
      ? Object.entries(jobStateContext.jobState.photoUploadStatuses)
      : Array.from(localUploadStatuses.entries()),
  );

  const fetchPhotos = useCallback(
    async (reset: boolean = true) => {
      if (!jobId) {
        setPhotos([]);
        setIsLoading(false);
        return;
      }

      try {
        if (reset) {
          setIsLoading(true);
          setCurrentOffset(0);
        }
        setError(null);

        // Vérifier si l'utilisateur est connecté
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          setError("Vous devez être connecté pour voir les photos.");
          setPhotos([]);
          return;
        }

        // Essayer l'API réelle
        try {
          const offset = reset ? 0 : currentOffset;
          const result = await fetchJobPhotos(jobId, {
            limit: PHOTOS_PER_PAGE,
            offset,
          });

          if (reset) {
            setPhotos(result.photos);
          } else {
            setPhotos((prev) => [...prev, ...result.photos]);
          }

          // ✅ Update total from backend (fixes badge issue)
          setTotalPhotos(result.pagination.total);
          setHasMore(result.pagination.hasMore);
          setCurrentOffset(offset + result.photos.length);
        } catch (fetchError) {
          const localPhotos = await getLocalPhotos(jobId);
          setPhotos(localPhotos);
          setHasMore(false);

          if (localPhotos.length === 0) {
            setError("Aucune photo disponible pour ce job.");
          }
        }
      } catch (err) {
        console.error("❌ [useJobPhotos] Error fetching job photos:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        if (errorMessage.includes("404")) {
          setError("Job non trouvé.");
        } else if (errorMessage.includes("403")) {
          setError(
            "Vous n'avez pas les droits pour voir les photos de ce job.",
          );
        } else {
          setError(`Erreur lors du chargement des photos: ${errorMessage}`);
        }
        setPhotos([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, currentOffset, PHOTOS_PER_PAGE],
  );

  const refetch = useCallback(async () => {
    await fetchPhotos(true); // Reset = true pour recharger depuis le début
  }, [fetchPhotos]);

  // ✅ Charger 8 photos supplémentaires
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      await fetchPhotos(false); // Reset = false pour ajouter à la suite
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPhotos, isLoadingMore, hasMore, currentOffset]);

  const uploadPhotoCallback = useCallback(
    async (
      photoUri: string,
      description?: string,
    ): Promise<JobPhotoAPI | null> => {
      if (!jobId || !profile) {
        console.error("❌ [DEBUG] Manque jobId ou profile");
        // Alert removed
        return null;
      }

      const photoKey = photoUri; // Utiliser l'URI comme clé temporaire

      try {
        setUploadStatus(photoKey, {
          status: "compressing",
          progress: 0,
          isLocal: false,
          timestamp: new Date().toISOString(),
        });

        // ✅ ÉTAPE 2: Uploading
        setUploadStatus(photoKey, {
          status: "uploading",
          progress: 50,
          isLocal: false,
          timestamp: new Date().toISOString(),
        });

        // ✅ Session 10 FIX: Passer userId au service pour le backend
        const userId = profile?.id?.toString();
        const newPhoto = await uploadJobPhoto(
          jobId,
          photoUri,
          description,
          userId,
        );

        // ✅ ÉTAPE 3: Success (API)
        setUploadStatus(String(newPhoto.id), {
          status: "success",
          progress: 100,
          isLocal: false,
          timestamp: new Date().toISOString(),
        });

        setPhotos((prevPhotos) => {
          const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          return [newPhoto, ...safePhotos];
        });

        // Nettoyer le statut après 3 secondes
        setTimeout(() => {
          if (jobStateContext) {
            jobStateContext.removeUploadStatus(photoKey);
            jobStateContext.removeUploadStatus(String(newPhoto.id));
          } else {
            setLocalUploadStatuses((prev) => {
              const newMap = new Map(prev);
              newMap.delete(photoKey);
              newMap.delete(String(newPhoto.id));
              return newMap;
            });
          }
        }, 3000);

        return newPhoto;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        if (errorMessage.includes("404") || errorMessage.includes("400")) {
          // Alert removed

          const localPhoto: JobPhotoAPI = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            job_id: jobId,
            user_id: profile.id,
            filename: photoUri.split("/").pop() || `photo_${Date.now()}.jpg`,
            original_name:
              photoUri.split("/").pop() || `photo_${Date.now()}.jpg`,
            description: description || "",
            file_size: 0,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // ✅ ÉTAPE 3b: Local (pas uploadé au serveur)
          setUploadStatus(String(localPhoto.id), {
            status: "local",
            progress: 100,
            isLocal: true,
            error:
              "Photo sauvegardée localement. Upload au serveur en attente.",
            photoUri,
            timestamp: new Date().toISOString(),
          });

          // ✅ Utiliser la forme fonctionnelle pour éviter les problèmes de closure
          setPhotos((prevPhotos) => {
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
            status: "error",
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
              setLocalUploadStatuses((prev) => {
                const newMap = new Map(prev);
                newMap.delete(photoKey);
                return newMap;
              });
            }
          }, 10000);

          return null;
        }
      }
    },
    [jobId, photos, profile, jobStateContext, setUploadStatus],
  );

  const uploadMultiplePhotosCallback = useCallback(
    async (
      photoUris: string[],
      descriptions?: string[],
    ): Promise<JobPhotoAPI[]> => {
      if (!jobId || !profile) return [];

      try {
        const newPhotos = await uploadJobPhotos(jobId, photoUris, descriptions);
        // ✅ Protection: vérifier que newPhotos est un array
        if (Array.isArray(newPhotos) && newPhotos.length > 0) {
          setPhotos((prevPhotos) => {
            const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
            return [...newPhotos, ...safePhotos];
          });
          return newPhotos;
        }
        return [];
      } catch (err) {
        console.error("Error uploading multiple photos:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(`Erreur lors de l'upload des photos: ${errorMessage}`);
        return [];
      }
    },
    [jobId, profile],
  );

  const updatePhotoDescriptionCallback = useCallback(
    async (
      photoId: string,
      description: string,
    ): Promise<JobPhotoAPI | null> => {
      try {
        const updatedPhoto = await updatePhotoDescription(photoId, description);
        setPhotos((prevPhotos) => {
          const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          return safePhotos.map((photo) =>
            photo.id === photoId ? updatedPhoto : photo,
          );
        });
        return updatedPhoto;
      } catch (err) {
        console.error("Error updating photo description:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(
          `Erreur lors de la mise à jour de la description: ${errorMessage}`,
        );
        return null;
      }
    },
    [],
  );

  const deletePhotoCallback = useCallback(
    async (photoId: string): Promise<boolean> => {
      try {
        await deletePhoto(photoId);
        setPhotos((prevPhotos) => {
          const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
          return safePhotos.filter((photo) => photo.id !== photoId);
        });
        return true;
      } catch (err) {
        console.error("Error deleting photo:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(`Erreur lors de la suppression de la photo: ${errorMessage}`);
        return false;
      }
    },
    [],
  );

  const getPhotoUrlCallback = useCallback(
    async (photoId: string): Promise<string | null> => {
      try {
        const url = await getPhotoServeUrl(photoId);
        return url;
      } catch (err) {
        console.error("Error getting photo URL:", err);
        return null;
      }
    },
    [],
  );

  // ✅ Fonction de retry automatique pour photos locales
  const schedulePhotoSync = useCallback(() => {
    // console.log('📸 Photo sync scheduled - Will retry upload in 30 seconds');

    // ✅ Retry toutes les 30 secondes (réduit de 5 min pour meilleur UX)
    setTimeout(async () => {
      try {
        // ✅ Protection: Vérifier que photos est bien un array
        if (!Array.isArray(photos)) {
          console.error(
            "❌ [schedulePhotoSync] photos is not an array:",
            typeof photos,
          );
          return;
        }

        const localPhotos = photos.filter((p) =>
          String(p?.id).startsWith("local-"),
        );

        if (localPhotos.length > 0) {
          for (const localPhoto of localPhotos) {
            // ✅ Récupérer l'URI originale depuis le statut d'upload ou le filename
            const uploadStatus = getUploadStatusHelper(String(localPhoto.id));
            const photoUri = uploadStatus?.photoUri || localPhoto.filename;

            if (!photoUri) {
              continue;
            }

            try {
              // ✅ Tenter le re-upload vers l'API
              const newPhoto = await uploadJobPhoto(
                jobId,
                photoUri,
                localPhoto.description || "",
              );

              // ✅ Remplacer la photo locale par la photo serveur
              setPhotos((prevPhotos) => {
                const safePhotos = Array.isArray(prevPhotos) ? prevPhotos : [];
                return safePhotos.map((p) =>
                  p.id === localPhoto.id ? newPhoto : p,
                );
              });

              // ✅ Mettre à jour le statut
              setUploadStatus(String(newPhoto.id), {
                status: "success",
                progress: 100,
                isLocal: false,
                timestamp: new Date().toISOString(),
              });

              // ✅ Supprimer l'ancien statut local
              if (jobStateContext) {
                jobStateContext.removeUploadStatus(String(localPhoto.id));
              } else {
                setLocalUploadStatuses((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(String(localPhoto.id));
                  return newMap;
                });
              }

              // ✅ Mettre à jour le stockage local
              await saveLocalPhotos(
                jobId,
                photos.filter((p) => p.id !== localPhoto.id),
              );
            } catch (uploadError) {
              // Ne pas arrêter la boucle, continuer avec les autres photos
              // Le prochain schedulePhotoSync réessayera
            }
          }
        }
      } catch (error) {
        console.error("❌ [schedulePhotoSync] Error during photo sync:", error);
      }
    }, 30 * 1000); // 30 secondes (était 5 min)
  }, [photos, jobId, getUploadStatusHelper, setUploadStatus, jobStateContext]);

  useEffect(() => {
    fetchPhotos(true); // Initial load
  }, [jobId]); // ✅ FIXED: Ne dépendre QUE de jobId, pas de fetchPhotos (sinon boucle infinie)

  // ✅ Tenter de synchroniser les photos locales au chargement (après 5s)
  useEffect(() => {
    if (!jobId || isLoading) return;

    const hasLocalPhotos = photos.some((p) =>
      String(p?.id).startsWith("local-"),
    );
    if (hasLocalPhotos) {
      // Délai de 5s pour laisser le temps à l'app de se stabiliser
      const timer = setTimeout(() => {
        schedulePhotoSync();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [jobId, isLoading, photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
