/**
 * JobStatusBanner - Bandeau indicateur de statut global du job
 * Affiche le statut du job + statut de paiement + signature
 */
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";

interface JobStatusBannerProps {
  job: JobSummaryData;
}

type StatusConfig = {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
};

const JobStatusBanner: React.FC<JobStatusBannerProps> = React.memo(
  ({ job }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const jobStatus = job?.status || "pending";
    const paymentStatus = job?.payment_status;
    const hasSigned = !!job?.signature_blob || !!job?.signatureDataUrl;

    const statusConfig = useMemo((): StatusConfig => {
      switch (jobStatus) {
        case "in-progress":
          return {
            label: t("jobDetails.components.statusBanner.inProgress"),
            icon: "🔄",
            bgColor: colors.warning + "15",
            textColor: colors.warning,
            borderColor: colors.warning,
          };
        case "completed":
          return {
            label: t("jobDetails.components.statusBanner.completed"),
            icon: "✅",
            bgColor: colors.success + "15",
            textColor: colors.success,
            borderColor: colors.success,
          };
        case "cancelled":
          return {
            label: t("jobDetails.components.statusBanner.cancelled"),
            icon: "❌",
            bgColor: colors.error + "15",
            textColor: colors.error,
            borderColor: colors.error,
          };
        case "accepted":
          return {
            label: t("jobDetails.components.statusBanner.accepted"),
            icon: "👍",
            bgColor: colors.info + "15",
            textColor: colors.info,
            borderColor: colors.info,
          };
        case "assigned":
          return {
            label: t("jobDetails.components.statusBanner.assigned"),
            icon: "👤",
            bgColor: colors.info + "15",
            textColor: colors.info,
            borderColor: colors.info,
          };
        case "declined":
          return {
            label: t("jobDetails.components.statusBanner.declined"),
            icon: "🚫",
            bgColor: colors.error + "15",
            textColor: colors.error,
            borderColor: colors.error,
          };
        case "pending":
        default:
          return {
            label: t("jobDetails.components.statusBanner.pending"),
            icon: "⏳",
            bgColor: colors.textSecondary + "15",
            textColor: colors.textSecondary,
            borderColor: colors.textSecondary,
          };
      }
    }, [jobStatus, colors, t]);

    const paymentLabel = useMemo(() => {
      if (!paymentStatus) return null;
      switch (paymentStatus) {
        case "paid":
          return {
            text: t("jobDetails.components.statusBanner.paid"),
            color: colors.success,
          };
        case "partial":
          return {
            text: t("jobDetails.components.statusBanner.partialPayment"),
            color: colors.warning,
          };
        case "pending":
          return {
            text: t("jobDetails.components.statusBanner.paymentPending"),
            color: colors.textSecondary,
          };
        default:
          return null;
      }
    }, [paymentStatus, colors, t]);

    const themedStyles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            backgroundColor: statusConfig.bgColor,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: statusConfig.borderColor + "40",
          },
          row: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          statusSection: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          },
          icon: {
            fontSize: 20,
            marginRight: DESIGN_TOKENS.spacing.sm,
          },
          statusLabel: {
            fontSize: 16,
            fontWeight: "700",
            color: statusConfig.textColor,
          },
          badges: {
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.xs,
          },
          badge: {
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: 2,
            borderRadius: DESIGN_TOKENS.radius.sm,
          },
          badgeText: {
            fontSize: 11,
            fontWeight: "600",
          },
        }),
      [statusConfig],
    );

    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.row}>
          <View style={themedStyles.statusSection}>
            <Text style={themedStyles.icon}>{statusConfig.icon}</Text>
            <Text style={themedStyles.statusLabel}>{statusConfig.label}</Text>
          </View>

          <View style={themedStyles.badges}>
            {paymentLabel && (
              <View
                style={[
                  themedStyles.badge,
                  { backgroundColor: paymentLabel.color + "20" },
                ]}
              >
                <Text
                  style={[
                    themedStyles.badgeText,
                    { color: paymentLabel.color },
                  ]}
                >
                  {paymentLabel.text}
                </Text>
              </View>
            )}
            {hasSigned && (
              <View
                style={[
                  themedStyles.badge,
                  { backgroundColor: colors.success + "20" },
                ]}
              >
                <Text
                  style={[themedStyles.badgeText, { color: colors.success }]}
                >
                  {t("jobDetails.components.statusBanner.signed")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  },
);

JobStatusBanner.displayName = "JobStatusBanner";

export default JobStatusBanner;
