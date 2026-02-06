/**
 * ReviewScreen - Étape 5/5 de l'onboarding Stripe
 * Récapitulatif final + validation CGU + activation compte
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
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useTranslation } from "../../../localization";
import { completeOnboarding } from "../../../services/StripeService";

interface ReviewScreenProps {
  navigation: any;
  route: any;
}

export default function ReviewScreen({ navigation, route }: ReviewScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [tosAccepted, setTosAccepted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { personalInfo, address, bankAccount, documents } = route.params || {};

  // Formater la date de naissance
  const formatDate = (date: Date): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  // Masquer les derniers chiffres du compte bancaire
  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    const lastFour = accountNumber.slice(-3);
    return `******${lastFour}`;
  };

  const handleActivate = async () => {
    if (!tosAccepted) {
      Alert.alert(
        t("stripe.onboarding.review.errors.tosTitle"),
        t("stripe.onboarding.review.errors.tosMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🎉 [Review] Completing onboarding...");

      const response = await completeOnboarding(true);

      console.log("✅ [Review] Onboarding completed!");
      console.log("📊 Account Status:", response.accountStatus);

      // Navigation vers l'écran de validation finale
      navigation.navigate("Completion", {
        accountStatus: response.accountStatus || {
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: true,
        },
      });
    } catch (error: any) {
      console.error("❌ [Review] Error completing onboarding:", error);
      Alert.alert(
        "Erreur",
        error.message ||
          "Une erreur est survenue lors de l'activation de votre compte.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    stepText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    progressContainer: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#10B981", // Green (complete)
      width: "100%",
    },
    progressText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "right",
    },
    scrollContent: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    titleSection: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    icon: {
      fontSize: 32,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    subtitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.5,
    },
    summarySection: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    summaryCard: {
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.md,
      paddingBottom: DESIGN_TOKENS.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    cardTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
    },
    editButton: {
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    },
    editButtonText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: "#635BFF",
      fontWeight: "600",
    },
    cardContent: {
      gap: DESIGN_TOKENS.spacing.xs,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    infoLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      minWidth: 120,
    },
    infoValue: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "500",
    },
    checkmarkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.xs,
    },
    checkmarkText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: "#10B981",
      fontWeight: "500",
    },
    tosSection: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tosCheckboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: DESIGN_TOKENS.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxChecked: {
      backgroundColor: "#635BFF",
      borderColor: "#635BFF",
    },
    tosText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.5,
    },
    tosLink: {
      color: "#635BFF",
      fontWeight: "600",
    },
    disclaimerSection: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: "#EFF6FF",
      borderLeftWidth: 4,
      borderLeftColor: "#3B82F6",
      borderRadius: 8,
    },
    disclaimerText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: "#1E40AF",
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.5,
    },
    activateButton: {
      backgroundColor: "#635BFF",
      borderRadius: 8,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    activateButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    activateButtonText: {
      color: "#FFFFFF",
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "700",
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    activateButtonTextDisabled: {
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header avec retour et étape */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepText}>
          {t("stripe.onboarding.review.step")}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>100%</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>
            {t("stripe.onboarding.review.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("stripe.onboarding.review.subtitle")}
          </Text>
        </View>

        {/* Récapitulatif */}
        <View style={styles.summarySection}>
          {/* Informations personnelles */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="person"
                  size={20}
                  color={colors.text}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>
                  {t("stripe.onboarding.review.personalInfoTitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("PersonalInfo")}
              >
                <Text style={styles.editButtonText}>
                  {t("stripe.onboarding.review.editButton")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.name")}:
                </Text>
                <Text style={styles.infoValue}>
                  {personalInfo?.firstName} {personalInfo?.lastName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.dob")}:
                </Text>
                <Text style={styles.infoValue}>
                  {formatDate(personalInfo?.dob)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.email")}:
                </Text>
                <Text style={styles.infoValue}>{personalInfo?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.phone")}:
                </Text>
                <Text style={styles.infoValue}>+61 {personalInfo?.phone}</Text>
              </View>
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="home"
                  size={20}
                  color={colors.text}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>
                  {t("stripe.onboarding.review.addressTitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("Address")}
              >
                <Text style={styles.editButtonText}>
                  {t("stripe.onboarding.review.editButton")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>
                  {address?.line1}
                  {address?.line2 ? `, ${address.line2}` : ""}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>
                  {address?.city}, {address?.state} {address?.postalCode}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>Australia</Text>
              </View>
            </View>
          </View>

          {/* Compte bancaire */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="card"
                  size={20}
                  color={colors.text}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>
                  {t("stripe.onboarding.review.bankAccountTitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("BankAccount")}
              >
                <Text style={styles.editButtonText}>
                  {t("stripe.onboarding.review.editButton")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.accountHolder")}:
                </Text>
                <Text style={styles.infoValue}>
                  {bankAccount?.accountHolderName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.bsb")}:
                </Text>
                <Text style={styles.infoValue}>{bankAccount?.bsb}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {t("stripe.onboarding.review.accountNumber")}:
                </Text>
                <Text style={styles.infoValue}>
                  {maskAccountNumber(bankAccount?.accountNumber)}
                </Text>
              </View>
            </View>
          </View>

          {/* Documents */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="camera"
                  size={20}
                  color={colors.text}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>
                  {t("stripe.onboarding.review.documentsTitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("Documents")}
              >
                <Text style={styles.editButtonText}>
                  {t("stripe.onboarding.review.editButton")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.checkmarkRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.checkmarkText}>
                  {t("stripe.onboarding.review.frontUploaded")}
                </Text>
              </View>
              <View style={styles.checkmarkRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.checkmarkText}>
                  {t("stripe.onboarding.review.backUploaded")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Conditions Générales */}
        <TouchableOpacity
          style={styles.tosSection}
          onPress={() => setTosAccepted(!tosAccepted)}
          activeOpacity={0.7}
        >
          <View style={styles.tosCheckboxRow}>
            <View
              style={[styles.checkbox, tosAccepted && styles.checkboxChecked]}
            >
              {tosAccepted && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.tosText}>
              {t("stripe.onboarding.review.tosText")}{" "}
              <Text style={styles.tosLink}>
                {t("stripe.onboarding.review.tosLink")}
              </Text>{" "}
              {t("stripe.onboarding.review.tosTextEnd")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            {t("stripe.onboarding.review.disclaimer")}
          </Text>
        </View>

        {/* Bouton Activer */}
        <TouchableOpacity
          style={[
            styles.activateButton,
            (!tosAccepted || isSubmitting) && styles.activateButtonDisabled,
          ]}
          onPress={handleActivate}
          disabled={!tosAccepted || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text
                style={[
                  styles.activateButtonText,
                  !tosAccepted && styles.activateButtonTextDisabled,
                ]}
              >
                {t("stripe.onboarding.review.activateButton")}
              </Text>
              <Ionicons
                name="rocket"
                size={20}
                color={tosAccepted ? "#FFFFFF" : "#CCCCCC"}
              />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
