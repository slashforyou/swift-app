/**
 * CompletionScreen - Écran de validation finale de l'onboarding Stripe
 * Affiche le statut de validation et permet de retourner au StripeHub
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useTranslation } from "../../../localization";

interface CompletionScreenProps {
  navigation: any;
  route: any;
}

export default function CompletionScreen({
  navigation,
  route,
}: CompletionScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { accountStatus } = route.params || {};

  // Déterminer si le compte est actif ou en attente
  const isActive =
    accountStatus?.charges_enabled && accountStatus?.payouts_enabled;
  const isPending = accountStatus?.details_submitted && !isActive;

  const handleReturn = () => {
    // Retourner au Business screen (StripeHub est un composant inline dans BusinessNavigation)
    // Le parent du StripeOnboardingStack est le root navigator qui a "Business"
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.navigate("Business");
    } else {
      // Fallback: revenir en arrière dans le stack
      navigation.popToTop();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.xl * 2,
      paddingBottom: Math.max(DESIGN_TOKENS.spacing.xl, insets.bottom + 12),
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isPending
        ? colors.warning + "20"
        : colors.success + "20",
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.xl,
      lineHeight: 24,
    },
    statusCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.xl,
      borderWidth: 1,
      borderColor: isPending ? colors.warning : colors.success,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    statusItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    statusText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: DESIGN_TOKENS.spacing.sm,
      flex: 1,
    },
    infoCard: {
      backgroundColor: colors.info + "15",
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.xl,
      borderLeftWidth: 4,
      borderLeftColor: colors.info,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    nextStepsCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    nextStepsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    stepItem: {
      flexDirection: "row",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    stepText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="stripe-completion-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icône de succès */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isPending ? "time-outline" : "checkmark-circle"}
              size={60}
              color={isPending ? colors.warning : colors.success}
            />
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          {isPending
            ? t("stripe.completion.titlePending")
            : isActive
              ? t("stripe.completion.titleActive")
              : t("stripe.completion.titleActive")}
        </Text>

        {/* Sous-titre */}
        <Text style={styles.subtitle}>
          {isPending
            ? t("stripe.completion.subtitlePending")
            : isActive
              ? t("stripe.completion.subtitleActive")
              : t("stripe.completion.subtitleActive")}
        </Text>

        {/* Carte de statut */}
        {accountStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              {t("stripe.completion.accountStatus")}
            </Text>

            <View style={styles.statusItem}>
              <Ionicons
                name={
                  accountStatus.details_submitted
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={20}
                color={
                  accountStatus.details_submitted
                    ? colors.success
                    : colors.textSecondary
                }
              />
              <Text style={styles.statusText}>
                Informations complètes:{" "}
                {accountStatus.details_submitted ? "Oui" : "Non"}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons
                name={
                  accountStatus.charges_enabled
                    ? "checkmark-circle"
                    : "time-outline"
                }
                size={20}
                color={
                  accountStatus.charges_enabled
                    ? colors.success
                    : colors.warning
                }
              />
              <Text style={styles.statusText}>
                Paiements:{" "}
                {accountStatus.charges_enabled ? "Activés" : "En attente"}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons
                name={
                  accountStatus.payouts_enabled
                    ? "checkmark-circle"
                    : "time-outline"
                }
                size={20}
                color={
                  accountStatus.payouts_enabled
                    ? colors.success
                    : colors.warning
                }
              />
              <Text style={styles.statusText}>
                Versements:{" "}
                {accountStatus.payouts_enabled ? "Activés" : "En attente"}
              </Text>
            </View>
          </View>
        )}

        {/* Information importante */}
        {isPending && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {t("stripe.completion.validationDelay")}
            </Text>
            <Text style={styles.infoText}>
              {t("stripe.completion.validationDelayDesc")}
            </Text>
          </View>
        )}

        {/* Prochaines étapes */}
        {isPending && (
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>
              {t("stripe.completion.nextStepsTitle")}
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                {t("stripe.completion.nextStepsStep1")}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                {t("stripe.completion.nextStepsStep2")}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                {t("stripe.completion.nextStepsStep3")}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                {t("stripe.completion.nextStepsStep4")}
              </Text>
            </View>
          </View>
        )}

        {/* Bouton de retour */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleReturn}
          testID="stripe-completion-return-btn"
        >
          <Text style={styles.buttonText}>
            {t("stripe.completion.returnToDashboard")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
