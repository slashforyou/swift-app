// hooks/useJobsForYear.ts
import { useState, useEffect } from 'react';
import { fetchJobs, JobAPI } from '../services/jobs';

interface JobsByMonth {
  [key: number]: JobAPI[]; // key = month number (1-12)
}

interface UseJobsForYearResult {
  jobsByMonth: JobsByMonth;
  totalJobs: number;
  isLoading: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
}

export const useJobsForYear = (year: number): UseJobsForYearResult => {
  const [jobsByMonth, setJobsByMonth] = useState<JobsByMonth>({});
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startDate = new Date(year, 0, 1); // 1er janvier
      const endDate = new Date(year, 11, 31); // 31 décembre
      
      
      const fetchedJobs = await fetchJobs(startDate, endDate);
      
      if (!fetchedJobs || !Array.isArray(fetchedJobs)) {
        setJobsByMonth({});
        setTotalJobs(0);
        return;
      }

      // L'API calendar-days retourne déjà les jobs filtrés par période
      // Regrouper par mois (1-12)
      const groupedByMonth: JobsByMonth = {};
      let totalCount = 0;

      fetchedJobs.forEach(job => {
        const jobDate = new Date(job.time.startWindowStart);
        const month = jobDate.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
        
        if (!groupedByMonth[month]) {
          groupedByMonth[month] = [];
        }
        
        groupedByMonth[month].push(job);
        totalCount++;
      });

      
      setJobsByMonth(groupedByMonth);
      setTotalJobs(totalCount);

    } catch (err) {

      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des jobs de l\'année';
      console.error('❌ Error loading year jobs:', err);
      setError(errorMessage);
      setJobsByMonth({});
      setTotalJobs(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = async () => {
    await loadJobs();
  };

  useEffect(() => {
    if (year && year > 2000 && year < 3000) { // Sanity check
      loadJobs();
    } else {
      setError('Année invalide');
    }
  }, [year]);

  return {
    jobsByMonth,
    totalJobs,
    isLoading,
    error,
    refreshJobs
  };
};
