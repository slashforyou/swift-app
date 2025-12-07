/**
 * useStripeReports - Hook pour gérer les données et analytics Stripe
 * Fournit les métriques, filtres et exports des rapports de paiements
 */

import { useCallback, useEffect, useState } from 'react';

// Types pour les données de rapports
export interface StripeMetrics {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageAmount: number;
  refundAmount: number;
  pendingAmount: number;
}

export interface TransactionData {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  customerEmail?: string;
  createdAt: Date;
  description?: string;
}

export interface ChartData {
  labels: string[];
  revenues: number[];
  transactions: number[];
}

export interface ReportsData {
  metrics: StripeMetrics;
  transactions: TransactionData[];
  chartData: ChartData;
  lastUpdated: Date;
}

// Interface des filtres (importée depuis ReportsScreen)
export interface ReportsFilters {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  status: 'all' | 'succeeded' | 'pending' | 'failed';
  paymentMethod: 'all' | 'card' | 'bank_transfer' | 'wallet';
  minAmount?: number;
  maxAmount?: number;
}

export const useStripeReports = (filters: ReportsFilters) => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation de données pour le développement
  const generateMockData = useCallback((): ReportsData => {
    const now = new Date();
    const mockTransactions: TransactionData[] = [
      {
        id: 'pi_1234567890',
        amount: 15000, // 150.00€ en centimes
        currency: 'EUR',
        status: 'succeeded',
        paymentMethod: 'card',
        customerEmail: 'client1@example.com',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        description: 'Déménagement - Appartement 3 pièces'
      },
      {
        id: 'pi_0987654321',
        amount: 28500, // 285.00€
        currency: 'EUR',
        status: 'succeeded',
        paymentMethod: 'card',
        customerEmail: 'client2@example.com',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        description: 'Déménagement - Maison 4 pièces'
      },
      {
        id: 'pi_1122334455',
        amount: 9500, // 95.00€
        currency: 'EUR',
        status: 'pending',
        paymentMethod: 'bank_transfer',
        customerEmail: 'client3@example.com',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        description: 'Déménagement - Studio'
      },
      {
        id: 'pi_5566778899',
        amount: 19800, // 198.00€
        currency: 'EUR',
        status: 'failed',
        paymentMethod: 'card',
        customerEmail: 'client4@example.com',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        description: 'Déménagement - Appartement 2 pièces'
      }
    ];

    // Calcul des métriques
    const succeededTransactions = mockTransactions.filter(t => t.status === 'succeeded');
    const totalRevenue = succeededTransactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = mockTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const metrics: StripeMetrics = {
      totalRevenue,
      totalTransactions: mockTransactions.length,
      successRate: (succeededTransactions.length / mockTransactions.length) * 100,
      averageAmount: succeededTransactions.length > 0 ? totalRevenue / succeededTransactions.length : 0,
      refundAmount: 0, // Aucun remboursement dans les données mock
      pendingAmount
    };

    // Données pour les graphiques (7 derniers jours)
    const chartData: ChartData = {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      revenues: [15000, 28500, 0, 9500, 0, 19800, 0],
      transactions: [1, 1, 0, 1, 0, 1, 0]
    };

    return {
      metrics,
      transactions: mockTransactions,
      chartData,
      lastUpdated: now
    };
  }, []);

  // Chargement des données
  const loadReportsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulation API call avec délai
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Remplacer par appel API réel Stripe
      // const response = await stripeAPI.getReports(filters);
      const mockData = generateMockData();
      
      setReportsData(mockData);
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
      setError('Erreur lors du chargement des rapports');
    } finally {
      setIsLoading(false);
    }
  }, [filters, generateMockData]);

  // Rafraîchissement des données
  const refreshReports = useCallback(async () => {
    await loadReportsData();
  }, [loadReportsData]);

  // Export des données
  const exportData = useCallback(async (format: 'csv' | 'pdf') => {
    if (!reportsData) {
      throw new Error('Aucune donnée à exporter');
    }

    // Simulation export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (format === 'csv') {
      // TODO: Générer et télécharger CSV
      console.log('Export CSV:', reportsData.transactions);
    } else {
      // TODO: Générer et télécharger PDF
      console.log('Export PDF:', reportsData);
    }
  }, [reportsData]);

  // Filtrage des transactions selon les critères
  const getFilteredTransactions = useCallback(() => {
    if (!reportsData) return [];

    return reportsData.transactions.filter(transaction => {
      // Filtre par statut
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }

      // Filtre par méthode de paiement
      if (filters.paymentMethod !== 'all') {
        const methodMap = {
          'card': 'card',
          'bank_transfer': 'bank_transfer',
          'wallet': 'wallet'
        };
        if (transaction.paymentMethod !== methodMap[filters.paymentMethod]) {
          return false;
        }
      }

      // Filtre par montant
      if (filters.minAmount && transaction.amount < filters.minAmount * 100) {
        return false;
      }
      if (filters.maxAmount && transaction.amount > filters.maxAmount * 100) {
        return false;
      }

      // TODO: Filtre par période/dates
      
      return true;
    });
  }, [reportsData, filters]);

  // Chargement initial
  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  return {
    reportsData,
    isLoading,
    error,
    refreshReports,
    exportData,
    filteredTransactions: getFilteredTransactions()
  };
};