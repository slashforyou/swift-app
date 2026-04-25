/**
 * PrepareJobSection
 *
 * Bouton de délégation — visible uniquement si aucune ressource n'est
 * encore assignée au job.  Dès qu'un camion ou un worker est affecté,
 * la délégation n'est plus pertinente et le composant se masque.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import { listAssignments } from "../../../services/jobAssignments";
import type { JobTransfer } from "../../../types/jobTransfer";

interface PrepareJobSectionProps {
  jobId: string | number;
  activeTransfer?: JobTransfer;
  onOpenWizard: (mode: "resources" | "delegate_part" | "delegate_full") => void;
  onRefresh?: () => void;
  companyId?: number;
  startAt?: string;
  endAt?: string;
}

const PrepareJobSection: React.FC<PrepareJobSectionProps> = ({
  jobId,
  activeTransfer,
  onOpenWizard,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [loading, setLoading] = useState(true);
  const [hasResources, setHasResources] = useState(false);

  const delegationActive =
    activeTransfer &&
    ["pending", "negotiating", "accepted"].includes(activeTransfer.status);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssignments(jobId);
      const active =
        result.data?.filter(
          (a) => !["cancelled", "declined", "replaced"].includes(a.status),
        ) ?? [];
      setHasResources(active.length > 0);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  // Masquer si des ressources sont déjà assignées ou si une délégation est en cours
  if (loading || hasResources || delegationActive) {
    return null;
  }

  return (
    <Pressable
      onPress={() => onOpenWizard("delegate_full")}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.lg,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: DESIGN_TOKENS.spacing.md,
        opacity: pressed ? 0.7 : 1,
        gap: 12,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary + "12",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="business-outline" size={20} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
          {t("prepareJob.delegateFull") || "Déléguer le job entier"}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
          {t("prepareJob.delegateFullDesc") || "Confier le job à une autre entreprise"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
};

export default PrepareJobSection;
