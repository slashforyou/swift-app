/**
 * AssignResourceModal — v2
 *
 * Nouveau flux :
 *   1. Liste des véhicules disponibles, paginés PAGE_SIZE à la fois
 *      Chaque carte : entreprise, nom du camion, volume, prix
 *   2. Sélection → wizard équipage
 *      - Chauffeur inclus (automatique, non modifiable)
 *      - Offsiders optionnels (compteur 0–5)
 *   3. Bouton "Demander du personnel" pour des offsiders sans véhicule
 *
 * Aucune liste de staff n'est exposée (protection contre la discrimination).
 *
 * Spec : docs/AVAILABILITY_ASSIGNMENT_SPEC.md — section 9.1
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
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
import { ServerData } from "../../../constants/ServerData";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import {
    createAssignment,
    fetchResourceAvailability,
} from "../../../services/jobAssignments";
import type {
    AvailabilityConflict,
    AvailableVehicle,
} from "../../../types/jobAssignment";
import { fetchWithAuth } from "../../../utils/session";

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface AssignResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
  jobId: string | number;
  companyId: number;
  /** Créneau du job pour calculer la disponibilité */
  startAt?: string;
  endAt?: string;
}

// ─────────────────────────────────────────────────────────────
// ConflictBadge
// ─────────────────────────────────────────────────────────────

const ConflictBadge: React.FC<{
  conflicts: AvailabilityConflict[];
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ conflicts, colors }) => {
  if (conflicts.length === 0) return null;
  return (
    <View style={{ marginTop: 4 }}>
      {conflicts.map((c, i) => (
        <Text
          key={i}
          style={{ fontSize: 11, color: colors.warning, marginTop: 2 }}
        >
          ⚠️ Conflit : job {c.conflicting_job_code}
        </Text>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// CounterRow — sélecteur +/–
// ─────────────────────────────────────────────────────────────

const CounterRow: React.FC<{
  label: string;
  subtitle?: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ label, subtitle, icon, value, min, max, onChange, colors }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    }}
  >
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.primary + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => ({
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 1.5,
          borderColor: value <= min ? colors.border : colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Ionicons
          name="remove"
          size={16}
          color={value <= min ? colors.border : colors.primary}
        />
      </Pressable>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          minWidth: 24,
          textAlign: "center",
        }}
      >
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => ({
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 1.5,
          borderColor: value >= max ? colors.border : colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Ionicons
          name="add"
          size={16}
          color={value >= max ? colors.border : colors.primary}
        />
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

const AssignResourceModal: React.FC<AssignResourceModalProps> = ({
  visible,
  onClose,
  onAssigned,
  jobId,
  companyId,
  startAt,
  endAt,
}) => {
  const { colors } = useTheme();

  // ── Navigation ──
  const [step, setStep] = useState<"list" | "wizard">("list");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Données ──
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);

  // ── Sélection ──
  const [selectedVehicle, setSelectedVehicle] =
    useState<AvailableVehicle | null>(null);
  const [offsiderCount, setOffsiderCount] = useState(0);

  // ── Recherche ──
  const [searchQuery, setSearchQuery] = useState("");

  // ── Demande de personnel ──
  const [showStaffRequest, setShowStaffRequest] = useState(false);
  const [staffNote, setStaffNote] = useState("");
  const [staffOffsiderCount, setStaffOffsiderCount] = useState(1);

  // ── Chargement de la disponibilité ──
  const loadAvailability = useCallback(async () => {
    setLoadError(null);
    if (!companyId) {
      setLoadError("Identifiant entreprise manquant.");
      return;
    }
    if (!startAt || !endAt) {
      setLoadError(
        "Ce job n'a pas de créneau horaire défini.\nImpossible de vérifier les disponibilités.",
      );
      return;
    }
    setLoading(true);
    try {
      const result = await fetchResourceAvailability(companyId, startAt, endAt);
      setVehicles(result.data.vehicles ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[AssignResourceModal] loadAvailability error:", err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [companyId, startAt, endAt]);

  useEffect(() => {
    if (visible) {
      setStep("list");
      setVisibleCount(PAGE_SIZE);
      setSelectedVehicle(null);
      setOffsiderCount(0);
      setShowStaffRequest(false);
      setStaffNote("");
      setStaffOffsiderCount(1);
      setSearchQuery("");
      loadAvailability();
    }
  }, [visible, loadAvailability]);

  // ── Affecter le véhicule ──
  const handleAssign = async () => {
    if (!selectedVehicle) return;

    const hasConflict =
      !selectedVehicle.is_available && selectedVehicle.conflicts.length > 0;

    if (hasConflict) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Conflit détecté",
          "Ce véhicule est déjà affecté sur ce créneau. Confirmer quand même ?",
          [
            { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Confirmer quand même",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ],
        );
      });
      if (!proceed) return;
    }

    setAssigning(true);
    try {
      await createAssignment(jobId, {
        resource_type: "vehicle",
        resource_id: selectedVehicle.id,
        role: "vehicle",
        driver_count: 1,
        offsider_count: offsiderCount,
      });
      onAssigned();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      Alert.alert("Erreur", message);
    } finally {
      setAssigning(false);
    }
  };

  // ── Demande de personnel libre ──
  const handleStaffRequest = async () => {
    setAssigning(true);
    try {
      const response = await fetchWithAuth(
        `${ServerData.serverUrl}v1/jobs/${jobId}/staff-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offsider_count: staffOffsiderCount,
            note: staffNote || undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      Alert.alert(
        "Demande enregistrée",
        `${staffOffsiderCount} offsider${staffOffsiderCount > 1 ? "s" : ""} demandé${staffOffsiderCount > 1 ? "s" : ""}.${staffNote ? `\n\n"${staffNote}"` : ""}`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowStaffRequest(false);
              setStaffNote("");
              setStaffOffsiderCount(1);
              onAssigned();
            },
          },
        ],
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      Alert.alert("Erreur", message);
    } finally {
      setAssigning(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Carte véhicule
  // ─────────────────────────────────────────────────────────────

  const renderVehicleCard = (item: AvailableVehicle) => {
    const available = item.is_available;
    const isPartner = item.company_id !== companyId;
    const companyName =
      item.company_name ?? (isPartner ? "Partenaire" : "Votre flotte");
    const companyColor = isPartner ? "#6366f1" : colors.primary;

    return (
      <Pressable
        key={item.id}
        testID={`assign-vehicle-card-${item.id}`}
        onPress={() => {
          setSelectedVehicle(item);
          setOffsiderCount(0);
          setStep("wizard");
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? colors.backgroundTertiary
            : colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          borderWidth: 1.5,
          borderColor: available ? colors.border : colors.warning + "70",
          marginBottom: DESIGN_TOKENS.spacing.sm,
          overflow: "visible",
        })}
      >
        {/* Barre de statut colorée en haut */}
        <View
          style={{
            height: 4,
            borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
            borderTopRightRadius: DESIGN_TOKENS.radius.lg,
            backgroundColor: available ? "#22C55E" : colors.warning,
          }}
        />

        <View style={{ padding: DESIGN_TOKENS.spacing.md, paddingRight: 40 }}>
          {/* Ligne 1 : badge entreprise + statut dispo */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: companyColor + "18",
                borderWidth: 1,
                borderColor: companyColor + "40",
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: companyColor }}
              >
                {companyName}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: available ? "#22C55E" : colors.warning,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: available ? "#22C55E" : colors.warning,
                }}
              >
                {available ? "Disponible" : "Conflit"}
              </Text>
            </View>
          </View>

          {/* Nom du camion */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {item.name}
          </Text>

          {/* Specs : volume · chauffeur inclus · prix */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {item.capacity && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons
                  name="cube-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {item.capacity}
                </Text>
              </View>
            )}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Chauffeur inclus
              </Text>
            </View>
            {item.price && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {item.price}
                </Text>
              </View>
            )}
          </View>

          <ConflictBadge conflicts={item.conflicts} colors={colors} />
        </View>

        {/* Flèche de navigation */}
        <View
          style={{
            position: "absolute",
            right: DESIGN_TOKENS.spacing.md,
            top: 0,
            bottom: 0,
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Étape 1 — Liste des véhicules
  // ─────────────────────────────────────────────────────────────

  // ── Filtrage et groupement par entreprise ──
  const filteredVehicles = React.useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter((v) => {
      const companyName = v.company_name ?? "";
      return (
        v.name.toLowerCase().includes(q) ||
        companyName.toLowerCase().includes(q) ||
        (v.capacity ?? "").toLowerCase().includes(q) ||
        (v.license_plate ?? "").toLowerCase().includes(q)
      );
    });
  }, [vehicles, searchQuery]);

  const groupedByCompany = React.useMemo(() => {
    const groups: { companyId: number; companyName: string; isPartner: boolean; vehicles: AvailableVehicle[] }[] = [];
    const map = new Map<number, typeof groups[number]>();
    for (const v of filteredVehicles) {
      const cId = v.company_id ?? -1;
      let group = map.get(cId);
      if (!group) {
        const isPartner = cId !== companyId;
        group = {
          companyId: cId,
          companyName: v.company_name ?? (isPartner ? "Partenaire" : "Votre flotte"),
          isPartner,
          vehicles: [],
        };
        map.set(cId, group);
        groups.push(group);
      }
      group.vehicles.push(v);
    }
    // Own company first, then partners sorted by name
    groups.sort((a, b) => {
      if (!a.isPartner && b.isPartner) return -1;
      if (a.isPartner && !b.isPartner) return 1;
      return a.companyName.localeCompare(b.companyName);
    });
    return groups;
  }, [filteredVehicles, companyId]);

  const renderList = () => {
    const paged = filteredVehicles.slice(0, visibleCount);
    const hasMore = visibleCount < filteredVehicles.length;

    const availableCount = filteredVehicles.filter((v) => v.is_available).length;

    return (
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Véhicules disponibles
            </Text>
            {startAt && endAt && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {new Date(startAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                —{" "}
                {new Date(endAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Search bar */}
        {!loading && !loadError && vehicles.length > 0 && (
          <View style={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg, paddingTop: DESIGN_TOKENS.spacing.sm }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              gap: 8,
            }}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Rechercher véhicule, entreprise…"
                placeholderTextColor={colors.textSecondary}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.text,
                  paddingVertical: 10,
                }}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Contenu */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
              Chargement des disponibilités…
            </Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#EF444415",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="warning-outline" size={30} color="#EF4444" />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Impossible de charger les véhicules
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 19,
                paddingHorizontal: 24,
                marginBottom: 20,
              }}
            >
              {loadError}
            </Text>
            <Pressable
              onPress={loadAvailability}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.primary + "25"
                  : colors.primary + "15",
                borderWidth: 1,
                borderColor: colors.primary + "40",
                gap: 6,
              })}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                Réessayer
              </Text>
            </Pressable>
          </View>
        ) : filteredVehicles.length === 0 && vehicles.length === 0 ? (
          <View style={styles.centered}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.backgroundTertiary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Ionicons
                name="car-outline"
                size={32}
                color={colors.textSecondary + "80"}
              />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 6,
              }}
            >
              Aucun véhicule disponible
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {"Aucun camion n'est disponible sur ce créneau."}
            </Text>
          </View>
        ) : filteredVehicles.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.centered}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.backgroundTertiary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="search" size={28} color={colors.textSecondary + "80"} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 6,
              }}
            >
              Aucun résultat
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Aucun véhicule ne correspond à &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Grouped by company */}
            {groupedByCompany.map((group) => {
              const groupVehicles = group.vehicles.filter((v) =>
                paged.some((p) => p.id === v.id)
              );
              if (groupVehicles.length === 0) return null;

              const groupColor = group.isPartner ? "#6366f1" : colors.primary;
              const groupAvailable = groupVehicles.filter((v) => v.is_available);
              const groupConflicts = groupVehicles.filter(
                (v) => !v.is_available && v.conflicts.length > 0
              );

              return (
                <View
                  key={group.companyId}
                  style={{
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    borderWidth: 1.5,
                    borderColor: groupColor + "35",
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    overflow: "hidden",
                  }}
                >
                  {/* Company header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: 10,
                      backgroundColor: groupColor + "0C",
                      borderBottomWidth: 1,
                      borderBottomColor: groupColor + "20",
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: groupColor + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={group.isPartner ? "business-outline" : "home-outline"}
                        size={14}
                        color={groupColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: groupColor,
                        }}
                      >
                        {group.companyName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {groupVehicles.length} véhicule{groupVehicles.length > 1 ? "s" : ""}
                        {groupAvailable.length > 0
                          ? ` · ${groupAvailable.length} disponible${groupAvailable.length > 1 ? "s" : ""}`
                          : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Vehicles in this company */}
                  <View style={{ padding: DESIGN_TOKENS.spacing.sm }}>
                    {groupAvailable.length > 0 && groupAvailable.map(renderVehicleCard)}
                    {groupConflicts.length > 0 && (
                      <>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: colors.warning, marginTop: groupAvailable.length > 0 ? 8 : 0 },
                          ]}
                        >
                          CONFLITS
                        </Text>
                        {groupConflicts.map(renderVehicleCard)}
                      </>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Voir plus */}
            {hasMore && (
              <Pressable
                onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: DESIGN_TOKENS.spacing.md,
                  marginTop: 4,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 6,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.primary,
                  }}
                >
                  Voir {Math.min(PAGE_SIZE, filteredVehicles.length - visibleCount)} de
                  plus
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.primary}
                />
              </Pressable>
            )}

            {/* ── Demander du personnel ── */}
            <View
              style={{
                marginTop: DESIGN_TOKENS.spacing.xl,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
                paddingTop: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {!showStaffRequest ? (
                <Pressable
                  onPress={() => setShowStaffRequest(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: colors.textSecondary + "50",
                    backgroundColor: pressed
                      ? colors.backgroundSecondary
                      : "transparent",
                    gap: 8,
                  })}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Demander du personnel
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* En-tête */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      Demander du personnel
                    </Text>
                    <Pressable
                      onPress={() => setShowStaffRequest(false)}
                      hitSlop={12}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: DESIGN_TOKENS.spacing.md,
                      lineHeight: 17,
                    }}
                  >
                    Précisez vos besoins. Un offsider disponible sera affecté.
                  </Text>

                  <CounterRow
                    label="Offsiders"
                    subtitle="Nombre requis"
                    icon="people-outline"
                    value={staffOffsiderCount}
                    min={1}
                    max={5}
                    onChange={setStaffOffsiderCount}
                    colors={colors}
                  />

                  <TextInput
                    value={staffNote}
                    onChangeText={setStaffNote}
                    placeholder="Précisions (horaires, compétences…)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    style={{
                      marginTop: DESIGN_TOKENS.spacing.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      padding: DESIGN_TOKENS.spacing.sm,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.backgroundTertiary,
                      minHeight: 72,
                      textAlignVertical: "top",
                    }}
                  />

                  <Pressable
                    onPress={handleStaffRequest}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: DESIGN_TOKENS.spacing.md,
                      paddingVertical: 12,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      backgroundColor: pressed
                        ? colors.primary + "CC"
                        : colors.primary,
                      gap: 8,
                    })}
                  >
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text
                      style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}
                    >
                      Envoyer la demande
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Étape 2 — Wizard équipage
  // ─────────────────────────────────────────────────────────────

  const renderWizard = () => {
    if (!selectedVehicle) return null;

    const isPartner = selectedVehicle.company_id !== companyId;
    const companyColor = isPartner ? "#6366f1" : colors.primary;
    const companyName =
      selectedVehicle.company_name ??
      (isPartner ? "Partenaire" : "Votre flotte");

    return (
      <View style={{ flex: 1 }}>
        {/* Header avec retour */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => setStep("list")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontWeight: "600",
              }}
            >
              Retour
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            {"Configurer l'équipage"}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {/* Récap du véhicule sélectionné */}
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              overflow: "hidden",
              marginBottom: DESIGN_TOKENS.spacing.lg,
              borderWidth: 1.5,
              borderColor: colors.primary + "50",
            }}
          >
            <View style={{ height: 4, backgroundColor: colors.primary }} />
            <View style={{ padding: DESIGN_TOKENS.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: DESIGN_TOKENS.radius.full,
                    backgroundColor: companyColor + "18",
                    borderWidth: 1,
                    borderColor: companyColor + "40",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: companyColor,
                    }}
                  >
                    {companyName}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                {selectedVehicle.name}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {selectedVehicle.capacity && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {selectedVehicle.capacity}
                    </Text>
                  </View>
                )}
                {selectedVehicle.price && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {selectedVehicle.price}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Section équipage */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.textSecondary,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}
          >
            Équipage
          </Text>

          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
            }}
          >
            {/* Chauffeur — inclus automatiquement */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#22C55E18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="car-sport-outline" size={18} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  1 Chauffeur
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Inclus avec le véhicule
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: DESIGN_TOKENS.radius.full,
                  backgroundColor: "#22C55E18",
                  gap: 4,
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#22C55E",
                  }}
                >
                  Inclus
                </Text>
              </View>
            </View>

            {/* Offsiders — optionnels */}
            <CounterRow
              label="Offsiders"
              subtitle={
                offsiderCount === 0
                  ? "Optionnel"
                  : `${offsiderCount} demandé${offsiderCount > 1 ? "s" : ""}`
              }
              icon="people-outline"
              value={offsiderCount}
              min={0}
              max={5}
              onChange={setOffsiderCount}
              colors={colors}
            />
          </View>

          {/* Note informative si offsiders demandés */}
          {offsiderCount > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
                marginTop: DESIGN_TOKENS.spacing.sm,
                padding: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.primary + "0C",
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primary}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.primary,
                  flex: 1,
                  lineHeight: 17,
                }}
              >
                {offsiderCount} offsider
                {offsiderCount > 1 ? "s" : ""} sera
                {offsiderCount > 1 ? "ont" : ""} sélectionné
                {offsiderCount > 1 ? "s" : ""} et devra
                {offsiderCount > 1 ? "ont" : ""} {"confirmer l'affectation."}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer — Confirmer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Pressable
            testID="assign-resource-confirm-btn"
            onPress={handleAssign}
            disabled={assigning}
            style={({ pressed }) => [
              styles.assignBtn,
              {
                backgroundColor: assigning
                  ? colors.textSecondary + "40"
                  : pressed
                    ? colors.primary + "CC"
                    : colors.primary,
              },
            ]}
          >
            {assigning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.assignBtnText}>
                  Confirmer — 1 chauffeur
                  {offsiderCount > 0
                    ? ` + ${offsiderCount} offsider${offsiderCount > 1 ? "s" : ""}`
                    : ""}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Rendu principal
  // ─────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {step === "list" ? renderList() : renderWizard()}
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    padding: DESIGN_TOKENS.spacing.lg,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: DESIGN_TOKENS.spacing.xl,
  },
  footer: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: DESIGN_TOKENS.radius.lg,
    gap: 8,
  },
  assignBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AssignResourceModal;
