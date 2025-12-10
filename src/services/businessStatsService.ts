/**
 * BusinessStatsService - Service API pour les statistiques business avec données réelles
 * Utilise la nouvelle architecture api.config.ts pour éliminer les données mock
 */

import { apiConfig } from './api.config';

// ===========================
// TYPES & INTERFACES
// ===========================

export interface BusinessOverviewStats {
  // Métriques principales
  totalRevenue: number;
  monthlyRevenue: number;
  averageJobValue: number;
  
  // Jobs & Operations
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  
  // Ressources
  totalEmployees: number;
  activeEmployees: number;
  totalVehicles: number;
  activeVehicles: number;
  totalContractors: number;
  
  // Métriques financières
  monthlyExpenses: number;
  netProfit: number;
  profitMargin: number;
  
  // Analytics temporels
  revenueGrowth: number; // Pourcentage vs mois précédent
  jobsGrowth: number;    // Pourcentage vs mois précédent
}

export interface BusinessPerformanceMetrics {
  // Efficacité opérationnelle
  averageJobDuration: number;    // En heures
  onTimeCompletionRate: number;  // Pourcentage
  customerSatisfaction: number;  // Note moyenne
  
  // Productivité
  jobsPerEmployee: number;
  revenuePerEmployee: number;
  vehicleUtilization: number;    // Pourcentage d'utilisation
  
  // Qualité de service
  completionRate: number;        // Pourcentage de jobs terminés vs annulés
  repeatCustomerRate: number;    // Pourcentage de clients récurrents
  referralRate: number;          // Pourcentage de nouveaux clients par référence
}

export interface BusinessTrendData {
  period: string;               // 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_12_months'
  data_points: Array<{
    date: string;               // ISO date
    revenue: number;
    jobs_completed: number;
    jobs_cancelled: number;
    active_employees: number;
    customer_satisfaction?: number;
  }>;
  trends: {
    revenue_trend: 'up' | 'down' | 'stable';
    jobs_trend: 'up' | 'down' | 'stable';
    satisfaction_trend: 'up' | 'down' | 'stable';
  };
}

export interface BusinessRegionalStats {
  regions: Array<{
    region_name: string;
    suburb_coverage: string[];
    total_jobs: number;
    total_revenue: number;
    average_job_value: number;
    market_share: number;       // Estimation en pourcentage
  }>;
  top_suburbs: Array<{
    suburb_name: string;
    jobs_count: number;
    revenue: number;
    growth_rate: number;        // Pourcentage vs période précédente
  }>;
}

export interface BusinessCompetitiveAnalysis {
  market_position: {
    estimated_rank: number;     // Position estimée dans le marché local
    market_share: number;       // Pourcentage estimé
    competitive_advantage: string[];
  };
  pricing_analysis: {
    average_price_vs_market: number;  // Pourcentage (+/- par rapport au marché)
    price_competitiveness: 'low' | 'competitive' | 'premium';
    recommended_adjustments: string[];
  };
  service_gaps: {
    missing_services: string[];
    opportunity_score: number;  // Score sur 100
    recommended_expansions: string[];
  };
}

// ===========================
// API ENDPOINTS
// ===========================

/**
 * Récupère les statistiques globales de l'entreprise
 * Endpoint: GET /v1/business/stats/overview
 */
export const fetchBusinessOverviewStats = async (): Promise<BusinessOverviewStats> => {
  try {
    console.log('📊 [BUSINESS STATS] Fetching overview statistics...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/overview', {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid business stats data');
    }

    console.log('✅ [BUSINESS STATS] Overview stats loaded successfully');
    console.log(`📈 [BUSINESS STATS] Monthly revenue: $${data.data.monthlyRevenue}`);
    console.log(`🏢 [BUSINESS STATS] Active jobs: ${data.data.activeJobs}`);
    console.log(`👥 [BUSINESS STATS] Total employees: ${data.data.totalEmployees}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching overview stats:', error);
    throw error;
  }
};

/**
 * Récupère les métriques de performance détaillées
 * Endpoint: GET /v1/business/stats/performance
 */
export const fetchBusinessPerformanceMetrics = async (): Promise<BusinessPerformanceMetrics> => {
  try {
    console.log('📊 [BUSINESS STATS] Fetching performance metrics...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/performance', {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid performance metrics');
    }

    console.log('✅ [BUSINESS STATS] Performance metrics loaded successfully');
    console.log(`⏱️ [BUSINESS STATS] Avg job duration: ${data.data.averageJobDuration}h`);
    console.log(`🎯 [BUSINESS STATS] On-time completion: ${data.data.onTimeCompletionRate}%`);
    console.log(`⭐ [BUSINESS STATS] Customer satisfaction: ${data.data.customerSatisfaction}/5`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching performance metrics:', error);
    throw error;
  }
};

/**
 * Récupère les données de tendance sur une période donnée
 * Endpoint: GET /v1/business/stats/trends
 */
export const fetchBusinessTrendData = async (
  period: 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_12_months' = 'last_30_days'
): Promise<BusinessTrendData> => {
  try {
    console.log(`📊 [BUSINESS STATS] Fetching trend data for period: ${period}...`);
    
    const response = await apiConfig.authenticatedFetch(`/v1/business/stats/trends?period=${period}`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid trend data');
    }

    console.log('✅ [BUSINESS STATS] Trend data loaded successfully');
    console.log(`📈 [BUSINESS STATS] Data points: ${data.data.data_points.length}`);
    console.log(`📊 [BUSINESS STATS] Revenue trend: ${data.data.trends.revenue_trend}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching trend data:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques régionales et géographiques
 * Endpoint: GET /v1/business/stats/regional
 */
export const fetchBusinessRegionalStats = async (): Promise<BusinessRegionalStats> => {
  try {
    console.log('🗺️ [BUSINESS STATS] Fetching regional statistics...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/regional', {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid regional stats');
    }

    console.log('✅ [BUSINESS STATS] Regional stats loaded successfully');
    console.log(`🏘️ [BUSINESS STATS] Regions covered: ${data.data.regions.length}`);
    console.log(`🔝 [BUSINESS STATS] Top suburbs: ${data.data.top_suburbs.length}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching regional stats:', error);
    throw error;
  }
};

/**
 * Récupère l'analyse competitive et de marché
 * Endpoint: GET /v1/business/stats/competitive
 */
export const fetchBusinessCompetitiveAnalysis = async (): Promise<BusinessCompetitiveAnalysis> => {
  try {
    console.log('🏆 [BUSINESS STATS] Fetching competitive analysis...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/competitive', {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid competitive analysis');
    }

    console.log('✅ [BUSINESS STATS] Competitive analysis loaded successfully');
    console.log(`🏆 [BUSINESS STATS] Market rank: #${data.data.market_position.estimated_rank}`);
    console.log(`📊 [BUSINESS STATS] Market share: ${data.data.market_position.market_share}%`);
    console.log(`💰 [BUSINESS STATS] Pricing: ${data.data.pricing_analysis.price_competitiveness}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching competitive analysis:', error);
    throw error;
  }
};

/**
 * Récupère un rapport consolidé complet
 * Endpoint: GET /v1/business/stats/complete-report
 */
export const fetchCompleteBusinessReport = async (
  options: {
    include_trends?: boolean;
    include_regional?: boolean;
    include_competitive?: boolean;
    trend_period?: 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_12_months';
  } = {}
): Promise<{
  overview: BusinessOverviewStats;
  performance: BusinessPerformanceMetrics;
  trends?: BusinessTrendData;
  regional?: BusinessRegionalStats;
  competitive?: BusinessCompetitiveAnalysis;
  generated_at: string;
  report_id: string;
}> => {
  try {
    console.log('📋 [BUSINESS STATS] Fetching complete business report...');
    
    const queryParams = new URLSearchParams();
    if (options.include_trends) queryParams.set('include_trends', 'true');
    if (options.include_regional) queryParams.set('include_regional', 'true');
    if (options.include_competitive) queryParams.set('include_competitive', 'true');
    if (options.trend_period) queryParams.set('trend_period', options.trend_period);
    
    const url = `/v1/business/stats/complete-report${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await apiConfig.authenticatedFetch(url, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid complete report');
    }

    console.log('✅ [BUSINESS STATS] Complete report loaded successfully');
    console.log(`📋 [BUSINESS STATS] Report ID: ${data.data.report_id}`);
    console.log(`⏰ [BUSINESS STATS] Generated: ${data.data.generated_at}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error fetching complete report:', error);
    throw error;
  }
};

/**
 * Exporte les statistiques business au format CSV
 * Endpoint: POST /v1/business/stats/export/csv
 */
export const exportBusinessStatsCSV = async (
  exportConfig: {
    data_types: ('overview' | 'performance' | 'trends' | 'regional' | 'competitive')[];
    date_range?: {
      start_date: string;
      end_date: string;
    };
    include_charts?: boolean;
  }
): Promise<{
  download_url: string;
  file_name: string;
  expires_at: string;
  record_count: number;
}> => {
  try {
    console.log('📄 [BUSINESS STATS] Creating CSV export...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/export/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportConfig)
    });

    const data = await response.json();
    
    if (!data.success || !data.data?.download_url) {
      throw new Error('API returned invalid export data');
    }

    console.log('✅ [BUSINESS STATS] CSV export created successfully');
    console.log(`📄 [BUSINESS STATS] File: ${data.data.file_name}`);
    console.log(`📊 [BUSINESS STATS] Records: ${data.data.record_count}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error creating CSV export:', error);
    throw error;
  }
};

/**
 * Déclenche une mise à jour des statistiques (recalcul côté backend)
 * Endpoint: POST /v1/business/stats/refresh
 */
export const refreshBusinessStats = async (): Promise<{
  refresh_id: string;
  status: 'initiated' | 'completed' | 'failed';
  estimated_completion: string;
}> => {
  try {
    console.log('🔄 [BUSINESS STATS] Triggering stats refresh...');
    
    const response = await apiConfig.authenticatedFetch('/v1/business/stats/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('API returned invalid refresh response');
    }

    console.log('✅ [BUSINESS STATS] Stats refresh initiated successfully');
    console.log(`🆔 [BUSINESS STATS] Refresh ID: ${data.data.refresh_id}`);
    console.log(`⏰ [BUSINESS STATS] Est. completion: ${data.data.estimated_completion}`);
    
    return data.data;
    
  } catch (error) {
    console.error('❌ [BUSINESS STATS] Error triggering stats refresh:', error);
    throw error;
  }
};