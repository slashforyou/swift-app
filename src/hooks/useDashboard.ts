/**
 * useDashboard - Hook pour la gestion du dashboard business
 * Version simplifiée avec données mock pour résoudre les erreurs de compilation
 */

import { useCallback, useEffect, useState } from 'react';

interface DashboardStats {
  totalRevenue: number;
  totalJobs: number;
  pendingPayments: number;
  completionRate: number;
  growthRate: number;
  avgJobValue: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: any[];
  upcomingJobs: any[];
  alerts: any[];
  loading: boolean;
  error: string | null;
}

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalRevenue: 0,
      totalJobs: 0,
      pendingPayments: 0,
      completionRate: 0,
      growthRate: 0,
      avgJobValue: 0,
    },
    recentActivity: [],
    upcomingJobs: [],
    alerts: [],
    loading: true,
    error: null,
  });

  const refreshData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock data pour le dashboard
      const mockStats: DashboardStats = {
        totalRevenue: 15750.50,
        totalJobs: 34,
        pendingPayments: 2150.25,
        completionRate: 92.5,
        growthRate: 15.3,
        avgJobValue: 463.25,
      };

      const mockRecentActivity = [
        {
          id: '1',
          type: 'payment',
          title: 'Paiement reçu',
          amount: 450,
          date: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'job',
          title: 'Nouveau job créé',
          client: 'Client ABC',
          date: new Date().toISOString(),
        },
      ];

      const mockUpcomingJobs = [
        {
          id: '1',
          title: 'Rénovation cuisine',
          client: 'Marie Dupont',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
        },
      ];

      setData({
        stats: mockStats,
        recentActivity: mockRecentActivity,
        upcomingJobs: mockUpcomingJobs,
        alerts: [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[useDashboard] Error refreshing data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement du dashboard',
      }));
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    ...data,
    refresh: refreshData,
    isLoading: data.loading,
  };
};

export default useDashboard;