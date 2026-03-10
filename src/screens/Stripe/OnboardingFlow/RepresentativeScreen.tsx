/**
 * RepresentativeScreen - Legal representative details for Stripe
 */
import DateTimePicker from "@react-native-community/datetimepicker";
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
    Switch,
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
    submitCompanyPersons,
    submitRepresentativeDetails,
} from "../../../services/StripeService";
import {
    getMissingOnboardingSteps,
    getNextOnboardingStep,
    getOnboardingStepMeta,
    resolveBusinessType,
} from "./onboardingSteps";

interface RepresentativeScreenProps {
  navigation: any;
}

interface FormData {
  firstName: string;
  lastName: string;
  dob: Date | null;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  title: string;
  owner: boolean;
  director: boolean;
  executive: boolean;
  percentOwnership: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  title?: string;
  relationship?: string;
  percentOwnership?: string;
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

export default function RepresentativeScreen({
  navigation,
}: RepresentativeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const stripeAccount = useStripeAccount();
  const stripeAccountRaw = stripeAccount.account as any;

  const businessType = resolveBusinessType(
    stripeAccountRaw?.business_type || stripeAccountRaw?.businessType,
    stripeAccount.account?.requirements,
  );
  const stepMeta = getOnboardingStepMeta("Representative", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const testData = __DEV__ ? getStripeTestData() : null;

  const [formData, setFormData] = React.useState<FormData>({
    firstName: testData?.representative.firstName || "",
    lastName: testData?.representative.lastName || "",
    dob: testData?.representative.dob || null,
    email: testData?.representative.email || "",
    phone: testData?.representative.phone || "",
    line1: testData?.representative.address.line1 || "",
    line2: testData?.representative.address.line2 || "",
    city: testData?.representative.address.city || "",
    state: testData?.representative.address.state || "",
    postalCode: testData?.representative.address.postalCode || "",
    title: testData?.representative.title || "",
    owner: testData?.representative.owner ?? false,
    director: testData?.representative.director ?? false,
    executive: testData?.representative.executive ?? false,
    percentOwnership: testData?.representative.percentOwnership || "",
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasAutoSkipped, setHasAutoSkipped] = React.useState(false);

  const representativeCacheKey = "stripe_onboarding_representative";

  const parseDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

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
        const raw = await SecureStore.getItemAsync(representativeCacheKey);
        if (!raw) return;
        const cached = JSON.parse(raw) as Partial<FormData>;
        const cachedDob = parseDate((cached as any).dob);
        setFormData((prev) => ({
          ...prev,
          ...cached,
          dob: cachedDob ?? prev.dob,
        }));
      } catch {
        // ignore
      }
    })();
  }, []);

  React.useEffect(() => {
    if (hasAutoSkipped || stripeAccount.loading) return;

    const requirements = stripeAccount.account?.requirements;
    if (!requirements) return;

    const missing = getMissingOnboardingSteps(requirements, businessType).steps;
    if (missing.length > 0 && !missing.includes("Representative")) {
      const nextStep = getNextOnboardingStep(
        "Representative",
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateAge = (dob: Date): boolean => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 18;
  };

  const validatePostalCode = (postalCode: string): boolean => {
    return /^[0-9]{4}$/.test(postalCode);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isDue("representative.first_name") && !formData.firstName.trim()) {
      newErrors.firstName = t(
        "stripe.onboarding.representative.errors.firstNameRequired",
      );
    }

    if (isDue("representative.last_name") && !formData.lastName.trim()) {
      newErrors.lastName = t(
        "stripe.onboarding.representative.errors.lastNameRequired",
      );
    }

    if (
      (isDue("representative.dob.day") ||
        isDue("representative.dob.month") ||
        isDue("representative.dob.year")) &&
      !formData.dob
    ) {
      newErrors.dob = t("stripe.onboarding.representative.errors.dobRequired");
    } else if (!validateAge(formData.dob!)) {
      newErrors.dob = t("stripe.onboarding.representative.errors.dobMinAge");
      !parseDate(formData.dob);

      if (isDue("representative.email") && !formData.email.trim()) {
      } else {
        const dobDate = parseDate(formData.dob);
        if (dobDate && !validateAge(dobDate)) {
          newErrors.dob = t(
            "stripe.onboarding.representative.errors.dobMinAge",
          );
        }
      }
      newErrors.email = t(
        "stripe.onboarding.representative.errors.emailInvalid",
      );
    }

    if (isDue("representative.phone") && !formData.phone.trim()) {
      newErrors.phone = t(
        "stripe.onboarding.representative.errors.phoneRequired",
      );
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t(
        "stripe.onboarding.representative.errors.phoneInvalid",
      );
    }

    if (isDue("representative.address.line1") && !formData.line1.trim()) {
      newErrors.line1 = t(
        "stripe.onboarding.representative.errors.line1Required",
      );
    }

    if (isDue("representative.address.city") && !formData.city.trim()) {
      newErrors.city = t(
        "stripe.onboarding.representative.errors.cityRequired",
      );
    }

    if (isDue("representative.address.state") && !formData.state) {
      newErrors.state = t(
        "stripe.onboarding.representative.errors.stateRequired",
      );
    }

    if (
      isDue("representative.address.postal_code") &&
      !formData.postalCode.trim()
    ) {
      newErrors.postalCode = t(
        "stripe.onboarding.representative.errors.postalCodeRequired",
      );
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t(
        "stripe.onboarding.representative.errors.postalCodeInvalid",
      );
    }

    if (isDue("representative.relationship.title") && !formData.title.trim()) {
      newErrors.title = t(
        "stripe.onboarding.representative.errors.titleRequired",
      );
    }

    // Company flow is single-person MVP: roles are auto-derived from Stripe requirements.
    if (businessType !== "company") {
      if (!formData.owner && !formData.director && !formData.executive) {
        newErrors.relationship = t(
          "stripe.onboarding.representative.errors.relationshipRequired",
        );
      }

      if (formData.owner && !formData.percentOwnership.trim()) {
        newErrors.percentOwnership = t(
          "stripe.onboarding.representative.errors.percentOwnershipRequired",
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.representative.errors.validationTitle"),
        t("stripe.onboarding.representative.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await SecureStore.setItemAsync(
        representativeCacheKey,
        JSON.stringify(formData),
      );

      const dobDate = parseDate(formData.dob);
      if (!dobDate) {
        throw new Error(
          t("stripe.onboarding.representative.errors.dobRequired"),
        );
      }
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        dob_day: dobDate.getDate(),
        dob_month: dobDate.getMonth() + 1,
        dob_year: dobDate.getFullYear(),
        email: formData.email.trim(),
        phone: `+61${formData.phone.replace(/\s/g, "")}`,
        address: {
          line1: formData.line1.trim(),
          line2: formData.line2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state,
          postal_code: formData.postalCode.trim(),
        },
        relationship: {
          title: formData.title.trim(),
          owner: formData.owner,
          director: formData.director,
          executive: formData.executive,
          percent_ownership: formData.owner
            ? Number(formData.percentOwnership)
            : undefined,
        },
      };

      const due = [
        ...(stripeAccount.account?.requirements?.past_due ?? []),
        ...(stripeAccount.account?.requirements?.currently_due ?? []),
      ];

      if (businessType === "company") {
        const dobStr = `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`;
        const person = {
          first_name: payload.first_name,
          last_name: payload.last_name,
          dob: dobStr,
          email: payload.email,
          phone: payload.phone,
          // Helps satisfy person_<id>.relationship.title (backend may also default it)
          title: payload.relationship.title || "Director",
          // Single-person MVP: assume 100% ownership when Stripe requires an owner
          percent_ownership: 100,
          address: {
            line1: payload.address.line1,
            line2: payload.address.line2,
            city: payload.address.city,
            state: payload.address.state,
            postal_code: payload.address.postal_code,
          },
        };

        // Backend v3.1 supports idempotent upsert + single_person_mode.
        // To avoid duplicate-person creation, we only send the representative payload.
        await submitCompanyPersons({ representative: person });
      } else {
        await submitRepresentativeDetails(payload);
      }
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
        "Representative",
        updatedAccount.requirements,
        nextBusinessType,
      );
      navigation.navigate(nextStep);
    } catch (error: any) {
      console.error("❌ [Representative] Error:", error);

      // Detect Stripe permission error (Express account trying to use Custom-only features)
      const isPermissionError =
        error.code === "STRIPE_PERMISSION_DENIED" ||
        error.message?.includes("required permissions") ||
        error.status === 403;

      if (isPermissionError) {
        Alert.alert(
          t("stripe.onboarding.errors.permissionDeniedTitle"),
          t("stripe.onboarding.errors.permissionDeniedMessage"),
          [{ text: t("common.ok") }],
        );
      } else {
        Alert.alert(
          t("stripe.onboarding.representative.errors.submissionTitle"),
          error.message ||
            t("stripe.onboarding.representative.errors.submissionMessage"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData({ ...formData, dob: selectedDate });
      setErrors({ ...errors, dob: undefined });
    }
  };

  const formatDate = (date: Date | null): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return parsed.toLocaleDateString("fr-FR");
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
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.backgroundSecondary,
    },
    dateButtonError: {
      borderColor: "#EF4444",
    },
    dateText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
    },
    datePlaceholder: {
      color: colors.textSecondary,
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
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
    },
    relationshipHint: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginTop: DESIGN_TOKENS.spacing.xs,
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
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.representative.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.representative.subtitle")}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.firstName")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.first_name") &&
                    styles.inputDisabled,
                  errors.firstName && styles.inputError,
                ]}
                value={formData.firstName}
                editable={!lockIfNotDue("representative.first_name")}
                onChangeText={(text) => {
                  setFormData({ ...formData, firstName: text });
                  setErrors({ ...errors, firstName: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.firstNamePlaceholder",
                )}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.lastName")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.last_name") &&
                    styles.inputDisabled,
                  errors.lastName && styles.inputError,
                ]}
                value={formData.lastName}
                editable={!lockIfNotDue("representative.last_name")}
                onChangeText={(text) => {
                  setFormData({ ...formData, lastName: text });
                  setErrors({ ...errors, lastName: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.lastNamePlaceholder",
                )}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.dob")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  errors.dob && styles.dateButtonError,
                  lockIfNotDue("representative.dob.day") &&
                    lockIfNotDue("representative.dob.month") &&
                    lockIfNotDue("representative.dob.year") &&
                    styles.inputDisabled,
                ]}
                onPress={() => {
                  const locked =
                    lockIfNotDue("representative.dob.day") &&
                    lockIfNotDue("representative.dob.month") &&
                    lockIfNotDue("representative.dob.year");
                  if (!locked) setShowDatePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.dateText,
                    !formData.dob && styles.datePlaceholder,
                  ]}
                >
                  {formData.dob
                    ? formatDate(formData.dob)
                    : t("stripe.onboarding.representative.dobPlaceholder")}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob || new Date(1990, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.email")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.email") && styles.inputDisabled,
                  errors.email && styles.inputError,
                ]}
                value={formData.email}
                editable={!lockIfNotDue("representative.email")}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  setErrors({ ...errors, email: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.emailPlaceholder",
                )}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.phone")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.phone") && styles.inputDisabled,
                  errors.phone && styles.inputError,
                ]}
                value={formData.phone}
                editable={!lockIfNotDue("representative.phone")}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  setErrors({ ...errors, phone: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.phonePlaceholder",
                )}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.line1")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.address.line1") &&
                    styles.inputDisabled,
                  errors.line1 && styles.inputError,
                ]}
                value={formData.line1}
                editable={!lockIfNotDue("representative.address.line1")}
                onChangeText={(text) => {
                  setFormData({ ...formData, line1: text });
                  setErrors({ ...errors, line1: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.line1Placeholder",
                )}
              />
              {errors.line1 && (
                <Text style={styles.errorText}>{errors.line1}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.line2")}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.line2}
                onChangeText={(text) =>
                  setFormData({ ...formData, line2: text })
                }
                placeholder={t(
                  "stripe.onboarding.representative.line2Placeholder",
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.city")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  lockIfNotDue("representative.address.city") &&
                    styles.inputDisabled,
                  errors.city && styles.inputError,
                ]}
                value={formData.city}
                editable={!lockIfNotDue("representative.address.city")}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text });
                  setErrors({ ...errors, city: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.cityPlaceholder",
                )}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.state")}{" "}
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
                  enabled={!lockIfNotDue("representative.address.state")}
                  onValueChange={(value) => {
                    setFormData({ ...formData, state: value });
                    setErrors({ ...errors, state: undefined });
                  }}
                >
                  <Picker.Item
                    label={t(
                      "stripe.onboarding.representative.statePlaceholder",
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
                {t("stripe.onboarding.representative.postalCode")}{" "}
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
                  "stripe.onboarding.representative.postalCodePlaceholder",
                )}
                keyboardType="number-pad"
              />
              {errors.postalCode && (
                <Text style={styles.errorText}>{errors.postalCode}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.representative.titleLabel")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData({ ...formData, title: text });
                  setErrors({ ...errors, title: undefined });
                }}
                placeholder={t(
                  "stripe.onboarding.representative.titlePlaceholder",
                )}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {businessType !== "company" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t("stripe.onboarding.representative.relationshipTitle")}
                  </Text>
                  <View style={styles.switchRow}>
                    <Text>{t("stripe.onboarding.representative.owner")}</Text>
                    <Switch
                      value={formData.owner}
                      onValueChange={(value) => {
                        setFormData({ ...formData, owner: value });
                        setErrors({ ...errors, relationship: undefined });
                      }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text>
                      {t("stripe.onboarding.representative.director")}
                    </Text>
                    <Switch
                      value={formData.director}
                      onValueChange={(value) => {
                        setFormData({ ...formData, director: value });
                        setErrors({ ...errors, relationship: undefined });
                      }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text>
                      {t("stripe.onboarding.representative.executive")}
                    </Text>
                    <Switch
                      value={formData.executive}
                      onValueChange={(value) => {
                        setFormData({ ...formData, executive: value });
                        setErrors({ ...errors, relationship: undefined });
                      }}
                    />
                  </View>
                  {errors.relationship && (
                    <Text style={styles.errorText}>{errors.relationship}</Text>
                  )}
                </View>

                {formData.owner && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      {t("stripe.onboarding.representative.percentOwnership")}{" "}
                      <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.percentOwnership && styles.inputError,
                      ]}
                      value={formData.percentOwnership}
                      onChangeText={(text) => {
                        setFormData({ ...formData, percentOwnership: text });
                        setErrors({
                          ...errors,
                          percentOwnership: undefined,
                        });
                      }}
                      placeholder={t(
                        "stripe.onboarding.representative.percentOwnershipPlaceholder",
                      )}
                      keyboardType="number-pad"
                    />
                    {errors.percentOwnership && (
                      <Text style={styles.errorText}>
                        {errors.percentOwnership}
                      </Text>
                    )}
                    <Text style={styles.relationshipHint}>
                      {t(
                        "stripe.onboarding.representative.percentOwnershipHint",
                      )}
                    </Text>
                  </View>
                )}
              </>
            )}
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
                  {t("stripe.onboarding.representative.nextButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
