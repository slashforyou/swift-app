/**
 * TransferJobModal
 *
 * Bottom‑sheet modal pour déléguer un job à une autre entreprise.
 * Sections :
 *   1. Rôle délégué (driver / offsider / full_job / custom)
 *   2. Tarification (hourly / flat + montant)
 *   3. Destinataire (carnet de relations ou code entreprise)
 *   4. Message optionnel
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
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
import {
    fetchCompanyPublicTrucks,
    listRelations,
    saveRelation,
} from "../../../services/companyRelations";
import { createTransfer } from "../../../services/jobTransfer";
import type {
    CompanyLookupResult,
    CompanyRelation,
    PublicTruck,
    TransferDelegatedRole,
    TransferPricingType,
} from "../../../types/jobTransfer";
import {
    DELEGATED_ROLE_LABELS,
    PRICING_TYPE_LABELS,
} from "../../../types/jobTransfer";
import CompanyCodeInput from "./CompanyCodeInput";
import RelationsCarnet from "./RelationsCarnet";
import ResourceSelector from "./ResourceSelector";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface TransferJobModalProps {
  visible: boolean;
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
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
  isActive: boolean;
  onPress: () => void;
  colors: any;
}> = ({ label, isActive, onPress, colors }) => (
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
      opacity: pressed ? 0.75 : 1,
    })}
  >
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

// ─────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────

const TransferJobModal: React.FC<TransferJobModalProps> = ({
  visible,
  jobId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // ── State formulaire ──
  const [role, setRole] = useState<TransferDelegatedRole>("full_job");
  const [roleCustomLabel, setRoleCustomLabel] = useState("");
  const [pricingType, setPricingType] = useState<TransferPricingType>("flat");
  const [pricingAmount, setPricingAmount] = useState("");
  const [message, setMessage] = useState("");

  // ── Destinataire ──
  const [relations, setRelations] = useState<CompanyRelation[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [selectedRelation, setSelectedRelation] =
    useState<CompanyRelation | null>(null);
  const [lookupResult, setLookupResult] = useState<CompanyLookupResult | null>(
    null,
  );

  // ── Ressources (section 5) ──
  const [partnerTrucks, setPartnerTrucks] = useState<PublicTruck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(false);
  const [preferredTruckId, setPreferredTruckId] = useState<number | null>(null);
  const [requestedDrivers, setRequestedDrivers] = useState(1);
  const [requestedOffsiders, setRequestedOffsiders] = useState(0);
  const [resourceNote, setResourceNote] = useState("");

  // ── Soumission ──
  const [isSending, setIsSending] = useState(false);

  // Charger le carnet à l'ouverture
  useEffect(() => {
    if (!visible) return;
    setRelationsLoading(true);
    listRelations()
      .then(setRelations)
      .catch(() => setRelations([]))
      .finally(() => setRelationsLoading(false));
  }, [visible]);

  // Charger les trucks du partenaire sélectionné
  useEffect(() => {
    const companyId =
      selectedRelation?.related_company_id ?? lookupResult?.id ?? null;
    if (!companyId) {
      setPartnerTrucks([]);
      setPreferredTruckId(null);
      return;
    }
    setTrucksLoading(true);
    fetchCompanyPublicTrucks(companyId)
      .then(setPartnerTrucks)
      .catch(() => setPartnerTrucks([]))
      .finally(() => setTrucksLoading(false));
  }, [selectedRelation, lookupResult]);

  // Reset au fermeture
  const handleClose = useCallback(() => {
    setRole("full_job");
    setRoleCustomLabel("");
    setPricingType("flat");
    setPricingAmount("");
    setMessage("");
    setSelectedRelation(null);
    setLookupResult(null);
    setPartnerTrucks([]);
    setPreferredTruckId(null);
    setRequestedDrivers(1);
    setRequestedOffsiders(0);
    setResourceNote("");
    onClose();
  }, [onClose]);

  // Sélection depuis lookup → override relation
  const handleCodeSelect = useCallback((result: CompanyLookupResult) => {
    setLookupResult(result);
    setSelectedRelation(null);
  }, []);

  const handleCodeClear = useCallback(() => {
    setLookupResult(null);
  }, []);

  // Sélection depuis le carnet → override lookup
  const handleRelationSelect = useCallback((relation: CompanyRelation) => {
    setSelectedRelation((prev) => (prev?.id === relation.id ? null : relation));
    setLookupResult(null);
  }, []);

  const resolvedRecipientName =
    selectedRelation?.related_company_name ??
    selectedRelation?.related_contractor_name ??
    lookupResult?.name ??
    null;

  // ── Validation ──
  const isValid = Boolean(
    role &&
    (role !== "custom" || roleCustomLabel.trim()) &&
    pricingAmount &&
    parseFloat(pricingAmount) > 0 &&
    (selectedRelation || lookupResult),
  );

  // ── Envoi ──
  const handleSend = useCallback(async () => {
    if (!isValid) return;

    const amount = parseFloat(pricingAmount);

    try {
      setIsSending(true);

      // Si l'entreprise vient d'un lookup non-sauvegardé, proposer la sauvegarde après
      const recipientCompanyId =
        selectedRelation?.related_company_id ?? lookupResult?.id;
      const recipientContractorId = selectedRelation?.related_contractor_id;
      const recipientType = selectedRelation?.related_type ?? "company";

      await createTransfer(jobId, {
        recipient_type: recipientType,
        recipient_company_id: recipientCompanyId,
        recipient_contractor_id: recipientContractorId,
        delegated_role: role,
        delegated_role_label:
          role === "custom" ? roleCustomLabel.trim() : undefined,
        pricing_type: pricingType,
        pricing_amount: amount,
        message: message.trim() || undefined,
        requested_drivers: requestedDrivers,
        requested_offsiders: requestedOffsiders,
        preferred_truck_id: preferredTruckId ?? undefined,
        resource_note: resourceNote.trim() || undefined,
      });

      // Si lookupResult non encore sauvegardé → sauvegarder en fond silencieusement
      if (lookupResult && !lookupResult.is_already_saved) {
        saveRelation({
          related_type: "company",
          related_company_id: lookupResult.id,
        }).catch(() => {
          /* silencieux */
        });
      }

      onSuccess();
      handleClose();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible d'envoyer la délégation");
    } finally {
      setIsSending(false);
    }
  }, [
    isValid,
    pricingAmount,
    selectedRelation,
    lookupResult,
    jobId,
    role,
    roleCustomLabel,
    pricingType,
    message,
    requestedDrivers,
    requestedOffsiders,
    preferredTruckId,
    resourceNote,
    onSuccess,
    handleClose,
  ]);

  // ── Styles ──
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
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    section: { marginBottom: DESIGN_TOKENS.spacing.lg },
    row: { flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      height: 48,
      backgroundColor: colors.backgroundSecondary,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    amountPrefix: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: "700",
    },
    amountInput: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    amountSuffix: { color: colors.textSecondary, fontSize: 14 },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.md,
    },
    orText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    messageInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
      minHeight: 72,
      textAlignVertical: "top",
      fontSize: 14,
    },
    sendButton: {
      backgroundColor: isValid ? colors.primary : colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    sendLabel: {
      color: isValid ? "#fff" : colors.textSecondary,
      fontWeight: "700",
      fontSize: 16,
    },
  });

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
          <Pressable
            onPress={() => {
              /* absorb taps */
            }}
          >
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Déléguer ce job</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── Section 1 : Rôle ── */}
                <View style={styles.section}>
                  <SectionTitle colors={colors}>Rôle délégué</SectionTitle>
                  <View style={[styles.row, { flexWrap: "wrap" }]}>
                    {(
                      [
                        "driver",
                        "offsider",
                        "full_job",
                      ] as TransferDelegatedRole[]
                    ).map((r) => (
                      <ChipButton
                        key={r}
                        label={DELEGATED_ROLE_LABELS[r]}
                        isActive={role === r}
                        onPress={() => setRole(r)}
                        colors={colors}
                      />
                    ))}
                  </View>
                  <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                    <ChipButton
                      label="Autre (préciser)"
                      isActive={role === "custom"}
                      onPress={() => setRole("custom")}
                      colors={colors}
                    />
                    {role === "custom" && (
                      <TextInput
                        style={[
                          styles.messageInput,
                          {
                            minHeight: 40,
                            marginTop: DESIGN_TOKENS.spacing.sm,
                          },
                        ]}
                        value={roleCustomLabel}
                        onChangeText={setRoleCustomLabel}
                        placeholder="Décrivez le rôle..."
                        placeholderTextColor={colors.textSecondary}
                      />
                    )}
                  </View>
                </View>

                {/* ── Section 2 : Tarification ── */}
                <View style={styles.section}>
                  <SectionTitle colors={colors}>Tarification</SectionTitle>
                  <View
                    style={[
                      styles.row,
                      { marginBottom: DESIGN_TOKENS.spacing.sm },
                    ]}
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
                  <View style={styles.amountRow}>
                    <Text style={styles.amountPrefix}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={pricingAmount}
                      onChangeText={(v) =>
                        setPricingAmount(v.replace(/[^0-9.]/g, ""))
                      }
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.amountSuffix}>
                      AUD{pricingType === "hourly" ? " / h" : ""}
                    </Text>
                  </View>
                </View>

                {/* ── Section 3 : Destinataire ── */}
                <View style={styles.section}>
                  <SectionTitle colors={colors}>Destinataire</SectionTitle>

                  {/* Carnet */}
                  <RelationsCarnet
                    relations={relations}
                    isLoading={relationsLoading}
                    mode="select"
                    selectedId={selectedRelation?.id}
                    onSelect={handleRelationSelect}
                  />

                  {/* Séparateur */}
                  <Text
                    style={[
                      styles.orText,
                      { marginTop: DESIGN_TOKENS.spacing.md },
                    ]}
                  >
                    — ou ajouter par code —
                  </Text>

                  {/* Lookup par code */}
                  <CompanyCodeInput
                    onSelect={handleCodeSelect}
                    onClear={handleCodeClear}
                  />
                </View>

                {/* ── Section 4 : Ressources ── */}
                {(selectedRelation || lookupResult) && (
                  <View style={styles.section}>
                    <SectionTitle colors={colors}>Ressources</SectionTitle>
                    <ResourceSelector
                      trucks={partnerTrucks}
                      trucksLoading={trucksLoading}
                      preferredTruckId={preferredTruckId}
                      onTruckSelect={setPreferredTruckId}
                      requestedDrivers={requestedDrivers}
                      onDriversChange={setRequestedDrivers}
                      requestedOffsiders={requestedOffsiders}
                      onOffsidersChange={setRequestedOffsiders}
                      resourceNote={resourceNote}
                      onNoteChange={setResourceNote}
                      colors={colors}
                    />
                  </View>
                )}

                {/* ── Section 5 : Message ── */}
                <View style={styles.section}>
                  <SectionTitle colors={colors}>
                    Message (optionnel)
                  </SectionTitle>
                  <TextInput
                    style={styles.messageInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Saisissez un message..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={500}
                  />
                </View>
              </ScrollView>

              {/* Bouton envoi */}
              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSend}
                disabled={!isValid || isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendLabel}>
                    {resolvedRecipientName
                      ? `Déléguer à ${resolvedRecipientName}`
                      : "Envoyer la délégation"}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default TransferJobModal;
