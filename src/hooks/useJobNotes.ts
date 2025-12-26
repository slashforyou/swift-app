// hooks/useJobNotes.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { addJobNote, CreateJobNoteRequest, deleteJobNote, fetchJobNotes, JobNoteAPI, updateJobNote, UpdateJobNoteRequest } from '../services/jobNotes';
import { isLoggedIn } from '../utils/auth';
import { useUserProfile } from './useUserProfile';

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
  updateNote: (noteId: string, noteData: UpdateJobNoteRequest) => Promise<JobNoteAPI | null>;
  deleteNote: (noteId: string) => Promise<boolean>;
  totalNotes: number;
}

export const useJobNotes = (jobId: string): UseJobNotesReturn => {
  const [notes, setNotes] = useState<JobNoteAPI[]>([]);
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
          // TEMP_DISABLED: console.log('📝 API notes endpoint not yet available, using local storage');
          const localNotes = await getLocalNotes(jobId);
          setNotes(localNotes);
        } else {
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
    if (!jobId || !profile || !profile.id) {
      console.error('❌ [useJobNotes] Missing required data:', { 
        jobId: !!jobId, 
        profile: !!profile, 
        profileId: profile?.id 
      });
      return null;
    }

    console.log('📝 [useJobNotes] Adding note:', {
      jobId,
      userId: profile.id,
      noteType: noteData.note_type,
      hasContent: !!noteData.content,
      hasTitle: !!noteData.title
    });

    try {
      // Préparer les données avec l'utilisateur actuel
      const noteWithUser: CreateJobNoteRequest = {
        ...noteData,
        created_by: profile.id
      };

      // Essayer d'abord l'API
      const newNote = await addJobNote(jobId, noteWithUser);
      console.log('✅ [useJobNotes] Note added successfully via API:', newNote.id);
      
      // Ajouter la nouvelle note à la liste locale
      setNotes(prevNotes => [newNote, ...prevNotes]);
      
      return newNote;
    } catch (err) {

      console.error('❌ [useJobNotes] Error adding job note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Si l'API n'est pas disponible, sauvegarder localement
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        console.log('📝 [useJobNotes] API notes endpoint not available (404/400), saving locally');
        
        // Créer une note locale temporaire
        const localNote: JobNoteAPI = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          job_id: jobId,
          title: noteData.title,
          content: noteData.content,
          note_type: noteData.note_type || 'general',
          created_by: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('💾 [useJobNotes] Local note created:', localNote.id);
        
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
  }, [jobId, notes, profile]);

  const updateNote = useCallback(async (noteId: string, noteData: UpdateJobNoteRequest): Promise<JobNoteAPI | null> => {
    try {
      const updatedNote = await updateJobNote(noteId, noteData);
      
      // Mettre à jour la note dans la liste locale
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === noteId ? updatedNote : note)
      );
      
      return updatedNote;
    } catch (err) {

      console.error('Error updating job note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de la mise à jour de la note: ${errorMessage}`);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!jobId) return false;

    try {
      await deleteJobNote(jobId, noteId);
      
      // Supprimer la note de la liste locale
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      return true;
    } catch (err) {

      console.error('Error deleting job note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Erreur lors de la suppression de la note: ${errorMessage}`);
      return false;
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
    updateNote,
    deleteNote,
    totalNotes,
  };
};