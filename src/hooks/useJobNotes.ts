// hooks/useJobNotes.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchJobNotes, JobNoteAPI, addJobNote, CreateJobNoteRequest } from '../services/jobNotes';
import { isLoggedIn } from '../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonctions utilitaires pour le stockage local temporaire
const getLocalNotesKey = (jobId: string) => `notes_${jobId}`;

const getLocalNotes = async (jobId: string): Promise<JobNoteAPI[]> => {
  try {
    const key = getLocalNotesKey(jobId);
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error reading local notes:', error);
    return [];
  }
};

const saveLocalNotes = async (jobId: string, notes: JobNoteAPI[]): Promise<void> => {
  try {
    const key = getLocalNotesKey(jobId);
    await AsyncStorage.setItem(key, JSON.stringify(notes));
  } catch (error) {
    console.warn('Error saving local notes:', error);
  }
};

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
      
      // Essayer l'API réelle, mais gérer les cas où elle n'est pas encore disponible
      try {
        const apiNotes = await fetchJobNotes(jobId);
        setNotes(apiNotes);
      } catch (apiError: any) {
        // Si l'endpoint n'existe pas (404) ou n'est pas encore implémenté (400), 
        // on utilise un stockage local temporaire
        if (apiError.message?.includes('404') || apiError.message?.includes('400')) {
          console.log('📝 API notes endpoint not yet available, using local storage');
          const localNotes = await getLocalNotes(jobId);
          setNotes(localNotes);
        } else {
          // Pour d'autres erreurs, on remonte l'erreur
          throw apiError;
        }
      }
      
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
      // Essayer d'abord l'API
      const newNote = await addJobNote(jobId, noteData);
      
      // Ajouter la nouvelle note à la liste locale
      setNotes(prevNotes => [newNote, ...prevNotes]);
      
      return newNote;
    } catch (err) {
      console.error('Error adding job note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Si l'API n'est pas disponible, sauvegarder localement
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        console.log('📝 API notes endpoint not available, saving locally');
        
        // Créer une note locale temporaire
        const localNote: JobNoteAPI = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          jobId,
          content: noteData.content,
          type: noteData.type || 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: 'current-user',
            name: 'Vous'
          }
        };
        
        // Ajouter à la liste locale
        const updatedNotes = [localNote, ...notes];
        setNotes(updatedNotes);
        
        // Sauvegarder dans AsyncStorage
        await saveLocalNotes(jobId, updatedNotes);
        
        return localNote;
      } else {
        setError(`Erreur lors de l'ajout de la note: ${errorMessage}`);
        return null;
      }
    }
  }, [jobId, notes]);

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