/**
 * JobTimeBreakdown — Écran récapitulatif post-job
 *
 * Affiche la timeline détaillée des segments, le coût par employé,
 * et le total (mode horaire) ou le détail forfait (mode flat_rate).
 *
 * Accessible depuis un job complété via "Voir le détail des heures".
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    fetchJobTimeBreakdown,
    updateReturnTripApi,
} from "../../services/jobSegmentApiService";
import {
    formatDurationMs,
    getSegmentColor,
    getSegmentIcon,
} from "../../services/jobSegmentService";
import type {
    FlatRateOption,
    JobTimeBreakdown as JobTimeBreakdownType,
} from "../../types/jobSegment";
import { getSegmentLabel } from "../../utils/getSegmentLabel";

// ============================================================================
// TYPES
// ============================================================================

interface JobTimeBreakdownScreenProps {
  route?: { params?: { breakdown?: JobTimeBreakdownType; jobReference?: string; jobId?: string | number } };
  navigation?: any;
  breakdown?: JobTimeBreakdownType;
  jobId?: string | number;
  jobReference?: string; // e.g. "JOB-2026-042"
  onEditReturnTrip?: (newMinutes: number) => void;
  onEditOptions?: (options: FlatRateOption[]) => void;
  onValidateAndPay?: () => void;
  onClose?: () => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

const JobTimeBreakdownScreen: React.FC<JobTimeBreakdownScreenProps> = ({
  route,
  navigation,
  breakdown: breakdownProp,
  jobId: jobIdProp,
  jobReference: jobReferenceProp,
  onEditReturnTrip,
  onEditOptions,
  onValidateAndPay,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const jobId = jobIdProp ?? route?.params?.jobId;
  const jobReference = jobReferenceProp ?? route?.params?.jobReference;
  const handleClose = onClose ?? (() => navigation?.goBack?.());

  // State for API-fetched breakdown
  const [fetchedBreakdown, setFetchedBreakdown] = useState<JobTimeBreakdownType | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch from API if no breakdown prop/route and jobId is provided
  useEffect(() => {
    const directBreakdown = breakdownProp ?? route?.params?.breakdown;
    if (!directBreakdown && jobId) {
      setLoading(true);
      fetchJobTimeBreakdown(jobId)
        .then(setFetchedBreakdown)
        .catch((err) => console.error('Failed to fetch breakdown:', err))
        .finally(() => setLoading(false));
    }
  }, [jobId, breakdownProp, route?.params?.breakdown]);

  const breakdown = breakdownProp ?? route?.params?.breakdown ?? fetchedBreakdown;

  const isFlatRate = breakdown?.billingMode === "flat_rate";

  const [editingReturnTrip, setEditingReturnTrip] = useState(false);
  const [returnTripMinutes, setReturnTripMinutes] = useState("");

  const billingModeLabel = useMemo(() => {
    const labels: Record<string, string> = {
      location_to_location: "Lieu à lieu",
      depot_to_depot: "Dépôt-à-dépôt",
      flat_rate: "Forfait",
      packing_only: "Packing only",
      unpacking_only: "Unpacking only",
    };
    const mode = breakdown?.billingMode ?? "";
    return labels[mode] ?? mode;
  }, [breakdown?.billingMode]);

  const handleSaveReturnTrip = useCallback(() => {
    const mins = parseInt(returnTripMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert("Erreur", "Entrez un nombre de minutes valide.");
      return;
    }
    if (onEditReturnTrip) {
      onEditReturnTrip(mins);
    } else if (jobId) {
      updateReturnTripApi(jobId, mins).catch((err) =>
        Alert.alert("Erreur", err.message),
      );
    }
    setEditingReturnTrip(false);
  }, [returnTripMinutes, onEditReturnTrip, jobId]);

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Styles ──
  const sectionDivider = useMemo(
    () => ({
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.lg,
    }),
    [colors],
  );

  const sectionLabel = useMemo(
    () => ({
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.textSecondary,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: DESIGN_TOKENS.spacing.md,
    }),
    [colors],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!breakdown) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          📊 Récapitulatif
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* ── En-tête du job ── */}
        <View style={{ marginTop: DESIGN_TOKENS.spacing.lg }}>
          {jobReference && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 4,
              }}
            >
              {jobReference}
            </Text>
          )}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Mode : {billingModeLabel}
          </Text>

          {!isFlatRate && (
            <View
              style={{
                flexDirection: "row",
                gap: DESIGN_TOKENS.spacing.lg,
                marginTop: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                  {formatDurationMs(breakdown.totalDurationMs)}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Facturable</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                  {formatDurationMs(breakdown.billableDurationMs)}
                </Text>
              </View>
            </View>
          )}

          {isFlatRate && (
            <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Forfait de base : {formatCurrency(breakdown.flatRateAmount ?? 0)}
                {breakdown.flatRateMaxHours
                  ? ` (≤ ${breakdown.flatRateMaxHours}h)`
                  : ""}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                Temps réel : {formatDurationMs(breakdown.totalDurationMs)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Timeline des segments ── */}
        <View style={sectionDivider} />
        <Text style={sectionLabel}>Timeline des segments</Text>

        <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
          {breakdown.segments.map((seg) => {
            const segColor = getSegmentColor(seg.type);
            const segIcon = getSegmentIcon(seg.type);

            return (
              <View key={seg.segmentId}>
                {/* Segment header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: segColor + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={segIcon as any} size={14} color={segColor} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {getSegmentLabel(t, seg.labelKey, seg.label)}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {formatDurationMs(seg.durationMs)}
                  </Text>
                  {!seg.isBillable && (
                    <View
                      style={{
                        backgroundColor: colors.textSecondary + "20",
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.textSecondary,
                          fontWeight: "600",
                        }}
                      >
                        non facturé
                      </Text>
                    </View>
                  )}
                </View>

                {/* Employees for this segment */}
                {seg.employees.map((emp) => (
                  <View
                    key={`${seg.segmentId}-${emp.employeeId}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingLeft: 40,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, width: 8 }}>
                      ├
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: colors.text,
                      }}
                    >
                      {emp.employeeName}{" "}
                      <Text style={{ color: colors.textSecondary }}>({emp.role})</Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginRight: 8 }}>
                      {formatDurationMs(emp.workedDurationMs ?? 0)}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                      → {formatCurrency(emp.cost ?? 0)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* ── Détail forfait (mode flat_rate) ── */}
        {isFlatRate && (
          <>
            <View style={sectionDivider} />
            <Text style={sectionLabel}>Détail forfait</Text>

            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                gap: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  💰 Forfait de base
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                  {formatCurrency(breakdown.flatRateAmount ?? 0)}
                </Text>
              </View>

              {(breakdown.flatRateOverageHours ?? 0) > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ fontSize: 14, color: colors.text }}>
                      ⏱️ Dépassement : {breakdown.flatRateOverageHours?.toFixed(1)}h
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 20 }}>
                      × {formatCurrency(breakdown.flatRateOverageHours && breakdown.flatRateOverageCost
                        ? breakdown.flatRateOverageCost / breakdown.flatRateOverageHours
                        : 0)}/h
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#EF4444" }}>
                    → {formatCurrency(breakdown.flatRateOverageCost ?? 0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Options sélectionnées */}
            {(breakdown.selectedOptions?.length ?? 0) > 0 && (
              <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
                <Text style={sectionLabel}>Options sélectionnées</Text>
                <View
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  {breakdown.selectedOptions?.map((opt) => (
                    <View
                      key={opt.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: colors.text }}>{opt.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {formatCurrency(opt.price)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Coût par employé (modes horaires) ── */}
        {!isFlatRate && (
          <>
            <View style={sectionDivider} />
            <Text style={sectionLabel}>Coût par employé</Text>

            <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
              {breakdown.employees.map((emp) => (
                <View
                  key={emp.employeeId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                      {emp.employeeName}{" "}
                      <Text style={{ fontWeight: "400", color: colors.textSecondary }}>
                        ({emp.role})
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {formatDurationMs(emp.totalWorkedMs)} total
                      {emp.billableWorkedMs !== emp.totalWorkedMs &&
                        ` · ${formatDurationMs(emp.billableWorkedMs)} facturé`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                    {formatCurrency(emp.totalCost)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── TOTAL ── */}
        <View
          style={{
            marginTop: DESIGN_TOKENS.spacing.xl,
            borderTopWidth: 2,
            borderTopColor: colors.text,
            paddingTop: DESIGN_TOKENS.spacing.md,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            TOTAL
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
            {formatCurrency(breakdown.totalCost)}
          </Text>
        </View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          paddingBottom: DESIGN_TOKENS.spacing.xl,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {/* Edit return trip (depot modes) */}
        {breakdown.billingMode === "depot_to_depot" && (onEditReturnTrip || jobId) && (
          <>
            {!editingReturnTrip ? (
              <Pressable
                onPress={() => setEditingReturnTrip(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  gap: DESIGN_TOKENS.spacing.xs,
                }}
              >
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Modifier temps de retour
                </Text>
              </Pressable>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <TextInput
                  value={returnTripMinutes}
                  onChangeText={setReturnTripMinutes}
                  keyboardType="number-pad"
                  placeholder="min"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    fontSize: 14,
                    color: colors.text,
                  }}
                />
                <Pressable
                  onPress={handleSaveReturnTrip}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>OK</Text>
                </Pressable>
                <Pressable onPress={() => setEditingReturnTrip(false)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* Edit options (flat rate) */}
        {isFlatRate && onEditOptions && (
          <Pressable
            onPress={() => onEditOptions(breakdown.selectedOptions ?? [])}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: DESIGN_TOKENS.radius.md,
              gap: DESIGN_TOKENS.spacing.xs,
            }}
          >
            <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Modifier les options
            </Text>
          </Pressable>
        )}

        {/* Validate & pay */}
        {onValidateAndPay && (
          <Pressable
            onPress={onValidateAndPay}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              borderRadius: DESIGN_TOKENS.radius.md,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              gap: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              Valider et payer
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default JobTimeBreakdownScreen;
