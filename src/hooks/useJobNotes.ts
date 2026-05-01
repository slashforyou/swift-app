// hooks/useJobNotes.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  addJobNote,
  CreateJobNoteRequest,
  deleteJobNote,
  fetchJobNotes,
  JobNoteAPI,
  markAllNotesAsRead,
  markNoteAsRead,
  updateJobNote,
  UpdateJobNoteRequest,
} from "../services/jobNotes";
import { isLoggedIn } from "../utils/auth";
import { useUserProfile } from "./useUserProfile";

// Fonctions utilitaires pour le stockage local temporaire
const getLocalNotesKey = (jobId: string) => `notes_${jobId}`;

const getLocalNotes = async (jobId: string): Promise<JobNoteAPI[]> => {
  try {
    const key = getLocalNotesKey(jobId);
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const saveLocalNotes = async (
  jobId: string,
  notes: JobNoteAPI[],
): Promise<void> => {
  try {
    const key = getLocalNotesKey(jobId);
    await AsyncStorage.setItem(key, JSON.stringify(notes));
  } catch (error) {
    // Non-critical: cache write is optional
  }
};

interface UseJobNotesReturn {
  notes: JobNoteAPI[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addNote: (noteData: CreateJobNoteRequest) => Promise<JobNoteAPI | null>;
  updateNote: (
    noteId: string,
    noteData: UpdateJobNoteRequest,
  ) => Promise<JobNoteAPI | null>;
  deleteNote: (noteId: string) => Promise<boolean>;
  totalNotes: number;
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  markNoteAsRead: (noteId: string | number) => Promise<void>;
}

export const useJobNotes = (jobId: string): UseJobNotesReturn => {
  const [notes, setNotes] = useState<JobNoteAPI[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUserProfile();

  const fetchNotes = useCallback(async () => {
    if (!jobId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si l'utilisateur est connecté
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        setError("Vous devez être connecté pour voir les notes.");
        setNotes([]);
        return;
      }

      // Essayer l'API réelle, mais gérer les cas où elle n'est pas encore disponible
      try {
        const response = await fetchJobNotes(jobId);
        setNotes(response.notes);
        setUnreadCount(response.unread_count || 0);
      } catch (apiError: any) {
        // Si l'endpoint n'existe pas (404) ou n'est pas encore implémenté (400),
        // on utilise un stockage local temporaire
        if (
          apiError.message?.includes("404") ||
          apiError.message?.includes("400")
        ) {
          const localNotes = await getLocalNotes(jobId);
          setNotes(localNotes);
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      console.error("Error fetching job notes:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      if (
        errorMessage === 'SESSION_EXPIRED' ||
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        // Session expired — already navigated away by auth layer, ignore silently
        return;
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("fetch")
      ) {
        setError("Problème de connexion réseau.");
      } else {
        setError(`Erreur lors du chargement des notes: ${errorMessage}`);
      }
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const refetch = useCallback(async () => {
    await fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (noteData: CreateJobNoteRequest): Promise<JobNoteAPI | null> => {
      // ✅ FIX JOB-04: Meilleure validation et messages d'erreur
      if (!jobId) {
        console.error("❌ [useJobNotes] Cannot add note: jobId is missing");
        throw new Error("ID du job manquant. Impossible d'ajouter la note.");
      }

      // ✅ FIX: Si le profile n'est pas chargé, utiliser un ID par défaut ou attendre
      let userId = profile?.id;
      if (!userId) {
        // Essayer de récupérer l'ID depuis AsyncStorage ou utiliser un placeholder
        userId = "current-user"; // Le backend peut résoudre cela avec le token
      }

      try {
        // Préparer les données avec l'utilisateur actuel
        const noteWithUser: CreateJobNoteRequest = {
          ...noteData,
          created_by: userId,
        };

        // Essayer d'abord l'API
        const newNote = await addJobNote(jobId, noteWithUser);

        // Ajouter la nouvelle note à la liste locale
        setNotes((prevNotes) => [newNote, ...prevNotes]);

        return newNote;
      } catch (err) {
        console.error("❌ [useJobNotes] Error adding job note:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        // Si l'API n'est pas disponible, sauvegarder localement
        if (errorMessage.includes("404") || errorMessage.includes("400")) {
          // Créer une note locale temporaire
          const localNote: JobNoteAPI = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            job_id: jobId,
            title: noteData.title,
            content: noteData.content,
            note_type: noteData.note_type || "general",
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Ajouter à la liste locale
          const updatedNotes = [localNote, ...notes];
          setNotes(updatedNotes);

          // Sauvegarder dans AsyncStorage sans await pour éviter le double error log
          saveLocalNotes(jobId, updatedNotes).catch((saveErr) => {
            console.error("Error saving note:", saveErr);
          });

          return localNote;
        } else {
          setError(`Erreur lors de l'ajout de la note: ${errorMessage}`);
          return null;
        }
      }
    },
    [jobId, notes, profile],
  );

  const updateNote = useCallback(
    async (
      noteId: string | number,
      noteData: UpdateJobNoteRequest,
    ): Promise<JobNoteAPI | null> => {
      if (!jobId) return null;

      try {
        // Convertir l'ID en string pour l'API
        const noteIdStr = String(noteId);
        const updatedNote = await updateJobNote(jobId, noteIdStr, noteData);

        // Mettre à jour la note dans la liste locale
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            String(note.id) === noteIdStr ? updatedNote : note,
          ),
        );

        return updatedNote;
      } catch (err) {
        console.error("Error updating job note:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(`Erreur lors de la mise à jour de la note: ${errorMessage}`);
        return null;
      }
    },
    [jobId],
  );

  const deleteNote = useCallback(
    async (noteId: string | number): Promise<boolean> => {
      if (!jobId) return false;

      try {
        // Convertir l'ID en string pour l'API
        const noteIdStr = String(noteId);
        await deleteJobNote(jobId, noteIdStr);

        // Supprimer la note de la liste locale
        setNotes((prevNotes) =>
          prevNotes.filter((note) => String(note.id) !== noteIdStr),
        );

        return true;
      } catch (err) {
        console.error("Error deleting job note:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(`Erreur lors de la suppression de la note: ${errorMessage}`);
        return false;
      }
    },
    [jobId],
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Marquer toutes les notes comme lues
  const markAllAsRead = useCallback(async () => {
    if (!jobId) return;

    try {
      // Étape 1: Envoyer à la BDD (les logs sont dans markAllNotesAsRead)
      await markAllNotesAsRead(jobId);

      // Étape 2: Mettre à jour localement immédiatement pour l'UI
      setNotes((prevNotes) => {
        const updatedNotes = prevNotes.map((note) => ({
          ...note,
          is_read: true,
        }));
        return updatedNotes;
      });
      setUnreadCount(0);

      // Étape 3: Recharger depuis le serveur pour obtenir les données fraîches
      await fetchNotes();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Si l'endpoint n'est pas encore implémenté (404), marquer localement quand même
      if (errorMessage.includes("404")) {
        // Mettre à jour localement même sans API
        setNotes((prevNotes) =>
          prevNotes.map((note) => ({ ...note, is_read: true })),
        );
        setUnreadCount(0);
      } else {
        console.error(
          "❌ [NOTES] Error marking all notes as read:",
          errorMessage,
        );
      }
    }
  }, [jobId, fetchNotes]);

  // Marquer une note spécifique comme lue
  const markNoteAsReadCallback = useCallback(
    async (noteId: string | number) => {
      if (!jobId) return;

      try {
        await markNoteAsRead(jobId, noteId);

        // Mettre à jour localement
        const noteIdStr = String(noteId);
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            String(note.id) === noteIdStr ? { ...note, is_read: true } : note,
          ),
        );

        // Décrémenter le compteur si la note était non lue
        const wasUnread = notes.find(
          (n) => String(n.id) === noteIdStr && !n.is_read,
        );
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error marking note as read:", err);
      }
    },
    [jobId, notes],
  );

  // Calculs dérivés
  const totalNotes = notes.length;

  return {
    notes,
    isLoading,
    error,
    refetch,
    addNote,
    updateNote,
    deleteNote,
    totalNotes,
    unreadCount,
    markAllAsRead,
    markNoteAsRead: markNoteAsReadCallback,
  };
};
