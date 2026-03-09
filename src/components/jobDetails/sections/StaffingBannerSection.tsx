/**
 * StaffingBannerSection
 *
 * Bandeau visible sur la page Summary indiquant l'avancement du staffing.
 * Visible par l'Entreprise A (vue agrégée — sans détails individuels).
 *
 * Spec : docs/AVAILABILITY_ASSIGNMENT_SPEC.md — section 9.3
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import type { StaffingStatus } from "../../../types/jobAssignment";

interface StaffingBannerSectionProps {
  staffingStatus: StaffingStatus;
  contractorName?: string;
}

const CONFIG: Record<
  StaffingStatus,
  { icon: string; bg: string; text: string; label: string }
> = {
  unassigned: {
    icon: "time-outline",
    bg: "#94A3B8",
    text: "Aucune ressource affectée pour le moment",
    label: "Non pourvu",
  },
  partial: {
    icon: "time-outline",
    bg: "#F59E0B",
    text: "Équipe en cours de constitution",
    label: "Partiellement pourvu",
  },
  fully_staffed: {
    icon: "checkmark-circle",
    bg: "#22C55E",
    text: "Équipe constituée",
    label: "Équipe complète",
  },
  conflict: {
    icon: "warning-outline",
    bg: "#EF4444",
    text: "Conflit de disponibilité détecté",
    label: "Conflit",
  },
};

const StaffingBannerSection: React.FC<StaffingBannerSectionProps> = ({
  staffingStatus,
  contractorName,
}) => {
  const { colors } = useTheme();
  const cfg = CONFIG[staffingStatus];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.lg,
        backgroundColor: cfg.bg + "15",
        borderWidth: 1,
        borderColor: cfg.bg + "40",
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: cfg.bg + "25",
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <Ionicons name={cfg.icon as any} size={18} color={cfg.bg} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: cfg.bg }}>
          {cfg.label}
        </Text>
        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}
        >
          {cfg.text}
          {contractorName ? ` · Par ${contractorName}` : ""}
        </Text>
      </View>
    </View>
  );
};

export default StaffingBannerSection;
