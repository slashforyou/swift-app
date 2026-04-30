/**
 * EmployeeScheduleScreen — Vue planning par employé (#40)
 *
 * Affiche les jobs assignés à un employé spécifique
 * sur une semaine sélectionnable, en vue agenda (7 jours).
 *
 * Accès depuis staffCrewScreen via le bouton "Planning".
 */
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
import { analytics } from "../services/analytics";
import {
    EmployeeScheduleData,
    ScheduleDay,
    ScheduledJob,
    fetchEmployeeSchedule,
    getMondayOfWeek,
    getSundayOfWeek,
    toYMD,
} from "../services/employeeScheduleService";

/* ─── helpers ───────────────────────────────────────────────────────────────*/

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  "in-progress": "#3B82F6",
  in_progress: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
};

const STATUS_ICON: Record<string, string> = {
  pending: "time-outline",
  "in-progress": "play-circle-outline",
  in_progress: "play-circle-outline",
  completed: "checkmark-circle-outline",
  cancelled: "close-circle-outline",
};

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const part = iso.includes("T") ? iso.split("T")[1] : iso.split(" ")[1] ?? "";
  return part.slice(0, 5);
}

function formatWeekLabel(monday: Date, sunday: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const m = monday.toLocaleDateString("en-AU", opts);
  const s = sunday.toLocaleDateString("en-AU", opts);
  return `${m} — ${s}`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isToday(dateStr: string): boolean {
  return toYMD(new Date()) === dateStr;
}

/* ─── JobCard ───────────────────────────────────────────────────────────────*/

interface JobCardProps {
  job: ScheduledJob;
  colors: any;
  onPress: () => void;
}

function JobCard({ job, colors, onPress }: JobCardProps) {
  const statusColor = STATUS_COLOR[job.status] ?? colors.textSecondary;
  const statusIcon = STATUS_ICON[job.status] ?? "ellipse-outline";
  const startStr = formatTime(job.startTime);
  const endStr = formatTime(job.endTime);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
        opacity: pressed ? 0.8 : 1,
        gap: DESIGN_TOKENS.spacing.sm,
      })}
    >
      {/* Icône statut */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: statusColor + "20",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <Ionicons name={statusIcon as any} size={18} color={statusColor} />
      </View>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.text,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {job.title}
          </Text>
          {startStr ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginLeft: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {startStr}
              {endStr ? ` → ${endStr}` : ""}
            </Text>
          ) : null}
        </View>

        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}
          numberOfLines={1}
        >
          {job.clientName}
        </Text>

        {job.pickupAddress ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
            }}
          >
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textMuted}
            />
            <Text
              style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}
              numberOfLines={1}
            >
              {job.pickupAddress}
            </Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

/* ─── DaySection ────────────────────────────────────────────────────────────*/

interface DaySectionProps {
  day: ScheduleDay;
  colors: any;
  t: (key: string, opts?: any) => string;
  onJobPress: (jobId: number) => void;
}

function DaySection({ day, colors, t, onJobPress }: DaySectionProps) {
  const label = formatDayLabel(day.date);
  const today = isToday(day.date);

  return (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      {/* Entête jour */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.sm,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: today ? colors.primary : colors.textMuted,
          }}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: today ? "700" : "600",
            color: today ? colors.primary : colors.textSecondary,
            flex: 1,
          }}
        >
          {label}
          {today ? ` · ${t("employeeSchedule.today")}` : ""}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {day.jobs.length > 0
            ? t("employeeSchedule.jobCount", { count: day.jobs.length })
            : ""}
        </Text>
      </View>

      {/* Jobs ou état vide */}
      {day.jobs.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
            opacity: 0.5,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {t("employeeSchedule.noJobs")}
          </Text>
        </View>
      ) : (
        day.jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            colors={colors}
            onPress={() => onJobPress(job.id)}
          />
        ))
      )}
    </View>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────────────*/

interface Props {
  route?: any;
  navigation: any;
}

export default function EmployeeScheduleScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const userId: number = route?.params?.userId;
  const employeeName: string = route?.params?.employeeName ?? "";

  // Semaine courante (lundi = base)
  const [weekMonday, setWeekMonday] = useState<Date>(() =>
    getMondayOfWeek(new Date()),
  );

  const [data, setData] = useState<EmployeeScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekSunday = getSundayOfWeek(weekMonday);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      setLoading(true);
      const result = await fetchEmployeeSchedule(userId, weekMonday, weekSunday);
      setData(result);
    } catch {
      setError(t("common.loadError") ?? "Loading error");
    } finally {
      setLoading(false);
    }
  }, [userId, weekMonday]);

  useEffect(() => {
    load();
    analytics.trackNavigation("EmployeeSchedule");
  }, [load]);

  const goToPrevWeek = () => {
    analytics.trackButtonPress("schedule_prev_week", "EmployeeSchedule");
    setWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    analytics.trackButtonPress("schedule_next_week", "EmployeeSchedule");
    setWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToCurrentWeek = () => {
    analytics.trackButtonPress("schedule_today", "EmployeeSchedule");
    setWeekMonday(getMondayOfWeek(new Date()));
  };

  const handleJobPress = (jobId: number) => {
    analytics.trackButtonPress("schedule_job_tap", "EmployeeSchedule", {
      job_id: jobId,
    });
    navigation.navigate("JobDetails", {
      jobId: String(jobId),
      from: "EmployeeSchedule",
    });
  };

  const isCurrentWeek =
    toYMD(weekMonday) === toYMD(getMondayOfWeek(new Date()));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "700", color: colors.text }}
            numberOfLines={1}
          >
            {employeeName || t("employeeSchedule.title")}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {t("employeeSchedule.subtitle")}
          </Text>
        </View>
      </View>

      {/* Navigation semaine */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <Pressable
          onPress={goToPrevWeek}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <Pressable onPress={goToCurrentWeek} style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: isCurrentWeek ? colors.primary : colors.text,
            }}
          >
            {formatWeekLabel(weekMonday, weekSunday)}
          </Text>
          {!isCurrentWeek && (
            <Text style={{ fontSize: 11, color: colors.primary, marginTop: 1 }}>
              {t("employeeSchedule.backToCurrentWeek")}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={goToNextWeek}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Contenu */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: DESIGN_TOKENS.spacing.md,
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {t("employeeSchedule.loading")}
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: DESIGN_TOKENS.spacing.xl,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text
            style={{
              marginTop: DESIGN_TOKENS.spacing.md,
              color: colors.error,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={load}
            style={{
              marginTop: DESIGN_TOKENS.spacing.lg,
              backgroundColor: colors.primary,
              paddingHorizontal: DESIGN_TOKENS.spacing.xl,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
            }}
          >
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: "600" }}>
              {t("common.retry")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
          }}
        >
          {/* Résumé semaine */}
          {data && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primary + "15",
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                gap: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
                {t("employeeSchedule.weekSummary", { count: data.totalJobs })}
              </Text>
            </View>
          )}

          {/* Jours de la semaine */}
          {data?.days.map((day) => (
            <DaySection
              key={day.date}
              day={day}
              colors={colors}
              t={t}
              onJobPress={handleJobPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
