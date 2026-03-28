/**
 * StripeHub - Hub de gestion des paiements Stripe
 * Remplace JobsBillingScreen avec une interface moderne pour Stripe
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MascotLoading from "../../components/ui/MascotLoading";

// Context
import {
    getRequirementIcon,
    getRequirementLabel,
} from "../../constants/stripeRequirements";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import {
    useStripeAccount,
    useStripePayments,
    useStripePayouts,
} from "../../hooks/useStripe";
import { useStripeConnection } from "../../hooks/useStripeConnection";
import { useTranslation } from "../../localization";
import {
    deleteStripeAccount,
    startStripeOnboarding,
} from "../../services/StripeService";
import {
    getStartOnboardingStep,
    resolveBusinessType,
} from "../Stripe/OnboardingFlow/onboardingSteps";
// Components
import CreatePaymentLinkModal from "../../components/modals/CreatePaymentLinkModal";

// Mascot Stripe image
const mascotStripeImage = require("../../../assets/images/mascot/mascotte_stripe.png");

// Types
interface StripeHubProps {
  navigation?: any; // Navigation prop pour permettre la navigation interne (Stripe screens)
  mainNavigation?: any; // Navigation principale pour accéder aux screens du root navigator
}
interface StripeStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  successfulPayments: number;
  currency: string;
}

interface StripeAccount {
  id: string;
  displayName: string;
  country: string;
  isActive: boolean;
  defaultCurrency: string;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export default function StripeHub({
  navigation,
  mainNavigation,
}: StripeHubProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [passFeesToClient, setPassFeesToClient] = useState(false);
  const hasFocusedOnceRef = React.useRef(false);

  // Hook pour détecter la connexion Stripe réelle
  const stripeConnection = useStripeConnection();

  // ✅ RÉACTIVÉ: Utiliser les vrais hooks Stripe
  const stripeAccount = useStripeAccount();
  const stripePayments = useStripePayments({ autoLoad: false });
  const stripePayouts = useStripePayouts({ autoLoad: false });

  // Charger le réglage "refacturer les frais au client"
  useEffect(() => {
    AsyncStorage.getItem("stripe_pass_fees_to_client").then((val) => {
      if (val !== null) setPassFeesToClient(val === "true");
    });
  }, []);

  const handleToggleFees = useCallback((value: boolean) => {
    setPassFeesToClient(value);
    AsyncStorage.setItem("stripe_pass_fees_to_client", String(value));
  }, []);

  // ✅ Log au chargement pour vérifier le compte Stripe
  React.useEffect(() => {
    if (stripeAccount.account) {
    } else if (!stripeAccount.loading) {
    }
  }, [stripeAccount.account, stripeAccount.loading]);

  // Calculer les stats réelles à partir des données Stripe
  const stripeStats = React.useMemo(() => {
    const totalRevenue = stripePayments.payments.reduce((total, payment) => {
      return payment.status === "succeeded" ? total + payment.amount : total;
    }, 0);

    const currentMonth = new Date().getMonth();
    const monthlyRevenue = stripePayments.payments
      .filter((payment) => {
        const paymentDate = new Date(payment.date);
        return (
          paymentDate.getMonth() === currentMonth &&
          payment.status === "succeeded"
        );
      })
      .reduce((total, payment) => total + payment.amount, 0);

    const pendingPayouts = stripeAccount.balance?.pending || 0;
    const successfulPayments = stripePayments.payments.filter(
      (p) => p.status === "succeeded",
    ).length;

    return {
      totalRevenue,
      monthlyRevenue,
      pendingPayouts,
      successfulPayments,
      currency: stripeAccount.account?.default_currency || "AUD",
    };
  }, [stripePayments.payments, stripeAccount.balance, stripeAccount.account]);

  // WebView states
  const [showStripeWebView, setShowStripeWebView] = useState(false);
  const [stripeAccountLink, setStripeAccountLink] = useState<string | null>(
    null,
  );

  const formatCurrency = (amount: number, currency: string = "AUD") => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const accountId =
    stripeAccount.account?.stripe_account_id ||
    stripeAccount.account?.accountId;

  const hubBusy =
    isLoading ||
    stripeAccount.loading ||
    stripeConnection.loading ||
    stripePayments.loading ||
    stripePayouts.loading;

  const hubBusyRef = React.useRef(false);
  hubBusyRef.current = hubBusy;

  const handleRefresh = async () => {
    if (hubBusy) return;
    setIsLoading(true);
    // 🔄 NOUVEAU: Refresh les vraies données Stripe
    try {
      if (accountId) {
        await Promise.all([
          stripeAccount.refresh(),
          stripePayments.refresh(),
          stripePayouts.refresh(),
          stripeConnection.refresh(),
        ]);
      } else {
        await Promise.all([
          stripeAccount.refresh(),
          stripeConnection.refresh(),
        ]);
      }

      // ✅ Log après refresh pour vérifier le compte
      if (stripeAccount.account) {
      }
    } catch (error) {
      console.error("❌ [StripeHub] Error refreshing Stripe data:", error);
    }
    setIsLoading(false);
  };

  // Refresh Stripe data when coming back to this screen (e.g. after onboarding)
  // ⚠️ Important: useFocusEffect will re-run if the callback changes while focused.
  // Use refs to avoid a refresh loop caused by loading state updates.
  const handleRefreshRef = React.useRef<() => Promise<void>>(async () => {});
  handleRefreshRef.current = handleRefresh;

  useFocusEffect(
    React.useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }

      if (hubBusyRef.current) return;
      void handleRefreshRef.current();
    }, []),
  );

  const handleCompleteProfile = async () => {

    if (!mainNavigation) {
      console.error("❌ [StripeHub] mainNavigation est undefined!");
      Alert.alert(
        t("common.error"),
        "La navigation n'est pas disponible. Veuillez redémarrer l'application.",
      );
      return;
    }

    try {

      const businessType = resolveBusinessType(
        stripeAccount.account?.business_type ||
          stripeAccount.account?.businessType,
        stripeAccount.account?.requirements,
      );
      const startStep = getStartOnboardingStep(
        stripeAccount.account?.requirements,
        businessType,
      );

      // Navigation vers le stack d'onboarding
      mainNavigation.navigate("StripeOnboarding", {
        screen: startStep,
      });
    } catch (error) {
      console.error("❌ [StripeHub] Error:", error);
      Alert.alert(t("common.error"), t("stripe.hub.errorLoadingForm"));
    }
  };

  // Handler: Supprimer le compte Stripe
  const handleDeleteAccount = async () => {
    Alert.alert(
      t("stripe.hub.deleteAccountTitle"),
      t("stripe.hub.deleteAccountConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("stripe.hub.deleteAccount"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStripeAccount();

              // Recharger les données
              await handleRefresh();

              Alert.alert(t("common.success"), t("stripe.hub.deleteSuccess"));
            } catch (error) {
              console.error("❌ [StripeHub] Delete error:", error);
              Alert.alert(t("common.error"), t("stripe.hub.deleteError"));
            }
          },
        },
      ],
    );
  };

  const handleStripeConnect = async () => {

    if (!mainNavigation) {
      console.error("❌ [StripeHub] mainNavigation est undefined!");
      Alert.alert(
        t("common.error"),
        "La navigation n'est pas disponible. Veuillez redémarrer l'application.",
      );
      return;
    }

    try {
      // Si un compte existe déjà, naviguer directement sans créer de compte
      if (accountId) {
        const businessType = resolveBusinessType(
          stripeAccount.account?.business_type ||
            stripeAccount.account?.businessType,
          stripeAccount.account?.requirements,
        );
        const startStep = getStartOnboardingStep(
          stripeAccount.account?.requirements,
          businessType,
        );
        mainNavigation.navigate("StripeOnboarding", {
          screen: startStep,
        });
        return;
      }

      setIsLoading(true);

      // Appel API pour démarrer l'onboarding (créer nouveau compte)
      const result = await startStripeOnboarding("company");


      // Navigation vers le stack d'onboarding
      mainNavigation.navigate("StripeOnboarding", {
        screen: "Welcome",
      });
    } catch (error) {
      console.error("❌ [StripeHub] Error:", error);
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("auth.errors.networkError"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPayments = () => {
    // Navigation vers la liste des paiements
    if (navigation?.navigate) {
      navigation.navigate("PaymentsList");
    }
  };

  const handleViewPayouts = () => {
    // Navigation vers les payouts
    if (navigation?.navigate) {
      navigation.navigate("Payouts");
    }
  };

  const handleCreatePaymentLink = () => {
    // Ouvrir le modal de création de lien de paiement (uniquement si compte existant)
    if (!accountId) {
      Alert.alert(t("common.error"), t("stripe.hub.noAccount"));
      return;
    }
    setShowPaymentLinkModal(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: DESIGN_TOKENS.spacing.xs,
    },
    statusText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
    },
    card: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    cardTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.md,
    },
    statItem: {
      flex: 1,
      minWidth: "45%",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    statLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "500",
    },
    actionTextPrimary: {
      color: colors.backgroundTertiary,
    },
    accountInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    accountText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.md,
    },
    quickActions: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
    },
    quickActionButton: {
      flex: 1,
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    quickActionText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.text,
      fontWeight: "500",
      textAlign: "center",
    },
  });

  // Écran d'onboarding pour utilisateur non connecté à Stripe
  const renderOnboardingScreen = () => {
    // ✅ FIX: Utiliser les vraies propriétés (snake_case du backend)
    const hasAccount = !!(
      stripeAccount.account?.stripe_account_id ||
      stripeAccount.account?.accountId
    );
    const accountInfo = stripeAccount.account;
    const requirements = accountInfo?.requirements;
    const hasMissingRequirements =
      (requirements?.currently_due?.length || 0) > 0 ||
      (requirements?.past_due?.length || 0) > 0 ||
      (requirements?.eventually_due?.length || 0) > 0;

    const statusLabel = (() => {
      switch (stripeConnection.status) {
        case "active":
          return t("stripe.hub.accountVerified");
        case "restricted":
          return t("stripe.hub.actionRequired");
        case "pending":
          return t("stripe.hub.pending");
        case "incomplete":
          return t("stripe.hub.incomplete");
        default:
          return t("stripe.hub.incomplete");
      }
    })();

    const missingNow = requirements?.currently_due || [];
    const missingPast = requirements?.past_due || [];
    const missingEventually = requirements?.eventually_due || [];
    const missingTotal =
      missingNow.length + missingPast.length + missingEventually.length;

    // ✅ Vérifier si l'onboarding est complet
    const isOnboardingComplete = hasAccount && !hasMissingRequirements;

    // 🔍 DEBUG: Voir la vraie valeur

    // ✅ CAS 0: Compte complet → Retourner null pour afficher le dashboard
    if (hasAccount && isOnboardingComplete) {
      return null;
    }

    return (
      <SafeAreaView testID="stripe-hub-screen" style={styles.container}>
        <View
          style={[
            styles.content,
            { justifyContent: "center", paddingHorizontal: 20 },
          ]}
        >
          {/* Loading état */}
          {stripeConnection.loading && (
            <MascotLoading text={t("stripe.hub.checkingConnection")} />
          )}

          {/* ✅ FIX: État erreur de connexion */}
          {!stripeConnection.loading && stripeConnection.error && (
            <>
              <View style={{ alignItems: "center", marginBottom: 40 }}>
                <Image
                  source={mascotStripeImage}
                  style={{
                    width: "100%",
                    height: 200,
                    marginBottom: 20,
                  }}
                  resizeMode="contain"
                />

                <Text
                  style={[
                    styles.title,
                    { textAlign: "center", marginBottom: 10 },
                  ]}
                >
                  {t("stripe.hub.connectionError")}
                </Text>

                <Text
                  style={{
                    textAlign: "center",
                    color: colors.textSecondary,
                    lineHeight: 22,
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  {stripeConnection.error}
                </Text>
              </View>

              {/* Bouton de retry */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    marginBottom: 15,
                  },
                ]}
                onPress={() => stripeConnection.refresh()}
              >
                <Ionicons name="refresh-outline" size={24} color="white" />
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: "white",
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 10,
                    },
                  ]}
                >
                  {t("common.retry")}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* CAS 1: Compte incomplet - Afficher infos partielles */}
          {!stripeConnection.loading &&
            !stripeConnection.error &&
            hasAccount && (
              <>
                <View style={{ alignItems: "center", marginBottom: 30 }}>
                  <Image
                    source={mascotStripeImage}
                    style={{
                      width: "100%",
                      height: 200,
                      marginBottom: 20,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.title,
                      { textAlign: "center", marginBottom: 10 },
                    ]}
                  >
                    {t("stripe.hub.accountInactive")}
                  </Text>

                  <Text
                    style={{
                      textAlign: "center",
                      color: colors.textSecondary,
                      lineHeight: 22,
                      fontSize: 14,
                    }}
                  >
                    {t("stripe.hub.accountInactiveDesc")}
                  </Text>
                </View>

                {/* Informations du compte partiel */}
                <View
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    {t("stripe.hub.savedInfo")}
                  </Text>

                  {(accountInfo?.business_name ||
                    accountInfo?.businessName) && (
                    <View style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <Text style={{ color: colors.text }}>
                        {accountInfo.business_name || accountInfo.businessName}
                      </Text>
                    </View>
                  )}

                  {(accountInfo?.stripe_account_id ||
                    accountInfo?.accountId) && (
                    <View style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Ionicons
                        name="card"
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 12,
                          fontFamily: "monospace",
                        }}
                      >
                        {accountInfo.stripe_account_id || accountInfo.accountId}
                      </Text>
                    </View>
                  )}

                  {accountInfo?.country && (
                    <View style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <Text style={{ color: colors.text }}>
                        {accountInfo.country} •{" "}
                        {accountInfo.currency?.toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 13 }}
                      >
                        {t("stripe.hub.status")}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {statusLabel}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 13 }}
                      >
                        {t("stripe.hub.payments")}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name={
                            accountInfo?.charges_enabled ||
                            accountInfo?.chargesEnabled
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            accountInfo?.charges_enabled ||
                            accountInfo?.chargesEnabled
                              ? colors.success
                              : colors.error
                          }
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color:
                              accountInfo?.charges_enabled ||
                              accountInfo?.chargesEnabled
                                ? colors.success
                                : colors.error,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {accountInfo?.charges_enabled ||
                          accountInfo?.chargesEnabled
                            ? t("stripe.hub.paymentsEnabled")
                            : t("stripe.hub.paymentsDisabled")}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        marginTop: 2,
                        color: colors.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {accountInfo?.charges_enabled ||
                      accountInfo?.chargesEnabled
                        ? t("stripe.hub.paymentsHintEnabled")
                        : t("stripe.hub.paymentsHintDisabled")}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 13 }}
                      >
                        {t("stripe.hub.payoutsLabel")}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name={
                            accountInfo?.payouts_enabled ||
                            accountInfo?.payoutsEnabled
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            accountInfo?.payouts_enabled ||
                            accountInfo?.payoutsEnabled
                              ? colors.success
                              : colors.error
                          }
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color:
                              accountInfo?.payouts_enabled ||
                              accountInfo?.payoutsEnabled
                                ? colors.success
                                : colors.error,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {accountInfo?.payouts_enabled ||
                          accountInfo?.payoutsEnabled
                            ? t("stripe.hub.payoutsEnabled")
                            : t("stripe.hub.payoutsDisabled")}
                        </Text>
                      </View>
                    </View>

                    {requirements?.disabled_reason && (
                      <View
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                          }}
                        >
                          {t("stripe.hub.reason")}:{" "}
                          {requirements.disabled_reason}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {hasMissingRequirements && (
                  <View
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 8,
                        fontWeight: "600",
                      }}
                    >
                      {t("stripe.hub.missingFields", { count: missingTotal })}
                    </Text>

                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        lineHeight: 18,
                        marginBottom: 10,
                      }}
                    >
                      {t("stripe.hub.missingFieldsDesc")}
                    </Text>

                    {(missingPast.length > 0 || missingNow.length > 0) && (
                      <View>
                        {(missingPast.length > 0 ? missingPast : missingNow)
                          .slice(0, 3)
                          .map((field, index) => (
                            <View
                              key={`missing_${index}`}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 4,
                              }}
                            >
                              <Ionicons
                                name={getRequirementIcon(field) as any}
                                size={14}
                                color={
                                  missingPast.length > 0
                                    ? colors.error
                                    : colors.warning
                                }
                              />
                              <Text
                                style={{
                                  marginLeft: 6,
                                  fontSize: 12,
                                  color:
                                    missingPast.length > 0
                                      ? colors.error
                                      : colors.warning,
                                }}
                              >
                                {getRequirementLabel(field, "fr")}
                              </Text>
                            </View>
                          ))}

                        {missingTotal > 3 && (
                          <Text
                            style={{
                              marginTop: 8,
                              fontSize: 11,
                              color: colors.textSecondary,
                            }}
                          >
                            {t("stripe.hub.otherFields", {
                              count: missingTotal - 3,
                            })}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Bouton principal: Rafraichir le statut */}
                <TouchableOpacity
                  testID="stripe-hub-refresh-btn"
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.primary,
                      paddingVertical: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                    },
                  ]}
                  onPress={handleRefresh}
                  disabled={hubBusy}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh-outline"
                        size={24}
                        color="white"
                      />
                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 10,
                          },
                        ]}
                      >
                        {t("common.refresh")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  testID="stripe-hub-complete-profile-btn"
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 12,
                    },
                  ]}
                  onPress={handleCompleteProfile}
                  disabled={hubBusy}
                >
                  <Ionicons
                    name="pencil"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.textSecondary,
                        fontSize: 14,
                        marginLeft: 8,
                      },
                    ]}
                  >
                    {t("stripe.hub.completeProfile")}
                  </Text>
                </TouchableOpacity>

                {/* Bouton secondaire: Supprimer le compte */}
                <TouchableOpacity
                  testID="stripe-hub-disconnect-btn"
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: "transparent",
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.error,
                    },
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={hubBusy}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.error,
                        fontSize: 14,
                        marginLeft: 8,
                      },
                    ]}
                  >
                    {t("stripe.hub.deleteAccount")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

          {/* CAS 2: Pas de compte - Nouveau compte */}
          {!stripeConnection.loading &&
            !stripeConnection.error &&
            !hasAccount && (
              <>
                <View style={{ alignItems: "center", marginBottom: 40 }}>
                  <Image
                    source={mascotStripeImage}
                    style={{
                      width: "100%",
                      height: 200,
                      marginBottom: 20,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.title,
                      { textAlign: "center", marginBottom: 10 },
                    ]}
                  >
                    {t("stripe.hub.completeSetup")}
                  </Text>

                  <Text
                    style={{
                      textAlign: "center",
                      color: colors.textSecondary,
                      lineHeight: 22,
                      fontSize: 14,
                    }}
                  >
                    {t("stripe.hub.subtitle")}
                  </Text>

                  <Text
                    style={{
                      textAlign: "center",
                      color: colors.text,
                      lineHeight: 22,
                      fontSize: 14,
                      marginTop: 16,
                      paddingHorizontal: 8,
                    }}
                  >
                    {t("stripe.hub.stripeExplanation")}
                  </Text>
                </View>

                {/* Boutons d'action */}
                <View style={{ gap: 15 }}>
                  <TouchableOpacity
                    testID="stripe-hub-connect-btn"
                    style={[
                      styles.actionButton,
                      styles.actionButtonPrimary,
                      {
                        backgroundColor: colors.primary,
                        paddingVertical: 16,
                        borderRadius: 12,
                      },
                    ]}
                    onPress={handleStripeConnect}
                    disabled={hubBusy}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color="white"
                    />
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: "white",
                          fontSize: 16,
                          fontWeight: "600",
                          marginLeft: 10,
                        },
                      ]}
                    >
                      {t("stripe.hub.onboarding")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        paddingVertical: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => stripeConnection.refresh()}
                    disabled={hubBusy}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: colors.textSecondary,
                          fontSize: 14,
                        },
                      ]}
                    >
                      {t("common.retry")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Informations de statut */}
                <View
                  style={{
                    marginTop: 30,
                    padding: 15,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.textSecondary,
                        fontSize: 12,
                        textAlign: "center",
                      },
                    ]}
                  >
                    {t("stripe.hub.status")}: {stripeConnection.status} •{" "}
                    {stripeConnection.details}
                  </Text>
                </View>
              </>
            )}
        </View>
      </SafeAreaView>
    );
  }; // ✅ Close renderOnboardingScreen function

  // Get account status badge info
  const getAccountStatusBadge = () => {
    const { account } = stripeAccount;
    if (!account)
      return {
        color: colors.textSecondary,
        bgColor: colors.backgroundSecondary,
        icon: "information-circle",
        text: "Loading...",
      };

    // Complete: charges + payouts enabled, no requirements
    const isComplete =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.requirements.currently_due.length === 0 &&
      account.requirements.past_due.length === 0;

    // Restricted: past due requirements
    const isRestricted = account.requirements.past_due.length > 0;

    // Pending: details submitted but requirements remain
    const isPending =
      account.details_submitted &&
      account.requirements.currently_due.length > 0;

    if (isComplete) {
      return {
        color: colors.success,
        bgColor: colors.successLight,
        icon: "checkmark-circle",
        text: t("stripe.hub.accountVerified"),
      };
    }
    if (isRestricted) {
      return {
        color: colors.error,
        bgColor: colors.errorLight,
        icon: "alert-circle",
        text: t("stripe.hub.actionRequired"),
      };
    }
    if (isPending) {
      return {
        color: colors.warning,
        bgColor: colors.warningLight,
        icon: "time",
        text: t("stripe.hub.pending"),
      };
    }
    return {
      color: colors.info,
      bgColor: colors.infoLight || colors.backgroundSecondary,
      icon: "information-circle",
      text: t("stripe.hub.incomplete"),
    };
  };

  // Écran principal pour utilisateur connecté à Stripe
  const renderConnectedScreen = () => {
    const statusBadge = getAccountStatusBadge();

    return (
      <SafeAreaView testID="stripe-hub-screen" style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={hubBusy}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header avec statut du compte */}
          <View
            style={[
              styles.header,
              {
                flexDirection: "column",
                alignItems: "stretch",
                marginBottom: 8,
                marginTop: 0,
                paddingTop: 0,
                paddingHorizontal: 0,
              },
            ]}
          >
            <Image
              source={mascotStripeImage}
              style={{
                width: "100%",
                height: 200,
                resizeMode: "contain",
              }}
            />
            <View style={{ alignItems: "flex-end", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  const { account } = stripeAccount;
                  if (!account) return;
                  const issues: string[] = [];
                  if (account.requirements.past_due.length > 0) {
                    issues.push(
                      `⚠️ ${t("stripe.hub.urgentAction")}:\n` +
                        account.requirements.past_due
                          .map(
                            (f: string) =>
                              `  • ${getRequirementLabel(f, "fr")}`,
                          )
                          .join("\n"),
                    );
                  }
                  if (account.requirements.currently_due.length > 0) {
                    issues.push(
                      `📋 ${t("stripe.hub.missingInfo")}:\n` +
                        account.requirements.currently_due
                          .map(
                            (f: string) =>
                              `  • ${getRequirementLabel(f, "fr")}`,
                          )
                          .join("\n"),
                    );
                  }
                  if (issues.length === 0) {
                    Alert.alert(
                      statusBadge.text,
                      t("stripe.hub.accountVerified"),
                    );
                  } else {
                    Alert.alert(statusBadge.text, issues.join("\n\n"));
                  }
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: statusBadge.color,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons
                  name={statusBadge.icon as any}
                  size={16}
                  color="#FFFFFF"
                />
                <Text
                  testID="stripe-hub-status-text"
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {statusBadge.text}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Informations du compte Stripe */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {t("stripe.hub.accountInfo")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation?.navigate?.("StripeSettings")}
                disabled={hubBusy}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.accountInfo}>
              <Ionicons
                name="business-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.accountText}>
                {stripeAccount.account?.business_name ||
                  "Swift Moving Services"}
              </Text>
            </View>

            <View style={styles.accountInfo}>
              <Ionicons
                name="card-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.accountText}>
                {t("stripe.hub.accountId")}:{" "}
                {stripeAccount.account?.stripe_account_id
                  ? `${stripeAccount.account.stripe_account_id.slice(0, 20)}...`
                  : t("stripe.hub.notConnected")}
              </Text>
            </View>

            {/* Requirements Display */}
            {stripeAccount.account?.requirements &&
              (stripeAccount.account.requirements.currently_due.length > 0 ||
                stripeAccount.account.requirements.past_due.length > 0) && (
                <>
                  <View style={styles.divider} />

                  <View
                    style={{
                      padding: 12,
                      backgroundColor:
                        stripeAccount.account.requirements.past_due.length > 0
                          ? colors.errorLight
                          : colors.warningLight,
                      borderRadius: 8,
                      marginVertical: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="warning"
                        size={18}
                        color={
                          stripeAccount.account.requirements.past_due.length > 0
                            ? colors.error
                            : colors.warning
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 14,
                          fontWeight: "600",
                          color:
                            stripeAccount.account.requirements.past_due.length >
                            0
                              ? colors.error
                              : colors.warning,
                        }}
                      >
                        {stripeAccount.account.requirements.past_due.length > 0
                          ? t("stripe.hub.urgentAction")
                          : t("stripe.hub.missingInfo")}
                      </Text>
                    </View>

                    {/* Past Due Requirements */}
                    {stripeAccount.account.requirements.past_due.length > 0 && (
                      <View style={{ marginBottom: 8 }}>
                        {stripeAccount.account.requirements.past_due
                          .slice(0, 3)
                          .map((field, index) => (
                            <View
                              key={index}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 4,
                              }}
                            >
                              <Ionicons
                                name={getRequirementIcon(field) as any}
                                size={14}
                                color={colors.error}
                              />
                              <Text
                                style={{
                                  marginLeft: 6,
                                  fontSize: 12,
                                  color: colors.error,
                                }}
                              >
                                {getRequirementLabel(field, "fr")}
                              </Text>
                            </View>
                          ))}
                      </View>
                    )}

                    {/* Currently Due Requirements */}
                    {stripeAccount.account.requirements.currently_due.length >
                      0 && (
                      <View>
                        {stripeAccount.account.requirements.currently_due
                          .slice(0, 3)
                          .map((field, index) => (
                            <View
                              key={index}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 4,
                              }}
                            >
                              <Ionicons
                                name={getRequirementIcon(field) as any}
                                size={14}
                                color={colors.warning}
                              />
                              <Text
                                style={{
                                  marginLeft: 6,
                                  fontSize: 12,
                                  color: colors.warning,
                                }}
                              >
                                {getRequirementLabel(field, "fr")}
                              </Text>
                            </View>
                          ))}
                      </View>
                    )}

                    {/* Show count if more than 3 */}
                    {stripeAccount.account.requirements.currently_due.length +
                      stripeAccount.account.requirements.past_due.length >
                      3 && (
                      <Text
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: colors.textSecondary,
                          fontStyle: "italic",
                        }}
                      >
                        +
                        {stripeAccount.account.requirements.currently_due
                          .length +
                          stripeAccount.account.requirements.past_due.length -
                          3}{" "}
                        {t("stripe.hub.additionalParams")}
                      </Text>
                    )}

                    {/* Complete Profile Button */}
                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        backgroundColor: colors.primary,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={handleCompleteProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="pencil" size={16} color="white" />
                          <Text
                            style={{
                              marginLeft: 8,
                              color: "white",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {t("stripe.hub.completeProfile")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

            <View style={styles.divider} />

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation?.navigate?.("StripeSettings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.textSecondary}
                  style={styles.quickActionIcon}
                />
                <Text style={styles.quickActionText}>
                  {t("stripe.hub.settingsAction")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={handleViewPayouts}
              >
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={colors.textSecondary}
                  style={styles.quickActionIcon}
                />
                <Text style={styles.quickActionText}>
                  {t("stripe.hub.payoutsLabel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={handleCreatePaymentLink}
              >
                <Ionicons
                  name="link-outline"
                  size={24}
                  color={colors.textSecondary}
                  style={styles.quickActionIcon}
                />
                <Text style={styles.quickActionText}>
                  {t("stripe.hub.paymentLinkAction")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle : refacturer les frais Stripe au client */}
          <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.cardTitle}>
                  {t("stripe.hub.feePassToClient")}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 4,
                  }}
                >
                  {t("stripe.hub.feePassToClientDesc")}
                </Text>
              </View>
              <Switch
                value={passFeesToClient}
                onValueChange={handleToggleFees}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={
                  passFeesToClient ? colors.primary : colors.textMuted
                }
              />
            </View>
          </View>

          {/* Statistiques */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {t("stripe.hub.revenueOverview")}
              </Text>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(stripeStats.totalRevenue)}
                </Text>
                <Text style={styles.statLabel}>
                  {t("stripe.hub.totalRevenue")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(stripeStats.monthlyRevenue)}
                </Text>
                <Text style={styles.statLabel}>
                  {t("stripe.hub.thisMonth")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(stripeStats.pendingPayouts)}
                </Text>
                <Text style={styles.statLabel}>
                  {t("stripe.hub.pendingPayouts")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stripeStats.successfulPayments}
                </Text>
                <Text style={styles.statLabel}>
                  {t("stripe.hub.successfulPayments")}
                </Text>
              </View>
            </View>
          </View>

          {/* Delete account button */}
          <TouchableOpacity
            testID="stripe-hub-dashboard-delete-btn"
            style={[
              styles.actionButton,
              {
                borderColor: colors.error,
                borderWidth: 1,
                marginHorizontal: 0,
              },
            ]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>
              {t("stripe.hub.deleteAccount")}
            </Text>
          </TouchableOpacity>

          {/* Footer info */}
          <View
            style={{
              alignItems: "center",
              marginTop: DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Text style={[styles.accountText, { textAlign: "center" }]}>
              {t("stripe.hub.poweredByStripe")}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }; // ✅ Close renderConnectedScreen function

  // Logique d'affichage conditionnelle selon le statut de connexion Stripe
  // ✅ Vérifier l'existence du compte (snake_case et camelCase)
  const accountExists = !!(
    stripeAccount.account?.stripe_account_id || stripeAccount.account?.accountId
  );

  // Pendant le chargement du hook de connexion, afficher un écran de chargement
  // qui ne peut pas retourner null (sinon écran vide / “chargement infini”).
  if (stripeConnection.loading && !accountExists) {
    return <MascotLoading text={t("stripe.hub.checkingConnection")} />;
  }

  const isAccountActive = !!(
    stripeAccount.account?.charges_enabled ||
    stripeAccount.account?.chargesEnabled
  );


  // Cas 1: Compte existe ET paiements activés → Dashboard complet
  if (accountExists && isAccountActive) {
    return (
      <>
        {renderConnectedScreen()}

        {/* Modal de création de lien de paiement */}
        <CreatePaymentLinkModal
          visible={showPaymentLinkModal}
          onClose={() => setShowPaymentLinkModal(false)}
          accountId={accountId || undefined}
          onSuccess={(paymentLink) => {
            // Lien créé avec succès
          }}
        />
      </>
    );
  }

  // Cas 2: Pas de compte OU onboarding incomplet → Afficher renderOnboardingScreen
  const onboardingScreen = renderOnboardingScreen();

  // Si renderOnboardingScreen retourne null (ne devrait pas arriver), afficher dashboard par défaut
  if (!onboardingScreen) {
    return (
      <>
        {renderConnectedScreen()}

        {/* Modal de création de lien de paiement */}
        <CreatePaymentLinkModal
          visible={showPaymentLinkModal}
          onClose={() => setShowPaymentLinkModal(false)}
          accountId={accountId || undefined}
          onSuccess={(paymentLink) => {
            // Lien créé avec succès
          }}
        />
      </>
    );
  }

  return <>{onboardingScreen}</>;
}
