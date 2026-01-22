/**
 * TruckDetailsSection - Section modulaire pour les détails du camion
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import SectionCard from "../SectionCard";
import VehicleAssignmentModal from "../../modals/VehicleAssignmentModal";

interface TruckDetailsSectionProps {
  job: any;
  onVehicleUpdated?: (
    vehicle: { name: string; licensePlate: string } | null,
  ) => void;
}

const TruckDetailsSection: React.FC<TruckDetailsSectionProps> = ({
  job,
  onVehicleUpdated,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Vérifier si un véhicule est assigné
  const hasVehicle = job.truck?.name || job.truck?.licensePlate;

  const handleVehicleAssigned = (
    vehicle: { name: string; licensePlate: string } | null,
  ) => {
    if (onVehicleUpdated) {
      onVehicleUpdated(vehicle);
    }
  };

  return (
    <>
      <SectionCard level="tertiary">
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {t("jobDetails.components.truckDetails.title")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {t("jobDetails.components.truckDetails.subtitle")}
              </Text>
            </View>

            {/* Bouton de gestion du véhicule */}
            <Pressable
              onPress={() => setShowAssignmentModal(true)}
              style={{
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: colors.primary + "15",
              }}
            >
              <Ionicons
                name={hasVehicle ? "pencil" : "add"}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {hasVehicle ? (
          /* Affichage du véhicule assigné */
          <View
            style={{
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 12,
              padding: DESIGN_TOKENS.spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Header avec icône camion */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: DESIGN_TOKENS.spacing.md,
                paddingBottom: DESIGN_TOKENS.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: DESIGN_TOKENS.spacing.md,
                }}
              >
                <Text style={{ fontSize: 20 }}>🚚</Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {job.truck.name}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  {t("jobDetails.components.truckDetails.primaryVehicle")}
                </Text>
              </View>
            </View>

            {/* Informations détaillées */}
            {job.truck.licensePlate && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: "500",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    🏷️ {t("jobDetails.components.truckDetails.licensePlate")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      fontWeight: "600",
                      backgroundColor: colors.background,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      textAlign: "center",
                    }}
                  >
                    {job.truck.licensePlate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* État vide - Aucun véhicule assigné */
          <View
            style={{
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 12,
              padding: DESIGN_TOKENS.spacing.xl,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 48, marginBottom: DESIGN_TOKENS.spacing.md }}
            >
              🚛
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.xs,
                textAlign: "center",
              }}
            >
              {t("jobDetails.components.truckDetails.noVehicleAssigned")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {t("jobDetails.components.truckDetails.noVehicleDescription")}
            </Text>

            <Pressable
              onPress={() => setShowAssignmentModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primary,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                borderRadius: DESIGN_TOKENS.radius.lg,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginLeft: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {t("jobDetails.components.truckDetails.addVehicleButton")}
              </Text>
            </Pressable>
          </View>
        )}
      </SectionCard>

      {/* Modal d'assignation de véhicule */}
      <VehicleAssignmentModal
        visible={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        jobId={job.id}
        currentVehicle={hasVehicle ? job.truck : null}
        onVehicleAssigned={handleVehicleAssigned}
      />
    </>
  );
};

export default TruckDetailsSection;
