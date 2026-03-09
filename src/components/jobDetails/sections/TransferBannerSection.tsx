/**
 * TransferBannerSection
 *
 * Affiche un bandeau sur la fiche du job selon la situation :
 *
 *  - Coté CÉDANT  (is_owner=true, transfer.status='pending')
 *    → "Délégation en attente" + bouton Annuler
 *
 *  - Coté CESSIONNAIRE (can_respond_transfer=true, status='pending')
 *    → "Délégation reçue" + boutons Refuser / Négocier / Accepter
 *
 *  - status='negotiating', coté CÉDANT (is_owner)
 *    → "Contre-proposition reçue" + boutons Refuser / Accepter
 *
 *  - status='negotiating', coté CESSIONNAIRE (can_respond)
 *    → "Contre-proposition en attente" (lecture seule)
 *
 *  - accepted / declined / cancelled → bandeau informatif (sans actions)
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import {
    cancelTransfer,
    respondToTransfer,
} from "../../../services/jobTransfer";
import type { JobTransfer, TransferStatus } from "../../../types/jobTransfer";
import {
    DELEGATED_ROLE_LABELS,
    PRICING_TYPE_LABELS,
} from "../../../types/jobTransfer";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatPrice(transfer: JobTransfer): string {
  const label = PRICING_TYPE_LABELS[transfer.pricing_type];
  const suffix = transfer.pricing_type === "hourly" ? "/h" : "";
  return `${label} : ${transfer.pricing_amount.toFixed(2)} ${transfer.pricing_currency}${suffix}`;
}

function formatRole(transfer: JobTransfer): string {
  if (transfer.delegated_role === "custom") {
    return transfer.delegated_role_label ?? "Autre";
  }
  return DELEGATED_ROLE_LABELS[transfer.delegated_role];
}

const STATUS_CONFIG: Record<
  TransferStatus,
  { icon: string; color: string; label: string }
> = {
  pending: { icon: "time-outline", color: "#F59E0B", label: "En attente" },
  negotiating: {
    icon: "swap-horizontal-outline",
    color: "#8B5CF6",
    label: "En négociation",
  },
  accepted: { icon: "checkmark-circle", color: "#22C55E", label: "Acceptée" },
  declined: { icon: "close-circle", color: "#EF4444", label: "Refusée" },
  cancelled: { icon: "ban-outline", color: "#94A3B8", label: "Annulée" },
};

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface TransferBannerSectionProps {
  jobId: string;
  transfer: JobTransfer;
  isOwner: boolean;
  canRespond: boolean;
  onTransferUpdated: () => void;
}

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────

const TransferBannerSection: React.FC<TransferBannerSectionProps> = ({
  jobId,
  transfer,
  isOwner,
  canRespond,
  onTransferUpdated,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState(
    String(transfer.pricing_amount ?? ""),
  );
  const [counterMessage, setCounterMessage] = useState("");

  const cfg = STATUS_CONFIG[transfer.status];
  const recipientName =
    transfer.recipient_company_name ??
    transfer.recipient_contractor_name ??
    "Entreprise";
  const senderName = transfer.sender_company_name;

  // ── Annuler (cédant) ──
  const handleCancel = useCallback(() => {
    Alert.alert(
      "Annuler la délégation",
      `Voulez-vous annuler la délégation envoyée à ${recipientName} ?`,
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Annuler la délégation",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await cancelTransfer(jobId, transfer.id);
              onTransferUpdated();
            } catch (e: any) {
              Alert.alert("Erreur", e?.message ?? "Impossible d'annuler");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [jobId, transfer.id, recipientName, onTransferUpdated]);

  // ── Accepter (cessionnaire OU cédant sur une contre-proposition) ──
  const handleAccept = useCallback(() => {
    Alert.alert(
      "Accepter la délégation",
      `Confirmer l'acceptation du job délégué par ${senderName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Accepter",
          onPress: async () => {
            try {
              setIsLoading(true);
              await respondToTransfer(jobId, transfer.id, { action: "accept" });
              onTransferUpdated();
            } catch (e: any) {
              Alert.alert("Erreur", e?.message ?? "Impossible d'accepter");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [jobId, transfer.id, senderName, onTransferUpdated]);

  // ── Soumettre la contre-proposition (cessionnaire) ──
  const handleCounterConfirm = useCallback(async () => {
    const amount = parseFloat(counterAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Montant invalide", "Veuillez saisir un montant valide.");
      return;
    }
    try {
      setIsLoading(true);
      await respondToTransfer(jobId, transfer.id, {
        action: "counter",
        counter_offer: {
          pricing_amount: amount,
          message: counterMessage.trim() || undefined,
        },
      });
      setShowCounterModal(false);
      setCounterMessage("");
      onTransferUpdated();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de soumettre");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, transfer.id, counterAmount, counterMessage, onTransferUpdated]);

  // ── Refuser (cessionnaire) ──
  const handleDeclineConfirm = useCallback(async () => {
    try {
      setIsLoading(true);
      await respondToTransfer(jobId, transfer.id, {
        action: "decline",
        decline_reason: declineReason.trim() || undefined,
      });
      setShowDeclineModal(false);
      setDeclineReason("");
      onTransferUpdated();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de refuser");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, transfer.id, declineReason, onTransferUpdated]);

  // ─────────────────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    banner: {
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: cfg.color + "44",
      backgroundColor: cfg.color + "12",
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    statusLabel: {
      flex: 1,
      color: cfg.color,
      fontWeight: "700",
      fontSize: 14,
    },
    companyName: { color: colors.text, fontWeight: "600", fontSize: 15 },
    detailText: { color: colors.textSecondary, fontSize: 13 },
    messageText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontStyle: "italic",
    },
    actionsRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    btnSecondary: {
      flex: 1,
      height: 40,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
    },
    btnPrimary: {
      flex: 2,
      height: 40,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: "#22C55E",
      alignItems: "center",
      justifyContent: "center",
    },
    btnCancel: {
      alignSelf: "flex-end",
      paddingVertical: 6,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // Modal refus
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    declineSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.md,
    },
    declineTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    declineInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
      minHeight: 80,
      textAlignVertical: "top",
      fontSize: 14,
    },
    declineConfirm: {
      height: 48,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <>
      <View style={styles.banner}>
        {/* Header statut */}
        <View style={styles.headerRow}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
          <Text style={styles.statusLabel}>Délégation {cfg.label}</Text>
          {isLoading && <ActivityIndicator size="small" color={cfg.color} />}
        </View>

        {/* Entreprise concernée */}
        {isOwner ? (
          <Text style={styles.companyName}>Envoyée à {recipientName}</Text>
        ) : (
          <Text style={styles.companyName}>Reçue de {senderName}</Text>
        )}

        {/* Détails */}
        <Text style={styles.detailText}>
          {formatRole(transfer)} · {formatPrice(transfer)}
        </Text>

        {/* Message */}
        {transfer.message ? (
          <Text style={styles.messageText}>{`"${transfer.message}"`}</Text>
        ) : null}

        {/* Raison refus */}
        {transfer.decline_reason ? (
          <Text style={styles.detailText}>
            Raison : {transfer.decline_reason}
          </Text>
        ) : null}

        {/* Contre-proposition (status=negotiating) */}
        {transfer.status === "negotiating" &&
          transfer.counter_offer_amount != null && (
            <View
              style={{
                backgroundColor: "#8B5CF612",
                borderRadius: DESIGN_TOKENS.radius.sm,
                borderLeftWidth: 3,
                borderLeftColor: "#8B5CF6",
                padding: DESIGN_TOKENS.spacing.sm,
                gap: 4,
              }}
            >
              <Text
                style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 12 }}
              >
                CONTRE-PROPOSITION DU CONTRACTOR
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}
              >
                {transfer.counter_offer_amount.toFixed(2)}{" "}
                {transfer.pricing_currency}
                {transfer.pricing_type === "hourly" ? "/h" : " (forfait)"}
              </Text>
              {transfer.counter_offer_message ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  “{transfer.counter_offer_message}”
                </Text>
              ) : null}
            </View>
          )}

        {/* Actions — pending : coté cédant */}
        {transfer.status === "pending" && !isLoading && isOwner && (
          <Pressable style={styles.btnCancel} onPress={handleCancel}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Annuler la délégation
            </Text>
          </Pressable>
        )}

        {/* Actions — pending : coté cessionnaire (Refuser / Négocier / Accepter) */}
        {transfer.status === "pending" && !isLoading && canRespond && (
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => setShowDeclineModal(true)}
            >
              <Text
                style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}
              >
                Refuser
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.btnSecondary,
                { borderColor: "#8B5CF6", flex: 1.5 },
              ]}
              onPress={() => {
                setCounterAmount(String(transfer.pricing_amount));
                setCounterMessage("");
                setShowCounterModal(true);
              }}
            >
              <Text
                style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 13 }}
              >
                Négocier
              </Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={handleAccept}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                Accepter
              </Text>
            </Pressable>
          </View>
        )}

        {/* Actions — negotiating : coté cédant (Refuser / Accepter la contre-proposition) */}
        {transfer.status === "negotiating" && !isLoading && isOwner && (
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => setShowDeclineModal(true)}
            >
              <Text
                style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}
              >
                Refuser
              </Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={handleAccept}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                Accepter
              </Text>
            </Pressable>
          </View>
        )}

        {/* Actions — negotiating : coté cessionnaire (lecture seule) */}
        {transfer.status === "negotiating" && !isLoading && canRespond && (
          <Text style={{ color: "#8B5CF6", fontSize: 12, fontStyle: "italic" }}>
            Votre contre-proposition attend la réponse du contractee.
          </Text>
        )}
      </View>

      {/* Modal de refus */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowDeclineModal(false)}
        >
          <Pressable
            onPress={() => {
              /* absorb */
            }}
          >
            <View style={styles.declineSheet}>
              <Text style={styles.declineTitle}>
                Motif du refus (optionnel)
              </Text>
              <TextInput
                style={styles.declineInput}
                value={declineReason}
                onChangeText={setDeclineReason}
                placeholder="Expliquez pourquoi vous refusez..."
                placeholderTextColor={colors.textSecondary}
                multiline
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  styles.declineConfirm,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleDeclineConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    Confirmer le refus
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal contre-proposition */}
      <Modal
        visible={showCounterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCounterModal(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowCounterModal(false)}
        >
          <Pressable
            onPress={() => {
              /* absorb */
            }}
          >
            <View style={styles.declineSheet}>
              <Text style={styles.declineTitle}>Contre-proposition</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Prix actuel : {transfer.pricing_amount.toFixed(2)}{" "}
                {transfer.pricing_currency}
                {transfer.pricing_type === "hourly" ? "/h" : ""}
              </Text>
              <TextInput
                style={[styles.declineInput, { minHeight: 44 }]}
                value={counterAmount}
                onChangeText={setCounterAmount}
                placeholder={`Nouveau montant (${transfer.pricing_currency})`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                autoFocus
              />
              <TextInput
                style={styles.declineInput}
                value={counterMessage}
                onChangeText={setCounterMessage}
                placeholder="Message explicatif (optionnel)..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <Pressable
                style={({ pressed }) => [
                  styles.declineConfirm,
                  { backgroundColor: "#8B5CF6" },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleCounterConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    Envoyer la contre-proposition
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default TransferBannerSection;
