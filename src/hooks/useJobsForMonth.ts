// hooks/useJobsForMonth.ts
import { useState, useEffect } from 'react';
import { fetchJobs, JobAPI } from '../services/jobs';

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
    try {
      setIsLoading(true);
      setError(null);
      
      // Délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Format dates pour le mois demandé
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Dernier jour du mois
      
      console.log(`📅 Fetching jobs for ${month}/${year} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
      
      const fetchedJobs = await fetchJobs(startDate, endDate);
      
      // 🔍 DIAGNOSTIC: Analyser ce qu'on a reçu
      console.log('🔍 [useJobsForMonth] fetchedJobs type:', typeof fetchedJobs);
      console.log('🔍 [useJobsForMonth] fetchedJobs is array:', Array.isArray(fetchedJobs));
      console.log('🔍 [useJobsForMonth] fetchedJobs length:', fetchedJobs?.length);
      console.log('🔍 [useJobsForMonth] fetchedJobs content:', JSON.stringify(fetchedJobs, null, 2));
      
      if (!fetchedJobs || !Array.isArray(fetchedJobs)) {
        console.warn('⚠️ Jobs API returned invalid data:', fetchedJobs);
        setJobs([]);
        return;
      }

      // L'API calendar-days retourne déjà les jobs filtrés par période
      if (!fetchedJobs || !Array.isArray(fetchedJobs)) {
        console.warn('⚠️ Calendar API returned invalid data:', fetchedJobs);
        setJobs([]);
        return;
      }

      console.log(`✅ Found ${fetchedJobs.length} jobs for ${month}/${year}`);
      console.log('🔍 Jobs data:', JSON.stringify(fetchedJobs, null, 2));
      setJobs(fetchedJobs);

    } catch (err) {
      let errorMessage = 'Erreur lors du chargement des jobs du mois';
      
      if (err instanceof Error) {
        console.error('❌ Error loading month jobs:', err);
        
        if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = '🔐 Session expirée. Tentative de reconnexion...';
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
    console.log('🔍 [useJobsForMonth] useEffect triggered with:', { year, month });
    
    if (year && month && month >= 1 && month <= 12) {
      console.log('🔍 [useJobsForMonth] Valid parameters, loading jobs...');
      loadJobs();
    } else {
      console.warn('⚠️ Invalid year or month:', { year, month });
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