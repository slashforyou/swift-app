/**
 * Analytics Dashboard Component - Dashboard temps réel pour monitoring
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getBusinessMetrics, getStripeAnalytics, getUsageAnalytics } from '../../services/analytics';

interface DashboardMetrics {
  jobs: {
    total: number;
    completed: number;
    inProgress: number;
    success_rate: number;
  };
  payments: {
    total_amount: number;
    total_transactions: number;
    success_rate: number;
    failed_transactions: number;
  };
  users: {
    active_users: number;
    total_sessions: number;
    avg_session_duration: number;
  };
  performance: {
    avg_api_response: number;
    error_rate: number;
    uptime: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { colors } = useTheme();
  const { track } = useAnalytics('analytics_dashboard');
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      track.userAction('dashboard_load_started', { period: selectedPeriod });// Paralléliser les appels API
      const [businessData, usageData, stripeData] = await Promise.allSettled([
        getBusinessMetrics(selectedPeriod),
        getUsageAnalytics(selectedPeriod),
        getStripeAnalytics('', selectedPeriod) // Empty company ID to get global stats
      ]);

      // Agréger les données
      const aggregatedMetrics: DashboardMetrics = {
        jobs: {
          total: businessData.status === 'fulfilled' ? businessData.value?.jobs?.total || 0 : 0,
          completed: businessData.status === 'fulfilled' ? businessData.value?.jobs?.completed || 0 : 0,
          inProgress: businessData.status === 'fulfilled' ? businessData.value?.jobs?.in_progress || 0 : 0,
          success_rate: businessData.status === 'fulfilled' ? businessData.value?.jobs?.success_rate || 0 : 0,
        },
        payments: {
          total_amount: stripeData.status === 'fulfilled' ? stripeData.value?.data?.metrics?.total_revenue || 0 : 0,
          total_transactions: stripeData.status === 'fulfilled' ? stripeData.value?.data?.metrics?.total_transactions || 0 : 0,
          success_rate: stripeData.status === 'fulfilled' ? stripeData.value?.data?.metrics?.success_rate || 0 : 0,
          failed_transactions: stripeData.status === 'fulfilled' ? stripeData.value?.data?.metrics?.failed_transactions || 0 : 0,
        },
        users: {
          active_users: usageData.status === 'fulfilled' ? usageData.value?.users?.active || 0 : 0,
          total_sessions: usageData.status === 'fulfilled' ? usageData.value?.users?.sessions || 0 : 0,
          avg_session_duration: usageData.status === 'fulfilled' ? usageData.value?.users?.avg_session_duration || 0 : 0,
        },
        performance: {
          avg_api_response: usageData.status === 'fulfilled' ? usageData.value?.performance?.avg_response_time || 0 : 0,
          error_rate: usageData.status === 'fulfilled' ? usageData.value?.performance?.error_rate || 0 : 0,
          uptime: usageData.status === 'fulfilled' ? usageData.value?.performance?.uptime || 0 : 0,
        }
      };

      setMetrics(aggregatedMetrics);
      track.businessEvent('dashboard_loaded', { period: selectedPeriod, success: true });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      track.error('api_error', `Dashboard load failed: ${error}`, { period: selectedPeriod });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const MetricCard = ({ title, value, subtitle, color = colors.primary, icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon?: string;
  }) => (
    <View style={[styles.metricCard, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.metricHeader}>
        <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    periodSelector: {
      flexDirection: 'row',
      marginVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonInactive: {
      backgroundColor: colors.backgroundSecondary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    periodButtonTextActive: {
      color: colors.background,
    },
    periodButtonTextInactive: {
      color: colors.textSecondary,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    section: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    metricCard: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    metricTitle: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    metricSubtitle: {
      fontSize: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: DESIGN_TOKENS.spacing.md,
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

  if (loading && !metrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des métriques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Analytics</Text>
        <Text style={styles.subtitle}>Monitoring en temps réel</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['24h', '7d', '30d'] as const).map((period) => (
          <Text
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period ? styles.periodButtonActive : styles.periodButtonInactive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period ? styles.periodButtonTextActive : styles.periodButtonTextInactive,
            ]}>
              {period === '24h' ? '24h' : period === '7d' ? '7 jours' : '30 jours'}
            </Text>
          </Text>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Jobs Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jobs & Progression</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Total Jobs"
              value={metrics?.jobs?.total || 0}
              subtitle="Créés"
              color={colors.primary}
            />
            <MetricCard
              title="Complétés"
              value={metrics?.jobs?.completed || 0}
              subtitle={formatPercentage(metrics?.jobs?.success_rate || 0)}
              color={colors.success}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="En Cours"
              value={metrics?.jobs?.inProgress || 0}
              subtitle="Actifs"
              color={colors.warning}
            />
          </View>
        </View>

        {/* Payments Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiements Stripe</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Revenus"
              value={formatCurrency(metrics?.payments?.total_amount || 0)}
              subtitle="AUD"
              color={colors.success}
            />
            <MetricCard
              title="Transactions"
              value={metrics?.payments?.total_transactions || 0}
              subtitle={formatPercentage(metrics?.payments?.success_rate || 0)}
              color={colors.primary}
            />
          </View>
        </View>

        {/* User Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateurs & Engagement</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Utilisateurs Actifs"
              value={metrics?.users?.active_users || 0}
              subtitle="Période"
              color={colors.primary}
            />
            <MetricCard
              title="Sessions"
              value={metrics?.users?.total_sessions || 0}
              subtitle={`${Math.round((metrics?.users?.avg_session_duration || 0) / 60)}min moy.`}
              color={colors.secondary}
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Système</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title="API Response"
              value={`${metrics?.performance?.avg_api_response || 0}ms`}
              subtitle="Moyenne"
              color={colors.primary}
            />
            <MetricCard
              title="Uptime"
              value={formatPercentage(metrics?.performance?.uptime || 0)}
              subtitle="Disponibilité"
              color={colors.success}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Taux d'Erreur"
              value={formatPercentage(metrics?.performance?.error_rate || 0)}
              subtitle="API Errors"
              color={colors.error}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AnalyticsDashboard;