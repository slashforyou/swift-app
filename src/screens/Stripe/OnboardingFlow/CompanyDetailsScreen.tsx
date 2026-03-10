/**
 * CompanyDetailsScreen - Company details for Stripe
 */
import { Picker } from "@react-native-picker/picker";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as SecureStore from "expo-secure-store";
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
    submitCompanyDetails,
} from "../../../services/StripeService";
import {
    getMissingOnboardingSteps,
    getNextOnboardingStep,
    getOnboardingStepMeta,
    resolveBusinessType,
} from "./onboardingSteps";

interface CompanyDetailsScreenProps {
  navigation: any;
}

interface FormData {
  name: string;
  taxId: string;
  companyNumber: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

interface FormErrors {
  name?: string;
  taxId?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

const AUSTRALIAN_STATES = [
  { label: "New South Wales (NSW)", value: "NSW" },
  { label: "Victoria (VIC)", value: "VIC" },
  { label: "Queensland (QLD)", value: "QLD" },
  { label: "South Australia (SA)", value: "SA" },
  { label: "Western Australia (WA)", value: "WA" },
  { label: "Tasmania (TAS)", value: "TAS" },
  { label: "Northern Territory (NT)", value: "NT" },
  { label: "Australian Capital Territory (ACT)", value: "ACT" },
];

export default function CompanyDetailsScreen({
  navigation,
}: CompanyDetailsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const stripeAccount = useStripeAccount();
  const stripeAccountRaw = stripeAccount.account as any;

  const businessType = resolveBusinessType(
    stripeAccountRaw?.business_type || stripeAccountRaw?.businessType,
    stripeAccount.account?.requirements,
  );
  const stepMeta = getOnboardingStepMeta("CompanyDetails", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const testData = __DEV__ ? getStripeTestData() : null;

  const [formData, setFormData] = React.useState<FormData>({
    name: testData?.company.name || "",
    taxId: testData?.company.taxId || "",
    companyNumber: testData?.company.companyNumber || "",
    phone: testData?.company.phone || "",
    line1: testData?.company.address.line1 || "",
    line2: testData?.company.address.line2 || "",
    city: testData?.company.address.city || "",
    state: testData?.company.address.state || "",
    postalCode: testData?.company.address.postalCode || "",
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasAutoSkipped, setHasAutoSkipped] = React.useState(false);

  const companyDetailsCacheKey = "stripe_onboarding_company_details";

  const dueFields = React.useMemo(() => {
    const req = stripeAccount.account?.requirements;
    const due = [...(req?.past_due ?? []), ...(req?.currently_due ?? [])];
    return new Set(due);
  }, [stripeAccount.account?.requirements]);

  const isDue = React.useCallback(
    (key: string) => dueFields.has(key),
    [dueFields],
  );

  const lockIfNotDue = React.useCallback((key: string) => !isDue(key), [isDue]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(companyDetailsCacheKey);
        if (!raw) return;
        const cached = JSON.parse(raw) as Partial<FormData>;
        setFormData((prev) => ({ ...prev, ...cached }));
      } catch {
        // ignore cache errors
      }
    })();
  }, []);

  React.useEffect(() => {
    if (hasAutoSkipped || stripeAccount.loading) return;

    const requirements = stripeAccount.account?.requirements;
    if (!requirements) return;

    const missing = getMissingOnboardingSteps(requirements, businessType).steps;
    if (missing.length > 0 && !missing.includes("CompanyDetails")) {
      const nextStep = getNextOnboardingStep(
        "CompanyDetails",
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

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validatePostalCode = (postalCode: string): boolean => {
    return /^[0-9]{4}$/.test(postalCode);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isDue("company.name") && !formData.name.trim()) {
      newErrors.name = t(
        "stripe.onboarding.companyDetails.errors.nameRequired",
      );
    }

    if (isDue("company.tax_id") && !formData.taxId.trim()) {
      newErrors.taxId = t(
        "stripe.onboarding.companyDetails.errors.taxIdRequired",
      );
    }

    if (isDue("company.phone") && !formData.phone.trim()) {
      newErrors.phone = t(
        "stripe.onboarding.companyDetails.errors.phoneRequired",
      );
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t(
        "stripe.onboarding.companyDetails.errors.phoneInvalid",
      );
    }

    if (!formData.line1.trim()) {
      newErrors.line1 = t(
        "stripe.onboarding.companyDetails.errors.line1Required",
      );
    }

    if (!formData.city.trim()) {
      newErrors.city = t(
        "stripe.onboarding.companyDetails.errors.cityRequired",
      );
    }

    if (!formData.state) {
      newErrors.state = t(
        "stripe.onboarding.companyDetails.errors.stateRequired",
      );
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t(
        "stripe.onboarding.companyDetails.errors.postalCodeRequired",
      );
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t(
        "stripe.onboarding.companyDetails.errors.postalCodeInvalid",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.companyDetails.errors.validationTitle"),
        t("stripe.onboarding.companyDetails.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await SecureStore.setItemAsync(
        companyDetailsCacheKey,
        JSON.stringify(formData),
      );

      const payload = {
        name: formData.name.trim(),
        tax_id: formData.taxId.trim(),
        company_number: formData.companyNumber.trim() || undefined,
        phone: `+61${formData.phone.replace(/\s/g, "")}`,
        address: {
          line1: formData.line1.trim(),
          line2: formData.line2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state,
          postal_code: formData.postalCode.trim(),
        },
      };

      await submitCompanyDetails(payload);
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
        "CompanyDetails",
        updatedAccount.requirements,
        nextBusinessType,
      );
      navigation.navigate(nextStep);
    } catch (error: any) {
      console.error("❌ [CompanyDetails] Error:", error);

      // Detect Stripe permission error (Express account trying to use Custom-only features)
      const isPermissionError =
        error.code === "STRIPE_PERMISSION_DENIED" ||
        error.message?.includes("required permissions") ||
        error.message?.includes("company") ||
        error.status === 403;

      if (isPermissionError) {
        Alert.alert(
          t("stripe.onboarding.errors.permissionDeniedTitle"),
          t("stripe.onboarding.errors.permissionDeniedMessage"),
          [{ text: t("common.ok") }],
        );
      } else {
        Alert.alert(
          t("stripe.onboarding.companyDetails.errors.submissionTitle"),
          error.message ||
            t("stripe.onboarding.companyDetails.errors.submissionMessage"),
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
    inputError: {
      borderColor: "#EF4444",
    },
    inputDisabled: {
      opacity: 0.6,
    },
    errorText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: "#EF4444",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      overflow: "hidden",
    },
    pickerContainerError: {
      borderColor: "#EF4444",
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
    <SafeAreaView style={styles.container} edges={["top"]}>
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
            <Text style={styles.icon}>🏢</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.companyDetails.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.companyDetails.subtitle")}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.name")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("company.name") && styles.inputDisabled,
                  errors.name && styles.inputError,
                ]}
                value={formData.name}
                editable={!lockIfNotDue("company.name")}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  setErrors({ ...errors, name: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.namePlaceholder",
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.taxId")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("company.tax_id") && styles.inputDisabled,
                  errors.taxId && styles.inputError,
                ]}
                value={formData.taxId}
                editable={!lockIfNotDue("company.tax_id")}
                onChangeText={(text) => {
                  setFormData({ ...formData, taxId: text });
                  setErrors({ ...errors, taxId: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.taxIdPlaceholder",
                )}
              />
              {errors.taxId && (
                <Text style={styles.errorText}>{errors.taxId}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.companyNumber")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("company.registration_number") &&
                    styles.inputDisabled,
                ]}
                value={formData.companyNumber}
                editable={!lockIfNotDue("company.registration_number")}
                onChangeText={(text) =>
                  setFormData({ ...formData, companyNumber: text })
                }
                placeholder={t(
                  "stripe.onboarding.companyDetails.companyNumberPlaceholder",
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.phone")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("company.phone") && styles.inputDisabled,
                  errors.phone && styles.inputError,
                ]}
                value={formData.phone}
                editable={!lockIfNotDue("company.phone")}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  setErrors({ ...errors, phone: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.phonePlaceholder",
                )}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.line1")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.line1 && styles.inputError]}
                value={formData.line1}
                onChangeText={(text) => {
                  setFormData({ ...formData, line1: text });
                  setErrors({ ...errors, line1: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.line1Placeholder",
                )}
              />
              {errors.line1 && (
                <Text style={styles.errorText}>{errors.line1}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.line2")}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.line2}
                onChangeText={(text) =>
                  setFormData({ ...formData, line2: text })
                }
                placeholder={t(
                  "stripe.onboarding.companyDetails.line2Placeholder",
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.city")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text });
                  setErrors({ ...errors, city: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.cityPlaceholder",
                )}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.state")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.pickerContainer,
                  errors.state && styles.pickerContainerError,
                ]}
              >
                <Picker
                  selectedValue={formData.state}
                  onValueChange={(value) => {
                    setFormData({ ...formData, state: value });
                    setErrors({ ...errors, state: undefined });
                  }}
                >
                  <Picker.Item
                    label={t(
                      "stripe.onboarding.companyDetails.statePlaceholder",
                    )}
                    value=""
                  />
                  {AUSTRALIAN_STATES.map((item) => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.state && (
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.postalCode")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.postalCode && styles.inputError]}
                value={formData.postalCode}
                onChangeText={(text) => {
                  setFormData({ ...formData, postalCode: text });
                  setErrors({ ...errors, postalCode: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.companyDetails.postalCodePlaceholder",
                )}
                keyboardType="number-pad"
              />
              {errors.postalCode && (
                <Text style={styles.errorText}>{errors.postalCode}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={18} color="white" />
                <Text style={styles.nextButtonText}>
                  {t("stripe.onboarding.companyDetails.nextButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
