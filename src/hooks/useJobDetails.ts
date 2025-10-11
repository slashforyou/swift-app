import { useState, useEffect, useCallback } from 'react';
import { 
  getJobDetails, 
  updateJob as updateJobService, 
  addJobNote as addJobNoteService, 
  startJob as startJobService, 
  pauseJob as pauseJobService, 
  resumeJob as resumeJobService, 
  completeJob as completeJobService 
} from '../services/jobs';

export const useJobDetails = (jobId: string) => {
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Fonction pour charger les détails du job (UN SEUL APPEL à /jobs/:id/full)
  const fetchJobDetails = useCallback(async () => {
    if (!jobId) {
      console.warn('⚠️ [useJobDetails] No jobId provided');
      setIsLoading(false);
      return;
    }

    console.log(`🔍 [useJobDetails] Loading job details for ID: ${jobId}`);
    setIsLoading(true);
    setError(null);

    try {
      // ✅ UN SEUL APPEL à l'endpoint /jobs/:id/full via le service
      console.log('📡 [useJobDetails] Calling getJobDetails service...');
      const data = await getJobDetails(jobId);
      
      console.log('✅ [useJobDetails] Job details received from service:', {
        hasJob: !!data?.job,
        jobId: data?.job?.id,
        jobTitle: data?.job?.title,
        hasClient: !!data?.client,
        clientName: data?.client?.name,
        hasItems: Array.isArray(data?.items),
        hasTrucks: Array.isArray(data?.trucks),
        hasWorkers: Array.isArray(data?.workers),
        hasNotes: Array.isArray(data?.notes),
        hasTimeline: !!data?.timeline,
        itemsCount: data?.items?.length || 0,
        trucksCount: data?.trucks?.length || 0,
        workersCount: data?.workers?.length || 0,
        notesCount: data?.notes?.length || 0,
      });

      // Vérification de la structure de données
      if (!data || !data.job) {
        throw new Error('Invalid job data received from server');
      }

      setJobDetails(data);
      console.log('✅ [useJobDetails] Job details loaded successfully:', {
        jobTitle: data.job?.title || 'Sans titre',
        clientName: data.client?.name || 'Client non trouvé',
        itemsCount: data.items?.length || 0,
        crewCount: data.workers?.length || 0,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load job details';
      console.error('❌ [useJobDetails] Error loading job details:', err);
      
      // Gestion de l'expiration de session
      if (errorMessage.includes('session') || errorMessage.includes('authentication')) {
        setIsSessionExpired(true);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Chargement initial
  useEffect(() => {
    console.log('🔍 [useJobDetails] useEffect triggered for jobId:', jobId);
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Fonction pour rafraîchir les données
  const refreshJobDetails = useCallback(async () => {
    console.log('🔄 [useJobDetails] Refreshing job details...');
    await fetchJobDetails();
  }, [fetchJobDetails]);

  // Fonction pour mettre à jour le job
  const updateJob = useCallback(async (data: any) => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Updating job...', data);
    setIsUpdating(true);
    setError(null);

    try {
      await updateJobService(jobId, data);
      console.log('✅ [useJobDetails] Job updated successfully');
      await refreshJobDetails(); // Recharger les données après mise à jour
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update job';
      console.error('❌ [useJobDetails] Error updating job:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [jobId, refreshJobDetails]);

  // Fonction pour ajouter une note
  const addNote = useCallback(async (note: { type: string; content: string }) => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Adding note...', note);
    setIsAddingNote(true);
    setError(null);

    try {
      await addJobNoteService(jobId, note);
      console.log('✅ [useJobDetails] Note added successfully');
      await refreshJobDetails(); // Recharger les données après ajout de note
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to add note';
      console.error('❌ [useJobDetails] Error adding note:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsAddingNote(false);
    }
  }, [jobId, refreshJobDetails]);

  // Fonction pour démarrer le job
  const startJob = useCallback(async () => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Starting job...');
    setIsPerformingAction(true);
    setError(null);

    try {
      await startJobService(jobId);
      console.log('✅ [useJobDetails] Job started successfully');
      await refreshJobDetails();
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to start job';
      console.error('❌ [useJobDetails] Error starting job:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsPerformingAction(false);
    }
  }, [jobId, refreshJobDetails]);

  // Fonction pour mettre en pause le job
  const pauseJob = useCallback(async () => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Pausing job...');
    setIsPerformingAction(true);
    setError(null);

    try {
      await pauseJobService(jobId);
      console.log('✅ [useJobDetails] Job paused successfully');
      await refreshJobDetails();
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to pause job';
      console.error('❌ [useJobDetails] Error pausing job:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsPerformingAction(false);
    }
  }, [jobId, refreshJobDetails]);

  // Fonction pour reprendre le job
  const resumeJob = useCallback(async () => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Resuming job...');
    setIsPerformingAction(true);
    setError(null);

    try {
      await resumeJobService(jobId);
      console.log('✅ [useJobDetails] Job resumed successfully');
      await refreshJobDetails();
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to resume job';
      console.error('❌ [useJobDetails] Error resuming job:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsPerformingAction(false);
    }
  }, [jobId, refreshJobDetails]);

  // Fonction pour terminer le job
  const completeJob = useCallback(async (data?: { signature?: string; notes?: string }) => {
    if (!jobId) return false;

    console.log('🔄 [useJobDetails] Completing job...', data);
    setIsPerformingAction(true);
    setError(null);

    try {
      await completeJobService(jobId, data);
      console.log('✅ [useJobDetails] Job completed successfully');
      await refreshJobDetails();
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to complete job';
      console.error('❌ [useJobDetails] Error completing job:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsPerformingAction(false);
    }
  }, [jobId, refreshJobDetails]);

  return {
    jobDetails,
    isLoading,
    error,
    refreshJobDetails,
    updateJob,
    addNote,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    isUpdating,
    isAddingNote,
    isPerformingAction,
    isSessionExpired,
  };
};