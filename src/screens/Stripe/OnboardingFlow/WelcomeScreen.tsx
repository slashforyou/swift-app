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
import { useTranslation } from "../../../localization";
import { startOnboarding } from "../../../services/StripeService";

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isStarting, setIsStarting] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<"individual" | "company">("individual");

  const handleStart = async () => {
    setIsStarting(true);

    try {
      // Always call start — endpoint is idempotent (returns existing account if one exists)
      await startOnboarding(selectedType);

      // Always start at the first step — no skipping
      navigation.navigate("PersonalInfo");
    } catch (error: any) {
      Alert.alert(
        t("stripe.onboarding.errors.startTitle"),
        error.message || t("stripe.onboarding.errors.startMessage"),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const styles = React.useMemo(() => StyleSheet.create({
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
    businessTypeSection: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    businessTypeSectionTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    businessTypeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    businessTypeOptionSelected: {
      borderColor: "#635BFF",
      backgroundColor: colors.backgroundSecondary,
    },
    businessTypeRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    businessTypeRadioSelected: {
      borderColor: "#635BFF",
    },
    businessTypeRadioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#635BFF",
    },
    businessTypeTextContainer: {
      flex: 1,
    },
    businessTypeLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
    },
    businessTypeDescription: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginTop: 2,
    },
  }), [colors, insets]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]} testID="stripe-welcome-screen">
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

        {/* Business type selector */}
        <View style={styles.businessTypeSection}>
          <Text style={styles.businessTypeSectionTitle}>
            {t("stripe.onboarding.welcome.businessTypeTitle")}
          </Text>

          <TouchableOpacity
            style={[styles.businessTypeOption, selectedType === "individual" && styles.businessTypeOptionSelected]}
            onPress={() => setSelectedType("individual")}
            activeOpacity={0.7}
          >
            <View style={[styles.businessTypeRadio, selectedType === "individual" && styles.businessTypeRadioSelected]}>
              {selectedType === "individual" && <View style={styles.businessTypeRadioInner} />}
            </View>
            <View style={styles.businessTypeTextContainer}>
              <Text style={styles.businessTypeLabel}>
                {t("stripe.onboarding.welcome.individualLabel")}
              </Text>
              <Text style={styles.businessTypeDescription}>
                {t("stripe.onboarding.welcome.individualDescription")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.businessTypeOption, selectedType === "company" && styles.businessTypeOptionSelected]}
            onPress={() => setSelectedType("company")}
            activeOpacity={0.7}
          >
            <View style={[styles.businessTypeRadio, selectedType === "company" && styles.businessTypeRadioSelected]}>
              {selectedType === "company" && <View style={styles.businessTypeRadioInner} />}
            </View>
            <View style={styles.businessTypeTextContainer}>
              <Text style={styles.businessTypeLabel}>
                {t("stripe.onboarding.welcome.companyLabel")}
              </Text>
              <Text style={styles.businessTypeDescription}>
                {t("stripe.onboarding.welcome.companyDescription")}
              </Text>
            </View>
          </TouchableOpacity>
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
            testID="stripe-welcome-start-btn"
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
            testID="stripe-welcome-cancel-btn"
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
