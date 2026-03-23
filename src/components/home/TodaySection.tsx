/**
 * TodaySection - Section "Aujourd'hui" compacte pour la page d'accueil
 * Une seule ligne horizontale : icône + date + nombre de jobs
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useJobsForDay } from "../../hooks/useJobsForDay";
import { formatDateWithDay, useLocalization } from "../../localization";
import { HStack } from "../primitives/Stack";

interface TodaySectionProps {
  onPress: () => void;
  style?: any;
}

const TodaySection: React.FC<TodaySectionProps> = ({ onPress, style }) => {
  const { t, currentLanguage } = useLocalization();
  const { colors } = useTheme();

  // Récupérer les jobs du jour
  const today = new Date();
  const { isLoading, totalJobs, completedJobs, pendingJobs } = useJobsForDay(
    today.getDate(),
    today.getMonth() + 1,
    today.getFullYear(),
  );

  // Formatage de la date localisé
  const formattedDate = formatDateWithDay(today, currentLanguage, t);

  // Couleur du badge selon le statut
  const getBadgeColor = () => {
    if (isLoading) return colors.textSecondary;
    if (totalJobs === 0) return colors.textMuted;
    if (completedJobs === totalJobs) return colors.success;
    if (pendingJobs > 0) return colors.warning;
    return colors.primary;
  };

  return (
    <Pressable
      testID="home-today-section"
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: pressed
            ? colors.backgroundTertiary
            : colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          height: 56,
          justifyContent: "center",
        },
        style,
      ]}
    >
      <HStack gap="md" align="center">
        {/* Icône calendrier */}
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.primary,
            borderRadius: DESIGN_TOKENS.radius.md,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="today" size={20} color="white" />
        </View>

        {/* Date */}
        <Text
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            fontWeight: "600",
            textTransform: "capitalize",
          }}
        >
          {formattedDate}
        </Text>

        {/* Badge jobs */}
        <View
          style={{
            backgroundColor: getBadgeColor(),
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            minWidth: 32,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {isLoading ? "..." : totalJobs}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </HStack>
    </Pressable>
  );
};

export default TodaySection;
