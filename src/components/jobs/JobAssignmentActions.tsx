/**
 * JobAssignmentActions - Actions pour accepter/refuser un job assigné
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

interface JobAssignmentActionsProps {
  jobId: string;
  jobTitle: string;
  canAccept: boolean;
  canDecline: boolean;
  onAccept: (notes?: string) => Promise<void>;
  onDecline: (reason: string) => Promise<void>;
}

export const JobAssignmentActions: React.FC<JobAssignmentActionsProps> = ({
  jobId,
  jobTitle,
  canAccept,
  canDecline,
  onAccept,
  onDecline,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  console.log("🎯 [JobAssignmentActions] Rendu:", {
    jobId,
    jobTitle,
    canAccept,
    canDecline,
    willDisplay: canAccept || canDecline,
  });

  if (!canAccept && !canDecline) {
    console.log(
      "⚠️ [JobAssignmentActions] Composant masqué (pas de permissions)",
    );
    return null;
  }

  console.log("✅ [JobAssignmentActions] Boutons affichés:", {
    acceptButton: canAccept,
    declineButton: canDecline,
  });

  const handleAccept = async () => {
    Alert.alert(
      t("jobs.acceptConfirmTitle"),
      t("jobs.acceptConfirmMessage", { jobTitle }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("jobs.acceptButton"),
          style: "default",
          onPress: async () => {
            setIsLoading(true);
            try {
              await onAccept();
              Alert.alert(t("common.success"), t("jobs.acceptSuccess"));
            } catch {
              Alert.alert(t("common.error"), t("jobs.acceptError"));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      Alert.alert(t("common.warning"), t("jobs.declineReasonRequired"));
      return;
    }

    setIsLoading(true);
    try {
      await onDecline(declineReason);
      setShowDeclineModal(false);
      setDeclineReason("");
      Alert.alert(t("common.success"), t("jobs.declineSuccess"));
    } catch {
      Alert.alert(t("common.error"), t("jobs.declineError"));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.info + "40",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    icon: {
      marginRight: DESIGN_TOKENS.spacing.xs,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    buttonsRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderWidth: 1,
    },
    acceptButton: {
      backgroundColor: colors.success + "20",
      borderColor: colors.success,
    },
    declineButton: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
    acceptButtonText: {
      color: colors.success,
    },
    declineButtonText: {
      color: colors.textSecondary,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      width: "85%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.sm,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: 14,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: "top",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    modalButtonsRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: "center",
    },
    modalCancelButton: {
      backgroundColor: colors.backgroundSecondary,
    },
    modalConfirmButton: {
      backgroundColor: colors.error,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    modalCancelText: {
      color: colors.textSecondary,
    },
    modalConfirmText: {
      color: "#FFFFFF",
    },
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={colors.info}
            style={styles.icon}
          />
          <Text style={styles.title}>Action Requise</Text>
        </View>

        <Text style={styles.description}>
          Ce job vous a été assigné. Acceptez-vous de le prendre en charge ?
        </Text>

        <View style={styles.buttonsRow}>
          {canAccept && (
            <TouchableOpacity
              testID="job-assignment-accept-btn"
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={[styles.buttonText, styles.acceptButtonText]}>
                    Accepter
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canDecline && (
            <TouchableOpacity
              testID="job-assignment-decline-btn"
              style={[styles.button, styles.declineButton]}
              onPress={() => setShowDeclineModal(true)}
              disabled={isLoading}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.buttonText, styles.declineButtonText]}>
                Refuser
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de refus */}
      <Modal
        visible={showDeclineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Refuser le Job</Text>
            <Text style={styles.modalSubtitle}>
              Veuillez indiquer la raison de votre refus. Le créateur du job
              sera notifié.
            </Text>

            <TextInput
              testID="job-decline-reason-input"
              style={styles.input}
              placeholderTextColor={colors.textSecondary + "80"}
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              maxLength={500}
              editable={!isLoading}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                testID="job-decline-cancel-btn"
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="job-decline-confirm-btn"
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDecline}
                disabled={isLoading || !declineReason.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[styles.modalButtonText, styles.modalConfirmText]}
                  >
                    Confirmer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default JobAssignmentActions;
