/**
 * WelcomeScreen - Écran d'accueil de l'onboarding Stripe
 * Présente les bénéfices et lance le processus d'activation
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Alert,
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
import { useStripeAccount } from "../../../hooks/useStripe";
import { useTranslation } from "../../../localization";
import { startOnboarding } from "../../../services/StripeService";
import { getStartOnboardingStep, resolveBusinessType } from "./onboardingSteps";

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const stripeAccount = useStripeAccount();
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStart = async () => {
    console.log("🚀 [Onboarding] Starting Stripe onboarding flow");

    setIsStarting(true);

    try {
      // Check if user already has a Stripe account
      const hasStripeAccount = stripeAccount.account?.stripe_account_id;

      if (!hasStripeAccount) {
        // Create Stripe Custom account first
        console.log("🆕 [Onboarding] No Stripe account, creating one...");
        const result = await startOnboarding("company");
        console.log(
          "✅ [Onboarding] Account created:",
          result.stripe_account_id,
        );

        // Refresh the stripe account in context
        await stripeAccount.refresh?.();
      }

      const businessType = resolveBusinessType(
        stripeAccount.account?.business_type ||
          stripeAccount.account?.businessType,
        stripeAccount.account?.requirements,
      );
      const startStep = getStartOnboardingStep(
        stripeAccount.account?.requirements,
        businessType,
      );
      navigation.navigate(startStep);
    } catch (error: any) {
      console.error("❌ [Onboarding] Error starting:", error);
      Alert.alert(
        t("stripe.onboarding.errors.startTitle"),
        error.message || t("stripe.onboarding.errors.startMessage"),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleGoBack = () => {
    console.log("← [Onboarding] User canceled at welcome screen");
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: DESIGN_TOKENS.spacing.xl,
    },
    header: {
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.xl,
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
      borderWidth: 3,
      borderColor: "#635BFF", // Stripe purple
    },
    logo: {
      fontSize: 48,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    subtitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    benefitsSection: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: DESIGN_TOKENS.spacing.md,
      paddingLeft: DESIGN_TOKENS.spacing.sm,
    },
    benefitIcon: {
      marginRight: DESIGN_TOKENS.spacing.md,
      marginTop: 2,
    },
    benefitText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      lineHeight: 22,
    },
    requirementsSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.xl,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    requirementsTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    requirementItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      paddingLeft: DESIGN_TOKENS.spacing.md,
    },
    requirementBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    requirementText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      flex: 1,
    },
    buttonContainer: {
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: "auto",
      paddingBottom: Math.max(DESIGN_TOKENS.spacing.lg, insets.bottom + 12),
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonText: {
      color: "white",
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: "600",
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    secondaryButton: {
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "500",
    },
    timeEstimate: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    timeEstimateText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header avec Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💳</Text>
          </View>
          <Text style={styles.title}>
            {t("stripe.onboarding.welcome.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("stripe.onboarding.welcome.subtitle")}
          </Text>
        </View>

        {/* Estimation de temps */}
        <View style={styles.timeEstimate}>
          <Ionicons
            name="time-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.timeEstimateText}>
            {t("stripe.onboarding.welcome.timeEstimate")}
          </Text>
        </View>

        {/* Liste des bénéfices */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#10B981"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>
              {t("stripe.onboarding.welcome.benefit1")}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#10B981"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>
              {t("stripe.onboarding.welcome.benefit2")}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#10B981"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>
              {t("stripe.onboarding.welcome.benefit3")}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#10B981"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>
              {t("stripe.onboarding.welcome.benefit4")}
            </Text>
          </View>
        </View>

        {/* Ce dont vous aurez besoin */}
        <View style={styles.requirementsSection}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
            />
            <Text style={styles.requirementsTitle}>
              {t("stripe.onboarding.welcome.whatYouNeedTitle")}
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Text style={styles.requirementText}>
              {t("stripe.onboarding.welcome.requirement1")}
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Text style={styles.requirementText}>
              {t("stripe.onboarding.welcome.requirement2")}
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Text style={styles.requirementText}>
              {t("stripe.onboarding.welcome.requirement3")}
            </Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isStarting && { opacity: 0.7 }]}
            onPress={handleStart}
            activeOpacity={0.8}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="rocket" size={20} color="white" />
            )}
            <Text style={styles.primaryButtonText}>
              {isStarting
                ? t("stripe.onboarding.welcome.startingButton", {
                    defaultValue: "Création en cours...",
                  })
                : t("stripe.onboarding.welcome.startButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            disabled={isStarting}
          >
            <Text style={styles.secondaryButtonText}>
              {t("stripe.onboarding.welcome.cancelButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
