/**
 * AssignResourceModal
 *
 * Permet à l'entreprise (propriétaire ou prestataire) d'affecter une de
 * ses propres ressources (véhicule ou membre du staff) à un job.
 *
 * - Récupère automatiquement le company_id depuis le profil utilisateur
 * - Appelle GET /v1/companies/:companyId/resources/availability (sans filtre
 *   resource_type) pour obtenir véhicules ET staff en une seule requête
 * - Deux sections scrollables : Véhicule / Équipe
 * - Sélection d'un item + choix du rôle (pour le staff)
 * - Confirmation → POST /v1/jobs/:jobId/assignments
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useOnboardingTarget } from "../../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    createAssignment,
    fetchResourceAvailability,
} from "../../services/jobAssignments";
import { fetchUserProfile } from "../../services/user";
import type {
    AssignmentRole,
    AvailableStaff,
    AvailableVehicle,
} from "../../types/jobAssignment";
import { OnboardingTourOverlay } from "../onboarding/OnboardingTourOverlay";
import AddStaffModal from "./AddStaffModal";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ActiveTab = "vehicle" | "staff";

interface AssignResourceModalProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé après une affectation réussie pour recharger la liste */
  onAssigned: () => void;
  jobId: string | number;
  companyId?: number;
  startAt?: string;
  endAt?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STAFF_ROLES: AssignmentRole[] = ["driver", "offsider", "supervisor"];

function fallbackWindow(): { startAt: string; endAt: string } {
  const start = new Date();
  const end = new Date(start.getTime() + 3600 * 1000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AssignResourceModal({
  visible,
  onClose,
  onAssigned,
  jobId,
  startAt,
  endAt,
}: AssignResourceModalProps) {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // Onboarding target on the Staff tab — step 14 tells the user to tap it.
  const staffTabTarget = useOnboardingTarget(21);
  // Onboarding target on the footer "Add team" button — step 22.
  const addTeamTarget = useOnboardingTarget(22);
  const { currentStep: onboardingStep, advanceToStep, markStepSeen } = useOnboardingTour();

  // AddStaffModal visibility — shown inline instead of navigating away
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Shortcut helpers
  const ts = (key: string, params?: Record<string, string>) =>
    t(`jobDetails.components.staffing.${key}` as any, params as any);
  const tm = (key: string) =>
    t(`jobDetails.components.staffing.modal.${key}` as any);

  // ── State ──
  const [activeTab, setActiveTab] = useState<ActiveTab>("vehicle");
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [staff, setStaff] = useState<AvailableStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Selected resource  (id + type)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<AssignmentRole>("driver");

  // company_id resolved from user profile
  const companyIdRef = useRef<number | null>(null);

  // ── Load resources when modal opens ──
  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setVehicles([]);
    setStaff([]);
    setSelectedVehicleId(null);
    setSelectedStaffId(null);
    setSelectedRole("driver");

    try {
      const profile = await fetchUserProfile();
      const cid = profile.company_id;
      if (!cid) {
        Alert.alert(
          t("common.error"),
          t("jobDetails.components.staffing.modal.loadError" as any),
        );
        setLoading(false);
        return;
      }
      companyIdRef.current = cid;

      const fallback = fallbackWindow();
      const result = await fetchResourceAvailability(
        cid,
        startAt ?? fallback.startAt,
        endAt ?? fallback.endAt,
        // no resource_type → returns both vehicles and staff
      );

      setVehicles(result.data.vehicles ?? []);
      setStaff(result.data.staff ?? []);
    } catch (err) {
      console.error("[AssignResourceModal] loadAvailability error:", err);
      Alert.alert(
        t("common.error"),
        t("jobDetails.components.staffing.modal.loadError" as any),
      );
    } finally {
      setLoading(false);
    }
  }, [startAt, endAt, t]);

  useEffect(() => {
    if (visible) {
      setActiveTab("vehicle");
      setSearchQuery("");
      loadAvailability();
    }
  }, [visible, loadAvailability]);

  // ── Filtering + Grouping ──
  const q = searchQuery.toLowerCase().trim();

  const filteredVehicles = useMemo(() => {
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.license_plate?.toLowerCase().includes(q) ||
        v.capacity?.toString().includes(q) ||
        (v as any).company_name?.toLowerCase().includes(q),
    );
  }, [vehicles, q]);

  const filteredStaff = useMemo(() => {
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        (s as any).company_name?.toLowerCase().includes(q),
    );
  }, [staff, q]);

  // Group vehicles by company
  const groupedVehicles = useMemo(() => {
    const groups: Record<string, AvailableVehicle[]> = {};
    for (const v of filteredVehicles) {
      const company = (v as any).company_name || "My Company";
      if (!groups[company]) groups[company] = [];
      groups[company].push(v);
    }
    return groups;
  }, [filteredVehicles]);

  // Group staff by company
  const groupedStaff = useMemo(() => {
    const groups: Record<string, AvailableStaff[]> = {};
    for (const s of filteredStaff) {
      const company = (s as any).company_name || "My Company";
      if (!groups[company]) groups[company] = [];
      groups[company].push(s);
    }
    return groups;
  }, [filteredStaff]);

  // ── Confirm assignment ──
  const handleAssign = async () => {
    const isVehicleTab = activeTab === "vehicle";
    const resourceId = isVehicleTab ? selectedVehicleId : selectedStaffId;

    if (!resourceId) return;

    setSubmitting(true);
    try {
      await createAssignment(jobId, {
        resource_type: isVehicleTab ? "vehicle" : "staff",
        resource_id: resourceId,
        role: isVehicleTab ? "vehicle" : selectedRole,
      });
      onAssigned();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tm("loadError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Selection state ──
  const hasSelection =
    activeTab === "vehicle" ? !!selectedVehicleId : !!selectedStaffId;

  const handleQuickAdd = useCallback(
    (target: "staff" | "vehicles") => {
      if (target === "staff") {
        if (onboardingStep === 22) {
          // Mark step 22/26 done so the onboarding flow continues inside AddStaffModal
          markStepSeen(22);
          markStepSeen(26);
        }
        // Open AddStaffModal directly inside this wizard — no page change
        setShowAddStaff(true);
      } else {
        // Vehicles: keep the old navigate-to-business behaviour
        onClose();
      }
    },
    [onClose, onboardingStep, markStepSeen],
  );

  const handleAddStaffClose = useCallback(() => {
    setShowAddStaff(false);
    loadAvailability();
  }, [loadAvailability]);

  const quickAddLabel =
    activeTab === "vehicle"
      ? `${t("common.add")} ${t("businessHub.subTabs.vehicles")}`
      : `${t("common.add")} ${t("businessHub.subTabs.staff")}`;

  // ─────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────

  const renderAvailabilityDot = (isAvailable: boolean) => (
    <View
      style={[
        styles.dot,
        { backgroundColor: isAvailable ? "#22C55E" : "#EF4444" },
      ]}
    />
  );

  const renderVehicleItem = (item: AvailableVehicle) => {
    const selected = selectedVehicleId === item.id;
    return (
      <Pressable
        key={item.id}
        testID={`vehicle-assign-item-${item.id}`}
        onPress={() => setSelectedVehicleId(selected ? null : item.id)}
        style={[
          styles.resourceItem,
          {
            backgroundColor: selected
              ? colors.primary + "18"
              : colors.backgroundTertiary,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {/* Left icon */}
        <View
          style={[
            styles.resourceIcon,
            { backgroundColor: "#F59E0B" + (selected ? "30" : "18") },
          ]}
        >
          <Ionicons name="car-outline" size={20} color="#F59E0B" />
        </View>

        {/* Info */}
        <View style={styles.resourceInfo}>
          <Text
            style={[styles.resourceName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.license_plate ? (
            <Text
              style={[styles.resourceSub, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.license_plate}
              {item.capacity ? ` · ${item.capacity}` : ""}
            </Text>
          ) : null}
        </View>

        {/* Availability */}
        <View style={styles.availRow}>
          {renderAvailabilityDot(item.is_available)}
          <Text
            style={[
              styles.availLabel,
              { color: item.is_available ? "#22C55E" : "#EF4444" },
            ]}
          >
            {item.is_available ? tm("available") : tm("unavailable")}
          </Text>
        </View>

        {/* Checkmark */}
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.primary}
            style={{ marginLeft: 6 }}
          />
        )}
      </Pressable>
    );
  };

  const renderStaffItem = (item: AvailableStaff) => {
    const selected = selectedStaffId === item.id;
    return (
      <View key={item.id}>
        <Pressable
          testID={`staff-assign-item-${item.id}`}
          onPress={() => setSelectedStaffId(selected ? null : item.id)}
          style={[
            styles.resourceItem,
            {
              backgroundColor: selected
                ? colors.primary + "18"
                : colors.backgroundTertiary,
              borderColor: selected ? colors.primary : colors.border,
            },
          ]}
        >
          {/* Left icon */}
          <View
            style={[
              styles.resourceIcon,
              { backgroundColor: "#3B82F6" + (selected ? "30" : "18") },
            ]}
          >
            <Ionicons name="person-outline" size={20} color="#3B82F6" />
          </View>

          {/* Info */}
          <View style={styles.resourceInfo}>
            <Text
              style={[styles.resourceName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.firstName} {item.lastName}
            </Text>
            {item.email ? (
              <Text
                style={[styles.resourceSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            ) : null}
          </View>

          {/* Availability */}
          <View style={styles.availRow}>
            {renderAvailabilityDot(item.is_available)}
            <Text
              style={[
                styles.availLabel,
                { color: item.is_available ? "#22C55E" : "#EF4444" },
              ]}
            >
              {item.is_available ? tm("available") : tm("unavailable")}
            </Text>
          </View>

          {/* Checkmark */}
          {selected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
              style={{ marginLeft: 6 }}
            />
          )}
        </Pressable>

        {/* Role picker — shown directly under selected staff member */}
        {selected && (
          <View
            style={[
              styles.rolePicker,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[styles.rolePickerLabel, { color: colors.textSecondary }]}
            >
              {tm("selectRole")}
            </Text>
            <View style={styles.roleRow}>
              {STAFF_ROLES.map((role) => {
                const active = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    testID={`role-select-${role}`}
                    onPress={() => setSelectedRole(role)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: active
                          ? colors.primary + "20"
                          : colors.backgroundTertiary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        {
                          color: active ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {ts(
                        `role${role.charAt(0).toUpperCase()}${role.slice(1)}`,
                      )}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {tm("title")}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons
                name="close-outline"
                size={24}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* ── Tabs ── */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            {(["vehicle", "staff"] as ActiveTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "vehicle" ? ts("vehicle") : ts("team");
              const icon = tab === "vehicle" ? "car-outline" : "people-outline";
              const color = tab === "vehicle" ? "#F59E0B" : "#3B82F6";
              return (
                <Pressable
                  key={tab}
                  testID={`assign-resource-${tab}-tab`}
                  ref={tab === "staff" ? staffTabTarget.ref : undefined}
                  onLayout={tab === "staff" ? staffTabTarget.onLayout : undefined}
                  onPress={() => {
                    setActiveTab(tab);
                    if (tab === "staff" && onboardingStep === 21) {
                      advanceToStep(22 as any);
                    }
                  }}
                  style={[
                    styles.tab,
                    isActive && {
                      borderBottomWidth: 2,
                      borderBottomColor: color,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={15}
                    color={isActive ? color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? color : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Search Bar ── */}
          {!loading && (
            <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t("common.search")}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}

          {/* ── Content ── */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                {ts("loading")}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === "vehicle" ? (
                filteredVehicles.length === 0 ? (
                  <View style={styles.emptyStateWrap}>
                    <Text
                      style={[styles.emptyText, { color: colors.textSecondary }]}
                    >
                      {tm("noVehicles")}
                    </Text>
                    <Pressable
                      onPress={() => handleQuickAdd("vehicles")}
                      style={[
                        styles.emptyActionBtn,
                        {
                          backgroundColor: colors.primary + "15",
                          borderColor: colors.primary + "40",
                        },
                      ]}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                      <Text style={[styles.emptyActionText, { color: colors.primary }]}>
                        {`${t("common.add")} ${t("businessHub.subTabs.vehicles")}`}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  Object.entries(groupedVehicles).map(([companyName, items]) => (
                    <View key={companyName} style={[styles.companyGroup, { borderColor: colors.border }]}>
                      <View style={styles.companyHeader}>
                        <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.companyName, { color: colors.textSecondary }]}>
                          {companyName}
                        </Text>
                      </View>
                      {items.map(renderVehicleItem)}
                    </View>
                  ))
                )
              ) : filteredStaff.length === 0 ? (
                <View style={styles.emptyStateWrap}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    {tm("noStaff")}
                  </Text>
                  <Pressable
                    onPress={() => handleQuickAdd("staff")}
                    style={[
                      styles.emptyActionBtn,
                      {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary + "40",
                      },
                    ]}
                  >
                    <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                    <Text style={[styles.emptyActionText, { color: colors.primary }]}>
                      {`${t("common.add")} ${t("businessHub.subTabs.staff")}`}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                Object.entries(groupedStaff).map(([companyName, items]) => (
                  <View key={companyName} style={[styles.companyGroup, { borderColor: colors.border }]}>
                    <View style={styles.companyHeader}>
                      <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.companyName, { color: colors.textSecondary }]}>
                        {companyName}
                      </Text>
                    </View>
                    {items.map(renderStaffItem)}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* ── Footer CTA ── */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={onClose}
              style={[
                styles.footerBtn,
                styles.footerBtnCancel,
                { borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.footerBtnText, { color: colors.textSecondary }]}
              >
                {t("common.cancel")}
              </Text>
            </Pressable>

            <Pressable
              ref={activeTab === "staff" ? addTeamTarget.ref : undefined}
              onLayout={activeTab === "staff" ? addTeamTarget.onLayout : undefined}
              onPress={() =>
                handleQuickAdd(activeTab === "vehicle" ? "vehicles" : "staff")
              }
              style={[
                styles.footerBtn,
                styles.footerBtnQuick,
                {
                  borderColor: colors.primary + "55",
                  backgroundColor: colors.primary + "10",
                },
              ]}
            >
              <Text style={[styles.footerBtnText, { color: colors.primary }]}>
                {quickAddLabel}
              </Text>
            </Pressable>

            <Pressable
              testID="staff-assign-confirm-btn"
              onPress={handleAssign}
              disabled={!hasSelection || submitting}
              style={[
                styles.footerBtn,
                styles.footerBtnConfirm,
                {
                  backgroundColor:
                    hasSelection && !submitting
                      ? colors.primary
                      : colors.primary + "50",
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.footerBtnText, { color: "#fff" }]}>
                  {tm("assign")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      {/* Onboarding bubble stacked above this native modal */}
      <OnboardingTourOverlay />
    </Modal>
    {/* AddStaffModal rendered outside the Modal to avoid nesting issues */}
    <AddStaffModal
      visible={showAddStaff}
      onClose={handleAddStaffClose}
      onInviteEmployee={async () => {}}
      onSearchContractor={async () => []}
      onAddContractor={async () => {}}
      onInviteContractor={async () => ({ success: true, message: "" })}
    />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
    borderTopRightRadius: DESIGN_TOKENS.radius.xl,
    maxHeight: "85%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  centered: {
    paddingVertical: DESIGN_TOKENS.spacing.xxl ?? 40,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  list: {
    flexGrow: 0,
    maxHeight: 380,
  },
  listContent: {
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    paddingVertical: DESIGN_TOKENS.spacing.xl,
  },
  emptyStateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: DESIGN_TOKENS.spacing.lg,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1.5,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: DESIGN_TOKENS.spacing.sm,
    marginRight: DESIGN_TOKENS.spacing.xs,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: "600",
  },
  resourceSub: {
    fontSize: 11,
    marginTop: 1,
  },
  availRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  rolePicker: {
    marginTop: 4,
    marginBottom: 4,
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.sm,
  },
  rolePickerLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  roleRow: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.xs,
    flexWrap: "wrap",
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1.5,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.sm,
    padding: DESIGN_TOKENS.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  footerBtnCancel: {
    borderWidth: 1.5,
  },
  footerBtnQuick: {
    borderWidth: 1.2,
  },
  footerBtnConfirm: {},
  footerBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  companyGroup: {
    borderWidth: 1.5,
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
