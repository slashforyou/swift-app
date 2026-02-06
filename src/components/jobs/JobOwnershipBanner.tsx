/**
 * JobOwnershipBanner - Affiche clairement à qui appartient le job
 * et le statut de l'assignation si applicable
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

export interface JobOwnership {
  // Contractee (créateur du job, reçoit le paiement)
  contractee: {
    company_id: number;
    company_name: string;
    created_by_name?: string;
  };

  // Contractor (exécutant assigné)
  contractor: {
    company_id: number;
    company_name: string;
    assigned_staff_name?: string;
  };

  // Statut de l'assignation
  assignment_status: "none" | "pending" | "accepted" | "declined";

  // Permissions de l'utilisateur
  permissions: {
    is_owner: boolean;
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
  };
}

interface JobOwnershipBannerProps {
  ownership: JobOwnership;
  variant?: "compact" | "full";
}

export const JobOwnershipBanner: React.FC<JobOwnershipBannerProps> = ({
  ownership,
  variant = "compact",
}) => {
  const { colors } = useTheme();
  // Validation défensive - Vérifier que toutes les données nécessaires existent
  if (
    !ownership ||
    !ownership.contractee ||
    !ownership.contractor ||
    !ownership.permissions
  ) {
    console.warn(
      "⚠️ [JobOwnershipBanner] Données ownership incomplètes - composant masqué",
      {
        hasOwnership: !!ownership,
        hasContractee: !!ownership?.contractee,
        hasContractor: !!ownership?.contractor,
        hasPermissions: !!ownership?.permissions,
        hasAssignmentStatus: !!ownership?.assignment_status,
      },
    );
    return null;
  }
  const { contractee, contractor, assignment_status, permissions } = ownership;
  const isDifferentCompany = contractee.company_id !== contractor.company_id;

  console.log("👑 [JobOwnershipBanner] Rendu:", {
    variant,
    isDifferentCompany,
    assignmentStatus: assignment_status,
    isOwner: permissions.is_owner,
    isAssigned: permissions.is_assigned,
    contracteeName: contractee.company_name,
    contractorName: contractor.company_name,
  });

  // Ne rien afficher si même company et pas d'assignation externe
  if (!isDifferentCompany && assignment_status === "none") {
    return null;
  }

  const getStatusInfo = () => {
    switch (assignment_status) {
      case "pending":
        return {
          text: "En attente d'acceptation",
          icon: "time-outline" as const,
          color: colors.warning,
          bgColor: colors.warning + "20",
        };
      case "accepted":
        return {
          text: "Accepté",
          icon: "checkmark-circle-outline" as const,
          color: colors.success,
          bgColor: colors.success + "20",
        };
      case "declined":
        return {
          text: "Refusé",
          icon: "close-circle-outline" as const,
          color: colors.error,
          bgColor: colors.error + "20",
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: isDifferentCompany ? colors.info : colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: variant === "full" ? DESIGN_TOKENS.spacing.sm : 0,
    },
    icon: {
      marginRight: DESIGN_TOKENS.spacing.xs,
    },
    title: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      flex: 1,
    },
    companyName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    value: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: 4,
      borderRadius: DESIGN_TOKENS.radius.sm,
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

  if (variant === "compact") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons
            name={isDifferentCompany ? "business-outline" : "home-outline"}
            size={16}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.title}>
            {permissions.is_owner
              ? "Votre Job"
              : `Job de: ${contractee.company_name}`}
          </Text>
        </View>

        {statusInfo && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bgColor },
            ]}
          >
            <Ionicons
              name={statusInfo.icon}
              size={14}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full variant
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="people-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.icon}
        />
        <Text style={styles.title}>Parties Impliquées</Text>
      </View>

      <View>
        <View style={styles.row}>
          <Text style={styles.label}>Créateur (Contractee):</Text>
        </View>
        <Text style={styles.companyName}>{contractee.company_name}</Text>
        {contractee.created_by_name && (
          <Text style={[styles.label, { marginTop: 2 }]}>
            par {contractee.created_by_name}
          </Text>
        )}
      </View>

      {isDifferentCompany && (
        <>
          <View style={styles.divider} />

          <View>
            <View style={styles.row}>
              <Text style={styles.label}>Exécutant (Contractor):</Text>
            </View>
            <Text style={styles.companyName}>{contractor.company_name}</Text>
            {contractor.assigned_staff_name && (
              <Text style={[styles.label, { marginTop: 2 }]}>
                Assigné à {contractor.assigned_staff_name}
              </Text>
            )}
          </View>
        </>
      )}

      {statusInfo && (
        <View
          style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}
        >
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      )}
    </View>
  );
};

export default JobOwnershipBanner;
