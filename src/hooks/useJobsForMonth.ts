// hooks/useJobsForMonth.ts
import { useEffect, useState } from 'react';
import { fetchJobs, JobAPI } from '../services/jobs';
import { isSessionDead } from '../utils/auth';

interface UseJobsForMonthResult {
  jobs: JobAPI[];
  isLoading: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
}

export const useJobsForMonth = (year: number, month: number): UseJobsForMonthResult => {
  const [jobs, setJobs] = useState<JobAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    if (isSessionDead()) return;
    try {
      setIsLoading(true);
      setError(null);
      
      // Délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Format dates pour le mois demandé
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Dernier jour du mois
      
      
      const fetchedJobs = await fetchJobs(startDate, endDate);
      
      // 🔍 DIAGNOSTIC: Analyser ce qu'on a reçu
      
      if (!fetchedJobs || !Array.isArray(fetchedJobs)) {
        setJobs([]);
        return;
      }

      // L'API calendar-days retourne déjà les jobs filtrés par période
      if (!fetchedJobs || !Array.isArray(fetchedJobs)) {
        setJobs([]);
        return;
      }

      setJobs(fetchedJobs);

    } catch (err) {

      let errorMessage = 'Erreur lors du chargement des jobs du mois';
      
      if (err instanceof Error) {
        console.error('❌ Error loading month jobs:', err);
        
        if (err.message === 'SESSION_EXPIRED' || err.message.includes('401') || err.message.includes('403')) {
          // Session expired — already navigated away by auth layer, ignore silently
          return;
        } else if (err.message.includes('IP_BLOCKED')) {
          errorMessage = '🚫 Accès temporairement bloqué. Réessayez plus tard.';
        } else if (err.message.includes('Network')) {
          errorMessage = '📡 Problème de connexion réseau.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setJobs([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = async () => {
    await loadJobs();
  };

  useEffect(() => {
    
    if (year && month && month >= 1 && month <= 12) {
      loadJobs();
    } else {
      setError('Année ou mois invalide');
    }
  }, [year, month]);

  return {
    jobs,
    isLoading,
    error,
    refreshJobs
  };
};
