/**
 * DelegateJobWizard
 *
 * Wizard multi-étapes pour gérer les ressources et la délégation d'un job.
 *
 * 3 modes :
 *   1. « Ajouter camion / personnel » — assigner ses propres ressources
 *   2. « Déléguer une partie » — envoyer un rôle (chauffeur, offsider) à un prestataire
 *   3. « Déléguer le job entier » — confier le job complet à une autre entreprise
 *
 * Le prestataire reçoit une proposition avec : rôle, camion, prix (horaire ou forfait),
 * type de comptage d'heures (depot-to-depot ou site only), et peut accepter, refuser
 * ou faire une contre-proposition de prix.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useStaff } from "../../../hooks/useStaff";
import { useVehicles } from "../../../hooks/useVehicles";
import {
  fetchCompanyPublicTrucks,
  listRelations,
  saveRelation,
} from "../../../services/companyRelations";
import { createAssignment } from "../../../services/jobAssignments";
import { createTransfer } from "../../../services/jobTransfer";
import type {
  CompanyLookupResult,
  CompanyRelation,
  HourCountingType,
  PublicTruck,
  TransferDelegatedRole,
  TransferPricingType,
} from "../../../types/jobTransfer";
import {
  DELEGATED_ROLE_LABELS,
  HOUR_COUNTING_LABELS,
  PRICING_TYPE_LABELS,
} from "../../../types/jobTransfer";
import CompanyCodeInput from "../TransferJobModal/CompanyCodeInput";
import RelationsCarnet from "../TransferJobModal/RelationsCarnet";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type WizardMode = "resources" | "delegate_part" | "delegate_full";
type WizardStep = "mode" | "config" | "summary";

interface DelegateJobWizardProps {
  visible: boolean;
  jobId: string;
  companyId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

/** Entrée dans la liste des ressources ajoutées */
interface ResourceEntry {
  id: string; // unique key
  type: "vehicle" | "staff";
  resourceId: string;
  label: string; // Display name
  sublabel?: string; // e.g. license plate
  role?: "driver" | "offsider" | "supervisor";
}

// ─────────────────────────────────────────────────────────────
// Sous-composants utilitaires
// ─────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: string; colors: any }> = ({
  children,
  colors,
}) => (
  <Text
    style={{
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    }}
  >
    {children}
  </Text>
);

const ChipButton: React.FC<{
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}> = ({ label, icon, isActive, onPress, colors }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1.5,
      borderColor: isActive ? colors.primary : colors.border,
      backgroundColor: isActive
        ? colors.primary + "18"
        : colors.backgroundSecondary,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      opacity: pressed ? 0.75 : 1,
    })}
  >
    {icon && (
      <Ionicons
        name={icon as any}
        size={16}
        color={isActive ? colors.primary : colors.textSecondary}
      />
    )}
    <Text
      style={{
        color: isActive ? colors.primary : colors.textSecondary,
        fontWeight: isActive ? "700" : "500",
        fontSize: 13,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

const ModeCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}> = ({ title, description, icon, isActive, onPress, colors }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 2,
      borderColor: isActive ? colors.primary : colors.border,
      backgroundColor: isActive
        ? colors.primary + "10"
        : colors.backgroundSecondary,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      opacity: pressed ? 0.8 : 1,
    })}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isActive ? colors.primary + "20" : colors.border + "40",
        alignItems: "center",
        justifyContent: "center",
        marginRight: DESIGN_TOKENS.spacing.md,
      }}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={isActive ? colors.primary : colors.textSecondary}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: isActive ? colors.primary : colors.text,
          marginBottom: 2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 16,
        }}
      >
        {description}
      </Text>
    </View>
    {isActive && (
      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
    )}
  </Pressable>
);

const Stepper: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  colors: any;
}> = ({ label, value, min = 0, max = 10, onChange, colors }) => (
  <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: DESIGN_TOKENS.radius.md,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value <= min ? 0.3 : 1,
        })}
      >
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <View
        style={{
          width: 32,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value >= max ? 0.3 : 1,
        })}
      >
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Progress dots
// ─────────────────────────────────────────────────────────────

const STEPS: WizardStep[] = ["mode", "config", "summary"];

const ProgressDots: React.FC<{ current: WizardStep; colors: any }> = ({
  current,
  colors,
}) => {
  const idx = STEPS.indexOf(current);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}
    >
      {STEPS.map((s, i) => (
        <View
          key={s}
          style={{
            width: i <= idx ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= idx ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const DelegateJobWizard: React.FC<DelegateJobWizardProps> = ({
  visible,
  jobId,
  companyId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { staff, isLoading: staffLoading } = useStaff();

  // ── Wizard state ──
  const [step, setStep] = useState<WizardStep>("mode");
  const [mode, setMode] = useState<WizardMode | null>(null);

  // ── Resources mode state ──
  const [selectedResources, setSelectedResources] = useState<ResourceEntry[]>(
    [],
  );

  // ── Delegate part state ──
  const [delegateRole, setDelegateRole] =
    useState<TransferDelegatedRole>("driver");
  const [roleCustomLabel, setRoleCustomLabel] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [vehicleLabel, setVehicleLabel] = useState("");

  // ── Pricing (delegate_part and delegate_full) ──
  const [pricingType, setPricingType] = useState<TransferPricingType>("flat");
  const [pricingAmount, setPricingAmount] = useState("");
  const [hourCountingType, setHourCountingType] =
    useState<HourCountingType>("depot_to_depot");

  // ── Recipient (companies) ──
  const [relations, setRelations] = useState<CompanyRelation[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [selectedRelation, setSelectedRelation] =
    useState<CompanyRelation | null>(null);
  const [lookupResult, setLookupResult] = useState<CompanyLookupResult | null>(
    null,
  );

  // ── For full job delegation, partner trucks ──
  const [partnerTrucks, setPartnerTrucks] = useState<PublicTruck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(false);
  const [preferredTruckId, setPreferredTruckId] = useState<number | null>(null);
  const [requestedDrivers, setRequestedDrivers] = useState(1);
  const [requestedOffsiders, setRequestedOffsiders] = useState(0);

  // ── Message ──
  const [message, setMessage] = useState("");

  // ── Submission ──
  const [isSending, setIsSending] = useState(false);

  // ── Load relations when opening ──
  useEffect(() => {
    if (!visible) return;
    if (mode === "delegate_part" || mode === "delegate_full") {
      setRelationsLoading(true);
      listRelations()
        .then(setRelations)
        .catch(() => setRelations([]))
        .finally(() => setRelationsLoading(false));
    }
  }, [visible, mode]);

  // ── Load partner trucks when recipient selected ──
  useEffect(() => {
    const cId =
      selectedRelation?.related_company_id ?? lookupResult?.id ?? null;
    if (!cId || mode !== "delegate_full") {
      setPartnerTrucks([]);
      setPreferredTruckId(null);
      return;
    }
    setTrucksLoading(true);
    fetchCompanyPublicTrucks(cId)
      .then(setPartnerTrucks)
      .catch(() => setPartnerTrucks([]))
      .finally(() => setTrucksLoading(false));
  }, [selectedRelation, lookupResult, mode]);

  // ── Reset on close ──
  const resetWizard = useCallback(() => {
    setStep("mode");
    setMode(null);
    setSelectedResources([]);
    setDelegateRole("driver");
    setRoleCustomLabel("");
    setSelectedVehicleId(null);
    setVehicleLabel("");
    setPricingType("flat");
    setPricingAmount("");
    setHourCountingType("depot_to_depot");
    setSelectedRelation(null);
    setLookupResult(null);
    setPartnerTrucks([]);
    setPreferredTruckId(null);
    setRequestedDrivers(1);
    setRequestedOffsiders(0);
    setMessage("");
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  // ── Navigation ──
  const canGoNext = useMemo(() => {
    if (step === "mode") return mode !== null;
    if (step === "config") {
      if (mode === "resources") return selectedResources.length > 0;
      if (mode === "delegate_part") {
        return (
          (delegateRole !== "custom" || roleCustomLabel.trim().length > 0) &&
          pricingAmount.trim().length > 0 &&
          parseFloat(pricingAmount) > 0 &&
          (selectedRelation !== null || lookupResult !== null)
        );
      }
      if (mode === "delegate_full") {
        return (
          pricingAmount.trim().length > 0 &&
          parseFloat(pricingAmount) > 0 &&
          (selectedRelation !== null || lookupResult !== null)
        );
      }
    }
    return true;
  }, [
    step,
    mode,
    selectedResources,
    delegateRole,
    roleCustomLabel,
    pricingAmount,
    selectedRelation,
    lookupResult,
  ]);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }, [step]);

  // ── Resource toggling (own vehicles / staff) ──
  const toggleVehicle = useCallback(
    (v: { id: string; registration: string; make?: string; model?: string }) => {
      setSelectedResources((prev) => {
        const exists = prev.find(
          (r) => r.type === "vehicle" && r.resourceId === v.id,
        );
        if (exists) return prev.filter((r) => r !== exists);
        return [
          ...prev,
          {
            id: `vehicle-${v.id}`,
            type: "vehicle" as const,
            resourceId: v.id,
            label: v.make && v.model ? `${v.make} ${v.model}` : `Véhicule`,
            sublabel: v.registration,
          },
        ];
      });
    },
    [],
  );

  const toggleStaff = useCallback(
    (
      s: { id: string; firstName: string; lastName: string; role?: string },
      role: "driver" | "offsider" | "supervisor" = "offsider",
    ) => {
      setSelectedResources((prev) => {
        const exists = prev.find(
          (r) => r.type === "staff" && r.resourceId === s.id,
        );
        if (exists) return prev.filter((r) => r !== exists);
        return [
          ...prev,
          {
            id: `staff-${s.id}`,
            type: "staff" as const,
            resourceId: s.id,
            label: `${s.firstName} ${s.lastName}`,
            sublabel: s.role,
            role,
          },
        ];
      });
    },
    [],
  );

  // ── Recipient handling ──
  const handleCodeSelect = useCallback((result: CompanyLookupResult) => {
    setLookupResult(result);
    setSelectedRelation(null);
  }, []);

  const handleCodeClear = useCallback(() => {
    setLookupResult(null);
  }, []);

  const handleRelationSelect = useCallback((relation: CompanyRelation) => {
    setSelectedRelation((prev) => (prev?.id === relation.id ? null : relation));
    setLookupResult(null);
  }, []);

  const resolvedRecipientName =
    selectedRelation?.related_company_name ??
    selectedRelation?.related_contractor_name ??
    lookupResult?.name ??
    null;

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    setIsSending(true);
    try {
      if (mode === "resources") {
        // Assign own resources to the job
        const vehicleEntries = selectedResources.filter(
          (r) => r.type === "vehicle",
        );
        const staffEntries = selectedResources.filter(
          (r) => r.type === "staff",
        );

        for (const v of vehicleEntries) {
          await createAssignment(jobId, {
            resource_type: "vehicle",
            resource_id: parseInt(v.resourceId, 10),
            role: "vehicle",
          });
        }
        for (const s of staffEntries) {
          await createAssignment(jobId, {
            resource_type: "staff",
            resource_id: parseInt(s.resourceId, 10),
            role: s.role || "offsider",
          });
        }
      } else {
        // delegate_part or delegate_full → create a transfer
        const recipientCompanyId =
          selectedRelation?.related_company_id ?? lookupResult?.id;
        const recipientContractorId =
          selectedRelation?.related_contractor_id;
        const recipientType = selectedRelation?.related_type ?? "company";

        const role: TransferDelegatedRole =
          mode === "delegate_full" ? "full_job" : delegateRole;

        await createTransfer(jobId, {
          recipient_type: recipientType,
          recipient_company_id: recipientCompanyId,
          recipient_contractor_id: recipientContractorId,
          delegated_role: role,
          delegated_role_label:
            role === "custom" ? roleCustomLabel.trim() : undefined,
          pricing_type: pricingType,
          pricing_amount: parseFloat(pricingAmount),
          hour_counting_type:
            pricingType === "hourly" ? hourCountingType : undefined,
          message: message.trim() || undefined,
          vehicle_id:
            mode === "delegate_part" && selectedVehicleId
              ? parseInt(selectedVehicleId, 10)
              : preferredTruckId ?? undefined,
          vehicle_label:
            mode === "delegate_part" ? vehicleLabel || undefined : undefined,
          requested_drivers:
            mode === "delegate_full" ? requestedDrivers : undefined,
          requested_offsiders:
            mode === "delegate_full" ? requestedOffsiders : undefined,
          preferred_truck_id:
            mode === "delegate_full" ? preferredTruckId ?? undefined : undefined,
        });

        // Save unsaved lookup result as a relation
        if (lookupResult && !lookupResult.is_already_saved) {
          saveRelation({
            related_type: "company",
            related_company_id: lookupResult.id,
          }).catch(() => {});
        }
      }

      onSuccess();
      handleClose();
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.message ?? "Impossible d'envoyer la délégation",
      );
    } finally {
      setIsSending(false);
    }
  }, [
    mode,
    jobId,
    selectedResources,
    selectedRelation,
    lookupResult,
    delegateRole,
    roleCustomLabel,
    pricingType,
    pricingAmount,
    hourCountingType,
    message,
    selectedVehicleId,
    vehicleLabel,
    preferredTruckId,
    requestedDrivers,
    requestedOffsiders,
    onSuccess,
    handleClose,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Render steps
  // ─────────────────────────────────────────────────────────────

  const renderModeStep = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: DESIGN_TOKENS.spacing.xl }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        Que souhaitez-vous faire ?
      </Text>

      <ModeCard
        title="Ajouter camion / personnel"
        description="Assigner vos propres camions et employés à ce job"
        icon="add-circle-outline"
        isActive={mode === "resources"}
        onPress={() => setMode("resources")}
        colors={colors}
      />

      <ModeCard
        title="Déléguer une partie"
        description="Envoyer un rôle (chauffeur, offsider) à un prestataire externe"
        icon="person-add-outline"
        isActive={mode === "delegate_part"}
        onPress={() => setMode("delegate_part")}
        colors={colors}
      />

      <ModeCard
        title="Déléguer le job entier"
        description="Confier le job complet à une autre entreprise"
        icon="business-outline"
        isActive={mode === "delegate_full"}
        onPress={() => setMode("delegate_full")}
        colors={colors}
      />
    </ScrollView>
  );

  // ──────────────────────────────────────────────────────────

  const renderResourcesConfig = () => {
    const activeStaff = staff.filter((m) => m.status === "active");
    const availableVehicles = vehicles.filter(
      (v) => v.status === "available" || v.status === "in-use",
    );

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: DESIGN_TOKENS.spacing.xl }}
      >
        {/* Vehicles */}
        <SectionTitle colors={colors}>Camions</SectionTitle>
        {vehiclesLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
          />
        ) : availableVehicles.length === 0 ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            Aucun véhicule disponible
          </Text>
        ) : (
          <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            {availableVehicles.map((v) => {
              const selected = selectedResources.some(
                (r) => r.type === "vehicle" && r.resourceId === v.id,
              );
              return (
                <Pressable
                  key={v.id}
                  onPress={() =>
                    toggleVehicle({
                      id: v.id,
                      registration: v.registration,
                      make: (v as any).make,
                      model: (v as any).model,
                    })
                  }
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.primary + "10"
                      : colors.backgroundSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons
                    name={selected ? "checkmark-circle" : "car-sport-outline"}
                    size={20}
                    color={selected ? colors.primary : colors.textSecondary}
                    style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {(v as any).make} {(v as any).model || v.registration}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      {v.registration} · {v.capacity || v.type}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Staff */}
        <SectionTitle colors={colors}>Personnel</SectionTitle>
        {staffLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : activeStaff.length === 0 ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            Aucun employé actif
          </Text>
        ) : (
          <View>
            {activeStaff.map((s) => {
              const selected = selectedResources.some(
                (r) => r.type === "staff" && r.resourceId === s.id,
              );
              return (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    toggleStaff({
                      id: s.id,
                      firstName: s.firstName,
                      lastName: s.lastName,
                      role: s.role,
                    })
                  }
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.primary + "10"
                      : colors.backgroundSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons
                    name={selected ? "checkmark-circle" : "person-outline"}
                    size={20}
                    color={selected ? colors.primary : colors.textSecondary}
                    style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {s.firstName} {s.lastName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      {s.role || s.type}
                    </Text>
                  </View>
                  {selected && (
                    <View
                      style={{
                        backgroundColor: colors.primary + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: colors.primary,
                        }}
                      >
                        {selectedResources.find(
                          (r) =>
                            r.type === "staff" && r.resourceId === s.id,
                        )?.role === "driver"
                          ? "Chauffeur"
                          : "Offsider"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  // ──────────────────────────────────────────────────────────

  const renderDelegatePartConfig = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: DESIGN_TOKENS.spacing.xl }}
    >
      {/* Role */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <SectionTitle colors={colors}>Rôle à déléguer</SectionTitle>
        <View
          style={{
            flexDirection: "row",
            gap: DESIGN_TOKENS.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {(["driver", "offsider", "custom"] as TransferDelegatedRole[]).map(
            (r) => (
              <ChipButton
                key={r}
                label={DELEGATED_ROLE_LABELS[r]}
                isActive={delegateRole === r}
                onPress={() => setDelegateRole(r)}
                colors={colors}
              />
            ),
          )}
        </View>
        {delegateRole === "custom" && (
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.md,
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
              marginTop: DESIGN_TOKENS.spacing.sm,
              fontSize: 14,
            }}
            value={roleCustomLabel}
            onChangeText={setRoleCustomLabel}
            placeholder="Décrivez le rôle..."
            placeholderTextColor={colors.textSecondary}
          />
        )}
      </View>

      {/* Véhicule associé */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <SectionTitle colors={colors}>Véhicule associé (optionnel)</SectionTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: DESIGN_TOKENS.spacing.sm }}
        >
          <ChipButton
            label="Aucun"
            icon="close-circle-outline"
            isActive={selectedVehicleId === null}
            onPress={() => {
              setSelectedVehicleId(null);
              setVehicleLabel("");
            }}
            colors={colors}
          />
          {vehicles
            .filter((v) => v.status === "available" || v.status === "in-use")
            .map((v) => (
              <Pressable
                key={v.id}
                onPress={() => {
                  setSelectedVehicleId(v.id);
                  setVehicleLabel(`${v.registration}`);
                }}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1.5,
                  borderColor:
                    selectedVehicleId === v.id
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    selectedVehicleId === v.id
                      ? colors.primary + "18"
                      : colors.backgroundSecondary,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={14}
                  color={
                    selectedVehicleId === v.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color:
                      selectedVehicleId === v.id
                        ? colors.primary
                        : colors.text,
                  }}
                >
                  {v.registration}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>

      {/* Pricing */}
      {renderPricingSection()}

      {/* Recipient */}
      {renderRecipientSection()}

      {/* Message */}
      {renderMessageSection()}
    </ScrollView>
  );

  // ──────────────────────────────────────────────────────────

  const renderDelegateFullConfig = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: DESIGN_TOKENS.spacing.xl }}
    >
      {/* Pricing */}
      {renderPricingSection()}

      {/* Recipient */}
      {renderRecipientSection()}

      {/* Partner Resources (drivers, offsiders, trucks) */}
      {(selectedRelation || lookupResult) && (
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <SectionTitle colors={colors}>Ressources demandées</SectionTitle>

          {/* Partner trucks */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}
          >
            Camion préféré
          </Text>
          {trucksLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
            >
              <Pressable
                onPress={() => setPreferredTruckId(null)}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1.5,
                  borderColor:
                    preferredTruckId === null
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    preferredTruckId === null
                      ? colors.primary + "18"
                      : colors.backgroundSecondary,
                  marginRight: DESIGN_TOKENS.spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color:
                      preferredTruckId === null
                        ? colors.primary
                        : colors.textSecondary,
                  }}
                >
                  Au choix
                </Text>
              </Pressable>
              {partnerTrucks.map((t) => {
                const active = preferredTruckId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() =>
                      setPreferredTruckId(active ? null : t.id)
                    }
                    style={({ pressed }) => ({
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? colors.primary + "18"
                        : colors.backgroundSecondary,
                      marginRight: DESIGN_TOKENS.spacing.sm,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? colors.primary : colors.text,
                      }}
                    >
                      {t.name}
                    </Text>
                    {t.license_plate && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {t.license_plate}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Crew counters */}
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Stepper
              label="Chauffeurs"
              value={requestedDrivers}
              min={0}
              max={5}
              onChange={setRequestedDrivers}
              colors={colors}
            />
            <Stepper
              label="Offsiders"
              value={requestedOffsiders}
              min={0}
              max={10}
              onChange={setRequestedOffsiders}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* Message */}
      {renderMessageSection()}
    </ScrollView>
  );

  // ──────────────────────────────────────────────────────────
  // Shared sections
  // ──────────────────────────────────────────────────────────

  const renderPricingSection = () => (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      <SectionTitle colors={colors}>Tarification</SectionTitle>
      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.sm,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {(["hourly", "flat"] as TransferPricingType[]).map((pt) => (
          <ChipButton
            key={pt}
            label={PRICING_TYPE_LABELS[pt]}
            isActive={pricingType === pt}
            onPress={() => setPricingType(pt)}
            colors={colors}
          />
        ))}
      </View>

      {/* Amount input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          height: 48,
          backgroundColor: colors.backgroundSecondary,
          gap: DESIGN_TOKENS.spacing.sm,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          $
        </Text>
        <TextInput
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 18,
            fontWeight: "600",
          }}
          value={pricingAmount}
          onChangeText={(v) => setPricingAmount(v.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          AUD{pricingType === "hourly" ? " / h" : ""}
        </Text>
      </View>

      {/* Hour counting type (only for hourly) */}
      {pricingType === "hourly" && (
        <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}
          >
            Comptage des heures
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
            }}
          >
            {(["depot_to_depot", "site_only"] as HourCountingType[]).map(
              (hct) => (
                <ChipButton
                  key={hct}
                  label={HOUR_COUNTING_LABELS[hct]}
                  isActive={hourCountingType === hct}
                  onPress={() => setHourCountingType(hct)}
                  colors={colors}
                />
              ),
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderRecipientSection = () => (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      <SectionTitle colors={colors}>Destinataire</SectionTitle>

      <RelationsCarnet
        relations={relations}
        isLoading={relationsLoading}
        mode="select"
        selectedId={selectedRelation?.id}
        onSelect={handleRelationSelect}
      />

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          textAlign: "center",
          marginVertical: DESIGN_TOKENS.spacing.sm,
        }}
      >
        — ou ajouter par code —
      </Text>

      <CompanyCodeInput
        onSelect={handleCodeSelect}
        onClear={handleCodeClear}
      />
    </View>
  );

  const renderMessageSection = () => (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      <SectionTitle colors={colors}>Message (optionnel)</SectionTitle>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          color: colors.text,
          backgroundColor: colors.backgroundSecondary,
          minHeight: 72,
          textAlignVertical: "top",
          fontSize: 14,
        }}
        value={message}
        onChangeText={setMessage}
        placeholder="Saisissez un message..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={500}
      />
    </View>
  );

  // ──────────────────────────────────────────────────────────
  // Config step router
  // ──────────────────────────────────────────────────────────

  const renderConfigStep = () => {
    if (mode === "resources") return renderResourcesConfig();
    if (mode === "delegate_part") return renderDelegatePartConfig();
    if (mode === "delegate_full") return renderDelegateFullConfig();
    return null;
  };

  // ──────────────────────────────────────────────────────────
  // Summary step
  // ──────────────────────────────────────────────────────────

  const renderSummary = () => {
    const SummaryRow: React.FC<{
      icon: string;
      label: string;
      value: string;
    }> = ({ icon, label, value }) => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.primary}
          style={{ marginRight: DESIGN_TOKENS.spacing.sm, marginTop: 1 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 1,
            }}
          >
            {label}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            {value}
          </Text>
        </View>
      </View>
    );

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: DESIGN_TOKENS.spacing.xl }}
      >
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {mode === "resources"
              ? "Ressources à assigner"
              : mode === "delegate_part"
                ? "Délégation partielle"
                : "Délégation complète"}
          </Text>

          {mode === "resources" ? (
            <>
              {selectedResources.map((r) => (
                <SummaryRow
                  key={r.id}
                  icon={
                    r.type === "vehicle" ? "car-sport-outline" : "person-outline"
                  }
                  label={r.type === "vehicle" ? "Véhicule" : "Personnel"}
                  value={`${r.label}${r.sublabel ? ` (${r.sublabel})` : ""}`}
                />
              ))}
            </>
          ) : (
            <>
              {/* Role */}
              <SummaryRow
                icon="briefcase-outline"
                label="Rôle"
                value={
                  mode === "delegate_full"
                    ? "Job entier"
                    : delegateRole === "custom"
                      ? roleCustomLabel
                      : DELEGATED_ROLE_LABELS[delegateRole]
                }
              />

              {/* Vehicle */}
              {mode === "delegate_part" && vehicleLabel && (
                <SummaryRow
                  icon="car-sport-outline"
                  label="Véhicule"
                  value={vehicleLabel}
                />
              )}

              {/* Pricing */}
              <SummaryRow
                icon="cash-outline"
                label="Prix"
                value={`$${pricingAmount} ${pricingType === "hourly" ? "/ heure" : "(forfait)"}`}
              />

              {/* Hour counting */}
              {pricingType === "hourly" && (
                <SummaryRow
                  icon="time-outline"
                  label="Comptage des heures"
                  value={HOUR_COUNTING_LABELS[hourCountingType]}
                />
              )}

              {/* Recipient */}
              <SummaryRow
                icon="business-outline"
                label="Destinataire"
                value={resolvedRecipientName || "—"}
              />

              {/* For full job: crew */}
              {mode === "delegate_full" && (
                <SummaryRow
                  icon="people-outline"
                  label="Équipe demandée"
                  value={`${requestedDrivers} chauffeur(s), ${requestedOffsiders} offsider(s)`}
                />
              )}

              {/* Message */}
              {message.trim() && (
                <SummaryRow
                  icon="chatbubble-outline"
                  label="Message"
                  value={message.trim()}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
      maxHeight: "92%",
      minHeight: "60%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    footer: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    backBtn: {
      flex: 1,
      borderRadius: DESIGN_TOKENS.radius.md,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    nextBtn: {
      flex: 2,
      borderRadius: DESIGN_TOKENS.radius.md,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const stepTitle =
    step === "mode"
      ? "Gestion du job"
      : step === "config"
        ? mode === "resources"
          ? "Sélectionner les ressources"
          : mode === "delegate_part"
            ? "Déléguer une partie"
            : "Déléguer le job entier"
        : "Récapitulatif";

  const nextLabel =
    step === "summary"
      ? mode === "resources"
        ? "Assigner"
        : resolvedRecipientName
          ? `Déléguer à ${resolvedRecipientName}`
          : "Envoyer"
      : "Suivant";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{stepTitle}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Progress */}
              <ProgressDots current={step} colors={colors} />

              {/* Content */}
              <View style={{ flex: 1 }}>
                {step === "mode" && renderModeStep()}
                {step === "config" && renderConfigStep()}
                {step === "summary" && renderSummary()}
              </View>

              {/* Footer buttons */}
              <View style={styles.footer}>
                {step !== "mode" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.backBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={goBack}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      Retour
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.nextBtn,
                    {
                      backgroundColor: canGoNext
                        ? colors.primary
                        : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={step === "summary" ? handleSubmit : goNext}
                  disabled={!canGoNext || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: canGoNext ? "#fff" : colors.textSecondary,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {nextLabel}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default DelegateJobWizard;
