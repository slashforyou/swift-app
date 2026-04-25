/**
 * EmployeeDashboardScreen
 * #29 Historique jobs • #30 Stats personnelles • #31 Dashboard heures
 */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MascotLoading from "../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useTranslation } from "../localization";
import {
    EmployeeJobEntry,
    fetchEmployeeDashboard,
    type EmployeeDashboardData,
} from "../services/employeeStats";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatHours(h: number | null): string {
  if (h == null) return "—";
  return `${h.toFixed(1)}h`;
}

function getStatusColor(
  status: string,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  switch (status) {
    case "completed": return "#27AE60";
    case "in_progress": return colors.primary;
    case "cancelled": return "#E74C3C";
    default: return colors.textSecondary;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, colors }) => (
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color + "20",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text
      style={{
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 2,
      }}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

interface JobRowProps {
  item: EmployeeJobEntry;
  colors: ReturnType<typeof useTheme>["colors"];
  t: (key: string, ...args: any[]) => string;
}

const JobRow: React.FC<JobRowProps> = ({ item, colors, t }) => {
  const statusColor = getStatusColor(item.status, colors);
  const statusLabel =
    t(`employeeDashboard.jobStatus.${item.status}`) || item.status;

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: DESIGN_TOKENS.spacing.sm,
      }}
    >
      {/* Status dot */}
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: statusColor,
          marginTop: 5,
        }}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: colors.text }}
          numberOfLines={1}
        >
          {item.title || `Job #${item.code}`}
        </Text>
        {item.client_name && (
          <Text
            style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}
            numberOfLines={1}
          >
            {t("employeeDashboard.client")}: {item.client_name}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          {formatShortDate(item.start_time)}
          {item.duration_hours != null &&
            `  •  ${formatHours(item.duration_hours)}`}
        </Text>
      </View>

      {/* Status badge */}
      <View
        style={{
          backgroundColor: statusColor + "20",
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: DESIGN_TOKENS.radius.full,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor }}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
};

// ─── Date range picker (simple: last 7 / 14 / 30 days) ──────────────────────

const RANGE_OPTIONS = [7, 14, 30] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];

function getDateRange(days: RangeDays): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const EmployeeDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [page, setPage] = useState(1);
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);

  const load = useCallback(
    async (reset: boolean, newPage: number, newRange: RangeDays) => {
      try {
        setError(null);
        const { start, end } = getDateRange(newRange);
        const result = await fetchEmployeeDashboard({ page: newPage, start, end });

        if (reset) {
          setData(result);
        } else {
          // append jobs only
          setData((prev) =>
            prev
              ? {
                  ...result,
                  jobHistory: {
                    ...result.jobHistory,
                    entries: [...prev.jobHistory.entries, ...result.jobHistory.entries],
                  },
                }
              : result,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("employeeDashboard.error") ?? "Error");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load(true, 1, rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    load(true, 1, rangeDays);
  }, [load, rangeDays]);

  const onLoadMore = useCallback(() => {
    if (!data) return;
    if (isLoadingMore) return;
    if (page >= data.jobHistory.totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setIsLoadingMore(true);
    load(false, nextPage, rangeDays);
  }, [data, isLoadingMore, page, load, rangeDays]);

  const onChangeRange = useCallback(
    (days: RangeDays) => {
      setRangeDays(days);
      setIsLoading(true);
      setPage(1);
      load(true, 1, days);
    },
    [load],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading && !isRefreshing) {
    return (
      <MascotLoading text={t("employeeDashboard.loading") ?? "Loading..."} />
    );
  }

  const stats = data?.stats;
  const jobs = data?.jobHistory.entries ?? [];
  const hours = data?.hours;
  const totalJobPages = data?.jobHistory.totalPages ?? 1;

  const ListHeader = () => (
    <>
      {/* ── Stats ── */}
      {stats && (
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {t("employeeDashboard.statsTitle")}
          </Text>
          <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
            <StatCard
              label={t("employeeDashboard.totalJobs")}
              value={stats.totalJobs}
              icon="briefcase-outline"
              color={colors.primary}
              colors={colors}
            />
            <StatCard
              label={t("employeeDashboard.completedJobs")}
              value={stats.completedJobs}
              icon="checkmark-circle-outline"
              color="#27AE60"
              colors={colors}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              marginTop: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <StatCard
              label={t("employeeDashboard.totalHours")}
              value={formatHours(stats.totalHours)}
              icon="time-outline"
              color="#E67E22"
              colors={colors}
            />
            <StatCard
              label={t("employeeDashboard.totalXp")}
              value={`${stats.totalXp} XP`}
              icon="flash-outline"
              color="#9B59B6"
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* ── Hours per day ── */}
      {hours && (
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}
          >
            {t("employeeDashboard.hoursTitle")}
          </Text>

          {/* Range selector */}
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.xs,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {RANGE_OPTIONS.map((days) => (
              <Pressable
                key={days}
                onPress={() => onChangeRange(days)}
                style={{
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xs,
                  borderRadius: DESIGN_TOKENS.radius.full,
                  backgroundColor:
                    rangeDays === days
                      ? colors.primary
                      : colors.backgroundSecondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: rangeDays === days ? "#fff" : colors.textSecondary,
                  }}
                >
                  {days}j
                </Text>
              </Pressable>
            ))}
          </View>

          {hours.entries.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                paddingVertical: DESIGN_TOKENS.spacing.md,
              }}
            >
              {t("employeeDashboard.hoursEmpty")}
            </Text>
          ) : (
            hours.entries.map((entry) => {
              const barWidth = Math.min(
                100,
                (entry.hours / Math.max(...hours.entries.map((e) => e.hours))) * 100,
              );
              return (
                <View
                  key={entry.work_date}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      width: 72,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {new Date(entry.work_date + "T12:00:00").toLocaleDateString(
                      undefined,
                      { weekday: "short", day: "numeric", month: "short" },
                    )}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 20,
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.full,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        backgroundColor: colors.primary + "CC",
                        borderRadius: DESIGN_TOKENS.radius.full,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      width: 40,
                      fontSize: 12,
                      fontWeight: "600",
                      color: colors.text,
                      textAlign: "right",
                    }}
                  >
                    {formatHours(entry.hours)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ── Job history header ── */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        {t("employeeDashboard.jobHistoryTitle")}
      </Text>
    </>
  );

  const ListFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={{ padding: DESIGN_TOKENS.spacing.md, alignItems: "center" }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    if (page < totalJobPages) {
      return (
        <Pressable
          onPress={onLoadMore}
          style={{
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            {t("employeeDashboard.loadMore")}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, flex: 1 }}>
          {t("employeeDashboard.title")}
        </Text>
      </View>

      {error ? (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: DESIGN_TOKENS.spacing.xl,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text
            style={{
              marginTop: DESIGN_TOKENS.spacing.md,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <JobRow item={item} colors={colors} t={t as any} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                paddingVertical: DESIGN_TOKENS.spacing.xl,
              }}
            >
              {t("employeeDashboard.noJobs")}
            </Text>
          }
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
};

export default EmployeeDashboardScreen;
