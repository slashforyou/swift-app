// Modern month calendar screen with enhanced UX, job indicators, and modern design

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import HeaderLogo from "../../components/ui/HeaderLogo";
import MascotLoading from "../../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useJobsForMonth } from "../../hooks/useJobsForMonth";
import { useTranslation } from "../../localization";
import { JobAPI } from "../../services/jobs";

// Adapter pour normaliser les données de l'API
// Gère les deux formats : objets imbriqués (JobAPI) et champs plats (réponse brute calendar-days)
const normalizeJob = (rawJob: any): JobAPI => {
  // contractee : objet imbriqué ou champs plats contractee_company_id / contractee_company_name
  const contractee: JobAPI["contractee"] =
    rawJob.contractee ??
    (rawJob.contractee_company_id != null
      ? {
          company_id: rawJob.contractee_company_id,
          company_name: rawJob.contractee_company_name || "",
        }
      : undefined);

  // contractor : objet imbriqué ou champs plats contractor_company_id / contractor_company_name
  const contractor: JobAPI["contractor"] =
    rawJob.contractor ??
    (rawJob.contractor_company_id != null
      ? {
          company_id: rawJob.contractor_company_id,
          company_name: rawJob.contractor_company_name || "",
        }
      : undefined);

  return {
    id: rawJob.id?.toString() || "",
    status: rawJob.status || "pending",
    priority: rawJob.priority || "medium",
    client_id: rawJob.client_id?.toString() || "",
    addresses: rawJob.addresses || [],
    time: {
      startWindowStart:
        rawJob.start_window_start || rawJob.time?.startWindowStart || "",
      startWindowEnd:
        rawJob.start_window_end || rawJob.time?.startWindowEnd || "",
      endWindowStart: rawJob.end_window_start || rawJob.time?.endWindowStart,
      endWindowEnd: rawJob.end_window_end || rawJob.time?.endWindowEnd,
    },
    createdAt: rawJob.created_at || rawJob.createdAt || "",
    updatedAt: rawJob.updated_at || rawJob.updatedAt || "",
    notes: rawJob.notes,
    estimatedDuration: rawJob.estimated_duration || rawJob.estimatedDuration,
    client: rawJob.client,
    contact: rawJob.contact,
    truck: rawJob.truck ?? (Array.isArray(rawJob.trucks) && rawJob.trucks.length > 0
      ? { name: rawJob.trucks[0].name || "", licensePlate: rawJob.trucks[0].license_plate || "" }
      : undefined),
    assignment_status: rawJob.assignment_status,
    contractee,
    contractor,
  };
};

// Indicator type for a single job on the calendar
type JobIndicatorType =
  | "declined-assignment"
  | "pending-assignment"
  | "in-progress"
  | "accepted"
  | "completed";

// Determine the visual indicator type for a single normalised job
const getSingleJobIndicatorType = (job: any): JobIndicatorType => {
  // assignment_status concerne les transferts inter-entreprises
  // Ces états ont la priorité visuelle la plus haute
  if (job.assignment_status === "declined") return "declined-assignment";
  if (job.assignment_status === "pending") return "pending-assignment";

  // Ensuite on se base sur le statut métier du job
  if (job.status === "in-progress" || job.status === "in_progress")
    return "in-progress";
  if (job.status === "completed") return "completed";

  // pending / assigned / accepted → orange (pas encore commencé)
  return "accepted";
};

// Helper function to get jobs for a specific day from API data
const getJobsForDay = (
  day: number,
  month: number, // 1-based
  year: number,
  jobs: any[],
) => {
  const allDayJobs = jobs.map(normalizeJob).filter((job) => {
    if (!job.time?.startWindowStart) {
      return false;
    }
    const jobDate = new Date(job.time.startWindowStart);
    // Vérifier jour + mois + année pour éviter les faux positifs
    return (
      jobDate.getDate() === day &&
      jobDate.getMonth() + 1 === month &&
      jobDate.getFullYear() === year
    );
  });

  // Exclude cancelled jobs from the visual count
  const dayJobs = allDayJobs.filter((j) => j.status !== "cancelled");

  if (dayJobs.length === 0) return null;

  const indicatorType =
    dayJobs.length === 1 ? getSingleJobIndicatorType(dayJobs[0]) : "accepted";

  return {
    count: dayJobs.length,
    indicatorType,
    jobs: dayJobs,
    // kept for backward compat with monthStats
    status: dayJobs[0]?.status || "pending",
  };
};

const MonthCalendarScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, styles: commonStyles } = useCommonThemedStyles();

  // States for modern UX
  const [animatedValue] = useState(new Animated.Value(1));

  // Calculate responsive dimensions
  const screenWidth = Dimensions.get("window").width;
  const buttonWidth =
    (screenWidth -
      DESIGN_TOKENS.spacing.lg * 2 -
      DESIGN_TOKENS.spacing.xs * 6) /
    7;

  const { t } = useTranslation();

  const monthList = [
    t("calendar.months.january"),
    t("calendar.months.february"),
    t("calendar.months.march"),
    t("calendar.months.april"),
    t("calendar.months.may"),
    t("calendar.months.june"),
    t("calendar.months.july"),
    t("calendar.months.august"),
    t("calendar.months.september"),
    t("calendar.months.october"),
    t("calendar.months.november"),
    t("calendar.months.december"),
  ];
  const daysList = [
    t("calendar.days.mon"),
    t("calendar.days.tue"),
    t("calendar.days.wed"),
    t("calendar.days.thu"),
    t("calendar.days.fri"),
    t("calendar.days.sat"),
    t("calendar.days.sun"),
  ];
  const { month, year } = route.params || {};

  const selectedYear = year || new Date().getFullYear();
  const selectedMonthIndex = month ? month - 1 : new Date().getMonth();

  // Hook pour les jobs du mois
  const { jobs, isLoading, error, refreshJobs } = useJobsForMonth(
    selectedYear,
    selectedMonthIndex + 1,
  );

  // Debug logs pour suivre l'état des jobs
  // selectedYear,
  // selectedMonth: selectedMonthIndex + 1,
  // jobsCount: jobs.length,
  // isLoading,
  // hasError: !!error
  // });

  const selectedMonth =
    monthList[selectedMonthIndex] || monthList[new Date().getMonth()];

  const daysInMonth = new Date(
    selectedYear,
    selectedMonthIndex + 1,
    0,
  ).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // We determine the number of day between the first day of the month and the last monday.
  const firstDayOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
  const firstDayOfWeek =
    firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Adjusting for Monday as the first day

  const daysBefore = firstDayOfWeek; // Number of days before the first Monday
  const daysAfter = (7 - ((daysInMonth + daysBefore) % 7)) % 7; // Number of days after the last day of the month

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      selectedMonthIndex === today.getMonth() &&
      selectedYear === today.getFullYear()
    );
  };

  // Modern navigation functions with animations
  const navigateToMonth = useCallback(
    (direction: "prev" | "next") => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const newMonth =
        direction === "prev"
          ? selectedMonthIndex > 0
            ? selectedMonthIndex
            : 12
          : selectedMonthIndex < 11
            ? selectedMonthIndex + 2
            : 1;
      const newYear =
        direction === "prev"
          ? selectedMonthIndex > 0
            ? selectedYear
            : selectedYear - 1
          : selectedMonthIndex < 11
            ? selectedYear
            : selectedYear + 1;

      navigation.navigate("Month", { year: newYear, month: newMonth });
    },
    [selectedMonthIndex, selectedYear, animatedValue, navigation],
  );

  // Pull to refresh functionality
  const handleRefresh = useCallback(async () => {
    refreshJobs();
  }, [refreshJobs]);

  // Calculate month statistics
  const monthStats = useMemo(() => {
    let totalJobs = 0;
    let urgentJobs = 0;
    let completedJobs = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayJobs = getJobsForDay(
        day,
        selectedMonthIndex + 1,
        selectedYear,
        jobs,
      );
      if (dayJobs) {
        totalJobs += dayJobs.count;
        if ((dayJobs.status as string) === "urgent")
          urgentJobs += dayJobs.count;
        if (dayJobs.status === "completed") completedJobs += dayJobs.count;
      }
    }

    return { totalJobs, urgentJobs, completedJobs };
  }, [selectedMonthIndex, selectedYear, daysInMonth, jobs]);

  // Component for job indicators on month calendar days
  const JobIndicator = ({ job }: { job: any }) => {
    if (!job) return null;

    const { count, indicatorType } = job;
    const DOT_SIZE = 10;

    const dotBase = {
      position: "absolute" as const,
      bottom: 4,
      left: "50%" as any,
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      transform: [{ translateX: -(DOT_SIZE / 2) }],
    };

    // Multiple jobs → grey rounded badge with count
    if (count > 1) {
      const displayCount = count > 9 ? "9+" : String(count);
      const badgeWidth = count > 9 ? 22 : 18;
      return (
        <View
          style={{
            position: "absolute",
            bottom: 3,
            left: "50%",
            transform: [{ translateX: -(badgeWidth / 2) }],
            backgroundColor: "#9CA3AF",
            borderRadius: 8,
            width: badgeWidth,
            height: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: "white" }}>
            {displayCount}
          </Text>
        </View>
      );
    }

    // Single job — 6 distinct visual states
    switch (indicatorType as JobIndicatorType) {
      case "declined-assignment":
        // Contour rouge : job assigné refusé
        return (
          <View
            style={{
              ...dotBase,
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: colors.error,
            }}
          />
        );
      case "pending-assignment":
        // Contour jaune : job assigné en attente de réponse
        return (
          <View
            style={{
              ...dotBase,
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: "#FBBF24",
            }}
          />
        );
      case "in-progress":
        // Plein jaune : job en cours
        return <View style={{ ...dotBase, backgroundColor: "#FBBF24" }} />;
      case "completed":
        // Plein bleu : job terminé (en attente de paiement)
        return <View style={{ ...dotBase, backgroundColor: colors.primary }} />;
      case "accepted":
      default:
        // Plein orange : job accepté / pas encore en cours
        return <View style={{ ...dotBase, backgroundColor: "#F97316" }} />;
    }
  };

  const useCustomStyles = () => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 0, // Calendrier prend toute la largeur
        paddingBottom: 100, // Marge pour menu Samsung
      },
      header: {
        backgroundColor: colors.background,
        paddingTop: 50,
        paddingBottom: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: DESIGN_TOKENS.spacing.md,
      },
      leftButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: DESIGN_TOKENS.spacing.sm,
      },
      homeButton: {
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        ...DESIGN_TOKENS.shadows.md,
      },
      backButton: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.sm,
        ...DESIGN_TOKENS.shadows.sm,
      },
      titleArea: {
        alignItems: "center",
        flex: 1,
      },
      statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.md,
        marginHorizontal: DESIGN_TOKENS.spacing.lg,
        ...DESIGN_TOKENS.shadows.sm,
      },
      statItem: {
        alignItems: "center",
      },
      statValue: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: "500",
      },
      navigationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: DESIGN_TOKENS.spacing.md,
        marginHorizontal: DESIGN_TOKENS.spacing.lg,
        gap: DESIGN_TOKENS.spacing.sm,
      },
      navButton: {
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        minWidth: 50,
        alignItems: "center",
        ...DESIGN_TOKENS.shadows.sm,
      },
      monthButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
        alignItems: "center",
        ...DESIGN_TOKENS.shadows.md,
      },
      monthButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.buttonPrimaryText,
      },
      monthButtonSubtext: {
        fontSize: 12,
        color: colors.buttonPrimaryText,
        opacity: 0.8,
        marginTop: 2,
      },
      calendarContainer: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 0, // Pas de border radius pour prendre toute la largeur
        padding: DESIGN_TOKENS.spacing.md,
        marginHorizontal: 0, // Prend toute la largeur
      },
      daysHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: DESIGN_TOKENS.spacing.sm,
        paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      },
      dayHeaderItem: {
        width: buttonWidth,
        alignItems: "center",
        paddingVertical: DESIGN_TOKENS.spacing.sm,
      },
      dayHeaderText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
      },
      daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: DESIGN_TOKENS.spacing.xs,
      },
      dayButton: {
        width: buttonWidth,
        height: buttonWidth,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: DESIGN_TOKENS.radius.md,
        backgroundColor: colors.background,
        position: "relative",
        ...DESIGN_TOKENS.shadows.sm,
      },
      dayButtonToday: {
        width: buttonWidth,
        height: buttonWidth,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: DESIGN_TOKENS.radius.md,
        backgroundColor: colors.primary,
        position: "relative",
        ...DESIGN_TOKENS.shadows.md,
      },
      dayText: {
        fontSize: 16,
        fontWeight: "500",
        color: colors.text,
      },
      dayTextToday: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.buttonPrimaryText,
      },
      emptyDayButton: {
        width: buttonWidth,
        height: buttonWidth,
        backgroundColor: "transparent",
      },
      errorContainer: {
        backgroundColor: colors.errorBanner,
        marginHorizontal: DESIGN_TOKENS.spacing.lg,
        marginVertical: DESIGN_TOKENS.spacing.md,
        padding: DESIGN_TOKENS.spacing.lg,
        borderRadius: DESIGN_TOKENS.radius.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      errorText: {
        fontSize: 14,
        color: colors.error,
        flex: 1,
        marginRight: DESIGN_TOKENS.spacing.md,
      },
      retryButton: {
        backgroundColor: colors.error,
        paddingHorizontal: DESIGN_TOKENS.spacing.md,
        paddingVertical: DESIGN_TOKENS.spacing.sm,
        borderRadius: DESIGN_TOKENS.radius.sm,
      },
      retryText: {
        fontSize: 12,
        color: "white",
        fontWeight: "600",
      },
    });
  };

  const customStyles = useCustomStyles();

  return (
    <View testID="calendar-month-screen" style={customStyles.container}>
      {/* Logo */}
      <View style={{ alignItems: "center", paddingTop: insets.top }}>
        <HeaderLogo preset="sm" variant="rectangle" marginVertical={2} />
      </View>
      {/* Header unifié avec style Business - Position fixe en haut */}
      <CalendarHeader
        navigation={navigation}
        title={selectedYear.toString()}
        skipSafeAreaTop={true}
        onBackPress={() => navigation.navigate("Home")}
      />

      {/* Affichage d'erreur si problème API */}
      {error && (
        <View testID="calendar-month-error" style={customStyles.errorContainer}>
          <Text
            testID="calendar-month-error-text"
            style={customStyles.errorText}
          >
            ⚠️ {error}
          </Text>
          <Pressable
            testID="calendar-month-retry-btn"
            style={customStyles.retryButton}
            onPress={refreshJobs}
          >
            <Text style={customStyles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      <Animated.View
        style={[customStyles.header, { transform: [{ scale: animatedValue }] }]}
      >
        {/* Statistiques du mois */}
        <View testID="calendar-month-stats" style={customStyles.statsContainer}>
          <View
            testID="calendar-month-stats-total"
            style={customStyles.statItem}
          >
            <Text
              testID="calendar-month-stats-total-value"
              style={customStyles.statValue}
            >
              {monthStats.totalJobs}
            </Text>
            <Text
              testID="calendar-month-stats-total-label"
              style={customStyles.statLabel}
            >
              {t("calendar.stats.totalJobs")}
            </Text>
          </View>
          <View
            testID="calendar-month-stats-urgent"
            style={customStyles.statItem}
          >
            <Text
              testID="calendar-month-stats-urgent-value"
              style={[customStyles.statValue, { color: colors.error }]}
            >
              {monthStats.urgentJobs}
            </Text>
            <Text
              testID="calendar-month-stats-urgent-label"
              style={customStyles.statLabel}
            >
              {t("calendar.stats.urgent")}
            </Text>
          </View>
          <View
            testID="calendar-month-stats-completed"
            style={customStyles.statItem}
          >
            <Text
              testID="calendar-month-stats-completed-value"
              style={[customStyles.statValue, { color: colors.success }]}
            >
              {monthStats.completedJobs}
            </Text>
            <Text
              testID="calendar-month-stats-completed-label"
              style={customStyles.statLabel}
            >
              {t("calendar.stats.completed")}
            </Text>
          </View>
        </View>

        {/* Navigation entre mois */}
        <View
          testID="calendar-month-navigation"
          style={customStyles.navigationContainer}
        >
          <Pressable
            testID="calendar-month-prev-btn"
            style={({ pressed }) => ({
              ...customStyles.navButton,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => navigateToMonth("prev")}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.buttonPrimaryText}
            />
          </Pressable>

          <Pressable
            testID="calendar-month-year-btn"
            style={({ pressed }) => ({
              ...customStyles.monthButton,
              opacity: pressed ? 0.95 : 1,
            })}
            onPress={() =>
              navigation.navigate("Year", {
                year: selectedYear,
                month: selectedMonthIndex + 1,
              })
            }
          >
            <Text
              testID="calendar-month-name-text"
              style={customStyles.monthButtonText}
            >
              {selectedMonth}
            </Text>
            <Text
              testID="calendar-month-year-hint-text"
              style={customStyles.monthButtonSubtext}
            >
              {t("calendar.selectMonth")}
            </Text>
          </Pressable>

          <Pressable
            testID="calendar-month-next-btn"
            style={({ pressed }) => ({
              ...customStyles.navButton,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => navigateToMonth("next")}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.buttonPrimaryText}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Calendrier avec pull-to-refresh */}
      <ScrollView
        testID="calendar-month-scroll"
        style={customStyles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <MascotLoading text={t("calendar.loading")} overlay />}

        <View
          testID="calendar-month-grid-container"
          style={customStyles.calendarContainer}
        >
          {/* En-têtes des jours */}
          <View
            testID="calendar-month-days-header"
            style={customStyles.daysHeader}
          >
            {daysList.map((day) => (
              <View
                key={day}
                testID={`calendar-month-header-${day}`}
                style={customStyles.dayHeaderItem}
              >
                <Text
                  testID={`calendar-month-header-${day}-text`}
                  style={customStyles.dayHeaderText}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Grille des jours */}
          <View testID="calendar-month-days-grid" style={customStyles.daysGrid}>
            {/* Jours vides avant le début du mois */}
            {Array.from({ length: daysBefore }, (_, i) => (
              <View key={`before-${i}`} style={customStyles.emptyDayButton} />
            ))}

            {/* Jours du mois */}
            {daysArray.map((day) => {
              const dayJobs = getJobsForDay(
                day,
                selectedMonthIndex + 1,
                selectedYear,
                jobs,
              );
              return (
                <Pressable
                  key={day}
                  testID={`calendar-month-day-${day}`}
                  style={({ pressed }) => ({
                    ...(isToday(day)
                      ? customStyles.dayButtonToday
                      : customStyles.dayButton),
                    opacity: pressed ? 0.8 : 1,
                  })}
                  onPress={() =>
                    navigation.navigate("Day", {
                      day,
                      month: selectedMonthIndex + 1,
                      year: selectedYear,
                    })
                  }
                >
                  <Text
                    testID={`calendar-month-day-${day}-text`}
                    style={
                      isToday(day)
                        ? customStyles.dayTextToday
                        : customStyles.dayText
                    }
                  >
                    {day}
                  </Text>
                  <JobIndicator job={dayJobs} />
                </Pressable>
              );
            })}

            {/* Jours vides après la fin du mois */}
            {Array.from({ length: daysAfter }, (_, i) => (
              <View key={`after-${i}`} style={customStyles.emptyDayButton} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MonthCalendarScreen;
