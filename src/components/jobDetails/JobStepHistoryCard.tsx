/**
 * JobStepHistoryCard - Affiche l'historique détaillé des étapes avec durées réelles
 * Utilise step_history depuis l'API au lieu du timer local
 */

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";

export interface JobStepHistory {
  step: number;
  step_name: string;
  started_at: string | null;
  completed_at: string | null;
  duration_hours: number | null;
  is_current: boolean;
}

export interface JobTimerInfo {
  step_history: JobStepHistory[];
  timer_billable_hours: number;
  timer_break_hours: number;
  timer_is_running: boolean;
  timer_started_at: string | null;
  timer_completed_at: string | null;
}

interface JobStepHistoryCardProps {
  timerInfo: JobTimerInfo;
}

export const JobStepHistoryCard: React.FC<JobStepHistoryCardProps> = ({
  timerInfo,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const {
    step_history,
    timer_billable_hours,
    timer_break_hours,
    timer_is_running,
  } = timerInfo;

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          padding: 16,
          marginVertical: 8,
          marginHorizontal: 16,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        },
        title: {
          fontSize: 18,
          fontWeight: "bold",
          color: colors.text,
        },
        runningBadge: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${colors.success}20`,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        },
        pulseDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success,
          marginRight: 6,
        },
        runningText: {
          fontSize: 12,
          color: colors.success,
          fontWeight: "600",
        },
        stepList: {
          gap: 12,
        },
        stepItem: {
          backgroundColor:
            colors.backgroundTertiary || colors.backgroundSecondary,
          borderRadius: 8,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: colors.textSecondary,
        },
        stepItemCurrent: {
          backgroundColor: `${colors.warning}20`,
          borderLeftColor: colors.warning,
        },
        stepItemCompleted: {
          backgroundColor: `${colors.success}20`,
          borderLeftColor: colors.success,
        },
        stepHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        },
        stepNumberContainer: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        },
        stepNumber: {
          fontSize: 16,
          fontWeight: "bold",
          color: colors.text,
        },
        stepInfo: {
          flex: 1,
        },
        stepName: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 2,
        },
        currentLabel: {
          fontSize: 12,
          color: colors.warning,
          fontWeight: "500",
        },
        completedLabel: {
          fontSize: 12,
          color: colors.success,
          fontWeight: "500",
        },
        durationRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 4,
        },
        durationLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        durationValue: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        timestampRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 2,
        },
        timestampLabel: {
          fontSize: 11,
          color: colors.textMuted || colors.textSecondary,
        },
        timestampValue: {
          fontSize: 11,
          color: colors.textSecondary,
        },
        emptyState: {
          alignItems: "center",
          paddingVertical: 32,
        },
        emptyText: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        emptyHint: {
          fontSize: 12,
          color: colors.textMuted || colors.textSecondary,
        },
        footer: {
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        summaryRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        summaryLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        summaryValue: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.text,
        },
        summaryLabelBold: {
          fontSize: 14,
          fontWeight: "bold",
          color: colors.text,
        },
        summaryValueBold: {
          fontSize: 14,
          fontWeight: "bold",
          color: colors.warning,
        },
        separatorLine: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 8,
        },
      }),
    [colors],
  );

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === 0) return "-";

    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}j ${remainingHours}h`;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={themedStyles.container}>
      {/* Header */}
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>
          {t("jobDetails.components.stepHistory.title")}
        </Text>
        {timer_is_running && (
          <View style={themedStyles.runningBadge}>
            <View style={themedStyles.pulseDot} />
            <Text style={themedStyles.runningText}>
              {t("jobDetails.components.stepHistory.running")}
            </Text>
          </View>
        )}
      </View>

      {/* Step History List */}
      {step_history && step_history.length > 0 ? (
        <View style={themedStyles.stepList}>
          {step_history.map((stepItem, index) => (
            <View
              key={`step-history-${stepItem.step}-${index}`}
              style={[
                themedStyles.stepItem,
                stepItem.is_current && themedStyles.stepItemCurrent,
                stepItem.completed_at && themedStyles.stepItemCompleted,
              ]}
            >
              {/* Step Number & Name */}
              <View style={themedStyles.stepHeader}>
                <View style={themedStyles.stepNumberContainer}>
                  <Text style={themedStyles.stepNumber}>{stepItem.step}</Text>
                </View>
                <View style={themedStyles.stepInfo}>
                  <Text style={themedStyles.stepName}>
                    {stepItem.step_name}
                  </Text>
                  {stepItem.is_current && (
                    <Text style={themedStyles.currentLabel}>
                      {t("jobDetails.components.stepHistory.currentStep")}
                    </Text>
                  )}
                  {stepItem.completed_at && (
                    <Text style={themedStyles.completedLabel}>
                      {t("jobDetails.components.stepHistory.completed")}
                    </Text>
                  )}
                </View>
              </View>

              {/* Duration */}
              <View style={themedStyles.durationRow}>
                <Text style={themedStyles.durationLabel}>
                  {t("jobDetails.components.stepHistory.duration")}
                </Text>
                <Text style={themedStyles.durationValue}>
                  {formatDuration(stepItem.duration_hours)}
                </Text>
              </View>

              {/* Timestamps */}
              {stepItem.started_at && (
                <View style={themedStyles.timestampRow}>
                  <Text style={themedStyles.timestampLabel}>
                    {t("jobDetails.components.stepHistory.startedAt")}
                  </Text>
                  <Text style={themedStyles.timestampValue}>
                    {formatDateTime(stepItem.started_at)}
                  </Text>
                </View>
              )}
              {stepItem.completed_at && (
                <View style={themedStyles.timestampRow}>
                  <Text style={themedStyles.timestampLabel}>
                    {t("jobDetails.components.stepHistory.completedAt")}
                  </Text>
                  <Text style={themedStyles.timestampValue}>
                    {formatDateTime(stepItem.completed_at)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={themedStyles.emptyState}>
          <Text style={themedStyles.emptyText}>
            {t("jobDetails.components.stepHistory.noHistory")}
          </Text>
          <Text style={themedStyles.emptyHint}>
            {t("jobDetails.components.stepHistory.noHistoryHint")}
          </Text>
        </View>
      )}

      {/* Summary Footer */}
      <View style={themedStyles.footer}>
        <View style={themedStyles.summaryRow}>
          <Text style={themedStyles.summaryLabel}>
            {t("jobDetails.components.stepHistory.billableHours")}
          </Text>
          <Text style={themedStyles.summaryValue}>
            {formatDuration(timer_billable_hours)}
          </Text>
        </View>
        <View style={themedStyles.summaryRow}>
          <Text style={themedStyles.summaryLabel}>
            {t("jobDetails.components.stepHistory.breakTime")}
          </Text>
          <Text style={themedStyles.summaryValue}>
            {formatDuration(timer_break_hours)}
          </Text>
        </View>
        <View style={themedStyles.separatorLine} />
        <View style={themedStyles.summaryRow}>
          <Text style={themedStyles.summaryLabelBold}>
            {t("jobDetails.components.stepHistory.total")}
          </Text>
          <Text style={themedStyles.summaryValueBold}>
            {formatDuration(timer_billable_hours + timer_break_hours)}
          </Text>
        </View>
      </View>
    </View>
  );
};
