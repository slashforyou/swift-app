/**
 * ContracteeNegotiationModal
 *
 * Wizard multi-étapes pour le créateur du job (contractee) qui reçoit
 * une contre-proposition de la part du prestataire (contractor).
 *
 * Étape 1 – Détails complets de la contre-proposition
 * Étape 2 – Décision : Accepter ou Rejeter
 * Étape 3A – Succès (accepté)
 * Étape 3B – Rejeté (retour à "pending")
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useVehicles } from "../../hooks/useVehicles";
import {
    acceptCounterProposal,
    rejectCounterProposal,
} from "../../services/jobs";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type WizardStep = "overview" | "decision" | "accepted" | "rejected";

export interface CounterProposalInfo {
  /** ID du job (numérique ou code) */
  jobId: string;
  jobTitle?: string;
  contractorName?: string;
  /** ISO datetime */
  proposedStart?: string;
  /** ISO datetime */
  proposedEnd?: string;
  proposedAt?: string;
  /** JSON sérialisé contenant price, drivers, note, etc. */
  notePayload?: string;
}

interface ContracteeNegotiationModalProps {
  visible: boolean;
  info: CounterProposalInfo | null;
  onClose: () => void;
  onJobUpdated: () => void;
}

// ─────────────────────────────────────────────
// Types internes
// ─────────────────────────────────────────────

interface ParsedProposal {
  text: string | null;
  proposedPrice: number | null;
  priceType: "hourly" | "flat" | "daily" | null;
  vehicleId: string | null;
  proposedDrivers: number | null;
  proposedOffsiders: number | null;
  proposedPackers: number | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatTime = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const parsePriceType = (
  raw?: string | null,
): "hourly" | "flat" | "daily" | null => {
  if (raw === "hourly" || raw === "flat" || raw === "daily") return raw;
  return null;
};

const priceTypeLabel = (type: "hourly" | "flat" | "daily" | null): string => {
  switch (type) {
    case "hourly":
      return "À l'heure";
    case "daily":
      return "À la journée";
    case "flat":
      return "Forfait";
    default:
      return "";
  }
};

const priceTypeSuffix = (type: "hourly" | "flat" | "daily" | null): string => {
  switch (type) {
    case "hourly":
      return " / heure";
    case "daily":
      return " / jour";
    default:
      return "";
  }
};

const parseNotePayload = (raw?: string): ParsedProposal => {
  const empty: ParsedProposal = {
    text: null,
    proposedPrice: null,
    priceType: null,
    vehicleId: null,
    proposedDrivers: null,
    proposedOffsiders: null,
    proposedPackers: null,
  };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    return {
      text: parsed.text ?? null,
      proposedPrice:
        parsed.proposed_price != null ? Number(parsed.proposed_price) : null,
      priceType: parsePriceType(parsed.price_type),
      vehicleId: parsed.vehicle_id ? String(parsed.vehicle_id) : null,
      proposedDrivers:
        parsed.proposed_drivers != null
          ? Number(parsed.proposed_drivers)
          : null,
      proposedOffsiders:
        parsed.proposed_offsiders != null
          ? Number(parsed.proposed_offsiders)
          : null,
      proposedPackers:
        parsed.proposed_packers != null
          ? Number(parsed.proposed_packers)
          : null,
    };
  } catch {
    return { ...empty, text: raw };
  }
};

const formatCurrency = (amount: number): string =>
  amount.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export const ContracteeNegotiationModal: React.FC<
  ContracteeNegotiationModalProps
> = ({ visible, info, onClose, onJobUpdated }) => {
  const { colors } = useTheme();
  const { vehicles } = useVehicles();

  const [step, setStep] = useState<WizardStep>("overview");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser à chaque ouverture
  useEffect(() => {
    if (visible) {
      setStep("overview");
      setRejectReason("");
      setIsSubmitting(false);
    }
  }, [visible]);

  const parsed = useMemo(
    () => parseNotePayload(info?.notePayload),
    [info?.notePayload],
  );

  // Résolution du nom du véhicule
  const vehicleName = useMemo(() => {
    if (!parsed.vehicleId) return null;
    const v = vehicles.find((v) => String(v.id) === String(parsed.vehicleId));
    if (!v) return `#${parsed.vehicleId}`;
    const name = `${v.make} ${v.model}`.trim();
    return v.registration ? `${name} (${v.registration})` : name;
  }, [parsed.vehicleId, vehicles]);

  // Durée estimée
  const estimatedDuration = useMemo(() => {
    if (!info?.proposedStart || !info?.proposedEnd) return null;
    try {
      const ms =
        new Date(info.proposedEnd).getTime() -
        new Date(info.proposedStart).getTime();
      if (ms <= 0) return null;
      const totalMin = Math.round(ms / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return h > 0
        ? m > 0
          ? `${h}h${String(m).padStart(2, "0")}`
          : `${h}h`
        : `${m} min`;
    } catch {
      return null;
    }
  }, [info?.proposedStart, info?.proposedEnd]);

  // Total équipe
  const totalCrew = useMemo(() => {
    return (
      (parsed.proposedDrivers ?? 0) +
      (parsed.proposedOffsiders ?? 0) +
      (parsed.proposedPackers ?? 0)
    );
  }, [parsed]);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const handleAccept = useCallback(async () => {
    if (!info) return;
    setIsSubmitting(true);
    try {
      await acceptCounterProposal(info.jobId);
      setStep("accepted");
      onJobUpdated();
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d'accepter la proposition. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [info, onJobUpdated]);

  const handleReject = useCallback(async () => {
    if (!info) return;
    setIsSubmitting(true);
    try {
      await rejectCounterProposal(info.jobId, rejectReason.trim() || undefined);
      setStep("rejected");
      onJobUpdated();
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de rejeter la proposition. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [info, rejectReason, onJobUpdated]);

  // ─────────────────────────────────────────────
  // Step config
  // ─────────────────────────────────────────────

  const getStepLabel = () => {
    switch (step) {
      case "overview":
        return "Étape 1/2 — Proposition reçue";
      case "decision":
        return "Étape 2/2 — Votre décision";
      case "accepted":
        return "Négociation terminée";
      case "rejected":
        return "Négociation terminée";
    }
  };

  const getHeaderTitle = () => {
    switch (step) {
      case "overview":
        return "Contre-proposition";
      case "decision":
        return "Votre réponse";
      case "accepted":
        return "Proposition acceptée";
      case "rejected":
        return "Proposition rejetée";
    }
  };

  // ─────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "94%",
      minHeight: "80%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flex: 1 },
    stepLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.warning || "#F59E0B",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: { padding: 8 },
    scrollContent: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.xl,
    },

    // Status badge
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: (colors.warning || "#F59E0B") + "20",
      borderRadius: DESIGN_TOKENS.radius.full,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: 5,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      gap: 6,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.warning || "#F59E0B",
    },

    // Contractor banner
    contractorBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.info + "15",
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.info,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    contractorBadgeText: { flex: 1 },
    contractorLabel: {
      fontSize: 11,
      color: colors.info,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    contractorName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginTop: 1,
    },

    // Section title
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.xs,
    },

    // Info card
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },

    // Schedule card
    scheduleCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    scheduleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    scheduleBlock: { alignItems: "center", flex: 1 },
    scheduleBlockLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    scheduleTime: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.primary,
    },
    scheduleDate: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: "center",
    },
    scheduleSeparator: {
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    },
    scheduleDuration: {
      backgroundColor: colors.primary + "15",
      borderRadius: DESIGN_TOKENS.radius.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: 4,
      alignSelf: "center",
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    scheduleDurationText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },

    // Price card
    priceCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: (colors.success || "#22C55E") + "40",
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    priceLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    priceTypeTag: {
      backgroundColor: (colors.success || "#22C55E") + "18",
      borderRadius: DESIGN_TOKENS.radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    priceTypeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.success || "#22C55E",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    priceAmount: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.success || "#22C55E",
    },
    priceSuffix: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    noPriceText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: "italic",
    },

    // Crew card
    crewCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    crewGrid: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    crewItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.sm,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    crewItemActive: {
      borderColor: colors.primary + "60",
      backgroundColor: colors.primary + "08",
    },
    crewCount: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    crewCountActive: { color: colors.primary },
    crewLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: "center",
    },
    crewTotal: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: DESIGN_TOKENS.spacing.sm,
      fontStyle: "italic",
    },

    // Info row (with icon)
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    infoIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginTop: 2,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },

    // Action bar
    actionBar: {
      flexDirection: "row",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    btnAccept: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: (colors.success || "#22C55E") + "18",
      borderWidth: 1.5,
      borderColor: colors.success || "#22C55E",
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: 14,
      gap: 6,
    },
    btnAcceptText: {
      color: colors.success || "#22C55E",
      fontSize: 15,
      fontWeight: "700",
    },
    btnReject: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: (colors.error || "#EF4444") + "12",
      borderWidth: 1.5,
      borderColor: (colors.error || "#EF4444") + "80",
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: 14,
      gap: 6,
    },
    btnRejectText: {
      color: colors.error || "#EF4444",
      fontSize: 15,
      fontWeight: "700",
    },
    btnFullDanger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.error || "#EF4444",
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: 14,
      gap: 6,
    },
    btnFullDangerText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    btnFullSuccess: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success || "#22C55E",
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: 14,
      gap: 6,
    },
    btnFullSuccessText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    btnSecondary: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: 14,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    btnSecondaryText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },

    // Textarea
    textarea: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: 14,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: "top",
      margin: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    textareaLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      marginTop: DESIGN_TOKENS.spacing.md,
    },

    // Result screens
    resultContainer: {
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    },
    resultIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    resultTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    resultSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });

  // ─────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────

  const renderOverview = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status badge */}
        <View style={styles.statusBadge}>
          <Ionicons
            name="swap-horizontal"
            size={14}
            color={colors.warning || "#F59E0B"}
          />
          <Text style={styles.statusText}>En négociation</Text>
        </View>

        {/* Contractor banner */}
        {info?.contractorName && (
          <View style={styles.contractorBadge}>
            <Ionicons name="business" size={22} color={colors.info} />
            <View style={styles.contractorBadgeText}>
              <Text style={styles.contractorLabel}>Proposition de</Text>
              <Text style={styles.contractorName}>{info.contractorName}</Text>
              {info.proposedAt && (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Soumise le {formatDateTime(info.proposedAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Créneaux */}
        <Text style={styles.sectionTitle}>Créneaux proposés</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>Début</Text>
              <Text style={styles.scheduleTime}>
                {formatTime(info?.proposedStart)}
              </Text>
              <Text style={styles.scheduleDate}>
                {formatDate(info?.proposedStart)}
              </Text>
            </View>
            <View style={styles.scheduleSeparator}>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>Fin</Text>
              <Text style={styles.scheduleTime}>
                {formatTime(info?.proposedEnd)}
              </Text>
              <Text style={styles.scheduleDate}>
                {formatDate(info?.proposedEnd)}
              </Text>
            </View>
          </View>
          {estimatedDuration && (
            <View style={styles.scheduleDuration}>
              <Text style={styles.scheduleDurationText}>
                ⏱ Durée estimée : {estimatedDuration}
              </Text>
            </View>
          )}
        </View>

        {/* Prix */}
        <Text style={styles.sectionTitle}>Tarification proposée</Text>
        <View style={styles.priceCard}>
          {parsed.proposedPrice != null ? (
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Ionicons
                  name="cash"
                  size={26}
                  color={colors.success || "#22C55E"}
                />
                <View>
                  {parsed.priceType && (
                    <View style={styles.priceTypeTag}>
                      <Text style={styles.priceTypeText}>
                        {priceTypeLabel(parsed.priceType)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.priceAmount}>
                    {formatCurrency(parsed.proposedPrice)}
                    <Text style={styles.priceSuffix}>
                      {priceTypeSuffix(parsed.priceType)}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons
                name="cash-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.infoIcon}
              />
              <Text style={styles.noPriceText}>Prix non spécifié</Text>
            </View>
          )}
        </View>

        {/* Véhicule */}
        <Text style={styles.sectionTitle}>Véhicule</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="car"
              size={18}
              color={vehicleName ? colors.primary : colors.textSecondary}
              style={styles.infoIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Camion proposé</Text>
              <Text
                style={[
                  styles.infoValue,
                  !vehicleName && {
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    fontWeight: "400",
                  },
                ]}
              >
                {vehicleName ?? "Non spécifié"}
              </Text>
            </View>
          </View>
        </View>

        {/* Équipe */}
        <Text style={styles.sectionTitle}>Composition de l&apos;équipe</Text>
        <View style={styles.crewCard}>
          <View style={styles.crewGrid}>
            <View
              style={[
                styles.crewItem,
                (parsed.proposedDrivers ?? 0) > 0 && styles.crewItemActive,
              ]}
            >
              <Ionicons
                name="person"
                size={20}
                color={
                  (parsed.proposedDrivers ?? 0) > 0
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.crewCount,
                  (parsed.proposedDrivers ?? 0) > 0 && styles.crewCountActive,
                ]}
              >
                {parsed.proposedDrivers ?? 0}
              </Text>
              <Text style={styles.crewLabel}>
                Chauffeur{(parsed.proposedDrivers ?? 0) > 1 ? "s" : ""}
              </Text>
            </View>
            <View
              style={[
                styles.crewItem,
                (parsed.proposedOffsiders ?? 0) > 0 && styles.crewItemActive,
              ]}
            >
              <Ionicons
                name="people"
                size={20}
                color={
                  (parsed.proposedOffsiders ?? 0) > 0
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.crewCount,
                  (parsed.proposedOffsiders ?? 0) > 0 && styles.crewCountActive,
                ]}
              >
                {parsed.proposedOffsiders ?? 0}
              </Text>
              <Text style={styles.crewLabel}>
                Offsider{(parsed.proposedOffsiders ?? 0) > 1 ? "s" : ""}
              </Text>
            </View>
            <View
              style={[
                styles.crewItem,
                (parsed.proposedPackers ?? 0) > 0 && styles.crewItemActive,
              ]}
            >
              <Ionicons
                name="cube"
                size={20}
                color={
                  (parsed.proposedPackers ?? 0) > 0
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.crewCount,
                  (parsed.proposedPackers ?? 0) > 0 && styles.crewCountActive,
                ]}
              >
                {parsed.proposedPackers ?? 0}
              </Text>
              <Text style={styles.crewLabel}>
                Packer{(parsed.proposedPackers ?? 0) > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          {totalCrew > 0 && (
            <Text style={styles.crewTotal}>
              {totalCrew} personne{totalCrew > 1 ? "s" : ""} au total
            </Text>
          )}
        </View>

        {/* Note du prestataire */}
        {parsed.text && (
          <>
            <Text style={styles.sectionTitle}>Note du prestataire</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.infoIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Message</Text>
                  <Text style={styles.infoValue}>{parsed.text}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Action bar fixe */}
      <View style={styles.actionBar}>
        <Pressable
          testID="counter-proposal-decline-btn"
          style={({ pressed }) => [
            styles.btnReject,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => setStep("decision")}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={colors.error || "#EF4444"}
          />
          <Text style={styles.btnRejectText}>Rejeter</Text>
        </Pressable>
        <Pressable
          testID="counter-proposal-accept-btn"
          style={({ pressed }) => [
            styles.btnAccept,
            { opacity: isSubmitting || pressed ? 0.8 : 1 },
          ]}
          onPress={() =>
            Alert.alert(
              "Accepter la proposition ?",
              `Confirmer l'accord avec ${info?.contractorName ?? "le prestataire"} ?`,
              [
                { text: "Annuler", style: "cancel" },
                { text: "Accepter", onPress: handleAccept },
              ],
            )
          }
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.success || "#22C55E"} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.success || "#22C55E"}
              />
              <Text style={styles.btnAcceptText}>Accepter</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );

  const renderDecision = () => (
    <>
      <Text style={styles.textareaLabel}>
        Raison du rejet (optionnel — le prestataire sera informé)
      </Text>
      <TextInput
        style={styles.textarea}
        placeholder="Expliquez pourquoi cette proposition ne convient pas…"
        placeholderTextColor={colors.textSecondary}
        value={rejectReason}
        onChangeText={setRejectReason}
        multiline
        maxLength={500}
        autoFocus
      />
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        En rejetant, le job revient en attente et le prestataire pourra
        soumettre une nouvelle proposition.
      </Text>

      <View style={styles.actionBar}>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            { opacity: isSubmitting || pressed ? 0.6 : 1 },
          ]}
          onPress={() => setStep("overview")}
          disabled={isSubmitting}
        >
          <Text style={styles.btnSecondaryText}>← Retour</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnFullDanger,
            { opacity: isSubmitting || pressed ? 0.8 : 1 },
          ]}
          onPress={handleReject}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.btnFullDangerText}>Confirmer le rejet</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );

  const renderAccepted = () => (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: (colors.success || "#22C55E") + "20" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={44}
              color={colors.success || "#22C55E"}
            />
          </View>
          <Text style={styles.resultTitle}>Proposition acceptée !</Text>
          <Text style={styles.resultSubtitle}>
            {info?.contractorName ?? "Le prestataire"} a été informé. Le job est
            maintenant confirmé sur les créneaux convenus.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.actionBar}>
        <Pressable
          style={({ pressed }) => [
            styles.btnFullSuccess,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={onClose}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.btnFullSuccessText}>Fermer</Text>
        </Pressable>
      </View>
    </>
  );

  const renderRejected = () => (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: (colors.error || "#EF4444") + "15" },
            ]}
          >
            <Ionicons
              name="close-circle"
              size={44}
              color={colors.error || "#EF4444"}
            />
          </View>
          <Text style={styles.resultTitle}>Proposition rejetée</Text>
          <Text style={styles.resultSubtitle}>
            {info?.contractorName ?? "Le prestataire"} a été informé que sa
            proposition n&apos;a pas été retenue. Il peut soumettre une nouvelle
            proposition ou le job peut être redélégué.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.actionBar}>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            { flex: 1, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={onClose}
        >
          <Text style={styles.btnSecondaryText}>Fermer</Text>
        </Pressable>
      </View>
    </>
  );

  const renderContent = () => {
    switch (step) {
      case "overview":
        return renderOverview();
      case "decision":
        return renderDecision();
      case "accepted":
        return renderAccepted();
      case "rejected":
        return renderRejected();
    }
  };
  // ─────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.stepLabel}>{getStepLabel()}</Text>
              <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {renderContent()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ContracteeNegotiationModal;
