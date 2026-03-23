/**
 * BusinessProfileScreen - Business profile details for Stripe
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getStripeTestData } from "../../../config/stripeTestData";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useStripeAccount } from "../../../hooks/useStripe";
import { useTranslation } from "../../../localization";
import {
    fetchStripeAccount,
    submitBusinessProfile,
} from "../../../services/StripeService";
import {
    getMissingOnboardingSteps,
    getNextOnboardingStep,
    getOnboardingStepMeta,
    resolveBusinessType,
} from "./onboardingSteps";

interface BusinessProfileScreenProps {
  navigation: any;
}

interface FormData {
  mcc: string;
  url: string;
  productDescription: string;
}

interface FormErrors {
  mcc?: string;
  url?: string;
  productDescription?: string;
}

export default function BusinessProfileScreen({
  navigation,
}: BusinessProfileScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const stripeAccount = useStripeAccount();
  const stripeAccountRaw = stripeAccount.account as any;

  const businessType = resolveBusinessType(
    stripeAccountRaw?.business_type || stripeAccountRaw?.businessType,
    stripeAccount.account?.requirements,
  );
  const stepMeta = getOnboardingStepMeta("BusinessProfile", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const testData = __DEV__ ? getStripeTestData() : null;

  const [formData, setFormData] = React.useState<FormData>({
    mcc: testData?.businessProfile.mcc || "",
    url: testData?.businessProfile.url || "",
    productDescription: testData?.businessProfile.productDescription || "",
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasAutoSkipped, setHasAutoSkipped] = React.useState(false);

  React.useEffect(() => {
    if (hasAutoSkipped || stripeAccount.loading) return;

    const requirements = stripeAccount.account?.requirements;
    if (!requirements) return;

    const missing = getMissingOnboardingSteps(requirements, businessType).steps;
    if (missing.length > 0 && !missing.includes("BusinessProfile")) {
      const nextStep = getNextOnboardingStep(
        "BusinessProfile",
        requirements,
        businessType,
      );
      setHasAutoSkipped(true);
      navigation.replace(nextStep);
    }
  }, [
    businessType,
    hasAutoSkipped,
    navigation,
    stripeAccount.account?.requirements,
    stripeAccount.loading,
  ]);

  const validateUrl = (url: string): boolean => {
    return url.trim().length > 0;
  };

  const validateMcc = (mcc: string): boolean => {
    return /^[0-9]{4}$/.test(mcc.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.mcc.trim()) {
      newErrors.mcc = t("stripe.onboarding.businessProfile.errors.mccRequired");
    } else if (!validateMcc(formData.mcc)) {
      newErrors.mcc = t("stripe.onboarding.businessProfile.errors.mccInvalid");
    }

    if (!formData.url.trim()) {
      newErrors.url = t("stripe.onboarding.businessProfile.errors.urlRequired");
    } else if (!validateUrl(formData.url)) {
      newErrors.url = t("stripe.onboarding.businessProfile.errors.urlInvalid");
    }

    if (!formData.productDescription.trim()) {
      newErrors.productDescription = t(
        "stripe.onboarding.businessProfile.errors.descriptionRequired",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.businessProfile.errors.validationTitle"),
        t("stripe.onboarding.businessProfile.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        mcc: formData.mcc.trim(),
        url: formData.url.trim(),
        product_description: formData.productDescription.trim(),
      };

      await submitBusinessProfile(payload);
      const updatedAccount = await fetchStripeAccount();
      const updatedAccountRaw = updatedAccount as any;
      if (!updatedAccount) {
        navigation.navigate("Review");
        return;
      }
      const nextBusinessType = resolveBusinessType(
        updatedAccountRaw?.business_type || updatedAccountRaw?.businessType,
        updatedAccount.requirements,
      );
      const nextStep = getNextOnboardingStep(
        "BusinessProfile",
        updatedAccount.requirements,
        nextBusinessType,
      );
      navigation.navigate(nextStep);
    } catch (error: any) {
      console.error("❌ [BusinessProfile] Error:", error);

      // Detect Stripe permission error (Express account trying to use Custom-only features)
      const isPermissionError =
        error.code === "STRIPE_PERMISSION_DENIED" ||
        error.message?.includes("required permissions") ||
        error.message?.includes("business_profile") ||
        error.status === 403;

      if (isPermissionError) {
        Alert.alert(
          t("stripe.onboarding.errors.permissionDeniedTitle"),
          t("stripe.onboarding.errors.permissionDeniedMessage"),
          [{ text: t("common.ok") }],
        );
      } else {
        Alert.alert(
          t("stripe.onboarding.businessProfile.errors.submissionTitle"),
          error.message ||
            t("stripe.onboarding.businessProfile.errors.submissionMessage"),
        );
      }
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
      backgroundColor: "#635BFF",
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
    textArea: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    inputError: {
      borderColor: "#EF4444",
    },
    errorText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: "#EF4444",
    },
    buttonContainer: {
      padding: DESIGN_TOKENS.spacing.lg,
      paddingBottom: Math.max(DESIGN_TOKENS.spacing.lg, insets.bottom + 12),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    nextButton: {
      backgroundColor: colors.primary,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    nextButtonText: {
      color: "white",
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="stripe-businessprofile-screen">
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepText}>{stepLabel}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${stepMeta.progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{`${stepMeta.progress}%`}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.icon}>🏷️</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.businessProfile.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.businessProfile.subtitle")}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.businessProfile.mcc")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.mcc && styles.inputError]}
                value={formData.mcc}
                onChangeText={(text) => {
                  setFormData({ ...formData, mcc: text });
                  setErrors({ ...errors, mcc: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.mccPlaceholder",
                )}
                keyboardType="number-pad"
                maxLength={4}
                testID="stripe-businessprofile-mcc"
              />
              {errors.mcc && <Text style={styles.errorText}>{errors.mcc}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.businessProfile.url")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.url && styles.inputError]}
                value={formData.url}
                onChangeText={(text) => {
                  setFormData({ ...formData, url: text });
                  setErrors({ ...errors, url: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.urlPlaceholder",
                )}
                autoCapitalize="none"
                keyboardType="url"
                testID="stripe-businessprofile-url"
              />
              {errors.url && <Text style={styles.errorText}>{errors.url}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.businessProfile.description")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.productDescription && styles.inputError,
                ]}
                value={formData.productDescription}
                onChangeText={(text) => {
                  setFormData({ ...formData, productDescription: text });
                  setErrors({ ...errors, productDescription: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.descriptionPlaceholder",
                )}
                multiline
                testID="stripe-businessprofile-description"
              />
              {errors.productDescription && (
                <Text style={styles.errorText}>
                  {errors.productDescription}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isSubmitting}
            testID="stripe-businessprofile-next-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={18} color="white" />
                <Text style={styles.nextButtonText}>
                  {t("stripe.onboarding.businessProfile.nextButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
