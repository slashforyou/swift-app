/**
 * JobContractSection — Contract section in job client tab
 * Auto-generates contract on load and shows clauses for reading before signing
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    fetchJobContract,
    generateJobContract,
    JobContract,
} from "../../services/contractsService";

interface JobContractSectionProps {
  jobId: number;
  onSignPress?: () => void;
}

const JobContractSection: React.FC<JobContractSectionProps> = ({
  jobId,
  onSignPress,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [contract, setContract] = useState<JobContract | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-fetch or auto-generate contract on mount
  const loadOrGenerateContract = useCallback(async () => {
    try {
      // Try to fetch existing contract first
      const existing = await fetchJobContract(jobId);
      if (existing) {
        setContract(existing);
        return;
      }
    } catch {
      // No contract yet — auto-generate
    }

    try {
      const generated = await generateJobContract(jobId);
      setContract(generated);
    } catch {
      // No clauses configured or generation failed — hide section
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadOrGenerateContract();
  }, [loadOrGenerateContract]);

  if (loading && !contract) {
    return (
      <Card style={{ padding: DESIGN_TOKENS.spacing.lg, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.tint} />
      </Card>
    );
  }

  // No contract and no clauses configured — hide section entirely
  if (!contract || contract.clauses.length === 0) {
    return null;
  }

  const isSigned = contract.status === "signed";

  return (
    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Ionicons name="document-text" size={22} color={colors.tint} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            {t("contracts.contractSection")}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {contract.clauses.length} {t("contracts.clausesCount")}
          </Text>
        </View>
        {isSigned && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#34C75915",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              gap: 4,
            }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#34C759" />
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#34C759" }}>
              {t("contracts.signed")}
            </Text>
          </View>
        )}
      </View>

      {/* Clauses — always visible for reading */}
      {contract.clauses.map((clause, index) => (
        <View
          key={clause.id}
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            marginBottom: index < contract.clauses.length - 1 ? 8 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 6,
            }}
          >
            {index + 1}. {clause.clause_title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 19,
            }}
          >
            {clause.clause_content}
          </Text>
        </View>
      ))}

      {/* Sign button — only when not yet signed */}
      {!isSigned && onSignPress && (
        <Pressable
          onPress={onSignPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tint,
            borderRadius: 10,
            paddingVertical: 12,
            gap: 8,
            marginTop: 16,
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityLabel="Sign contract"
          accessibilityRole="button"
        >
          <Ionicons name="pencil-outline" size={18} color="#FFF" />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>
            {t("contracts.signButton")}
          </Text>
        </Pressable>
      )}
    </Card>
  );
};

export default JobContractSection;
