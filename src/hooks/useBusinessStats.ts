/**
 * useBusinessStats - Hook pour les statistiques business avec API réelle
 * Remplace les données mock par de vraies données API
 */

import { useCallback, useEffect, useState } from 'react';
import {
    BusinessCompetitiveAnalysis,
    BusinessOverviewStats,
    BusinessPerformanceMetrics,
    BusinessRegionalStats,
    BusinessTrendData,
    fetchBusinessCompetitiveAnalysis,
    fetchBusinessOverviewStats,
    fetchBusinessPerformanceMetrics,
    fetchBusinessRegionalStats,
    fetchBusinessTrendData,
    refreshBusinessStats
} from '../services/businessStatsService';

// Configuration pour basculer entre mock et API réelle
const USE_MOCK_BUSINESS_STATS = __DEV__; // En dev on peut utiliser les mocks en cas de problème API

// ===========================
// MOCK DATA (fallback)
// ===========================

const mockOverviewStats: BusinessOverviewStats = {
  totalRevenue: 850000,
  monthlyRevenue: 85000,
  averageJobValue: 1250,
  totalJobs: 157,
  activeJobs: 12,
  completedJobs: 145,
  pendingJobs: 8,
  totalEmployees: 8,
  activeEmployees: 7,
  totalVehicles: 5,
  activeVehicles: 4,
  totalContractors: 15,
  monthlyExpenses: 45000,
  netProfit: 40000,
  profitMargin: 47.1,
  revenueGrowth: 12.5,
  jobsGrowth: 8.3
};

const mockPerformanceMetrics: BusinessPerformanceMetrics = {
  averageJobDuration: 4.5,
  onTimeCompletionRate: 94.2,
  customerSatisfaction: 4.7,
  jobsPerEmployee: 18.1,
  revenuePerEmployee: 106250,
  vehicleUtilization: 87.5,
  completionRate: 96.8,
  repeatCustomerRate: 34.5,
  referralRate: 28.3
};

const mockTrendData: BusinessTrendData = {
  period: 'last_30_days',
  data_points: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revenue: Math.floor(Math.random() * 5000) + 2000,
    jobs_completed: Math.floor(Math.random() * 8) + 3,
    jobs_cancelled: Math.floor(Math.random() * 2),
    active_employees: 7 + Math.floor(Math.random() * 2),
    customer_satisfaction: 4.2 + Math.random() * 0.8
  })),
  trends: {
    revenue_trend: 'up',
    jobs_trend: 'up',
    satisfaction_trend: 'stable'
  }
};

const mockRegionalStats: BusinessRegionalStats = {
  regions: [
    {
      region_name: 'Sydney Metro',
      suburb_coverage: ['CBD', 'North Sydney', 'Bondi', 'Parramatta', 'Chatswood'],
      total_jobs: 89,
      total_revenue: 485000,
      average_job_value: 5450,
      market_share: 12.5
    },
    {
      region_name: 'Northern Beaches',
      suburb_coverage: ['Manly', 'Dee Why', 'Mona Vale', 'Avalon'],
      total_jobs: 34,
      total_revenue: 178000,
      average_job_value: 5235,
      market_share: 18.7
    },
    {
      region_name: 'Eastern Suburbs',
      suburb_coverage: ['Bondi Junction', 'Double Bay', 'Paddington', 'Woollahra'],
      total_jobs: 28,
      total_revenue: 165000,
      average_job_value: 5890,
      market_share: 15.2
    }
  ],
  top_suburbs: [
    { suburb_name: 'Bondi Junction', jobs_count: 15, revenue: 89500, growth_rate: 23.4 },
    { suburb_name: 'North Sydney', jobs_count: 12, revenue: 72000, growth_rate: 18.2 },
    { suburb_name: 'Manly', jobs_count: 11, revenue: 68500, growth_rate: 15.7 },
    { suburb_name: 'Chatswood', jobs_count: 9, revenue: 54000, growth_rate: 12.1 },
    { suburb_name: 'Parramatta', jobs_count: 8, revenue: 48000, growth_rate: 9.8 }
  ]
};

const mockCompetitiveAnalysis: BusinessCompetitiveAnalysis = {
  market_position: {
    estimated_rank: 3,
    market_share: 14.2,
    competitive_advantage: ['Excellent customer service', 'Competitive pricing', 'Modern equipment']
  },
  pricing_analysis: {
    average_price_vs_market: 5.2,
    price_competitiveness: 'competitive',
    recommended_adjustments: ['Consider premium services for luxury moves', 'Bundle packing services']
  },
  service_gaps: {
    missing_services: ['International moves', 'Storage solutions', 'Pet relocation'],
    opportunity_score: 76,
    recommended_expansions: ['Partner with storage facility', 'Add pet transport service']
  }
};

// ===========================
// HOOK PRINCIPAL
// ===========================

export interface UseBusinessStatsReturn {
  // Données
  overviewStats: BusinessOverviewStats | null;
  performanceMetrics: BusinessPerformanceMetrics | null;
  trendData: BusinessTrendData | null;
  regionalStats: BusinessRegionalStats | null;
  competitiveAnalysis: BusinessCompetitiveAnalysis | null;
  
  // États de chargement
  isLoadingOverview: boolean;
  isLoadingPerformance: boolean;
  isLoadingTrends: boolean;
  isLoadingRegional: boolean;
  isLoadingCompetitive: boolean;
  isLoadingAny: boolean;
  
  // États d'erreur
  overviewError: string | null;
  performanceError: string | null;
  trendsError: string | null;
  regionalError: string | null;
  competitiveError: string | null;
  
  // Actions
  loadOverviewStats: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  loadTrendData: (period?: 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_12_months') => Promise<void>;
  loadRegionalStats: () => Promise<void>;
  loadCompetitiveAnalysis: () => Promise<void>;
  loadAllStats: () => Promise<void>;
  refreshAllStats: () => Promise<void>;
  clearAllErrors: () => void;
  
  // Métadonnées
  lastUpdated: Date | null;
  isUsingMockData: boolean;
}

export const useBusinessStats = (): UseBusinessStatsReturn => {
  // États des données
  const [overviewStats, setOverviewStats] = useState<BusinessOverviewStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<BusinessPerformanceMetrics | null>(null);
  const [trendData, setTrendData] = useState<BusinessTrendData | null>(null);
  const [regionalStats, setRegionalStats] = useState<BusinessRegionalStats | null>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<BusinessCompetitiveAnalysis | null>(null);
  
  // États de chargement
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingRegional, setIsLoadingRegional] = useState(false);
  const [isLoadingCompetitive, setIsLoadingCompetitive] = useState(false);
  
  // États d'erreur
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [regionalError, setRegionalError] = useState<string | null>(null);
  const [competitiveError, setCompetitiveError] = useState<string | null>(null);
  
  // Métadonnées
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Calculé
  const isLoadingAny = isLoadingOverview || isLoadingPerformance || isLoadingTrends || isLoadingRegional || isLoadingCompetitive;
  
  // ===========================
  // ACTIONS INDIVIDUELLES
  // ===========================
  
  const loadOverviewStats = useCallback(async () => {
    if (isLoadingOverview) return;
    
    setIsLoadingOverview(true);
    setOverviewError(null);
    
    try {
      if (USE_MOCK_BUSINESS_STATS) {
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock overview stats');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setOverviewStats(mockOverviewStats);
      } else {
        const stats = await fetchBusinessOverviewStats();
        setOverviewStats(stats);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error loading overview stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques générales';
      setOverviewError(errorMessage);
      
      if (__DEV__) {
        // Fallback vers les données mock en développement uniquement
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock data as fallback for overview in DEV');
        setOverviewStats(mockOverviewStats);
      } else {
        setOverviewStats(null);
      }
    } finally {
      setIsLoadingOverview(false);
    }
  }, [isLoadingOverview]);
  
  const loadPerformanceMetrics = useCallback(async () => {
    if (isLoadingPerformance) return;
    
    setIsLoadingPerformance(true);
    setPerformanceError(null);
    
    try {
      if (USE_MOCK_BUSINESS_STATS) {
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock performance metrics');
        await new Promise(resolve => setTimeout(resolve, 500));
        setPerformanceMetrics(mockPerformanceMetrics);
      } else {
        const metrics = await fetchBusinessPerformanceMetrics();
        setPerformanceMetrics(metrics);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error loading performance metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des métriques de performance';
      setPerformanceError(errorMessage);
      
      if (__DEV__) {
        // Fallback vers les données mock en développement uniquement
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock data as fallback for performance in DEV');
        setPerformanceMetrics(mockPerformanceMetrics);
      } else {
        setPerformanceMetrics(null);
      }
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [isLoadingPerformance]);
  
  const loadTrendData = useCallback(async (
    period: 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_12_months' = 'last_30_days'
  ) => {
    if (isLoadingTrends) return;
    
    setIsLoadingTrends(true);
    setTrendsError(null);
    
    try {
      if (USE_MOCK_BUSINESS_STATS) {
        // TEMP_DISABLED: console.log(`📊 [BUSINESS STATS] Using mock trend data for period: ${period}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setTrendData({ ...mockTrendData, period });
      } else {
        // TEMP_DISABLED: console.log(`📊 [BUSINESS STATS] Loading real trend data from API for period: ${period}`);
        const trends = await fetchBusinessTrendData(period);
        setTrendData(trends);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error loading trend data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des données de tendance';
      setTrendsError(errorMessage);
      
      if (__DEV__) {
        // Fallback vers les données mock en développement uniquement
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock data as fallback for trends in DEV');
        setTrendData({ ...mockTrendData, period });
      } else {
        // En production, on ne masque pas les erreurs API
        setTrendData(null);
      }
    } finally {
      setIsLoadingTrends(false);
    }
  }, [isLoadingTrends]);
  
  const loadRegionalStats = useCallback(async () => {
    if (isLoadingRegional) return;
    
    setIsLoadingRegional(true);
    setRegionalError(null);
    
    try {
      if (USE_MOCK_BUSINESS_STATS) {
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock regional stats');
        await new Promise(resolve => setTimeout(resolve, 500));
        setRegionalStats(mockRegionalStats);
      } else {
        const regional = await fetchBusinessRegionalStats();
        setRegionalStats(regional);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error loading regional stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques régionales';
      setRegionalError(errorMessage);
      
      if (__DEV__) {
        // Fallback vers les données mock en développement uniquement
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock data as fallback for regional in DEV');
        setRegionalStats(mockRegionalStats);
      } else {
        setRegionalStats(null);
      }
    } finally {
      setIsLoadingRegional(false);
    }
  }, [isLoadingRegional]);
  
  const loadCompetitiveAnalysis = useCallback(async () => {
    if (isLoadingCompetitive) return;
    
    setIsLoadingCompetitive(true);
    setCompetitiveError(null);
    
    try {
      if (USE_MOCK_BUSINESS_STATS) {
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock competitive analysis');
        await new Promise(resolve => setTimeout(resolve, 500));
        setCompetitiveAnalysis(mockCompetitiveAnalysis);
      } else {
        const competitive = await fetchBusinessCompetitiveAnalysis();
        setCompetitiveAnalysis(competitive);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error loading competitive analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'analyse concurrentielle';
      setCompetitiveError(errorMessage);
      
      if (__DEV__) {
        // Fallback vers les données mock en développement uniquement
        // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Using mock data as fallback for competitive in DEV');
        setCompetitiveAnalysis(mockCompetitiveAnalysis);
      } else {
        setCompetitiveAnalysis(null);
      }
    } finally {
      setIsLoadingCompetitive(false);
    }
  }, [isLoadingCompetitive]);
  
  // ===========================
  // ACTIONS GLOBALES
  // ===========================
  
  const loadAllStats = useCallback(async () => {
    // TEMP_DISABLED: console.log('📊 [BUSINESS STATS] Loading all business statistics...');
    await Promise.all([
      loadOverviewStats(),
      loadPerformanceMetrics(),
      loadTrendData(),
      loadRegionalStats(),
      loadCompetitiveAnalysis()
    ]);
    // TEMP_DISABLED: console.log('✅ [BUSINESS STATS] All statistics loaded successfully');
  }, [loadOverviewStats, loadPerformanceMetrics, loadTrendData, loadRegionalStats, loadCompetitiveAnalysis]);
  
  const refreshAllStats = useCallback(async () => {    
    try {
      if (!USE_MOCK_BUSINESS_STATS) {
        // Déclencher le refresh côté backend
        await refreshBusinessStats();
        // TEMP_DISABLED: console.log('✅ [BUSINESS STATS] Backend refresh initiated');
        
        // Attendre un délai pour laisser le backend recalculer
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Recharger toutes les données
      await loadAllStats();
      
    } catch (error) {
      console.error('❌ [BUSINESS STATS] Error during refresh:', error);
      // Continuer avec le rechargement même en cas d'erreur de refresh
      await loadAllStats();
    }
  }, [loadAllStats]);
  
  const clearAllErrors = useCallback(() => {
    setOverviewError(null);
    setPerformanceError(null);
    setTrendsError(null);
    setRegionalError(null);
    setCompetitiveError(null);
  }, []);
  
  // ===========================
  // EFFET INITIAL
  // ===========================
  
  useEffect(() => {
    loadAllStats();
  }, []);
  
  // ===========================
  // RETOUR DU HOOK
  // ===========================
  
  return {
    // Données
    overviewStats,
    performanceMetrics,
    trendData,
    regionalStats,
    competitiveAnalysis,
    
    // États de chargement
    isLoadingOverview,
    isLoadingPerformance,
    isLoadingTrends,
    isLoadingRegional,
    isLoadingCompetitive,
    isLoadingAny,
    
    // États d'erreur
    overviewError,
    performanceError,
    trendsError,
    regionalError,
    competitiveError,
    
    // Actions
    loadOverviewStats,
    loadPerformanceMetrics,
    loadTrendData,
    loadRegionalStats,
    loadCompetitiveAnalysis,
    loadAllStats,
    refreshAllStats,
    clearAllErrors,
    
    // Métadonnées
    lastUpdated,
    isUsingMockData: USE_MOCK_BUSINESS_STATS
  };
};