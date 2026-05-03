// Modern day screen with enhanced UX, loading states, filters, and animations

import JobBox from "@/src/components/calendar/modernJobBox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import ContractorJobWizardModal from "../../components/calendar/ContractorJobWizardModal";
import {
    EmptyDayState,
    ErrorState,
    JobsLoadingSkeleton,
} from "../../components/calendar/DayScreenComponents";
import CreateJobModal from "../../components/modals/CreateJobModal";
import HeaderLogo from "../../components/ui/HeaderLogo";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useOnboardingTarget } from "../../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useCompanyPermissions } from "../../hooks/useCompanyPermissions";
import { Job, useJobsForDay } from "../../hooks/useJobsForDay";
import { useLocalization, useTranslation } from "../../localization";
import { formatDateWithDay } from "../../localization/formatters";
import { analytics } from "../../services/analytics";
import {
    acceptJob,
    createJob,
    CreateJobRequest,
    declineJob,
} from "../../services/jobs";

interface DayScreenProps {
  route: {
    params?: {
      day?: number;
      month?: number;
      year?: number;
    };
  };
  navigation: any;
}

const DayScreen: React.FC<DayScreenProps> = ({ route, navigation }) => {
  const { day, month, year } = route.params || {};
  const selectedDay = day || new Date().getDate();
  const selectedMonth = month || new Date().getMonth() + 1;
  const selectedYear = year || new Date().getFullYear();

  // Onboarding triggers
  const { currentStep, advanceToStep, notifyWizardStep, markStepSeen } = useOnboardingTour();
  const createJobTarget = useOnboardingTarget(4);
  const firstJobTarget = useOnboardingTarget(12);
  // React to currentStep changes so the transition isn't missed if the
  // context value updates AFTER first render.
  useEffect(() => {
    if (currentStep === 3) {
      advanceToStep(4);
    } else if (currentStep === 11) {
      advanceToStep(12);
    }
  }, [currentStep, advanceToStep]);
  // Safety net: arriving on a day view means the user is past steps 2 & 3
  // (the calendar opening + the today cell selection). Force-mark them so a
  // lingering home/month bubble can't keep blocking the visibleStep race.
  useEffect(() => {
    markStepSeen(2);
    markStepSeen(3);
  }, [markStepSeen]);

  // States for filtering and sorting
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"time" | "priority" | "status">("time");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateJobModalVisible, setIsCreateJobModalVisible] = useState(false);

  // Advance to step 5 when job creation modal becomes visible (user tapped +).
  useEffect(() => {
    if (isCreateJobModalVisible && currentStep === 4) {
      advanceToStep(5);
    }
  }, [isCreateJobModalVisible, currentStep, advanceToStep]);

  // Advance to step 12 (tap the new job) when the create-job modal closes
  // after a successful creation (currentStep === 11 means the wizard reached
  // its confirmation step). This effect fires whenever the modal visibility
  // flips, so it also covers re-entering the day screen.
  useEffect(() => {
    if (!isCreateJobModalVisible && currentStep === 11) {
      advanceToStep(12);
    }
  }, [isCreateJobModalVisible, currentStep, advanceToStep]);

  // Handler for the "+" FAB: opens the modal AND advances onboarding synchronously
  // so there is no frame where the bubble still points at the closed FAB.
  const handleOpenCreateJob = useCallback(() => {
    analytics.trackButtonPress('create_job_fab', 'DayScreen');
    setIsCreateJobModalVisible(true);
    if (currentStep === 4) {
      advanceToStep(5);
    }
  }, [currentStep, advanceToStep]);

  // States for contractor wizard
  const [wizardJob, setWizardJob] = useState<Job | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Get themed colors and styles
  const insets = useSafeAreaInsets();
  const { colors, styles: commonStyles } = useCommonThemedStyles();
  const { t } = useTranslation();
  const { currentLanguage } = useLocalization();

  // Get company permissions
  const { canCreateJob, company: currentCompany } = useCompanyPermissions();

  // Custom hook for jobs data
  const {
    jobs,
    isLoading,
    error,
    refetch,
    filteredJobs,
    totalJobs,
    completedJobs,
    pendingJobs,
  } = useJobsForDay(
    selectedDay,
    selectedMonth,
    selectedYear,
    statusFilter,
    sortBy,
  );

  // Debug logs

  // Format date for display - utilise la langue courante
  const formattedDate = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    return formatDateWithDay(date, currentLanguage, t);
  }, [selectedDay, selectedMonth, selectedYear, currentLanguage, t]);

  // Pending assignment jobs (external jobs that need accept/decline)
  const pendingAssignmentJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.assignment_status === "pending" &&
          j.contractee &&
          j.contractor &&
          j.contractee.company_id !== j.contractor.company_id,
      ),
    [jobs],
  );

  // #49 — Vehicle availability: derive truck usage from loaded jobs (no extra API call)
  const vehicleAvailability = useMemo(() => {
    const map = new Map<string, { name: string; licensePlate: string; count: number }>();
    let unassigned = 0;
    for (const job of jobs) {
      if (job.status === "cancelled") continue;
      if (job.truck?.id) {
        const key = String(job.truck.id);
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name: job.truck.name || key, licensePlate: job.truck.licensePlate || "", count: 1 });
        }
      } else {
        unassigned += 1;
      }
    }
    return { trucks: Array.from(map.values()), unassigned };
  }, [jobs]); — open wizard for pending contractor jobs, else navigate to details
  const handleJobPress = useCallback(
    (job: Job) => {
      // Onboarding: tapping the job acknowledges step 12.
      if (currentStep === 12) {
        markStepSeen(12);
      }
      analytics.trackButtonPress('open_job', 'DayScreen', { job_id: job.id });
      const isExternal =
        job.contractee &&
        job.contractor &&
        job.contractee.company_id !== job.contractor.company_id;

      // Si c'est un job externe ET que l'utilisateur est du côté contractor
      // et en négociation → ouvrir le wizard
      const currentCompanyId = currentCompany?.id;
      const isCurrentUserContractor =
        isExternal &&
        currentCompanyId != null &&
        job.contractor?.company_id === currentCompanyId;

      if (isCurrentUserContractor && job.assignment_status === "negotiating") {
        setWizardJob(job);
        setShowWizard(true);
        return;
      }

      // Cas normal (propriétaire du job ou job interne) : naviguer vers les détails
      const jobCode = job.code || job.id;
      navigation.navigate("JobDetails", {
        jobId: jobCode,
        day: selectedDay,
        month: selectedMonth,
        year: selectedYear,
        from: [
          "Calendar",
          { day: selectedDay, month: selectedMonth, year: selectedYear },
        ],
      });
    },
    [navigation, selectedDay, selectedMonth, selectedYear, currentCompany, currentStep, markStepSeen],
  );

  // Refetch jobs when screen regains focus (e.g. returning from JobDetails after vehicle change)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Handle create job
  const handleCreateJob = useCallback(
    async (jobData: CreateJobRequest) => {
      const wasFirstJob = totalJobs === 0;
      await createJob(jobData);
      await refetch(); // Refresh the jobs list

      // C6: After first job created, suggest plan selection (one-time)
      if (wasFirstJob) {
        const alreadySuggested = await AsyncStorage.getItem("plan_suggestion_shown");
        if (!alreadySuggested) {
          await AsyncStorage.setItem("plan_suggestion_shown", "1");
          setTimeout(() => {
            Alert.alert(
              t("home.onboarding.planSuggestionTitle") || "Unlock premium features",
              t("home.onboarding.planSuggestionMessage") || "Now that your first job is created, explore our plans to get the most out of Swift.",
              [
                { text: t("common.skip") || "Skip", style: "cancel" },
                {
                  text: t("home.onboarding.planSuggestionCta") || "View plans",
                  onPress: () => navigation.navigate("Subscription"),
                },
              ],
            );
          }, 500);
        }
      }
    },
    [refetch, totalJobs, navigation, t],
  );

  // Handle inline accept job
  const handleInlineAccept = useCallback(
    async (jobId: string) => {
      await acceptJob(jobId);
      await refetch();
    },
    [refetch],
  );

  // Handle inline decline job
  const handleInlineDecline = useCallback(
    async (jobId: string, reason: string) => {
      await declineJob(jobId, reason);
      await refetch();
    },
    [refetch],
  );

  // Navigate to previous/next day
  const navigateDay = useCallback(
    (direction: "prev" | "next") => {
      const currentDate = new Date(
        selectedYear,
        selectedMonth - 1,
        selectedDay,
      );
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));

      navigation.replace("Day", {
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
      });
    },
    [selectedDay, selectedMonth, selectedYear, navigation],
  );

  // Filter buttons data
  const filterOptions = [
    { key: "", label: t("calendar.filters.all"), count: totalJobs },
    {
      key: "pending",
      label: t("calendar.filters.pending"),
      count: jobs.filter((j) => j.status === "pending").length,
    },
    {
      key: "in-progress",
      label: t("calendar.filters.active"),
      count: jobs.filter((j) => j.status === "in-progress").length,
    },
    {
      key: "completed",
      label: t("calendar.filters.done"),
      count: jobs.filter((j) => j.status === "completed").length,
    },
  ];

  const sortOptions = [
    {
      key: "time" as const,
      label: t("calendar.sorting.time"),
      icon: "time" as const,
    },
    {
      key: "priority" as const,
      label: t("calendar.sorting.priority"),
      icon: "flag" as const,
    },
    {
      key: "status" as const,
      label: t("calendar.sorting.status"),
      icon: "checkmark-circle" as const,
    },
  ];

  // Custom styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.backgroundSecondary,
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
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backButton: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateContainer: {
      flex: 1,
      alignItems: "center",
      marginHorizontal: DESIGN_TOKENS.spacing.md,
    },
    dateText: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    dayNavigation: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.xs,
    },
    navButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.sm,
      padding: DESIGN_TOKENS.spacing.xs,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "700",
      color: colors.primary,
    },
    statLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginTop: 2,
    },
    content: {
      flex: 1,
      paddingBottom: 100, // Marge pour menu Samsung
    },
    filtersContainer: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filtersRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    filterButtons: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.xs,
      flexWrap: "wrap",
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    filterButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonInactive: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    filterButtonText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
    },
    sortContainer: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.xs,
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: 4,
    },
    jobsList: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.lg,
    },
    fab: {
      position: "absolute",
      right: DESIGN_TOKENS.spacing.lg,
      bottom: 120, // Above the navigation bar
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  // Render filter button
  const renderFilterButton = (option: (typeof filterOptions)[0]) => (
    <Pressable
      key={option.key}
      style={[
        styles.filterButton,
        statusFilter === option.key
          ? styles.filterButtonActive
          : styles.filterButtonInactive,
      ]}
      onPress={() => setStatusFilter(option.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          {
            color:
              statusFilter === option.key
                ? colors.buttonPrimaryText
                : colors.text,
          },
        ]}
      >
        {option.label} {option.count > 0 && `(${option.count})`}
      </Text>
    </Pressable>
  );

  // Render sort button
  const renderSortButton = (option: (typeof sortOptions)[0]) => (
    <Pressable
      key={option.key}
      style={[
        styles.sortButton,
        {
          backgroundColor:
            sortBy === option.key ? colors.primary : colors.backgroundTertiary,
        },
      ]}
      onPress={() => setSortBy(option.key)}
    >
      <Ionicons
        name={option.icon}
        size={12}
        color={
          sortBy === option.key
            ? colors.buttonPrimaryText
            : colors.textSecondary
        }
      />
      <Text
        style={[
          styles.filterButtonText,
          {
            color:
              sortBy === option.key
                ? colors.buttonPrimaryText
                : colors.textSecondary,
          },
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );

  return (
    <View testID="calendar-day-screen" style={styles.container}>
      {/* Logo */}
      <View style={{ alignItems: "center", paddingTop: insets.top }}>
        <HeaderLogo preset="sm" variant="rectangle" marginVertical={2} />
      </View>
      {/* Header unifié avec style Business et label dynamique */}
      <CalendarHeader
        navigation={navigation}
        title={formattedDate}
        useCompanyLabel={true}
        skipSafeAreaTop={true}
        onBackPress={() =>
          navigation.navigate("Month", {
            year: selectedYear,
            month: selectedMonth,
          })
        }
      />

      {/* ⚠️ Pending assignment banner */}
      {pendingAssignmentJobs.length > 0 && (
        <Pressable
          testID="calendar-day-pending-banner"
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.warning + "1A",
            borderBottomWidth: 1,
            borderBottomColor: colors.warning + "40",
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            gap: DESIGN_TOKENS.spacing.sm,
          }}
          onPress={() => {
            // Ouvrir directement le wizard sur le premier job en attente
            if (pendingAssignmentJobs[0]) {
              setWizardJob(pendingAssignmentJobs[0]);
              setShowWizard(true);
            }
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.warning + "30",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="alert-circle" size={18} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.warning,
              }}
            >
              {pendingAssignmentJobs.length === 1
                ? "1 job en attente de votre réponse"
                : `${pendingAssignmentJobs.length} jobs en attente de votre réponse`}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Appuyez pour répondre
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.warning} />
        </Pressable>
      )}

      {/* Stats */}
      <View testID="calendar-day-stats" style={styles.statsContainer}>
        <View testID="calendar-day-stats-total" style={styles.statItem}>
          <Text
            testID="calendar-day-stats-total-value"
            style={styles.statNumber}
          >
            {totalJobs}
          </Text>
          <Text
            testID="calendar-day-stats-total-label"
            style={styles.statLabel}
          >
            {t("calendar.dayScreen.stats.total")}
          </Text>
        </View>
        <View testID="calendar-day-stats-pending" style={styles.statItem}>
          <Text
            testID="calendar-day-stats-pending-value"
            style={styles.statNumber}
          >
            {pendingJobs}
          </Text>
          <Text
            testID="calendar-day-stats-pending-label"
            style={styles.statLabel}
          >
            {t("calendar.dayScreen.stats.pending")}
          </Text>
        </View>
        <View testID="calendar-day-stats-completed" style={styles.statItem}>
          <Text
            testID="calendar-day-stats-completed-value"
            style={styles.statNumber}
          >
            {completedJobs}
          </Text>
          <Text
            testID="calendar-day-stats-completed-label"
            style={styles.statLabel}
          >
            {t("calendar.dayScreen.stats.completed")}
          </Text>
        </View>
      </View>

      {/* #49 — Vehicle Availability Bar */}
      {!isLoading && totalJobs > 0 && (vehicleAvailability.trucks.length > 0 || vehicleAvailability.unassigned > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            gap: DESIGN_TOKENS.spacing.sm,
          }}
        >
          {vehicleAvailability.trucks.map((truck) => (
            <View
              key={truck.name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: truck.count > 1 ? colors.warning + "22" : colors.primary + "18",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: DESIGN_TOKENS.radius.sm,
                borderWidth: 1,
                borderColor: truck.count > 1 ? colors.warning + "60" : colors.primary + "40",
              }}
            >
              <Ionicons
                name="car-sport"
                size={13}
                color={truck.count > 1 ? colors.warning : colors.primary}
              />
              <Text style={{ fontSize: 12, color: truck.count > 1 ? colors.warning : colors.primary, fontWeight: "600" }}>
                {truck.name}
              </Text>
              <View
                style={{
                  backgroundColor: truck.count > 1 ? colors.warning : colors.primary,
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.buttonPrimaryText, fontWeight: "700" }}>
                  {truck.count}
                </Text>
              </View>
              {truck.licensePlate ? (
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {truck.licensePlate}
                </Text>
              ) : null}
            </View>
          ))}
          {vehicleAvailability.unassigned > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: colors.backgroundTertiary,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: DESIGN_TOKENS.radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="car-outline" size={13} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {t("calendar.dayScreen.vehicleBar.noVehicle")}
              </Text>
              <View
                style={{
                  backgroundColor: colors.textSecondary,
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.background, fontWeight: "700" }}>
                  {vehicleAvailability.unassigned}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Filters */}
      <View testID="calendar-day-filters" style={styles.filtersContainer}>
        <View testID="calendar-day-filters-row" style={styles.filtersRow}>
          <Text
            testID="calendar-day-filters-title"
            style={[commonStyles.subtitle, { color: colors.text }]}
          >
            {t("calendar.dayScreen.filtersTitle")}
          </Text>
          <Pressable
            testID="calendar-day-filters-toggle-btn"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name={showFilters ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {showFilters && (
          <>
            <View style={styles.filterButtons}>
              {filterOptions.map(renderFilterButton)}
            </View>
            <View style={styles.sortContainer}>
              <Text style={[styles.statLabel, { marginRight: 8 }]}>
                {t("calendar.dayScreen.sortBy")}
              </Text>
              {sortOptions.map(renderSortButton)}
            </View>
          </>
        )}
      </View>

      {/* Content */}
      <View testID="calendar-day-content" style={styles.content}>
        {error ? (
          <ErrorState error={error} onRetry={handleRefresh} />
        ) : (
          <ScrollView
            testID="calendar-day-jobs-scroll"
            style={styles.jobsList}
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
            {(() => {
              return null;
            })()}

            {isLoading ? (
              <JobsLoadingSkeleton />
            ) : filteredJobs.length > 0 ? (
              <View
                ref={firstJobTarget.ref}
                onLayout={firstJobTarget.onLayout}
              >
                {filteredJobs.map((job) => (
                  <JobBox
                    key={job.id}
                    job={job}
                    onPress={() => handleJobPress(job)}
                    onAccept={handleInlineAccept}
                    onDecline={handleInlineDecline}
                    navigation={navigation}
                    day={selectedDay}
                    month={selectedMonth}
                    year={selectedYear}
                  />
                ))}
              </View>
            ) : (
              <EmptyDayState date={formattedDate} onRefresh={handleRefresh} />
            )}
          </ScrollView>
        )}
      </View>

      {/* FAB - Create Job Button - Hidden for past dates OR if user doesn't have permission */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = new Date(
          selectedYear,
          selectedMonth - 1,
          selectedDay,
        );
        selectedDateObj.setHours(0, 0, 0, 0);
        const isPastDate = selectedDateObj < today;

        // Hide button if past date OR user doesn't have permission to create jobs
        if (isPastDate || !canCreateJob) return null;

        return (
          <Pressable
            testID="calendar-day-create-job-fab"
            ref={createJobTarget.ref}
            onLayout={createJobTarget.onLayout}
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={handleOpenCreateJob}
          >
            <Ionicons name="add" size={28} color={colors.buttonPrimaryText} />
          </Pressable>
        );
      })()}

      {/* Create Job Modal */}
      <CreateJobModal
        visible={isCreateJobModalVisible}
        onClose={() => setIsCreateJobModalVisible(false)}
        onCreateJob={handleCreateJob}
        selectedDate={new Date(selectedYear, selectedMonth - 1, selectedDay)}
        onWizardStep={(wizStep) => notifyWizardStep(wizStep)}
      />

      {/* Contractor Job Wizard Modal */}
      <ContractorJobWizardModal
        visible={showWizard}
        job={wizardJob}
        onClose={() => {
          setShowWizard(false);
          setWizardJob(null);
        }}
        onJobUpdated={async () => {
          await refetch();
        }}
      />
    </View>
  );
};

export default DayScreen;
