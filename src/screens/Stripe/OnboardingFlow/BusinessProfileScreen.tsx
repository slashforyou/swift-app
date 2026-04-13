/**
 * BusinessProfileScreen - Business profile details for Stripe
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
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
import { ServerData } from "../../../constants/ServerData";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useOnboardingDraft } from "../../../hooks/useOnboardingDraft";
import { useTranslation } from "../../../localization";
import {
    fetchStripeAccount,
    loadDraft,
    submitBusinessProfile,
} from "../../../services/StripeService";
import { authenticatedFetch } from "../../../utils/auth";
import { pickFirst } from "../../../utils/autoFill";
import {
    getFixedNextStep,
    getOnboardingStepMeta,
    resolveBusinessType,
    type StripeOnboardingBusinessType,
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

  const [businessType, setBusinessType] = React.useState<StripeOnboardingBusinessType>("company");
  const stepMeta = getOnboardingStepMeta("BusinessProfile", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const [formData, setFormData] = React.useState<FormData>({
    mcc: "",
    url: "",
    productDescription: "",
  });

  const { saveDraftNow } = useOnboardingDraft("BusinessProfile");
  const formDataRef = React.useRef(formData);
  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  const handleFieldBlur = React.useCallback(() => {
    saveDraftNow(formDataRef.current);
  }, [saveDraftNow]);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pre-fill from draft > Stripe account > company profile
  React.useEffect(() => {
    (async () => {
      try {
        const [draft, stripeData, companyRes] = await Promise.all([
          loadDraft("BusinessProfile").catch(() => null) as Promise<Partial<FormData> | null>,
          fetchStripeAccount().catch(() => null) as Promise<any>,
          authenticatedFetch(
            `${ServerData.serverUrl}v1/companies/me`,
            { method: "GET" },
          ).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        let d: any = {};
        if (companyRes?.success && companyRes?.data) d = companyRes.data;

        // Resolve business type
        const bt = resolveBusinessType(
          stripeData?.business_type || stripeData?.businessType,
          stripeData?.requirements,
        );
        setBusinessType(bt);

        // Stripe account business_profile data
        const bp = stripeData?.business_profile || {};
        setFormData((prev) => ({
          ...prev,
          mcc: pickFirst("", draft?.mcc as string, bp.mcc ? String(bp.mcc) : ""),
          url: pickFirst("", draft?.url as string, bp.url, d.website),
          productDescription: pickFirst("", draft?.productDescription as string, bp.product_description, "Professional moving and relocation services including packing, loading, transportation, and unloading of household and commercial goods."),
        }));
      } catch { /* non-critical */ }
    })();
  }, []);

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
      await fetchStripeAccount();

      // Always go to next sequential step
      const nextStep = getFixedNextStep("BusinessProfile", businessType);
      Keyboard.dismiss();
      navigation.navigate(nextStep);
    } catch (error: any) {
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

  const styles = React.useMemo(() => StyleSheet.create({
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
  }), [colors, insets]);

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
                value={String(formData.mcc ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, mcc: text }));
                  setErrors(prev => ({ ...prev, mcc: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.mccPlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                maxLength={4}
                testID="stripe-businessprofile-mcc"
                onBlur={handleFieldBlur}
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
                value={String(formData.url ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, url: text }));
                  setErrors(prev => ({ ...prev, url: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.urlPlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
                keyboardType="url"
                testID="stripe-businessprofile-url"
                onBlur={handleFieldBlur}
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
                value={String(formData.productDescription ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, productDescription: text }));
                  setErrors(prev => ({ ...prev, productDescription: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.businessProfile.descriptionPlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                testID="stripe-businessprofile-description"
                onBlur={handleFieldBlur}
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
