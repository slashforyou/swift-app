import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../../../hooks/useThemeColor";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { Job } from "../../hooks/useJobsForDay";
import { useTranslation } from "../../localization";
// Modern job box component with enhanced UI and animations

interface JobBoxProps {
  job: Job;
  onPress: () => void;
  navigation: any;
  day: number;
  month: number;
  year: number;
}

const JobBox: React.FC<JobBoxProps> = ({
  job,
  onPress,
  navigation,
  day,
  month,
  year,
}) => {
  const colors = useThemeColors();
  const { t } = useTranslation();

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
      default:
        return {
          color: colors.textSecondary,
          backgroundColor: colors.backgroundTertiary,
          icon: "help-circle-outline" as const,
          text: t("calendar.jobStatus.unknown"),
        };
    }
  };

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
    return new Date(dateString).toLocaleTimeString("en-US", {
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
      style={({ pressed }) => ({
        ...styles.jobCard,
        transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
      onPress={onPress}
    >
      {/* Header avec référence */}
      <View style={styles.cardHeader}>
        <View style={styles.refBadge}>
          <Text style={styles.refText}>Ref: {job.code || job.id}</Text>
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
            <Text style={styles.timeLabel}>🕐 Créneau horaire</Text>
            <Text style={styles.timeValue}>{getDisplayTimeWindow()}</Text>
          </View>
        </View>
      </View>

      {/* Footer - Truck Info Moderne */}
      <View style={styles.modernTruckSection}>
        <Pressable
          style={({ pressed }) => ({
            ...styles.modernTruckCard,
            opacity: pressed ? 0.7 : 1,
          })}
          onPress={() => {
            // TODO: Navigation vers les détails du véhicule quand l'id sera disponible
            // Le type Job.truck ne contient actuellement que licensePlate et name
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
};

export default JobBox;
