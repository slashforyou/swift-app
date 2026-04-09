/**
 * useBusinessStats - Hook pour les statistiques business avec API réelle
 */

import { useCallback, useEffect, useState } from "react";
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
    refreshBusinessStats,
} from "../services/businessStatsService";

// ===========================
// HOOK TYPES
// ===========================
// HOOK TYPES
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
  loadTrendData: (
    period?:
      | "last_7_days"
      | "last_30_days"
      | "last_3_months"
      | "last_12_months",
  ) => Promise<void>;
  loadRegionalStats: () => Promise<void>;
  loadCompetitiveAnalysis: () => Promise<void>;
  loadAllStats: () => Promise<void>;
  refreshAllStats: () => Promise<void>;
  clearAllErrors: () => void;

  // Métadonnées
  lastUpdated: Date | null;
}

export const useBusinessStats = (): UseBusinessStatsReturn => {
  // États des données
  const [overviewStats, setOverviewStats] =
    useState<BusinessOverviewStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<BusinessPerformanceMetrics | null>(null);
  const [trendData, setTrendData] = useState<BusinessTrendData | null>(null);
  const [regionalStats, setRegionalStats] =
    useState<BusinessRegionalStats | null>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] =
    useState<BusinessCompetitiveAnalysis | null>(null);

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
  const isLoadingAny =
    isLoadingOverview ||
    isLoadingPerformance ||
    isLoadingTrends ||
    isLoadingRegional ||
    isLoadingCompetitive;

  // ===========================
  // ACTIONS INDIVIDUELLES
  // ===========================

  const loadOverviewStats = useCallback(async () => {
    if (isLoadingOverview) return;

    setIsLoadingOverview(true);
    setOverviewError(null);

    try {
      const stats = await fetchBusinessOverviewStats();
      setOverviewStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ [BUSINESS STATS] Error loading overview stats:", error);
      setOverviewError(
        error instanceof Error ? error.message : "Error loading overview stats"
      );
    } finally {
      setIsLoadingOverview(false);
    }
  }, [isLoadingOverview]);

  const loadPerformanceMetrics = useCallback(async () => {
    if (isLoadingPerformance) return;

    setIsLoadingPerformance(true);
    setPerformanceError(null);

    try {
      const metrics = await fetchBusinessPerformanceMetrics();
      setPerformanceMetrics(metrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ [BUSINESS STATS] Error loading performance metrics:", error);
      setPerformanceError(
        error instanceof Error ? error.message : "Error loading performance metrics"
      );
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [isLoadingPerformance]);

  const loadTrendData = useCallback(
    async (
      period:
        | "last_7_days"
        | "last_30_days"
        | "last_3_months"
        | "last_12_months" = "last_30_days",
    ) => {
      if (isLoadingTrends) return;

      setIsLoadingTrends(true);
      setTrendsError(null);

      try {
        const trends = await fetchBusinessTrendData(period);
        setTrendData(trends);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("❌ [BUSINESS STATS] Error loading trend data:", error);
        setTrendsError(
          error instanceof Error ? error.message : "Error loading trend data"
        );
      } finally {
        setIsLoadingTrends(false);
      }
    },
    [isLoadingTrends],
  );

  const loadRegionalStats = useCallback(async () => {
    if (isLoadingRegional) return;

    setIsLoadingRegional(true);
    setRegionalError(null);

    try {
      const regional = await fetchBusinessRegionalStats();
      setRegionalStats(regional);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ [BUSINESS STATS] Error loading regional stats:", error);
      setRegionalError(
        error instanceof Error ? error.message : "Error loading regional stats"
      );
    } finally {
      setIsLoadingRegional(false);
    }
  }, [isLoadingRegional]);

  const loadCompetitiveAnalysis = useCallback(async () => {
    if (isLoadingCompetitive) return;

    setIsLoadingCompetitive(true);
    setCompetitiveError(null);

    try {
      const competitive = await fetchBusinessCompetitiveAnalysis();
      setCompetitiveAnalysis(competitive);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ [BUSINESS STATS] Error loading competitive analysis:", error);
      setCompetitiveError(
        error instanceof Error ? error.message : "Error loading competitive analysis"
      );
    } finally {
      setIsLoadingCompetitive(false);
    }
  }, [isLoadingCompetitive]);

  // ===========================
  // ACTIONS GLOBALES
  // ===========================

  const loadAllStats = useCallback(async () => {
    await Promise.all([
      loadOverviewStats(),
      loadPerformanceMetrics(),
      loadTrendData(),
      loadRegionalStats(),
      loadCompetitiveAnalysis(),
    ]);
  }, [
    loadOverviewStats,
    loadPerformanceMetrics,
    loadTrendData,
    loadRegionalStats,
    loadCompetitiveAnalysis,
  ]);

  const refreshAllStats = useCallback(async () => {
    try {
      await refreshBusinessStats();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadAllStats();
    } catch (error) {
      console.error("❌ [BUSINESS STATS] Error during refresh:", error);
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
  };
};
