import Ionicons from "@react-native-vector-icons/ionicons";
import React, { memo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useThemeColors } from "../../../hooks/useThemeColor";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { Job } from "../../hooks/useJobsForDay";
import { useLocalization } from "../../localization";
import { getLocale } from "../../localization/formatters";
// Modern job box component with enhanced UI and animations

interface JobBoxProps {
  job: Job;
  onPress: () => void;
  onAccept?: (jobId: string) => Promise<void>;
  onDecline?: (jobId: string, reason: string) => Promise<void>;
  navigation: any;
  day: number;
  month: number;
  year: number;
}

/**
 * Inline accept/decline actions for pending contractor assignments
 */
const PendingAssignmentActions: React.FC<{
  jobId: string;
  onAccept: (jobId: string) => Promise<void>;
  onDecline: (jobId: string, reason: string) => Promise<void>;
  colors: any;
  t: (key: string) => string;
}> = ({ jobId, onAccept, onDecline, colors, t }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const handleAccept = async () => {
    Alert.alert(
      t("contractorWizard.jobAccepted"),
      t("contractorWizard.acceptJobQuestion"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("contractorWizard.respond"),
          onPress: async () => {
            setIsAccepting(true);
            try {
              await onAccept(jobId);
            } finally {
              setIsAccepting(false);
            }
          },
        },
      ],
    );
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return;
    setIsDeclining(true);
    try {
      await onDecline(jobId, declineReason.trim());
    } finally {
      setIsDeclining(false);
      setShowDeclineInput(false);
      setDeclineReason("");
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        paddingVertical: DESIGN_TOKENS.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.warning + "30",
        backgroundColor: colors.warning + "08",
      }}
    >
      {!showDeclineInput ? (
        <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
          <Pressable
            onPress={() => setShowDeclineInput(true)}
            disabled={isAccepting}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1.5,
              borderColor: colors.error,
              backgroundColor: pressed ? colors.error + "15" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              opacity: isAccepting ? 0.5 : 1,
            })}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={colors.error}
            />
            <Text
              style={{ color: colors.error, fontWeight: "600", fontSize: 14 }}
            >
              {t("contractorWizard.refuse")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleAccept}
            disabled={isAccepting || isDeclining}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: pressed ? colors.success + "DD" : colors.success,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              opacity: isDeclining ? 0.5 : 1,
            })}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                />
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  {t("contractorWizard.respond")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
          <TextInput
            placeholder={t("contractorWizard.refusalPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={declineReason}
            onChangeText={setDeclineReason}
            multiline
            maxLength={500}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.sm,
              color: colors.text,
              fontSize: 14,
              minHeight: 60,
              backgroundColor: colors.backgroundSecondary,
            }}
          />
          <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
            <Pressable
              onPress={() => {
                setShowDeclineInput(false);
                setDeclineReason("");
              }}
              style={{
                flex: 1,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                {t("common.cancel")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDecline}
              disabled={isDeclining || !declineReason.trim()}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: !declineReason.trim()
                  ? colors.error + "60"
                  : pressed
                    ? colors.error + "DD"
                    : colors.error,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              })}
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {t("contractorWizard.confirmRefusal")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const JobBox: React.FC<JobBoxProps> = memo(function JobBox({
  job,
  onPress,
  onAccept,
  onDecline,
  navigation,
  day,
  month,
  year,
}) {
  const colors = useThemeColors();
  const { t, currentLanguage } = useLocalization();

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: colors.warning,
          backgroundColor: colors.backgroundTertiary,
          icon: "time-outline" as const,
          text: t("calendar.jobStatus.pending"),
        };
      case "assigned":
        return {
          color: colors.info,
          backgroundColor: colors.backgroundTertiary,
          icon: "person-add-outline" as const,
          text: t("calendar.jobStatus.assigned"),
        };
      case "accepted":
        return {
          color: colors.success,
          backgroundColor: colors.backgroundTertiary,
          icon: "checkmark-circle-outline" as const,
          text: t("calendar.jobStatus.accepted"),
        };
      case "declined":
        return {
          color: colors.error,
          backgroundColor: colors.backgroundTertiary,
          icon: "close-circle-outline" as const,
          text: t("calendar.jobStatus.declined"),
        };
      case "in-progress":
        return {
          color: colors.info,
          backgroundColor: colors.backgroundTertiary,
          icon: "play-circle-outline" as const,
          text: t("calendar.jobStatus.inProgress"),
        };
      case "completed":
        return {
          color: colors.success,
          backgroundColor: colors.backgroundTertiary,
          icon: "checkmark-circle-outline" as const,
          text: t("calendar.jobStatus.completed"),
        };
      case "cancelled":
        return {
          color: colors.error,
          backgroundColor: colors.backgroundTertiary,
          icon: "close-circle-outline" as const,
          text: t("calendar.jobStatus.cancelled"),
        };
      case "overdue":
        return {
          color: colors.error,
          backgroundColor: colors.backgroundTertiary,
          icon: "alert-circle-outline" as const,
          text: t("calendar.jobStatus.overdue"),
        };
      default:
        return {
          color: colors.textSecondary,
          backgroundColor: colors.backgroundTertiary,
          icon: "help-circle-outline" as const,
          text: t("calendar.jobStatus.unknown"),
        };
    }
  };

  // ──────────────────────────────────────────────────────
  // Contractor / Assigned job helpers
  // ──────────────────────────────────────────────────────
  const isExternalJob =
    !!job.contractee &&
    !!job.contractor &&
    job.contractee.company_id !== job.contractor.company_id;

  const isPendingAssignment =
    job.assignment_status === "pending" && isExternalJob;
  const isAcceptedAssignment =
    job.assignment_status === "accepted" && isExternalJob;
  const isNegotiatingAssignment =
    job.assignment_status === "negotiating" && isExternalJob;
  const contracteeName = job.contractee?.company_name || "";

  // Priority configuration
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          color: colors.error,
          text: t("calendar.priority.urgent"),
          icon: "flash" as const,
        };
      case "high":
        return {
          color: colors.warning,
          text: t("calendar.priority.high"),
          icon: "alert-circle" as const,
        };
      case "medium":
        return {
          color: colors.info,
          text: t("calendar.priority.medium"),
          icon: "information-circle" as const,
        };
      case "low":
        return {
          color: colors.success,
          text: t("calendar.priority.low"),
          icon: "checkmark-circle" as const,
        };
      default:
        return {
          color: colors.textSecondary,
          text: t("calendar.priority.normal"),
          icon: "remove-circle" as const,
        };
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(getLocale(currentLanguage), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Default time margin for job windows (in hours) - should match CreateJobModal
  const DEFAULT_JOB_TIME_MARGIN_HOURS = 4;

  // Calculate end time with margin if start and end are the same
  const getDisplayTimeWindow = () => {
    const startTime = formatTime(job.time.startWindowStart);
    let endTime = formatTime(job.time.startWindowEnd);

    // If start and end are the same, calculate end = start + margin
    if (job.time.startWindowStart === job.time.startWindowEnd) {
      const startDate = new Date(job.time.startWindowStart);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + DEFAULT_JOB_TIME_MARGIN_HOURS);
      endTime = formatTime(endDate.toISOString());
    }

    return `${startTime} - ${endTime}`;
  };

  const statusConfig = getStatusConfig(job.status);
  const priorityConfig = getPriorityConfig(job.priority);

  const styles = StyleSheet.create({
    jobCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.md,
    },
    refBadge: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: 4,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    refText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    cardContent: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    clientRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    clientTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    clientTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
    },
    clientName: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    addressText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    timeSection: {
      backgroundColor: colors.backgroundTertiary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginVertical: DESIGN_TOKENS.spacing.md,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontWeight: "600",
    },
    timeValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "600",
    },
    truckSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
    },
    truckInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
      flex: 1,
    },
    truckText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "500",
    },
    licensePlate: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    licensePlateText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.buttonPrimaryText,
      fontWeight: "700",
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
    },
    actionButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
    },
    // Contractor assignment banner
    assignmentBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: 8,
      gap: 6,
      borderBottomWidth: 1,
    },
    assignmentBannerText: {
      fontSize: 12,
      fontWeight: "700" as const,
      flex: 1,
    },
    assignmentActionBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: 3,
    },
    assignmentActionBadgeText: {
      fontSize: 11,
      fontWeight: "700" as const,
    },
    // Styles modernes pour la section truck
    modernTruckSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modernTruckCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundTertiary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      flex: 1,
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    truckIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    truckDetails: {
      flex: 1,
    },
    truckName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    licensePlateModern: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    licensePlateModernText: {
      fontSize: 11,
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      letterSpacing: 1,
    },
    modernActionButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    modernActionText: {
      color: colors.buttonPrimaryText,
      fontSize: 14,
      fontWeight: "600",
    },
  });

  return (
    <Pressable
      testID={`job-card-${job.id}`}
      style={({ pressed }) => ({
        ...styles.jobCard,
        transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        opacity: pressed ? 0.9 : 1,
        borderColor: isPendingAssignment
          ? colors.warning
          : isNegotiatingAssignment
            ? colors.info + "80"
            : isAcceptedAssignment
              ? colors.success + "80"
              : colors.border,
        borderWidth:
          isPendingAssignment || isAcceptedAssignment || isNegotiatingAssignment
            ? 1.5
            : 1,
      })}
      onPress={onPress}
    >
      {/* ── Contractor assignment banner ── */}
      {isExternalJob && (
        <View
          style={[
            styles.assignmentBanner,
            {
              backgroundColor: isPendingAssignment
                ? colors.warning + "18"
                : isNegotiatingAssignment
                  ? colors.info + "15"
                  : colors.success + "15",
              borderBottomColor: isPendingAssignment
                ? colors.warning + "40"
                : isNegotiatingAssignment
                  ? colors.info + "30"
                  : colors.success + "30",
            },
          ]}
        >
          <Ionicons
            name="business-outline"
            size={14}
            color={
              isPendingAssignment
                ? colors.warning
                : isNegotiatingAssignment
                  ? colors.info
                  : colors.success
            }
          />
          <Text
            style={[
              styles.assignmentBannerText,
              {
                color: isPendingAssignment
                  ? colors.warning
                  : isNegotiatingAssignment
                    ? colors.info
                    : colors.success,
              },
            ]}
            numberOfLines={1}
          >
            {isPendingAssignment
              ? `${t("contractorWizard.assignedBy")} ${contracteeName}`
              : contracteeName}
          </Text>
          {isPendingAssignment && (
            <View
              style={[
                styles.assignmentActionBadge,
                { backgroundColor: colors.warning + "25" },
              ]}
            >
              <Ionicons name="alert-circle" size={11} color={colors.warning} />
              <Text
                style={[
                  styles.assignmentActionBadgeText,
                  { color: colors.warning },
                ]}
              >
                {t("assignmentActions.actionRequired")}
              </Text>
            </View>
          )}
          {isAcceptedAssignment && (
            <View
              style={[
                styles.assignmentActionBadge,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={11}
                color={colors.success}
              />
              <Text
                style={[
                  styles.assignmentActionBadgeText,
                  { color: colors.success },
                ]}
              >
                {t("transfer.acceptedStatus")}
              </Text>
            </View>
          )}
          {isNegotiatingAssignment && (
            <View
              style={[
                styles.assignmentActionBadge,
                { backgroundColor: colors.info + "20" },
              ]}
            >
              <Ionicons name="swap-horizontal" size={11} color={colors.info} />
              <Text
                style={[
                  styles.assignmentActionBadgeText,
                  { color: colors.info },
                ]}
              >
                {t("transfer.negotiating")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Header avec référence */}
      <View style={styles.cardHeader}>
        <View style={styles.refBadge}>
          <Text style={styles.refText}>{t("contractorWizard.reference")}: {job.code || job.id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.backgroundColor },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusConfig.color}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Titre Client et Priorité */}
        <View style={styles.clientTitleRow}>
          <Text style={styles.clientTitle}>
            {job.client.firstName} {job.client.lastName}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityConfig.color + "20" },
            ]}
          >
            <Ionicons
              name={priorityConfig.icon}
              size={10}
              color={priorityConfig.color}
            />
            <Text
              style={[styles.priorityText, { color: priorityConfig.color }]}
            >
              {priorityConfig.text}
            </Text>
          </View>
        </View>

        {/* Addresses */}
        {job.addresses[0]?.street ? (
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.info} />
            <Text style={styles.addressText}>
              {job.addresses[0].street}
              {job.addresses[0].city ? `, ${job.addresses[0].city}` : ""}
            </Text>
          </View>
        ) : (
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.addressText, { fontStyle: "italic" }]}>
              {t("calendar.dayScreen.noPickupAddress")}
            </Text>
          </View>
        )}

        {job.addresses[1]?.street ? (
          <View style={styles.addressRow}>
            <Ionicons name="flag" size={16} color={colors.success} />
            <Text style={styles.addressText}>
              {job.addresses[1].street}
              {job.addresses[1].city ? `, ${job.addresses[1].city}` : ""}
            </Text>
          </View>
        ) : job.addresses.length > 1 ? (
          <View style={styles.addressRow}>
            <Ionicons name="flag" size={16} color={colors.textSecondary} />
            <Text style={[styles.addressText, { fontStyle: "italic" }]}>
              {t("calendar.dayScreen.noDeliveryAddress")}
            </Text>
          </View>
        ) : null}

        {/* Time Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>
              🕐 {t("calendar.dayScreen.timeSlot")}
            </Text>
            <Text style={styles.timeValue}>{getDisplayTimeWindow()}</Text>
          </View>
        </View>
      </View>

      {/* Inline Accept/Decline actions for pending assignments */}
      {isPendingAssignment && onAccept && onDecline && (
        <PendingAssignmentActions
          jobId={job.id}
          onAccept={onAccept}
          onDecline={onDecline}
          colors={colors}
          t={t}
        />
      )}

      {/* Footer - Truck Info Moderne */}
      <View style={styles.modernTruckSection}>
        <Pressable
          style={({ pressed }) => ({
            ...styles.modernTruckCard,
            opacity: pressed ? 0.7 : 1,
          })}
          onPress={() => {
            if (job.truck.id) {
              navigation.navigate("Business", { initialTab: "Trucks" });
            }
          }}
        >
          <View style={styles.truckIconContainer}>
            <Ionicons
              name={job.truck.name ? "car-sport" : "car-sport-outline"}
              size={20}
              color={job.truck.name ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={styles.truckDetails}>
            <Text
              style={[
                styles.truckName,
                !job.truck.name && {
                  color: colors.textSecondary,
                  fontStyle: "italic",
                },
              ]}
            >
              {job.truck.name || t("calendar.dayScreen.noVehicleSelected")}
            </Text>
            {job.truck.licensePlate ? (
              <View style={styles.licensePlateModern}>
                <Text style={styles.licensePlateModernText}>
                  {job.truck.licensePlate}
                </Text>
              </View>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => ({
            ...styles.modernActionButton,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
          onPress={() =>
            navigation.navigate("JobDetails", {
              jobId: job.code || job.id,
              day,
              month,
              year,
              initialTab: "job",
              from: ["Calendar", { day, month, year }],
            })
          }
        >
          <Ionicons
            name="arrow-forward"
            size={16}
            color={colors.buttonPrimaryText}
          />
          <Text style={styles.modernActionText}>
            {t("calendar.dayScreen.details")}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

export default JobBox;
