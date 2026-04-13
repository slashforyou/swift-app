import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJobs, JobAPI } from '../services/jobs';

export interface WeekDay {
  date: Date;
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  jobs: JobAPI[];
}

interface UseJobsForWeekResult {
  weekDays: WeekDay[];
  isLoading: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
  totalJobs: number;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Get the Monday of the week containing the given date
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useJobsForWeek = (referenceDate: Date): UseJobsForWeekResult => {
  const [jobs, setJobs] = useState<JobAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referenceDateISO = referenceDate.toISOString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const monday = useMemo(() => getMonday(referenceDate), [referenceDateISO]);
  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [monday]);

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedJobs = await fetchJobs(monday, sunday);
      setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error loading week jobs';
      setError(msg);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [monday, sunday]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const weekDays: WeekDay[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const dayNum = date.getDate();
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();

      const dayJobs = jobs.filter((job: any) => {
        const startDate = job.start_window_start || job.time?.startWindowStart;
        if (!startDate) return false;
        const jobDate = new Date(startDate);
        return (
          jobDate.getDate() === dayNum &&
          jobDate.getMonth() + 1 === monthNum &&
          jobDate.getFullYear() === yearNum
        );
      }).filter((j: any) => j.status !== 'cancelled');

      return {
        date,
        day: dayNum,
        month: monthNum,
        year: yearNum,
        isToday:
          dayNum === todayDate &&
          monthNum === todayMonth + 1 &&
          yearNum === todayYear,
        jobs: dayJobs,
      };
    });
  }, [monday, jobs, todayDate, todayMonth, todayYear]);

  const totalJobs = useMemo(() => weekDays.reduce((sum, d) => sum + d.jobs.length, 0), [weekDays]);

  return {
    weekDays,
    isLoading,
    error,
    refreshJobs: loadJobs,
    totalJobs,
    weekStart: monday,
    weekEnd: sunday,
  };
};
