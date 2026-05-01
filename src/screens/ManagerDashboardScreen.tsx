/**
 * ManagerDashboardScreen
 * Vue superviseur : KPIs journaliers, jobs de l'équipe, membres actifs
 */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { analytics } from "../services/analytics";
import {
    fetchManagerDashboard,
    type ManagerDashboardData,
    type ManagerJobEntry,
} from "../services/managerDashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getStatusColor(status: string, primary: string): string {
  switch (status) {
    case "completed": return "#27AE60";
    case "in_progress": return primary;
    case "assigned": return "#F39C12";
    case "cancelled": return "#E74C3C";
    default: return "#95A5A6";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed": return "Terminé";
    case "in_progress": return "En cours";
    case "assigned": return "Assigné";
    case "pending": return "En attente";
    case "cancelled": return "Annulé";
    default: return status;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color, colors }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      minWidth: 0,
    }}
  >
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: color + "22",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{value}</Text>
    <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 2 }}>{label}</Text>
  </View>
);

interface JobRowProps {
  job: ManagerJobEntry;
  colors: ReturnType<typeof useTheme>["colors"];
  primary: string;
}

const JobRow: React.FC<JobRowProps> = ({ job, colors, primary }) => {
  const statusColor = getStatusColor(job.status, primary);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: DESIGN_TOKENS.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 10,
      }}
    >
      {/* Status dot */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: statusColor,
          flexShrink: 0,
        }}
      />
      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
          {job.assigned_to_name ?? "Non assigné"} · {formatShortDate(job.start_time)}
        </Text>
      </View>
      {/* Status badge */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: statusColor + "22",
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor }}>
          {getStatusLabel(job.status)}
        </Text>
      </View>
    </View>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ManagerDashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const primary = colors.primary ?? "#FF8C00";

  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"jobs" | "team">("jobs");

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const result = await fetchManagerDashboard();
      setData(result);
    } catch (e: any) {
      setError("Impossible de charger le dashboard manager.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); analytics.trackCustomEvent('manager_dashboard_viewed', 'business'); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => { analytics.trackButtonPress('back_btn', 'ManagerDashboard'); navigation.goBack(); }}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Dashboard Manager
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Vue superviseur de l'équipe
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="refresh" size={20} color={primary} />
        </Pressable>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={primary} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Chargement...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: DESIGN_TOKENS.spacing.lg }}>
          <Ionicons name="warning-outline" size={48} color="#E74C3C" />
          <Text style={{ color: colors.text, fontWeight: "600", marginTop: 12, textAlign: "center" }}>{error}</Text>
          <Pressable
            onPress={() => load()}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: pressed ? primary + "CC" : primary,
            })}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* KPIs */}
          <View style={{ padding: DESIGN_TOKENS.spacing.md }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Aujourd'hui
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <KpiCard label="Jobs total" value={data.kpis.total_jobs_today} icon="briefcase-outline" color={primary} colors={colors} />
              <KpiCard label="Terminés" value={data.kpis.completed_today} icon="checkmark-circle-outline" color="#27AE60" colors={colors} />
              <KpiCard label="En cours" value={data.kpis.in_progress_today} icon="time-outline" color="#F39C12" colors={colors} />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
              <KpiCard label="En attente" value={data.kpis.pending_today} icon="hourglass-outline" color="#95A5A6" colors={colors} />
              <KpiCard label="Équipe" value={data.kpis.team_size} icon="people-outline" color="#3498DB" colors={colors} />
              <KpiCard label="Actifs auj." value={data.kpis.active_members_today} icon="person-outline" color="#9B59B6" colors={colors} />
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: DESIGN_TOKENS.spacing.md,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: 4,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {(["jobs", "team"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => { analytics.trackButtonPress(`manager_tab_${tab}`, 'ManagerDashboard'); setActiveTab(tab); }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: activeTab === tab ? colors.background : "transparent",
                  alignItems: "center",
                  shadowColor: activeTab === tab ? colors.shadow : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: activeTab === tab ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: activeTab === tab ? colors.text : colors.textMuted,
                  }}
                >
                  {tab === "jobs" ? `Jobs (${data.recentJobs.length})` : `Équipe (${data.team.length})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Jobs tab */}
          {activeTab === "jobs" && (
            <View
              style={{
                marginHorizontal: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                overflow: "hidden",
              }}
            >
              {data.recentJobs.length === 0 ? (
                <View style={{ padding: DESIGN_TOKENS.spacing.lg, alignItems: "center" }}>
                  <Text style={{ color: colors.textMuted }}>Aucun job récent</Text>
                </View>
              ) : (
                data.recentJobs.map((job) => (
                  <JobRow key={job.id} job={job} colors={colors} primary={primary} />
                ))
              )}
            </View>
          )}

          {/* Team tab */}
          {activeTab === "team" && (
            <View
              style={{
                marginHorizontal: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                overflow: "hidden",
              }}
            >
              {data.team.length === 0 ? (
                <View style={{ padding: DESIGN_TOKENS.spacing.lg, alignItems: "center" }}>
                  <Text style={{ color: colors.textMuted }}>Aucun membre d'équipe</Text>
                </View>
              ) : (
                data.team.map((member, idx) => (
                  <View
                    key={member.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      borderBottomWidth: idx < data.team.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      gap: 12,
                    }}
                  >
                    {/* Avatar placeholder */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: primary + "22",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "700", color: primary }}>
                        {member.first_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {/* Info */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                        {member.first_name} {member.last_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                        {member.role}
                      </Text>
                    </View>
                    {/* Stats */}
                    <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                      {member.active_jobs > 0 ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: primary + "22",
                            marginBottom: 3,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "700", color: primary }}>
                            {member.active_jobs} actif{member.active_jobs > 1 ? "s" : ""}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>Libre</Text>
                      )}
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {member.completed_this_month} ce mois
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
