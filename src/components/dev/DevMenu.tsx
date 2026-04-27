/**
 * DevMenu - Menu de développement pour tester rapidement
 * Visible uniquement en mode __DEV__
 */
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ServerData } from "../../constants/ServerData";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";
import {
    clearStripeCache,
    deleteStripeAccount,
} from "../../services/StripeService";
import { scheduleLocalNotification } from "../../services/pushNotifications";
import type { CompanyRole } from "../../services/user";
import { fetchWithAuth } from "../../utils/session";

interface DevMenuProps {
  visible: boolean;
  onClose: () => void;
}

type StripeStatus =
  | "complete"
  | "restricted"
  | "pending"
  | "incomplete"
  | "none"
  | "real";

export default function DevMenu({ visible, onClose }: DevMenuProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currentRole, setCurrentRole] = useState<CompanyRole | null>(null);
  const [currentStripeStatus, setCurrentStripeStatus] =
    useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger le rôle actuel et le statut Stripe simulé au montage
  useEffect(() => {
    if (visible) {
      loadCurrentRole();
      loadCurrentStripeStatus();
    }
  }, [visible]);

  const loadCurrentRole = async () => {
    try {
      const userData = await SecureStore.getItemAsync("user_data");
      if (userData) {
        const parsed = JSON.parse(userData);
        setCurrentRole(parsed.company_role || null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadCurrentStripeStatus = async () => {
    try {
      const devStatus = await SecureStore.getItemAsync("dev_stripe_status");
      if (devStatus) {
        const parsed = JSON.parse(devStatus);
        if (parsed === null) {
          setCurrentStripeStatus("none");
        } else if (parsed.charges_enabled && parsed.payouts_enabled) {
          setCurrentStripeStatus("complete");
        } else if (parsed.requirements?.past_due?.length > 0) {
          setCurrentStripeStatus("restricted");
        } else if (parsed.charges_enabled && !parsed.payouts_enabled) {
          setCurrentStripeStatus("pending");
        } else {
          setCurrentStripeStatus("incomplete");
        }
      } else {
        setCurrentStripeStatus("real");
      }
    } catch (error) {
      console.error("Error loading Stripe status:", error);
      setCurrentStripeStatus("real");
    }
  };

  const handleRoleChange = async (newRole: CompanyRole) => {
    setLoading(true);
    try {
      const userData = await SecureStore.getItemAsync("user_data");
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.company_role = newRole;
        await SecureStore.setItemAsync("user_data", JSON.stringify(parsed));
        setCurrentRole(newRole);
        Alert.alert(
          t("devMenu.roleChangedTitle"),
          t("devMenu.roleChangedMessage", { role: getRoleLabel(newRole) }),
        );
      }
    } catch (error) {
      console.error("Error changing role:", error);
      Alert.alert(t("common.error"), t("devMenu.errors.changeRole"));
    } finally {
      setLoading(false);
    }
  };

  const handleStripeStatusChange = async (status: StripeStatus) => {
    setLoading(true);
    try {
      // "real" = supprimer la simulation et utiliser les vraies données
      if (status === "real") {
        await SecureStore.deleteItemAsync("dev_stripe_status");
        clearStripeCache();
        setCurrentStripeStatus("real");
        Alert.alert(t("devMenu.realModeTitle"), t("devMenu.realModeMessage"));
        setLoading(false);
        return;
      }

      // On simule un changement de statut Stripe en modifiant les données locales
      // Note: cela ne change pas les vraies données côté serveur
      const stripeTestData: Record<string, any> = {
        complete: {
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          requirements: { currently_due: [], past_due: [], eventually_due: [] },
        },
        restricted: {
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: true,
          requirements: {
            currently_due: [],
            past_due: ["verification.document"],
            eventually_due: [],
          },
        },
        pending: {
          charges_enabled: true,
          payouts_enabled: false,
          details_submitted: true,
          requirements: {
            currently_due: ["external_account"],
            past_due: [],
            eventually_due: [],
          },
        },
        incomplete: {
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          requirements: {
            currently_due: ["business_profile.url"],
            past_due: [],
            eventually_due: [],
          },
        },
        none: null,
      };

      // Sauvegarder le statut de test
      await SecureStore.setItemAsync(
        "dev_stripe_status",
        JSON.stringify(stripeTestData[status]),
      );
      setCurrentStripeStatus(status);

      // Clear le cache Stripe pour forcer un refresh
      clearStripeCache();

      Alert.alert(
        t("devMenu.stripeStatusChangedTitle"),
        t("devMenu.stripeStatusChangedMessage", {
          status: getStripeStatusLabel(status),
        }),
      );
    } catch (error) {
      console.error("Error changing Stripe status:", error);
      Alert.alert(t("common.error"), t("devMenu.errors.changeStripeStatus"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStripeAccount = async () => {
    Alert.alert(
      t("devMenu.deleteStripe.title"),
      t("devMenu.deleteStripe.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteStripeAccount();
              if (result.success) {
                clearStripeCache();
                Alert.alert(
                  t("devMenu.deleteStripe.successTitle"),
                  t("devMenu.deleteStripe.successMessage"),
                );
                onClose();
              } else {
                Alert.alert(
                  t("common.error"),
                  t("devMenu.errors.deleteStripeAccount"),
                );
              }
            } catch (error) {
              console.error("Error deleting Stripe account:", error);
              Alert.alert(t("common.error"), t("devMenu.errors.generic"));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleTestPushProduction = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${ServerData.serverUrl}v1/dev/test-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "romaingiovanni@gmail.com" }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("✅ Push envoyé", `Notification envoyée à romaingiovanni@gmail.com`);
      } else {
        Alert.alert("Erreur", data.error || "Impossible d'envoyer la notification");
      }
    } catch (error) {
      Alert.alert("Erreur", "Appel backend échoué");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPushNotification = async () => {
    try {
      await scheduleLocalNotification(
        "Nouveau job assigné",
        "Un job de déménagement a été assigné à votre entreprise. Cliquez pour voir les détails.",
        { type: "new_job", job_id: "test-123", screen: "JobDetails" },
      );
      Alert.alert(
        "✅ Notification envoyée",
        "La notification de test devrait apparaître dans quelques secondes.",
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("Erreur", "Impossible d'envoyer la notification de test.");
    }
  };

  const getRoleLabel = (role: CompanyRole): string => {
    switch (role) {
      case "patron":
        return t("devMenu.roles.patron");
      case "cadre":
        return t("devMenu.roles.cadre");
      case "employee":
        return t("devMenu.roles.employee");
      default:
        return role;
    }
  };

  const getStripeStatusLabel = (status: StripeStatus): string => {
    switch (status) {
      case "real":
        return t("devMenu.stripeStatuses.real");
      case "complete":
        return t("devMenu.stripeStatuses.complete");
      case "restricted":
        return t("devMenu.stripeStatuses.restricted");
      case "pending":
        return t("devMenu.stripeStatuses.pending");
      case "incomplete":
        return t("devMenu.stripeStatuses.incomplete");
      case "none":
        return t("devMenu.stripeStatuses.none");
      default:
        return status;
    }
  };

  const roles: CompanyRole[] = ["patron", "cadre", "employee"];
  const stripeStatuses: StripeStatus[] = [
    "real",
    "complete",
    "restricted",
    "pending",
    "incomplete",
    "none",
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.xl,
      width: "90%",
      maxHeight: "80%",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    section: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    optionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.error,
      borderRadius: DESIGN_TOKENS.radius.md,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    dangerButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    devBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    devBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#000",
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="terminal" size={24} color={colors.primary} />
              <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                DevTools
              </Text>
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>DEV</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Section: Rôle utilisateur */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Rôle utilisateur</Text>
              <Text style={styles.sectionSubtitle}>
                Changer le rôle pour tester les permissions
              </Text>
              {roles.map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.optionButton,
                    currentRole === role && styles.optionButtonActive,
                  ]}
                  onPress={() => handleRoleChange(role)}
                  disabled={loading}
                >
                  <Text style={styles.optionText}>{getRoleLabel(role)}</Text>
                  {currentRole === role && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Section: Statut Stripe */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                💳 Statut Stripe (simulation)
              </Text>
              <Text style={styles.sectionSubtitle}>
                Simuler différents états du compte Stripe
              </Text>
              {stripeStatuses.map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.optionButton,
                    currentStripeStatus === status && styles.optionButtonActive,
                  ]}
                  onPress={() => handleStripeStatusChange(status)}
                  disabled={loading}
                >
                  <Text style={styles.optionText}>
                    {getStripeStatusLabel(status)}
                  </Text>
                  {currentStripeStatus === status && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Section: Test Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔔 Notifications</Text>
              <Pressable
                style={[
                  styles.optionButton,
                  { justifyContent: "center", gap: DESIGN_TOKENS.spacing.sm },
                ]}
                onPress={handleTestPushNotification}
              >
                <Ionicons
                  name="notifications"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.optionText, { flex: 0, fontWeight: "600" }]}
                >
                  Test notification push (job)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.optionButton,
                  { justifyContent: "center", gap: DESIGN_TOKENS.spacing.sm },
                ]}
                onPress={handleTestPushProduction}
                disabled={loading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={(colors as any).primaryDark || colors.primary}
                />
                <Text
                  style={[styles.optionText, { flex: 0, fontWeight: "600" }]}
                >
                  Test push production (romaingiovanni@gmail.com)
                </Text>
              </Pressable>
            </View>

            {/* Section: Actions destructives */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Actions destructives</Text>
              <Pressable
                style={styles.dangerButton}
                onPress={handleDeleteStripeAccount}
                disabled={loading}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.dangerButtonText}>
                  Supprimer le compte Stripe
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
