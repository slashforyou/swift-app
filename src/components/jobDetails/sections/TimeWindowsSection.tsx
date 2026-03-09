/**
 * TimeWindowsSection - Créneaux horaires en grille compacte 2 colonnes
 * Ionicons au lieu d'emojis, layout épuré
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface TimeWindowsSectionProps {
  job: JobSummaryData;
}

const TimeWindowsSection: React.FC<TimeWindowsSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const DEFAULT_JOB_TIME_MARGIN_HOURS = 4;
  const getTimeWindowDisplay = (
    startDateString: string | undefined | null,
    endDateString: string | undefined | null,
  ) => {
    if (!startDateString) return "-";
    const startTime = formatTime(startDateString);
    let endTime = formatTime(endDateString || startDateString);

    if (startDateString === endDateString || !endDateString) {
      const startDate = new Date(startDateString);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + DEFAULT_JOB_TIME_MARGIN_HOURS);
        endTime = formatTime(endDate.toISOString());
      }
    }

    return `${startTime} - ${endTime}`;
  };

  const startWindowStart = job.start_window_start || job.time?.startWindowStart;
  const startWindowEnd = job.start_window_end || job.time?.startWindowEnd;
  const endWindowStart = job.end_window_start || job.time?.endWindowStart;
  const endWindowEnd = job.end_window_end || job.time?.endWindowEnd;

  const s = useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.md,
        },
        grid: {
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.sm,
        },
        cell: {
          flex: 1,
          backgroundColor: colors.backgroundTertiary,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border + "60",
        },
        cellHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        },
        iconCircle: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.xs,
        },
        cellLabel: {
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        dateRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 4,
        },
        dateIcon: {
          marginRight: 4,
        },
        dateText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        timeText: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginTop: 2,
        },
      }),
    [colors],
  );

  const renderCell = (
    label: string,
    icon: "play-circle-outline" | "flag-outline",
    color: string,
    windowStart: string | undefined | null,
    windowEnd: string | undefined | null,
  ) => (
    <View style={s.cell}>
      <View style={s.cellHeader}>
        <View style={[s.iconCircle, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[s.cellLabel, { color }]}>{label}</Text>
      </View>
      <View style={s.dateRow}>
        <Ionicons
          name="calendar-outline"
          size={13}
          color={colors.textSecondary}
          style={s.dateIcon}
        />
        <Text style={s.dateText}>{formatDate(windowStart)}</Text>
      </View>
      <Text style={s.timeText}>
        {getTimeWindowDisplay(windowStart, windowEnd)}
      </Text>
    </View>
  );

  return (
    <SectionCard level="tertiary">
      <Text style={s.title}>
        {t("jobDetails.components.timeWindows.title")}
      </Text>
      <View style={s.grid}>
        {renderCell(
          t("jobDetails.components.timeWindows.missionStart"),
          "play-circle-outline",
          colors.success,
          startWindowStart,
          startWindowEnd,
        )}
        {renderCell(
          t("jobDetails.components.timeWindows.missionEnd"),
          "flag-outline",
          colors.error,
          endWindowStart,
          endWindowEnd,
        )}
      </View>
    </SectionCard>
  );
};

export default TimeWindowsSection;
