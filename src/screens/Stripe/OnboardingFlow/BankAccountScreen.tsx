/**
 * BankAccountScreen - Étape 3/5 de l'onboarding Stripe
 * Collecte: Nom titulaire, BSB (6 chiffres), Numéro compte (5-9 chiffres)
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useTranslation } from "../../../localization";
import { submitBankAccount } from "../../../services/StripeService";

interface BankAccountScreenProps {
  navigation: any;
  route: any;
}

interface FormData {
  accountHolderName: string;
  bsb: string;
  accountNumber: string;
}

interface FormErrors {
  accountHolderName?: string;
  bsb?: string;
  accountNumber?: string;
}

export default function BankAccountScreen({
  navigation,
  route,
}: BankAccountScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState<FormData>({
    accountHolderName: __DEV__ ? "Romain Giovanni" : "",
    bsb: __DEV__ ? "000-000" : "",
    accountNumber: __DEV__ ? "000123456" : "",
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Formater BSB avec tiret (XXX-XXX)
  const formatBSB = (value: string): string => {
    const cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned.length <= 3) {
      return cleaned;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
  };

  // Validation BSB (6 chiffres)
  const validateBSB = (bsb: string): boolean => {
    const cleaned = bsb.replace(/[^0-9]/g, "");
    return cleaned.length === 6;
  };

  // Validation numéro compte (5-9 chiffres)
  const validateAccountNumber = (accountNumber: string): boolean => {
    const cleaned = accountNumber.replace(/[^0-9]/g, "");
    return cleaned.length >= 5 && cleaned.length <= 9;
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = t(
        "stripe.onboarding.bankAccount.errors.holderNameRequired",
      );
    }

    if (!formData.bsb.trim()) {
      newErrors.bsb = t("stripe.onboarding.bankAccount.errors.bsbRequired");
    } else if (!validateBSB(formData.bsb)) {
      newErrors.bsb = t("stripe.onboarding.bankAccount.errors.bsbInvalid");
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = t(
        "stripe.onboarding.bankAccount.errors.accountNumberRequired",
      );
    } else if (!validateAccountNumber(formData.accountNumber)) {
      newErrors.accountNumber = t(
        "stripe.onboarding.bankAccount.errors.accountNumberInvalid",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.bankAccount.errors.validationTitle"),
        t("stripe.onboarding.bankAccount.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("💳 [BankAccount] Submitting data to API...");

      const payload = {
        bsb: formData.bsb.replace("-", ""), // Remove hyphen: "062-000" -> "062000"
        account_number: formData.accountNumber.trim(),
        account_holder_name: formData.accountHolderName.trim(),
      };

      const response = await submitBankAccount(payload);
      console.log("✅ [BankAccount] Success! Progress:", response.progress);

      navigation.navigate("Documents", {
        personalInfo: route.params.personalInfo,
        address: route.params.address,
        bankAccount: formData,
      });
    } catch (error: any) {
      console.error("❌ [BankAccount] Error:", error);
      Alert.alert(
        t("stripe.onboarding.bankAccount.errors.submissionTitle"),
        error.message ||
          t("stripe.onboarding.bankAccount.errors.submissionMessage"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBSBChange = (text: string) => {
    const formatted = formatBSB(text);
    setFormData({ ...formData, bsb: formatted });
    setErrors({ ...errors, bsb: undefined });
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
      backgroundColor: "#635BFF", // Stripe purple
      width: "60%",
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
    formSection: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    inputGroup: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    label: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    required: {
      color: "#EF4444",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
    },
    inputError: {
      borderColor: "#EF4444",
    },
    errorText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: "#EF4444",
    },
    helperText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    securityNote: {
      marginTop: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: "#F0FDF4", // Light green
      borderLeftWidth: 4,
      borderLeftColor: "#10B981", // Green
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    securityIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginTop: 2,
    },
    securityText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: "#065F46", // Dark green
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.5,
    },
    infoNote: {
      marginTop: DESIGN_TOKENS.spacing.md,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundTertiary,
      borderLeftWidth: 4,
      borderLeftColor: "#3B82F6", // Blue
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    infoIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.5,
    },
    nextButton: {
      backgroundColor: "#635BFF", // Stripe purple
      borderRadius: 8,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginRight: DESIGN_TOKENS.spacing.xs,
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
          {t("stripe.onboarding.bankAccount.step")}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>60%</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Titre */}
          <View style={styles.titleSection}>
            <Text style={styles.icon}>💳</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.bankAccount.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.bankAccount.subtitle")}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formSection}>
            {/* Nom titulaire */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.bankAccount.holderName")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.accountHolderName && styles.inputError,
                ]}
                value={formData.accountHolderName}
                onChangeText={(text) => {
                  setFormData({ ...formData, accountHolderName: text });
                  setErrors({ ...errors, accountHolderName: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.bankAccount.holderNamePlaceholder",
                )}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
              {errors.accountHolderName && (
                <Text style={styles.errorText}>{errors.accountHolderName}</Text>
              )}
            </View>

            {/* BSB */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.bankAccount.bsb")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.bsb && styles.inputError]}
                value={formData.bsb}
                onChangeText={handleBSBChange}
                placeholder={t("stripe.onboarding.bankAccount.bsbPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={7} // XXX-XXX
              />
              {errors.bsb && <Text style={styles.errorText}>{errors.bsb}</Text>}
              <Text style={styles.helperText}>
                {t("stripe.onboarding.bankAccount.bsbHelper")}
              </Text>
            </View>

            {/* Numéro compte */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.bankAccount.accountNumber")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.accountNumber && styles.inputError,
                ]}
                value={formData.accountNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setFormData({ ...formData, accountNumber: cleaned });
                  setErrors({ ...errors, accountNumber: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.bankAccount.accountNumberPlaceholder",
                )}
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={9}
              />
              {errors.accountNumber && (
                <Text style={styles.errorText}>{errors.accountNumber}</Text>
              )}
              <Text style={styles.helperText}>
                {t("stripe.onboarding.bankAccount.accountNumberHelper")}
              </Text>
            </View>

            {/* Note sécurité */}
            <View style={styles.securityNote}>
              <Ionicons
                name="lock-closed"
                size={20}
                color="#10B981"
                style={styles.securityIcon}
              />
              <Text style={styles.securityText}>
                {t("stripe.onboarding.bankAccount.securityNote")}
              </Text>
            </View>

            {/* Note info */}
            <View style={styles.infoNote}>
              <Ionicons
                name="information-circle"
                size={20}
                color="#3B82F6"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                {t("stripe.onboarding.bankAccount.infoNote")}
              </Text>
            </View>
          </View>

          {/* Bouton Suivant */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              isSubmitting && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {t("stripe.onboarding.bankAccount.nextButton")}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
