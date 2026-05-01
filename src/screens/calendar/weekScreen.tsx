/**
 * WeekScreen — Vue semaine du calendrier
 * Affiche 7 colonnes (Lun→Dim) avec les jobs de chaque jour.
 * Navigation prev/next semaine, accès rapide au jour, stats de la semaine.
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getJobCalendarColor } from "../../components/calendar/calendarColors";
import CalendarFilters, {
    CalendarFilterState,
    DEFAULT_FILTERS,
} from "../../components/calendar/CalendarFilters";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import DraggableJobCard from "../../components/calendar/DraggableJobCard";
import HeaderLogo from "../../components/ui/HeaderLogo";
import MascotLoading from "../../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useJobsForWeek, WeekDay } from "../../hooks/useJobsForWeek";
import { useLocalization, useTranslation } from "../../localization";
import { analytics } from "../../services/analytics";
import { updateJob } from "../../services/jobs";

interface WeekScreenProps {
  route: {
    params?: {
      day?: number;
      month?: number;
      year?: number;
    };
  };
  navigation: any;
}

const WeekScreen: React.FC<WeekScreenProps> = ({ route, navigation }) => {
  const { day, month, year } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors } = useCommonThemedStyles();
  const { t } = useTranslation();
  const { currentLanguage } = useLocalization();

  // Reference date for the week (defaults to today)
  const [referenceDate, setReferenceDate] = useState(() => {
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
    return new Date();
  });

  // Filter state
  const [filters, setFilters] = useState<CalendarFilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const {
    weekDays,
    isLoading,
    error,
    refreshJobs,
    weekStart,
    weekEnd,
  } = useJobsForWeek(referenceDate);

  const screenWidth = Dimensions.get("window").width;
  const DAY_COLUMN_WIDTH = (screenWidth - DESIGN_TOKENS.spacing.lg * 2) / 7;

  // ── Navigation ──────────────────────

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      analytics.trackButtonPress(`calendar_week_${direction}`, 'WeekScreen');
      setReferenceDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
        return d;
      });
    },
    [],
  );

  const goToToday = useCallback(() => {
    analytics.trackButtonPress('calendar_go_to_today', 'WeekScreen');
    setReferenceDate(new Date());
  }, []);

  const navigateToDay = useCallback(
    (weekDay: WeekDay) => {
      analytics.trackButtonPress('calendar_day_open', 'WeekScreen', { day: weekDay.day, month: weekDay.month, year: weekDay.year });
      navigation.navigate("Day", {
        day: weekDay.day,
        month: weekDay.month,
        year: weekDay.year,
      });
    },
    [navigation],
  );

  // ── Formatted header ──────────────────────

  const weekRangeLabel = useMemo(() => {
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonth = weekStart.toLocaleString(currentLanguage, {
      month: "short",
    });
    const endMonth = weekEnd.toLocaleString(currentLanguage, {
      month: "short",
    });
    const yr = weekStart.getFullYear();

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${startDay} – ${endDay} ${startMonth} ${yr}`;
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${yr}`;
  }, [weekStart, weekEnd, currentLanguage]);

  // ── Day-of-week labels ──────────────────────

  const dayLabels = useMemo(
    () => [
      t("calendar.days.mon"),
      t("calendar.days.tue"),
      t("calendar.days.wed"),
      t("calendar.days.thu"),
      t("calendar.days.fri"),
      t("calendar.days.sat"),
      t("calendar.days.sun"),
    ],
    [t],
  );

  // ── Filtered week days ──────────────────────

  const filteredWeekDays = useMemo(() => {
    return weekDays.map((wd) => {
      let dayJobs = wd.jobs;

      // Status filter
      if (filters.status) {
        dayJobs = dayJobs.filter((j: any) => {
          const s = j.status || "";
          if (filters.status === "in-progress")
            return s === "in-progress" || s === "in_progress";
          return s === filters.status;
        });
      }

      // Vehicle filter
      if (filters.vehicleId) {
        dayJobs = dayJobs.filter((j: any) => {
          const vId =
            j.truck?.id?.toString() ||
            j.truck_id?.toString() ||
            j.preferred_truck_id?.toString() ||
            "";
          return vId === filters.vehicleId;
        });
      }

      // Staff filter
      if (filters.staffId) {
        dayJobs = dayJobs.filter((j: any) => {
          const sId =
            j.contractor?.company_id?.toString() ||
            j.assigned_staff_id?.toString() ||
            "";
          return sId === filters.staffId;
        });
      }

      return { ...wd, jobs: dayJobs };
    });
  }, [weekDays, filters]);

  const filteredTotal = useMemo(
    () => filteredWeekDays.reduce((sum, d) => sum + d.jobs.length, 0),
    [filteredWeekDays],
  );

  // ── Stats ──────────────────────

  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    filteredWeekDays.forEach((d) => {
      d.jobs.forEach((j: any) => {
        const status = j.status || "";
        if (status === "completed") completed++;
        else if (status === "in-progress" || status === "in_progress")
          inProgress++;
        else pending++;
      });
    });
    return { completed, pending, inProgress, total: filteredTotal };
  }, [filteredWeekDays, filteredTotal]);

  // ── Drag & drop handler ──────────────────────

  const handleJobDrop = useCallback(
    async (job: any, fromDayIndex: number, toDayIndex: number) => {
      if (fromDayIndex === toDayIndex) return;

      const targetDay = filteredWeekDays[toDayIndex];
      if (!targetDay) return;

      // Compute new dates by shifting the difference in days
      const dayDiff = toDayIndex - fromDayIndex;
      const shiftDate = (dateStr: string): string => {
        if (!dateStr) return dateStr;
        const d = new Date(dateStr);
        d.setDate(d.getDate() + dayDiff);
        return d.toISOString();
      };

      const startWindowStart =
        job.start_window_start || job.time?.startWindowStart || "";
      const startWindowEnd =
        job.start_window_end || job.time?.startWindowEnd || "";
      const endWindowStart =
        job.end_window_start || job.time?.endWindowStart || "";
      const endWindowEnd =
        job.end_window_end || job.time?.endWindowEnd || "";

      const newTime = {
        startWindowStart: shiftDate(startWindowStart),
        startWindowEnd: shiftDate(startWindowEnd),
        endWindowStart: shiftDate(endWindowStart),
        endWindowEnd: shiftDate(endWindowEnd),
      };

      const jobId = (job.id || job.code || "").toString();
      const targetDateLabel = `${targetDay.day}/${targetDay.month}`;

      Alert.alert(
        t("calendar.dragDrop.confirmTitle") || "Reschedule job?",
        (t("calendar.dragDrop.confirmMessage") || "Move this job to {date}?").replace(
          "{date}",
          targetDateLabel,
        ),
        [
          { text: t("common.cancel") || "Cancel", style: "cancel" },
          {
            text: t("common.confirm") || "Confirm",
            onPress: async () => {
              try {
                await updateJob(jobId, { time: newTime });
                analytics.trackCustomEvent('job_rescheduled', 'business', { job_id: jobId, to_date: targetDateLabel });
                await refreshJobs();
              } catch {
                Alert.alert(
                  t("calendar.dragDrop.errorTitle") || "Error",
                  t("calendar.dragDrop.errorMessage") ||
                    "Failed to reschedule job. Please try again.",
                );
              }
            },
          },
        ],
      );
    },
    [filteredWeekDays, refreshJobs, t],
  );

  // ── Render a mini job card inside a day column ──────────────────────

  const renderJobCard = useCallback(
    (job: any, weekDay: WeekDay, dayIndex: number) => {
      const statusColor = getJobCalendarColor(job, filters.colorBy);

      // Time extraction
      const startTime =
        job.start_window_start || job.time?.startWindowStart || "";
      let timeLabel = "";
      if (startTime) {
        try {
          const d = new Date(startTime);
          timeLabel = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        } catch {
          /* ignore */
        }
      }

      // Client name
      const clientName =
        job.client?.name ||
        job.contact_name ||
        (job.client?.firstName
          ? `${job.client.firstName} ${job.client.lastName || ""}`
          : "");

      return (
        <DraggableJobCard
          key={job.id}
          job={job}
          color={statusColor}
          dayIndex={dayIndex}
          dayColumnWidth={DAY_COLUMN_WIDTH}
          timeLabel={timeLabel}
          clientName={clientName}
          onPress={() =>
            navigation.navigate("Day", {
              day: weekDay.day,
              month: weekDay.month,
              year: weekDay.year,
            })
          }
          onDrop={handleJobDrop}
        />
      );
    },
    [filters.colorBy, navigation, handleJobDrop, DAY_COLUMN_WIDTH],
  );

  // ── Styles ──────────────────────

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        nav: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        navBtn: {
          backgroundColor: colors.primary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.sm,
          minWidth: 40,
          alignItems: "center",
        },
        navCenter: {
          flex: 1,
          alignItems: "center",
        },
        navTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
        },
        todayBtn: {
          marginTop: 4,
          paddingHorizontal: 10,
          paddingVertical: 2,
          borderRadius: DESIGN_TOKENS.radius.sm,
          backgroundColor: colors.primary + "20",
        },
        todayBtnText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.primary,
        },
        statsRow: {
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        statItem: {
          alignItems: "center",
        },
        statValue: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        statLabel: {
          fontSize: 10,
          color: colors.textSecondary,
          marginTop: 2,
        },
        weekGrid: {
          flexDirection: "row",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingTop: DESIGN_TOKENS.spacing.sm,
          flex: 1,
        },
        dayColumn: {
          width: DAY_COLUMN_WIDTH,
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
        dayColumnLast: {
          width: DAY_COLUMN_WIDTH,
          borderRightWidth: 0,
        },
        dayHeader: {
          alignItems: "center",
          paddingVertical: DESIGN_TOKENS.spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        dayHeaderLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
        },
        dayHeaderNumber: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
          marginTop: 2,
        },
        dayHeaderToday: {
          backgroundColor: colors.primary,
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        },
        dayHeaderTodayText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.buttonPrimaryText,
        },
        dayContent: {
          padding: 2,
          minHeight: 200,
        },
        jobCount: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 4,
        },
        emptyDay: {
          alignItems: "center",
          paddingTop: 20,
        },
        emptyDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
        },
        errorBanner: {
          backgroundColor: colors.errorBanner || "#FEE2E2",
          margin: DESIGN_TOKENS.spacing.lg,
          padding: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          borderLeftWidth: 4,
          borderLeftColor: colors.error,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        scrollContent: {
          flex: 1,
          paddingBottom: 100,
        },
      }),
    [colors, DAY_COLUMN_WIDTH],
  );

  // ── Render ──────────────────────

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      {/* Logo */}
      <View style={{ alignItems: "center", paddingTop: insets.top }}>
        <HeaderLogo preset="sm" variant="rectangle" marginVertical={2} />
      </View>

      {/* Unified header */}
      <CalendarHeader
        navigation={navigation}
        title={t("calendar.navigation.weeklyView")}
        skipSafeAreaTop={true}
        onBackPress={() => navigation.navigate("Month")}
      />

      {/* Week navigation */}
      <View style={styles.nav}>
        <Pressable
          style={({ pressed }) => ({
            ...styles.navBtn,
            opacity: pressed ? 0.8 : 1,
          })}
          onPress={() => navigateWeek("prev")}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={colors.buttonPrimaryText}
          />
        </Pressable>

        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{weekRangeLabel}</Text>
          <Pressable style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>
              {t("calendar.dayScreen.today") || "Today"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => ({
            ...styles.navBtn,
            opacity: pressed ? 0.8 : 1,
          })}
          onPress={() => navigateWeek("next")}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.buttonPrimaryText}
          />
        </Pressable>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t("calendar.stats.totalJobs")}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F97316" }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>
            {t("calendar.filters.pending")}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FBBF24" }]}>
            {stats.inProgress}
          </Text>
          <Text style={styles.statLabel}>
            {t("calendar.filters.active")}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>{t("calendar.stats.completed")}</Text>
        </View>
        <Pressable
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? "funnel" : "funnel-outline"}
            size={20}
            color={showFilters ? colors.primary : colors.textSecondary}
          />
          <Text
            style={{
              fontSize: 9,
              color: showFilters ? colors.primary : colors.textSecondary,
              marginTop: 2,
            }}
          >
            {t("calendar.dayScreen.filtersTitle") || "Filters"}
          </Text>
        </Pressable>
      </View>

      {/* Filters bar */}
      {showFilters && (
        <CalendarFilters
          filters={filters}
          onFiltersChange={setFilters}
          compact={true}
        />
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={{ flex: 1, color: colors.error, fontSize: 13 }}>
            {error}
          </Text>
          <Pressable
            onPress={refreshJobs}
            style={{
              backgroundColor: colors.error,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: DESIGN_TOKENS.radius.sm,
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
              {t("calendar.refresh")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Loading */}
      {isLoading && <MascotLoading text={t("calendar.loading")} overlay />}

      {/* Week grid */}
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshJobs}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekGrid}>
          {filteredWeekDays.map((weekDay, index) => (
            <Pressable
              key={weekDay.date.toISOString()}
              style={
                index === 6 ? styles.dayColumnLast : styles.dayColumn
              }
              onPress={() => navigateToDay(weekDay)}
            >
              {/* Day header */}
              <View
                style={[
                  styles.dayHeader,
                  weekDay.isToday && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
              >
                <Text style={styles.dayHeaderLabel}>
                  {dayLabels[index]}
                </Text>
                {weekDay.isToday ? (
                  <View style={styles.dayHeaderToday}>
                    <Text style={styles.dayHeaderTodayText}>
                      {weekDay.day}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.dayHeaderNumber}>{weekDay.day}</Text>
                )}
              </View>

              {/* Day jobs */}
              <View style={styles.dayContent}>
                {weekDay.jobs.length > 0 ? (
                  <>
                    <Text style={styles.jobCount}>
                      {weekDay.jobs.length}{" "}
                      {weekDay.jobs.length === 1 ? "job" : "jobs"}
                    </Text>
                    {weekDay.jobs.slice(0, 4).map((job) =>
                      renderJobCard(job, weekDay, index),
                    )}
                    {weekDay.jobs.length > 4 && (
                      <Text
                        style={{
                          fontSize: 9,
                          color: colors.primary,
                          textAlign: "center",
                          fontWeight: "600",
                          marginTop: 2,
                        }}
                      >
                        +{weekDay.jobs.length - 4}
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyDay}>
                    <View style={styles.emptyDot} />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
    </GestureHandlerRootView>
  );
};

export default WeekScreen;
