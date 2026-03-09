/**
 * TruckDetailsSection
 *
 * Affiche la section vÃ©hicule dans la fiche job.
 * Utilise AssignResourceModal (createAssignment) au lieu de updateJob
 * â†’ Ã©vite le HTTP 400 et offre la sÃ©lection d'Ã©quipage intÃ©grÃ©e.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import AssignResourceModal from "../../modals/AssignResourceModal";
import SectionCard from "../SectionCard";

interface TruckDetailsSectionProps {
  job: JobSummaryData;
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

  // RÃ©cupÃ©rer le company ID depuis le job (cessionnaire ou cÃ©dant)
  const companyId =
    job.contractor?.company_id ?? job.contractee?.company_id ?? 0;

  const hasVehicle = job.truck?.name || job.truck?.licensePlate;

  return (
    <>
      <SectionCard level="tertiary">
        {/* â”€â”€ Header â”€â”€ */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: hasVehicle ? DESIGN_TOKENS.spacing.md : 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary + "18",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="car-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: colors.text,
                  letterSpacing: -0.2,
                }}
              >
                {t("jobDetails.components.truckDetails.title")}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {t("jobDetails.components.truckDetails.subtitle")}
              </Text>
            </View>
          </View>

          {companyId > 0 && (
            <Pressable
              onPress={() => setShowAssignmentModal(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.primary + "25"
                  : colors.primary + "15",
                gap: 4,
              })}
            >
              <Ionicons
                name={hasVehicle ? "swap-horizontal-outline" : "add-outline"}
                size={16}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                {hasVehicle
                  ? t("jobDetails.components.truckDetails.assignVehicle")
                  : t("jobDetails.components.truckDetails.addVehicleButton")}
              </Text>
            </Pressable>
          )}
        </View>

        {hasVehicle ? (
          /* â”€â”€ VÃ©hicule assignÃ© â”€â”€ */
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.primary + "0C",
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderWidth: 1.5,
              borderColor: colors.primary + "30",
              padding: DESIGN_TOKENS.spacing.md,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>ðŸš›</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  letterSpacing: -0.3,
                }}
              >
                {job.truck!.name}
              </Text>
              {job.truck?.licensePlate && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.background,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.text,
                        letterSpacing: 1,
                      }}
                    >
                      {job.truck.licensePlate}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {t("jobDetails.components.truckDetails.primaryVehicle")}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: "#22C55E20",
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            </View>
          </View>
        ) : (
          /* â”€â”€ Ã‰tat vide â”€â”€ */
          <Pressable
            onPress={
              companyId > 0 ? () => setShowAssignmentModal(true) : undefined
            }
            style={({ pressed }) => ({
              alignItems: "center",
              paddingVertical: DESIGN_TOKENS.spacing.xl,
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor:
                companyId > 0
                  ? pressed
                    ? colors.primary + "60"
                    : colors.primary + "30"
                  : colors.border,
              backgroundColor:
                companyId > 0
                  ? pressed
                    ? colors.primary + "08"
                    : colors.primary + "04"
                  : colors.backgroundTertiary,
              gap: 8,
            })}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="car-outline" size={28} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
                textAlign: "center",
              }}
            >
              {t("jobDetails.components.truckDetails.noVehicleAssigned")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {companyId > 0
                ? t("jobDetails.components.truckDetails.noVehicleDescription")
                : "Aucune ressource affectÃ©e"}
            </Text>
            {companyId > 0 && (
              <View
                style={{
                  marginTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                >
                  {t("jobDetails.components.truckDetails.addVehicleButton")}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </SectionCard>

      {/* Modal d'affectation (AssignResourceModal â€” onglet vÃ©hicule + Ã©quipage) */}
      {companyId > 0 && (
        <AssignResourceModal
          visible={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onAssigned={() => {
            setShowAssignmentModal(false);
            // Signaler au parent qu'une ressource a Ã©tÃ© affectÃ©e
            onVehicleUpdated?.(null);
          }}
          jobId={job.id}
          companyId={companyId}
          startAt={job.start_window_start}
          endAt={job.end_window_end ?? job.end_window_start}
        />
      )}
    </>
  );
};

export default TruckDetailsSection;
