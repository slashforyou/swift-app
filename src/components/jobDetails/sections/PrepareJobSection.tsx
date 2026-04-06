/**
 * PrepareJobSection
 *
 * Checklist de préparation affichée dans le summary tant que le job
 * n'est pas démarré.  Trois étapes :
 *   1. Ajouter un véhicule (ou cocher « pas de véhicule »)
 *   2. Ajouter un ou plusieurs travailleurs
 *   3. Ou : déléguer le job entier
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import { listAssignments } from "../../../services/jobAssignments";
import type { JobTransfer } from "../../../types/jobTransfer";
import AssignResourceModal from "../../modals/AssignResourceModal";

interface PrepareJobSectionProps {
  jobId: string | number;
  activeTransfer?: JobTransfer;
  /** Ouvrir le wizard avec un mode pré-sélectionné */
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
  onRefresh,
  companyId,
  startAt,
  endAt,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [loading, setLoading] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasWorkers, setHasWorkers] = useState(false);
  const [noVehicleNeeded, setNoVehicleNeeded] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const isFullyDelegated =
    activeTransfer &&
    activeTransfer.delegated_role === "full_job" &&
    ["pending", "negotiating", "accepted"].includes(activeTransfer.status);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssignments(jobId);
      const active =
        result.data?.filter(
          (a) => !["cancelled", "declined", "replaced"].includes(a.status),
        ) ?? [];
      setHasVehicle(active.some((a) => a.resource_type === "vehicle"));
      const workers = active.filter((a) => a.resource_type !== "vehicle");
      setHasWorkers(workers.length > 0);
      setWorkerCount(workers.length);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  // Step completion
  const vehicleDone = hasVehicle || noVehicleNeeded;
  const workersDone = hasWorkers || !!isFullyDelegated;
  const delegationActive =
    activeTransfer &&
    ["pending", "negotiating", "accepted"].includes(activeTransfer.status);

  const renderStep = (
    icon: string,
    title: string,
    subtitle: string,
    done: boolean,
    onPress: () => void,
    extra?: React.ReactNode,
  ) => (
    <Pressable
      onPress={done ? undefined : onPress}
      disabled={done}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        backgroundColor: done
          ? colors.success + "08"
          : colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: done ? colors.success + "30" : colors.border,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        opacity: pressed && !done ? 0.7 : 1,
      })}
    >
      {/* Check / icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: done ? colors.success + "18" : colors.primary + "12",
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Ionicons
          name={(done ? "checkmark-circle" : icon) as any}
          size={20}
          color={done ? colors.success : colors.primary}
        />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: done ? colors.success : colors.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 1,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* Extra or chevron */}
      {extra ??
        (!done && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        ))}
    </Pressable>
  );

  // Masquer entièrement si ressources assignées ou job délégué
  if (!loading && (hasVehicle || hasWorkers || isFullyDelegated)) {
    return null;
  }

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.md,
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        overflow: "hidden",
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingTop: DESIGN_TOKENS.spacing.md,
          paddingBottom: DESIGN_TOKENS.spacing.sm,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="clipboard-outline" size={14} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
          {t("prepareJob.title") || "Préparer le job"}
        </Text>
      </View>

      {/* Steps */}
      <View
        style={{
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        {/* 1. Véhicule / Travailleurs — masqué si délégation active */}
        {!delegationActive && renderStep(
          "people-outline",
          t("prepareJob.addVehicleWorker") || "Add vehicle / worker",
          vehicleDone && workersDone
            ? isFullyDelegated
              ? t("prepareJob.jobDelegated") || "Job fully delegated"
              : [
                  hasVehicle
                    ? t("prepareJob.vehicleAssigned") || "Vehicle assigned"
                    : null,
                  workerCount > 0
                    ? `${workerCount} ${t("prepareJob.workersAssigned") || "worker(s) assigned"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || t("prepareJob.allAssigned") || "All assigned"
            : t("prepareJob.addVehicleWorkerDesc") ||
                "Assign a vehicle and/or workers to this job",
          vehicleDone && workersDone,
          () => setShowAssignModal(true),
          /* Checkbox "pas de véhicule" — visible seulement si pas encore de véhicule */
          !hasVehicle ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                setNoVehicleNeeded((v) => !v);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                }}
              >
                {t("prepareJob.notNeeded") || "Not needed"}
              </Text>
              <Switch
                value={noVehicleNeeded}
                onValueChange={setNoVehicleNeeded}
                trackColor={{
                  false: colors.border,
                  true: colors.success + "60",
                }}
                thumbColor={noVehicleNeeded ? colors.success : "#f4f3f4"}
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
              />
            </Pressable>
          ) : undefined,
        )}

        {/* Divider "ou" — visible uniquement si aucun des deux n'est choisi */}
        {!isFullyDelegated && !hasVehicle && !hasWorkers && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: DESIGN_TOKENS.spacing.xs,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: colors.border,
              }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                marginHorizontal: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("prepareJob.or") || "ou"}
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: colors.border,
              }}
            />
          </View>
        )}

        {/* 3. Déléguer le job entier — masqué si des ressources sont assignées */}
        {!hasVehicle && !hasWorkers && renderStep(
          "business-outline",
          t("prepareJob.delegateFull") || "Déléguer le job entier",
          delegationActive
            ? `${t("prepareJob.delegatedTo") || "Délégué à"} ${activeTransfer?.recipient_company_name || "—"}`
            : t("prepareJob.delegateFullDesc") ||
                "Confier le job à une autre entreprise",
          !!isFullyDelegated,
          () => onOpenWizard("delegate_full"),
        )}
      </View>

      {/* Modal d'affectation de ressources (véhicule + équipage) */}
      {(companyId ?? 0) > 0 && (
        <AssignResourceModal
          visible={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            load();
            onRefresh?.();
          }}
          jobId={jobId}
          companyId={companyId!}
          startAt={startAt}
          endAt={endAt}
        />
      )}
    </View>
  );
};

export default PrepareJobSection;
