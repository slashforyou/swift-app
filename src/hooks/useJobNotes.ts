// hooks/useJobNotes.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchJobNotes, JobNoteAPI, addJobNote, CreateJobNoteRequest } from '../services/jobNotes';
import { isLoggedIn } from '../utils/auth';

interface UseJobNotesReturn {
  notes: JobNoteAPI[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addNote: (noteData: CreateJobNoteRequest) => Promise<JobNoteAPI | null>;
  totalNotes: number;
}

export const useJobNotes = (jobId: string): UseJobNotesReturn => {
  const [notes, setNotes] = useState<JobNoteAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('Vous devez être connecté pour voir les notes.');
        setNotes([]);
        return;
      }
      
      // Utiliser l'API réelle
      const apiNotes = await fetchJobNotes(jobId);
      setNotes(apiNotes);
      
    } catch (err) {
      console.error('Error fetching job notes:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('Problème de connexion réseau.');
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

  const addNote = useCallback(async (noteData: CreateJobNoteRequest): Promise<JobNoteAPI | null> => {
    if (!jobId) return null;

    try {
      const newNote = await addJobNote(jobId, noteData);
      
      // Ajouter la nouvelle note à la liste locale
      setNotes(prevNotes => [newNote, ...prevNotes]);
      
      return newNote;
    } catch (err) {
      console.error('Error adding job note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de l'ajout de la note: ${errorMessage}`);
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Calculs dérivés
  const totalNotes = notes.length;

  return {
    notes,
    isLoading,
    error,
    refetch,
    addNote,
    totalNotes,
  };
};