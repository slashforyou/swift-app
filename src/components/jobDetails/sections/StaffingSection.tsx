/**
 * StaffingSection
 *
 * Affiche la section "Équipe & Véhicule" dans l'onglet Job de la fiche.
 * Permet à l'Entreprise B d'affecter ses ressources (véhicule, chauffeur, offsider)
 * et de voir leur statut de confirmation + la société qui les fournit.
 *
 * Spec : docs/AVAILABILITY_ASSIGNMENT_SPEC.md — section 9.1
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import {
  deleteAssignment,
  listAssignments,
} from "../../../services/jobAssignments";
import { cancelTransfer } from "../../../services/jobTransfer";
import type {
  AssignmentStatus,
  JobAssignment,
  ListAssignmentsResponse,
  StaffingStatus,
  StaffResource,
  VehicleResource,
} from "../../../types/jobAssignment";
import type { JobTransfer } from "../../../types/jobTransfer";
import AssignResourceModal from "../../modals/AssignResourceModal";

// ─────────────────────────────────────────────────────────────
// Static config (colors / icons — no translations needed)
// ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#22C55E",
  declined: "#EF4444",
  cancelled: "#94A3B8",
  replaced: "#94A3B8",
};
const STATUS_ICON: Record<AssignmentStatus, string> = {
  pending: "time-outline",
  confirmed: "checkmark-circle",
  declined: "close-circle",
  cancelled: "ban-outline",
  replaced: "swap-horizontal",
};
const STAFFING_COLOR: Record<StaffingStatus, string> = {
  unassigned: "#94A3B8",
  partial: "#F59E0B",
  fully_staffed: "#22C55E",
  conflict: "#EF4444",
};
const STAFFING_ICON: Record<StaffingStatus, string> = {
  unassigned: "alert-circle-outline",
  partial: "time-outline",
  fully_staffed: "checkmark-circle",
  conflict: "warning-outline",
};
const ROLE_COLOR: Record<string, string> = {
  vehicle: "#F59E0B",
  driver: "#3B82F6",
  offsider: "#8B5CF6",
  supervisor: "#22C55E",
};
const ROLE_ICON: Record<string, string> = {
  vehicle: "car-outline",
  driver: "car-sport-outline",
  offsider: "person-add-outline",
  supervisor: "ribbon-outline",
};

function getResourceName(assignment: JobAssignment): string {
  if (!assignment.resource) return `#${assignment.resource_id}`;
  if (assignment.resource_type === "vehicle") {
    const v = assignment.resource as VehicleResource;
    return v.name + (v.license_plate ? ` · ${v.license_plate}` : "");
  }
  const s = assignment.resource as StaffResource;
  return `${s.firstName} ${s.lastName}`;
}

function getVehicleDetails(resource: VehicleResource): string | null {
  const parts: string[] = [];
  if (resource.license_plate) parts.push(resource.license_plate);
  if (resource.capacity) parts.push(resource.capacity);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ─────────────────────────────────────────────────────────────
// Transfer status config
// ─────────────────────────────────────────────────────────────

const TRANSFER_STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  negotiating: "#3B82F6",
  accepted: "#22C55E",
  declined: "#EF4444",
  cancelled: "#94A3B8",
};
const TRANSFER_STATUS_ICON: Record<string, string> = {
  pending: "time-outline",
  negotiating: "chatbubbles-outline",
  accepted: "checkmark-circle",
  declined: "close-circle",
  cancelled: "ban-outline",
};

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface StaffingSectionProps {
  job: {
    id: string | number;
    start_window_start?: string;
    end_window_start?: string;
    end_window_end?: string;
    /** API returns camelCase keys */
    contractor?: { companyId?: number; companyName?: string };
    contractee?: { companyId?: number; companyName?: string };
    permissions?: {
      is_assigned?: boolean;
      is_owner?: boolean;
    };
  };
  /** Transfert / délégation actif sur ce job */
  activeTransfer?: JobTransfer;
  /** Rafraîchir le job parent si nécessaire */
  onJobRefresh?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────

const StaffingSection: React.FC<StaffingSectionProps> = ({
  job,
  activeTransfer,
  onJobRefresh,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // Shortcut for the staffing namespace
  const ts = (key: string, params?: Record<string, string>) =>
    t(`jobDetails.components.staffing.${key}` as any, params as any);

  const [data, setData] = useState<ListAssignmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // The contractor is responsible for providing resources (staff + vehicle).
  // Their company name is shown on empty slots so both parties know who must fill them.
  const contractorCompanyName =
    job.contractor?.companyName ?? job.contractee?.companyName;

  const canAssign = !!(
    job.permissions?.is_assigned || job.permissions?.is_owner
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssignments(job.id);
      setData(result);
    } catch (err) {
      console.error("[StaffingSection] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (assignment: JobAssignment) => {
    const name = getResourceName(assignment);
    Alert.alert(
      ts("cancelConfirmTitle"),
      ts("cancelConfirmMessage", { name }),
      [
        { text: ts("cancelConfirmNo"), style: "cancel" },
        {
          text: ts("cancelConfirmYes"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAssignment(job.id, assignment.id);
              load();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : ts("loading");
              Alert.alert("Erreur", msg);
            }
          },
        },
      ],
    );
  };

  const handleCancelTransfer = () => {
    if (!activeTransfer) return;
    Alert.alert(
      ts("cancelDelegationTitle"),
      ts("cancelDelegationMessage", {
        name:
          activeTransfer.recipient_company_name ??
          activeTransfer.recipient_contractor_name ??
          "—",
      }),
      [
        { text: ts("cancelConfirmNo"), style: "cancel" },
        {
          text: ts("cancelDelegationYes"),
          style: "destructive",
          onPress: async () => {
            try {
              await cancelTransfer(String(job.id), activeTransfer.id);
              onJobRefresh?.();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Error";
              Alert.alert(ts("error") || "Error", msg);
            }
          },
        },
      ],
    );
  };

  // ── Transfer status labels ──
  const TRANSFER_STATUS_LABEL: Record<string, string> = {
    pending: ts("delegationPending"),
    negotiating: ts("delegationNegotiating"),
    accepted: ts("delegationAccepted"),
    declined: ts("delegationDeclined"),
    cancelled: ts("statusCancelled"),
  };

  // ── Status labels (need t) ──
  const STATUS_LABEL: Record<AssignmentStatus, string> = {
    pending: ts("statusPending"),
    confirmed: ts("statusConfirmed"),
    declined: ts("statusDeclined"),
    cancelled: ts("statusCancelled"),
    replaced: ts("statusReplaced"),
  };
  const STAFFING_LABEL: Record<StaffingStatus, string> = {
    unassigned: ts("statusUnassigned"),
    partial: ts("statusPartial"),
    fully_staffed: ts("statusFullyStaffed"),
    conflict: ts("statusConflict"),
  };
  const ROLE_LABEL: Record<string, string> = {
    driver: ts("roleDriver"),
    offsider: ts("roleOffsider"),
    supervisor: ts("roleSupervisor"),
    vehicle: ts("roleVehicle"),
  };

  // ── Bandeau de statut global ──
  const staffingStatus = data?.staffing_status ?? "unassigned";
  const statusColor = STAFFING_COLOR[staffingStatus];
  const statusIcon = STAFFING_ICON[staffingStatus];
  const statusLabel = STAFFING_LABEL[staffingStatus];

  // ── Affectations actives ──
  const activeAssignments =
    data?.data?.filter(
      (a) => !["cancelled", "declined", "replaced"].includes(a.status),
    ) ?? [];

  const vehicleAssignments = activeAssignments.filter(
    (a) => a.resource_type === "vehicle",
  );
  const driverAssignments = activeAssignments.filter(
    (a) => a.role === "driver",
  );
  const offsiderAssignments = activeAssignments.filter(
    (a) => a.role === "offsider",
  );
  const staffAssignments = activeAssignments.filter(
    (a) => a.resource_type !== "vehicle",
  );

  // ── Slots manquants ──
  const required = data?.required ?? { vehicle: 0, driver: 0, offsider: 0 };
  const missingVehicles = Math.max(
    0,
    required.vehicle - vehicleAssignments.length,
  );
  const missingDrivers = Math.max(
    0,
    required.driver - driverAssignments.length,
  );
  const missingOffsiders = Math.max(
    0,
    required.offsider - offsiderAssignments.length,
  );

  const hasAnything =
    activeAssignments.length > 0 ||
    missingVehicles > 0 ||
    missingDrivers > 0 ||
    missingOffsiders > 0 ||
    !!activeTransfer;

  // ─────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────

  const roleColor = (role: string) => ROLE_COLOR[role] ?? colors.primary;
  const roleIcon = (role: string) =>
    (ROLE_ICON[role] ?? "person-outline") as any;

  /** Badge "Fourni par <company>" */
  const renderCompanyBadge = (companyName: string | undefined) => {
    if (!companyName) return null;
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          marginBottom: 2,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: DESIGN_TOKENS.radius.full,
          backgroundColor: colors.primary + "18",
          borderWidth: 1,
          borderColor: colors.primary + "30",
        }}
      >
        <Ionicons
          name="business-outline"
          size={10}
          color={colors.primary}
          style={{ marginRight: 3 }}
        />
        <Text
          style={{ fontSize: 10, fontWeight: "600", color: colors.primary }}
          numberOfLines={1}
        >
          {ts("providedBy", { company: companyName })}
        </Text>
      </View>
    );
  };

  /** Carte d'affectation normale */
  const renderAssignmentCard = (assignment: JobAssignment, index: number) => {
    const sc = STATUS_COLOR[assignment.status];
    const si = STATUS_ICON[assignment.status];
    const sl = STATUS_LABEL[assignment.status];
    const rc = roleColor(assignment.role);
    const ri = roleIcon(assignment.role);
    const isFirst = index === 0;

    const companyName =
      assignment.resource_type === "vehicle"
        ? (assignment.resource as VehicleResource | undefined)?.company_name
        : (assignment.resource as StaffResource | undefined)?.company_name;

    const vehicleDetails =
      assignment.resource_type === "vehicle" && assignment.resource
        ? getVehicleDetails(assignment.resource as VehicleResource)
        : null;

    return (
      <View
        key={assignment.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.backgroundTertiary,
          borderRadius: DESIGN_TOKENS.radius.md,
          marginTop: isFirst ? 0 : DESIGN_TOKENS.spacing.xs,
          overflow: "hidden",
        }}
      >
        {/* Accent strip */}
        <View style={{ width: 4, alignSelf: "stretch", backgroundColor: rc }} />

        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: rc + "18",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: DESIGN_TOKENS.spacing.sm,
            flexShrink: 0,
          }}
        >
          <Ionicons name={ri} size={18} color={rc} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingVertical: DESIGN_TOKENS.spacing.sm }}>
          {renderCompanyBadge(companyName)}
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
            numberOfLines={1}
          >
            {getResourceName(assignment)}
          </Text>
          {vehicleDetails && (
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {vehicleDetails}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {ROLE_LABEL[assignment.role] ?? assignment.role}
          </Text>
        </View>

        {/* Status badge + delete */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: DESIGN_TOKENS.radius.full,
              backgroundColor: sc + "20",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons name={si as any} size={11} color={sc} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: sc }}>
                {sl}
              </Text>
            </View>
          </View>
          {canAssign && assignment.status === "pending" && (
            <Pressable onPress={() => handleDelete(assignment)} hitSlop={10}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  /** Carte "slot vide" — ressource non encore sélectionnée par le prestataire */
  const renderEmptySlot = (
    role: "vehicle" | "driver" | "offsider",
    key: string,
  ) => {
    const rc = roleColor(role);
    const ri = roleIcon(role);
    const label =
      role === "vehicle" ? ts("vehicleNotSelected") : ts("workerNotSelected");
    const desc =
      role === "vehicle"
        ? ts("vehicleNotSelectedDesc")
        : ts("workerNotSelectedDesc");

    return (
      <View
        key={key}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: colors.border,
          borderStyle: "dashed",
          borderRadius: DESIGN_TOKENS.radius.md,
          marginTop: DESIGN_TOKENS.spacing.xs,
          overflow: "hidden",
          opacity: 0.7,
        }}
      >
        {/* Accent strip */}
        <View
          style={{ width: 4, alignSelf: "stretch", backgroundColor: rc + "40" }}
        />

        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.backgroundTertiary,
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: DESIGN_TOKENS.spacing.sm,
            flexShrink: 0,
          }}
        >
          <Ionicons name={ri} size={18} color={colors.textSecondary + "80"} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingVertical: DESIGN_TOKENS.spacing.sm }}>
          {renderCompanyBadge(contractorCompanyName)}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            {label}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary + "90" }}>
            {desc}
          </Text>
        </View>
      </View>
    );
  };

  /** Carte de délégation / transfert actif */
  const renderTransferCard = (transfer: JobTransfer) => {
    const sc = TRANSFER_STATUS_COLOR[transfer.status] ?? "#94A3B8";
    const si = TRANSFER_STATUS_ICON[transfer.status] ?? "help-outline";
    const sl = TRANSFER_STATUS_LABEL[transfer.status] ?? transfer.status;
    const recipientName =
      transfer.recipient_company_name ??
      transfer.recipient_contractor_name ??
      "—";
    const roleLabel =
      transfer.delegated_role === "full_job"
        ? ts("delegationFullJob")
        : transfer.delegated_role === "driver"
          ? ts("roleDriver")
          : transfer.delegated_role === "offsider"
            ? ts("roleOffsider")
            : (transfer.delegated_role_label ?? transfer.delegated_role);
    const accentColor = "#8B5CF6";

    return (
      <View
        key={`transfer-${transfer.id}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.backgroundTertiary,
          borderRadius: DESIGN_TOKENS.radius.md,
          marginTop: DESIGN_TOKENS.spacing.xs,
          overflow: "hidden",
        }}
      >
        {/* Accent strip */}
        <View
          style={{
            width: 4,
            alignSelf: "stretch",
            backgroundColor: accentColor,
          }}
        />

        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: accentColor + "18",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: DESIGN_TOKENS.spacing.sm,
            flexShrink: 0,
          }}
        >
          <Ionicons name="send-outline" size={18} color={accentColor} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingVertical: DESIGN_TOKENS.spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              marginBottom: 2,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: DESIGN_TOKENS.radius.full,
              backgroundColor: accentColor + "18",
              borderWidth: 1,
              borderColor: accentColor + "30",
            }}
          >
            <Ionicons
              name="business-outline"
              size={10}
              color={accentColor}
              style={{ marginRight: 3 }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: accentColor,
              }}
              numberOfLines={1}
            >
              {ts("delegatedTo", { name: recipientName })}
            </Text>
          </View>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
            numberOfLines={1}
          >
            {recipientName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {roleLabel}
          </Text>
        </View>

        {/* Status badge + cancel */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: DESIGN_TOKENS.radius.full,
              backgroundColor: sc + "20",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons name={si as any} size={11} color={sc} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: sc }}>
                {sl}
              </Text>
            </View>
          </View>
          {transfer.status === "pending" && canAssign && (
            <Pressable onPress={handleCancelTransfer} hitSlop={10}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal d'affectation */}
      <AssignResourceModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAssigned={() => {
          setShowModal(false);
          load();
          onJobRefresh?.();
        }}
        jobId={job.id}
        startAt={job.start_window_start}
        endAt={job.end_window_end ?? job.end_window_start}
      />

      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingTop: DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary + "18",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="grid-outline" size={16} color={colors.primary} />
            </View>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: colors.text }}
            >
              {ts("title")}
            </Text>
          </View>

          {/* Status badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: DESIGN_TOKENS.radius.full,
              backgroundColor: statusColor + "18",
              borderWidth: 1,
              borderColor: statusColor + "40",
            }}
          >
            <Ionicons name={statusIcon as any} size={12} color={statusColor} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: statusColor,
                marginLeft: 4,
              }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* ── Contenu ── */}
        <View
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          {loading ? (
            <View
              style={{
                paddingVertical: DESIGN_TOKENS.spacing.xl,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 8,
                }}
              >
                {ts("loading")}
              </Text>
            </View>
          ) : !hasAnything ? (
            /* ── Empty state ── */
            <View style={{ paddingTop: DESIGN_TOKENS.spacing.sm }}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xl,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.backgroundTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={28}
                    color={colors.textSecondary + "80"}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {ts("noResourceAssigned")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 18,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    marginBottom: canAssign ? DESIGN_TOKENS.spacing.md : 0,
                  }}
                >
                  {ts("noResourceDescription")}
                </Text>
                {canAssign && (
                  <Pressable
                    testID="job-staffing-assign-btn"
                    onPress={() => setShowModal(true)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      backgroundColor: pressed
                        ? colors.primary + "30"
                        : colors.primary + "18",
                      borderWidth: 1,
                      borderColor: colors.primary + "50",
                    })}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.primary,
                        marginLeft: 6,
                      }}
                    >
                      {ts("assignResources")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <View>
              {/* ── Groupe Véhicule ── */}
              {(vehicleAssignments.length > 0 || missingVehicles > 0) && (
                <View style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    <Ionicons
                      name={"car-outline" as any}
                      size={13}
                      color="#F59E0B"
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#F59E0B",
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                      }}
                    >
                      {ts("vehicle")}
                    </Text>
                  </View>
                  {vehicleAssignments.map((a, i) => renderAssignmentCard(a, i))}
                  {Array.from({ length: missingVehicles }, (_, i) =>
                    renderEmptySlot("vehicle", `empty-vehicle-${i}`),
                  )}
                </View>
              )}

              {/* ── Groupe Équipe ── */}
              {(staffAssignments.length > 0 ||
                missingDrivers > 0 ||
                missingOffsiders > 0) && (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color="#3B82F6"
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#3B82F6",
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        }}
                      >
                        {ts("team")}
                      </Text>
                    </View>
                    {/* Crew summary */}
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {[
                        driverAssignments.length > 0 &&
                          `${driverAssignments.length} ${ts("roleDriver").toLowerCase()}`,
                        offsiderAssignments.length > 0 &&
                          `${offsiderAssignments.length} offsider`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                  {staffAssignments.map((a, i) => renderAssignmentCard(a, i))}
                  {Array.from({ length: missingDrivers }, (_, i) =>
                    renderEmptySlot("driver", `empty-driver-${i}`),
                  )}
                  {Array.from({ length: missingOffsiders }, (_, i) =>
                    renderEmptySlot("offsider", `empty-offsider-${i}`),
                  )}
                </View>
              )}

              {/* ── Groupe Délégation ── */}
              {activeTransfer && (
                <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    <Ionicons name="send-outline" size={13} color="#8B5CF6" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#8B5CF6",
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                      }}
                    >
                      {ts("delegation")}
                    </Text>
                  </View>
                  {renderTransferCard(activeTransfer)}
                </View>
              )}

              {/* ── Bouton Affecter ── */}
              {canAssign && (
                <Pressable
                  testID="job-staffing-manage-btn"
                  onPress={() => setShowModal(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: pressed
                      ? colors.primary + "20"
                      : colors.primary + "10",
                    borderWidth: 1,
                    borderColor: colors.primary + "30",
                  })}
                >
                  <Ionicons
                    name="add-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: colors.primary,
                      marginLeft: 5,
                    }}
                  >
                    {ts("addResource")}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </>
  );
};

export default StaffingSection;
