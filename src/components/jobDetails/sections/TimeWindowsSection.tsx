/**
 * TimeWindowsSection - Section modulaire pour les créneaux horaires
 */
import React from "react";
import { Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import SectionCard from "../SectionCard";

interface TimeWindowsSectionProps {
  job: any;
}

const TimeWindowsSection: React.FC<TimeWindowsSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // Default time margin for job windows (in hours)
  const DEFAULT_JOB_TIME_MARGIN_HOURS = 4;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // l'heure '0' doit être '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  // Calculate time window with margin if start and end are the same
  const getTimeWindowDisplay = (
    startDateString: string,
    endDateString: string,
  ) => {
    const startTime = formatTime(startDateString);
    let endTime = formatTime(endDateString);

    // If start and end are the same, calculate end = start + margin
    if (startDateString === endDateString) {
      const startDate = new Date(startDateString);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + DEFAULT_JOB_TIME_MARGIN_HOURS);
      endTime = formatTime(endDate.toISOString());
    }

    return `${startTime} - ${endTime}`;
  };

  // Get the actual values
  const startWindowStart = job.start_window_start || job.time?.startWindowStart;
  const startWindowEnd = job.start_window_end || job.time?.startWindowEnd;
  const endWindowStart = job.end_window_start || job.time?.endWindowStart;
  const endWindowEnd = job.end_window_end || job.time?.endWindowEnd;

  return (
    <SectionCard level="tertiary">
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}
        >
          {t("jobDetails.components.timeWindows.title")}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {t("jobDetails.components.timeWindows.subtitle")}
        </Text>
      </View>

      <View>
        {/* Start Window */}
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              fontWeight: "500",
              marginBottom: DESIGN_TOKENS.spacing.xs,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("jobDetails.components.timeWindows.missionStart")}
          </Text>
          <View
            style={{
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 8,
              padding: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 4,
              }}
            >
              📅 {formatDate(startWindowStart)}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.text,
                fontWeight: "600",
              }}
            >
              🕐 {getTimeWindowDisplay(startWindowStart, startWindowEnd)}
            </Text>
          </View>
        </View>

        {/* End Window */}
        <View>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              fontWeight: "500",
              marginBottom: DESIGN_TOKENS.spacing.xs,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            🏁 Fin de Mission
          </Text>
          <View
            style={{
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 8,
              padding: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 4,
              }}
            >
              📅 {formatDate(endWindowStart)}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.text,
                fontWeight: "600",
              }}
            >
              🕐 {getTimeWindowDisplay(endWindowStart, endWindowEnd)}
            </Text>
          </View>
        </View>
      </View>
    </SectionCard>
  );
};

export default TimeWindowsSection;
