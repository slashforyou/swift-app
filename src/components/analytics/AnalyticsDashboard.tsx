/**
 * Analytics Dashboard Component - Dashboard temps réel pour monitoring
 */

import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useTranslation } from "../../localization";
import {
    getBusinessMetrics,
    getStripeAnalytics,
    getUsageAnalytics,
} from "../../services/analytics";

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
  paywallFunnel: {
    locks_clicked: number;
    upgrade_cta_clicked: number;
    conversion_rate: number;
    breakdown: { source: string; locks: number; cta: number }[];
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { track } = useAnalytics("analytics_dashboard");

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"24h" | "7d" | "30d">(
    "24h",
  );

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const extractEventCount = (usagePayload: any, eventName: string): number => {
    const candidates = [
      usagePayload?.events?.by_type,
      usagePayload?.events?.event_types,
      usagePayload?.event_types,
      usagePayload?.custom_events,
      usagePayload?.summary?.events,
      usagePayload?.data?.events,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === "object") {
        const raw = candidate[eventName];
        if (typeof raw === "number") return raw;
        if (raw && typeof raw.count === "number") return raw.count;
        if (raw && typeof raw.total === "number") return raw.total;
      }
    }

    return 0;
  };

  const extractPaywallFunnel = (usagePayload: any) => {
    const locks = extractEventCount(usagePayload, "paywall_lock_clicked");
    const cta = extractEventCount(usagePayload, "paywall_upgrade_cta_clicked");

    // Try to extract per-source breakdown from event_data arrays
    const breakdownMap: Record<string, { locks: number; cta: number }> = {};
    const tryExtractBreakdown = (candidate: any, eventKey: string, field: "locks" | "cta") => {
      if (!candidate || typeof candidate !== "object") return;
      // Some backends return events as arrays: [{event_type, source, count}, ...]
      const list = Array.isArray(candidate) ? candidate : candidate[eventKey];
      if (!Array.isArray(list)) return;
      list.forEach((item: any) => {
        const src: string = item?.source || item?.event_data?.source || "other";
        if (!breakdownMap[src]) breakdownMap[src] = { locks: 0, cta: 0 };
        breakdownMap[src][field] += item?.count || item?.total || 1;
      });
    };

    tryExtractBreakdown(usagePayload?.events?.details, "paywall_lock_clicked", "locks");
    tryExtractBreakdown(usagePayload?.events?.details, "paywall_upgrade_cta_clicked", "cta");

    // If no breakdown returned by API, group total under "total" bucket
    const breakdown = Object.keys(breakdownMap).length
      ? Object.entries(breakdownMap)
          .map(([source, v]) => ({ source, locks: v.locks, cta: v.cta }))
          .sort((a, b) => b.locks - a.locks)
      : locks > 0
        ? [{ source: "total", locks, cta }]
        : [];

    return {
      locks_clicked: locks,
      upgrade_cta_clicked: cta,
      conversion_rate: locks > 0 ? cta / locks : 0,
      breakdown,
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      track.userAction("dashboard_load_started", { period: selectedPeriod }); // Paralléliser les appels API
      const [businessData, usageData, stripeData] = await Promise.allSettled([
        getBusinessMetrics(selectedPeriod),
        getUsageAnalytics(selectedPeriod),
        getStripeAnalytics("", selectedPeriod), // Empty company ID to get global stats
      ]);

      // Agréger les données
      const aggregatedMetrics: DashboardMetrics = {
        jobs: {
          total:
            businessData.status === "fulfilled"
              ? businessData.value?.jobs?.total || 0
              : 0,
          completed:
            businessData.status === "fulfilled"
              ? businessData.value?.jobs?.completed || 0
              : 0,
          inProgress:
            businessData.status === "fulfilled"
              ? businessData.value?.jobs?.in_progress || 0
              : 0,
          success_rate:
            businessData.status === "fulfilled"
              ? businessData.value?.jobs?.success_rate || 0
              : 0,
        },
        payments: {
          total_amount:
            stripeData.status === "fulfilled"
              ? stripeData.value?.data?.metrics?.total_revenue || 0
              : 0,
          total_transactions:
            stripeData.status === "fulfilled"
              ? stripeData.value?.data?.metrics?.total_transactions || 0
              : 0,
          success_rate:
            stripeData.status === "fulfilled"
              ? stripeData.value?.data?.metrics?.success_rate || 0
              : 0,
          failed_transactions:
            stripeData.status === "fulfilled"
              ? stripeData.value?.data?.metrics?.failed_transactions || 0
              : 0,
        },
        users: {
          active_users:
            usageData.status === "fulfilled"
              ? usageData.value?.users?.active || 0
              : 0,
          total_sessions:
            usageData.status === "fulfilled"
              ? usageData.value?.users?.sessions || 0
              : 0,
          avg_session_duration:
            usageData.status === "fulfilled"
              ? usageData.value?.users?.avg_session_duration || 0
              : 0,
        },
        performance: {
          avg_api_response:
            usageData.status === "fulfilled"
              ? usageData.value?.performance?.avg_response_time || 0
              : 0,
          error_rate:
            usageData.status === "fulfilled"
              ? usageData.value?.performance?.error_rate || 0
              : 0,
          uptime:
            usageData.status === "fulfilled"
              ? usageData.value?.performance?.uptime || 0
              : 0,
        },
        paywallFunnel:
          usageData.status === "fulfilled"
            ? extractPaywallFunnel(usageData.value)
            : {
                locks_clicked: 0,
                upgrade_cta_clicked: 0,
                conversion_rate: 0,
                breakdown: [],
              },
      };

      setMetrics(aggregatedMetrics);
      track.businessEvent("dashboard_loaded", {
        period: selectedPeriod,
        success: true,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      track.error("api_error", `Dashboard load failed: ${error}`, {
        period: selectedPeriod,
      });
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

  const MetricCard = ({
    title,
    value,
    subtitle,
    color = colors.primary,
    icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon?: string;
  }) => (
    <View
      style={[
        styles.metricCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <View style={styles.metricHeader}>
        <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
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
      fontWeight: "700",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    periodSelector: {
      flexDirection: "row",
      marginVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
      alignItems: "center",
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonInactive: {
      backgroundColor: colors.backgroundSecondary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: "600",
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
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    metricsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    metricTitle: {
      fontSize: 12,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    metricSubtitle: {
      fontSize: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
        <Text style={styles.loadingText}>{t("analytics.loadingMetrics")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("analytics.title")}</Text>
        <Text style={styles.subtitle}>{t("analytics.subtitle")}</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(["24h", "7d", "30d"] as const).map((period) => (
          <Text
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period
                ? styles.periodButtonActive
                : styles.periodButtonInactive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period
                  ? styles.periodButtonTextActive
                  : styles.periodButtonTextInactive,
              ]}
            >
              {period === "24h"
                ? t("analytics.period24h")
                : period === "7d"
                  ? t("analytics.period7d")
                  : t("analytics.period30d")}
            </Text>
          </Text>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Jobs Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("analytics.jobsProgression")}
          </Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.totalJobs")}
              value={metrics?.jobs?.total || 0}
              subtitle={t("analytics.created")}
              color={colors.primary}
            />
            <MetricCard
              title={t("analytics.completedLabel")}
              value={metrics?.jobs?.completed || 0}
              subtitle={formatPercentage(metrics?.jobs?.success_rate || 0)}
              color={colors.success}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.inProgress")}
              value={metrics?.jobs?.inProgress || 0}
              subtitle={t("analytics.active")}
              color={colors.warning}
            />
          </View>
        </View>

        {/* Payments Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("analytics.stripePayments")}
          </Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.revenue")}
              value={formatCurrency(metrics?.payments?.total_amount || 0)}
              subtitle={t("analytics.aud")}
              color={colors.success}
            />
            <MetricCard
              title={t("analytics.transactions")}
              value={metrics?.payments?.total_transactions || 0}
              subtitle={formatPercentage(metrics?.payments?.success_rate || 0)}
              color={colors.primary}
            />
          </View>
        </View>

        {/* User Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("analytics.usersEngagement")}
          </Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.activeUsers")}
              value={metrics?.users?.active_users || 0}
              subtitle={t("analytics.period")}
              color={colors.primary}
            />
            <MetricCard
              title={t("analytics.sessions")}
              value={metrics?.users?.total_sessions || 0}
              subtitle={`${Math.round((metrics?.users?.avg_session_duration || 0) / 60)}min moy.`}
              color={colors.secondary}
            />
          </View>
        </View>

        {/* Paywall Funnel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("analytics.paywallFunnelTitle") || "Paywall Funnel"}
          </Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.paywallLocksClicked") || "Locks hit"}
              value={metrics?.paywallFunnel?.locks_clicked || 0}
              subtitle={t("analytics.paywallLocksSubtitle") || "Users who hit a locked feature"}
              color={colors.warning}
            />
            <MetricCard
              title={t("analytics.paywallUpgradeCta") || "Upgrade CTA"}
              value={metrics?.paywallFunnel?.upgrade_cta_clicked || 0}
              subtitle={t("analytics.paywallUpgradeSubtitle") || "Clicks toward subscription"}
              color={colors.primary}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.paywallConversion") || "Funnel conversion"}
              value={formatPercentage(metrics?.paywallFunnel?.conversion_rate || 0)}
              subtitle={t("analytics.paywallConversionSubtitle") || "CTA clicks / lock hits"}
              color={colors.success}
            />
          </View>

          {/* Breakdown par source */}
          {(metrics?.paywallFunnel?.breakdown ?? []).length > 0 && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: DESIGN_TOKENS.spacing.md,
                marginTop: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: 13, marginBottom: DESIGN_TOKENS.spacing.sm },
                ]}
              >
                {t("analytics.paywallBreakdownTitle") || "By entry point"}
              </Text>

              {/* Header row */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingBottom: 4,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  Source
                </Text>
                <Text
                  style={{
                    width: 48,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.warning,
                    textTransform: "uppercase",
                  }}
                >
                  Locks
                </Text>
                <Text
                  style={{
                    width: 48,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.primary,
                    textTransform: "uppercase",
                  }}
                >
                  CTA
                </Text>
                <Text
                  style={{
                    width: 56,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.success,
                    textTransform: "uppercase",
                  }}
                >
                  Conv.
                </Text>
              </View>

              {(metrics?.paywallFunnel?.breakdown ?? []).map((row) => {
                const conv = row.locks > 0 ? ((row.cta / row.locks) * 100).toFixed(0) : "–";
                const labelMap: Record<string, string> = {
                  business_hub_shortcut: "Hub shortcut",
                  business_finances_billing_lock: "Billing lock",
                  business_finances_invoices_lock: "Invoices lock",
                  settings_plan_access: "Settings",
                  settings_plan_access_alert: "Settings alert",
                  total: "Total",
                };
                const label = labelMap[row.source] || row.source;

                return (
                  <View
                    key={row.source}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 5,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      style={{ flex: 1, fontSize: 12, color: colors.text }}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        width: 48,
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 13,
                        color: colors.warning,
                      }}
                    >
                      {row.locks}
                    </Text>
                    <Text
                      style={{
                        width: 48,
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 13,
                        color: colors.primary,
                      }}
                    >
                      {row.cta}
                    </Text>
                    <Text
                      style={{
                        width: 56,
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 13,
                        color: colors.success,
                      }}
                    >
                      {conv}{row.locks > 0 ? "%" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("analytics.systemPerformance")}
          </Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.apiResponse")}
              value={`${metrics?.performance?.avg_api_response || 0}ms`}
              subtitle={t("analytics.average")}
              color={colors.primary}
            />
            <MetricCard
              title={t("analytics.uptime")}
              value={formatPercentage(metrics?.performance?.uptime || 0)}
              subtitle={t("analytics.availability")}
              color={colors.success}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title={t("analytics.errorRate")}
              value={formatPercentage(metrics?.performance?.error_rate || 0)}
              subtitle={t("analytics.apiErrors")}
              color={colors.error}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AnalyticsDashboard;
