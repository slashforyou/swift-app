/**
 * PersonalInfoScreen - Étape 1/5 de l'onboarding Stripe
 * Collecte: Prénom, Nom, Date naissance, Email, Téléphone
 */
import DateTimePicker from "@react-native-community/datetimepicker";
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
    submitPersonalInfo,
} from "../../../services/StripeService";
import { authenticatedFetch } from "../../../utils/auth";
import { pickFirst, stripeDobToDate } from "../../../utils/autoFill";
import {
    getFixedNextStep,
    getOnboardingStepMeta,
    resolveBusinessType,
    type StripeOnboardingBusinessType,
} from "./onboardingSteps";

interface PersonalInfoScreenProps {
  navigation: any;
}

interface FormData {
  firstName: string;
  lastName: string;
  dob: Date | null;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  phone?: string;
}

export default function PersonalInfoScreen({
  navigation,
}: PersonalInfoScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [businessType, setBusinessType] = React.useState<StripeOnboardingBusinessType>("company");
  const stepMeta = getOnboardingStepMeta("PersonalInfo", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const [formData, setFormData] = React.useState<FormData>({
    firstName: "",
    lastName: "",
    dob: null,
    email: "",
    phone: "",
  });

  const { saveDraftNow } = useOnboardingDraft("PersonalInfo");
  const formDataRef = React.useRef(formData);
  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  const handleFieldBlur = React.useCallback(() => {
    const d = formDataRef.current;
    saveDraftNow({ ...d, dob: d.dob?.toISOString() ?? null });
  }, [saveDraftNow]);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load draft on mount + pre-fill: draft > Stripe individual > user profile
  const preFillDone = React.useRef(false);
  React.useEffect(() => {
    if (preFillDone.current) return;
    preFillDone.current = true;
    (async () => {
      try {
        // Fetch all data sources in parallel
        const [draft, stripeData, profileRes] = await Promise.all([
          loadDraft("PersonalInfo").catch(() => null) as Promise<Record<string, unknown> | null>,
          fetchStripeAccount().catch(() => null) as Promise<any>,
          authenticatedFetch(`${ServerData.serverUrl}v1/user/profile`, { method: "GET" }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const si = stripeData?.individual || {};
        const prof = profileRes?.data || profileRes || {};

        // Resolve business type from Stripe data
        const bt = resolveBusinessType(
          stripeData?.business_type || stripeData?.businessType,
          stripeData?.requirements,
        );
        setBusinessType(bt);

        setFormData(prev => ({
          ...prev,
          firstName: pickFirst(prev.firstName, draft?.firstName as string, si.first_name, prof?.firstName),
          lastName: pickFirst(prev.lastName, draft?.lastName as string, si.last_name, prof?.lastName),
          email: pickFirst(prev.email, draft?.email as string, si.email, prof?.email),
          phone: pickFirst(prev.phone, draft?.phone as string, si.phone, prof?.phone),
          dob: pickFirst(prev.dob, draft?.dob ? new Date(draft.dob as string) : null, stripeDobToDate(si.dob)),
        }));
      } catch { /* non-critical */ }
    })();
  }, []);

  // Validation email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation téléphone (10 chiffres pour AU)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Validation age minimum (18 ans)
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

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t(
        "stripe.onboarding.personalInfo.errors.firstNameRequired",
      );
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t(
        "stripe.onboarding.personalInfo.errors.lastNameRequired",
      );
    }

    if (!formData.dob) {
      newErrors.dob = t("stripe.onboarding.personalInfo.errors.dobRequired");
    } else if (!validateAge(formData.dob)) {
      newErrors.dob = t("stripe.onboarding.personalInfo.errors.dobMinAge");
    }

    if (!formData.email.trim()) {
      newErrors.email = t(
        "stripe.onboarding.personalInfo.errors.emailRequired",
      );
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("stripe.onboarding.personalInfo.errors.emailInvalid");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t(
        "stripe.onboarding.personalInfo.errors.phoneRequired",
      );
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("stripe.onboarding.personalInfo.errors.phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.personalInfo.errors.validationTitle"),
        t("stripe.onboarding.personalInfo.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {

      // Convertir la date en composantes jour/mois/année
      const dobDate = formData.dob!;
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        dob_day: dobDate.getDate(),
        dob_month: dobDate.getMonth() + 1, // JS months are 0-indexed
        dob_year: dobDate.getFullYear(),
        email: formData.email.trim(),
        phone: `+61${formData.phone.replace(/\s/g, "")}`, // Format: +61xxxxxxxxx
      };


      const currentBusinessType = businessType;

      // Appel API
      const response = await submitPersonalInfo(payload, currentBusinessType);

      // Refresh account to update requirements context
      await fetchStripeAccount();

      // Always go to next sequential step
      const nextStep = getFixedNextStep("PersonalInfo", currentBusinessType);
      Keyboard.dismiss();
      navigation.navigate(nextStep, { personalInfo: { ...formData, dob: formData.dob?.toISOString() ?? null } });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error || "");

      // Detect Stripe permission error (Express account trying to use Custom-only features)
      const isPermissionError =
        error.code === "STRIPE_PERMISSION_DENIED" ||
        errorMessage.includes("required permissions") ||
        error.status === 403;

      console.error("[PersonalInfo] Error:", {
        message: errorMessage,
        raw: error,
      });

      if (isPermissionError) {
        Alert.alert(
          t("stripe.onboarding.errors.permissionDeniedTitle"),
          t("stripe.onboarding.errors.permissionDeniedMessage"),
          [{ text: t("common.ok") }],
        );
      } else {
        Alert.alert(
          t("stripe.onboarding.personalInfo.errors.submissionTitle"),
          errorMessage ||
            t("stripe.onboarding.personalInfo.errors.submissionMessage"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dob: selectedDate }));
      setErrors(prev => ({ ...prev, dob: undefined }));
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR");
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
      backgroundColor: "#635BFF", // Stripe purple
      width: "20%",
    },
    progressText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "right",
    },
    scrollContent: {
      padding: DESIGN_TOKENS.spacing.lg,
      paddingBottom: Math.max(DESIGN_TOKENS.spacing.xl, insets.bottom + 12),
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
    phoneInputContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    phonePrefix: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      marginRight: DESIGN_TOKENS.spacing.sm,
      backgroundColor: colors.border,
    },
    phonePrefixText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
    },
    phoneInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
    },
    helperText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    requiredNote: {
      marginTop: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
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
  }), [colors, insets]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="stripe-personalinfo-screen">
      {/* Header avec retour et étape */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepText}>{stepLabel}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${stepMeta.progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{`${stepMeta.progress}%`}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Titre */}
          <View style={styles.titleSection}>
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.personalInfo.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.personalInfo.subtitle")}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formSection}>
            {/* Prénom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.personalInfo.firstName")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={String(formData.firstName ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, firstName: text }));
                  setErrors(prev => ({ ...prev, firstName: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.personalInfo.firstNamePlaceholder",
                )}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                testID="stripe-personalinfo-firstname"
                onBlur={handleFieldBlur}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            {/* Nom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.personalInfo.lastName")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={String(formData.lastName ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, lastName: text }));
                  setErrors(prev => ({ ...prev, lastName: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.personalInfo.lastNamePlaceholder",
                )}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                testID="stripe-personalinfo-lastname"
                onBlur={handleFieldBlur}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            {/* Date de naissance */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.personalInfo.dob")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  errors.dob && styles.dateButtonError,
                ]}
                onPress={() => setShowDatePicker(true)}
                testID="stripe-personalinfo-dob-btn"
              >
                <Text
                  style={[
                    styles.dateText,
                    !formData.dob && styles.datePlaceholder,
                  ]}
                >
                  {formData.dob
                    ? formatDate(formData.dob)
                    : t("stripe.onboarding.personalInfo.dobPlaceholder")}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
              <Text style={styles.helperText}>
                {t("stripe.onboarding.personalInfo.dobHelper")}
              </Text>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.personalInfo.email")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={String(formData.email ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text }));
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.personalInfo.emailPlaceholder",
                )}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="stripe-personalinfo-email"
                onBlur={handleFieldBlur}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.personalInfo.phone")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+61</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, errors.phone && styles.inputError]}
                  value={String(formData.phone ?? "")}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData(prev => ({ ...prev, phone: cleaned }));
                    setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder={t(
                    "stripe.onboarding.personalInfo.phonePlaceholder",
                  )}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  testID="stripe-personalinfo-phone"
                  onBlur={handleFieldBlur}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
              <Text style={styles.helperText}>
                {t("stripe.onboarding.personalInfo.phoneHelper")}
              </Text>
            </View>

            <Text style={styles.requiredNote}>
              {t("stripe.onboarding.personalInfo.requiredNote")}
            </Text>
          </View>

          {/* Bouton Suivant */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              isSubmitting && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
            testID="stripe-personalinfo-next-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {t("stripe.onboarding.personalInfo.nextButton")}
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
