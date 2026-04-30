import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
    getRevenueDashboard,
    RevenueDashboard,
} from "../services/revenueDashboardService";

type Period = "week" | "month" | "year";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

interface Props {
  route?: any;
  navigation: any;
}

export default function RevenueDashboardScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const d = await getRevenueDashboard(period);
      setData(d);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const formatAmount = (n: number) => `$${n.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}`;

  // Bar chart: find max value
  const barData = data?.chart_data ?? [];
  const maxVal = Math.max(...barData.map((b) => b.value), 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("revenue.title") ?? "💰 Revenus"}
        </Text>
      </View>

      {/* Period picker */}
      <View style={{ flexDirection: "row", paddingHorizontal: DESIGN_TOKENS.spacing.lg, paddingVertical: DESIGN_TOKENS.spacing.sm, gap: 8 }}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
              backgroundColor: period === p.key ? colors.primary : colors.backgroundSecondary,
              borderWidth: 1, borderColor: period === p.key ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: period === p.key ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !data ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable onPress={load} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {/* KPI cards */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg, padding: DESIGN_TOKENS.spacing.md, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                  {t("revenue.kpiTotal") ?? "CA Total"}
                </Text>
                <Text style={{ color: "#38A169", fontSize: 24, fontWeight: "800" }}>
                  {formatAmount(data.total_revenue)}
                </Text>
                {data.growth_percent !== undefined && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Ionicons
                      name={data.growth_percent >= 0 ? "trending-up" : "trending-down"}
                      size={14}
                      color={data.growth_percent >= 0 ? "#38A169" : "#E53E3E"}
                    />
                    <Text style={{ color: data.growth_percent >= 0 ? "#38A169" : "#E53E3E", fontWeight: "700", fontSize: 13 }}>
                      {data.growth_percent >= 0 ? "+" : ""}{data.growth_percent.toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg, padding: DESIGN_TOKENS.spacing.md, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                  {t("revenue.kpiJobs") ?? "Nb Jobs"}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "800" }}>
                  {data.total_jobs}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg, padding: DESIGN_TOKENS.spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                {t("revenue.kpiAvg") ?? "Valeur moyenne / job"}
              </Text>
              <Text style={{ color: "#D69E2E", fontSize: 22, fontWeight: "800" }}>
                {data.total_jobs > 0 ? formatAmount(Math.round(data.total_revenue / data.total_jobs)) : "$0"}
              </Text>
            </View>
          </View>

          {/* Bar chart */}
          {barData.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                {t("revenue.chart") ?? "Évolution"}
              </Text>
              <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg, padding: DESIGN_TOKENS.spacing.md, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 }}>
                  {barData.map((bar, idx) => {
                    const pct = maxVal > 0 ? bar.value / maxVal : 0;
                    return (
                      <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                        <View
                          style={{
                            width: "100%",
                            height: Math.max(4, Math.round(pct * 100)),
                            backgroundColor: colors.primary,
                            borderRadius: 3,
                            opacity: 0.8 + idx * 0.05,
                          }}
                        />
                        <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 4 }} numberOfLines={1}>
                          {bar.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Top clients */}
          {data.top_clients && data.top_clients.length > 0 && (
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                {t("revenue.topClients") ?? "Top clients"}
              </Text>
              {data.top_clients.slice(0, 3).map((client, idx) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      padding: DESIGN_TOKENS.spacing.md,
                      marginBottom: DESIGN_TOKENS.spacing.sm,
                      borderWidth: 1, borderColor: colors.border,
                      flexDirection: "row", alignItems: "center", gap: 12,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{medals[idx] ?? "·"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>{client.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{client.jobs_count} job{client.jobs_count !== 1 ? "s" : ""}</Text>
                    </View>
                    <Text style={{ fontWeight: "800", color: "#38A169", fontSize: 15 }}>{formatAmount(client.total)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
