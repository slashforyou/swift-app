/**
 * RepresentativeScreen - Legal representative details for Stripe
 */
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
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
import { ServerData } from "../../../constants/ServerData";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useOnboardingDraft } from "../../../hooks/useOnboardingDraft";
import { useTranslation } from "../../../localization";
import { lookupPostcode } from "../../../services/abnLookupService";
import {
    fetchStripeAccount,
    loadDraft,
    submitCompanyPersons,
    submitRepresentativeDetails,
} from "../../../services/StripeService";
import { authenticatedFetch } from "../../../utils/auth";
import { pickFirst, stripeDobToDate } from "../../../utils/autoFill";
import {
    getFixedNextStep,
    getOnboardingStepMeta,
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

  // This screen is company-only — hardcode businessType
  const businessType = "company" as const;
  const stepMeta = getOnboardingStepMeta("Representative", businessType);
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
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    title: "",
    owner: false,
    director: false,
    executive: false,
    percentOwnership: "",
  });

  const { saveDraftNow } = useOnboardingDraft("Representative");
  const formDataRef = React.useRef(formData);
  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  const lastLookedUpPostcode = React.useRef("");
  const handleFieldBlur = React.useCallback(() => {
    const d = formDataRef.current;
    saveDraftNow({ ...d, dob: d.dob?.toISOString() ?? null });
  }, [saveDraftNow]);

  // Pre-fill from draft > Stripe account > company profile (runs ONCE)
  const hasPreFilled = React.useRef(false);
  React.useEffect(() => {
    if (hasPreFilled.current) return;
    hasPreFilled.current = true;

    (async () => {
      try {
        const draft = await loadDraft("Representative") as Record<string, unknown>;

        // Fetch Stripe data directly (no hook re-renders)
        let si: any = {};
        let siAddr: any = {};
        let siRel: any = {};
        try {
          const stripeData = await fetchStripeAccount() as any;
          si = stripeData?.individual || {};
          siAddr = si.address || {};
          siRel = si.relationship || {};
        } catch { /* ignore */ }

        // Company profile as fallback source
        let cp: any = {};
        try {
          const response = await authenticatedFetch(
            `${ServerData.serverUrl}v1/companies/me`,
            { method: "GET" },
          );
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data) cp = json.data;
          }
        } catch { /* non-critical */ }

        const newPostalCode = pickFirst("", draft.postalCode as string, siAddr.postal_code, cp.address?.postcode);
        const cleanedPc = (newPostalCode || "").trim();
        if (/^\d{4}$/.test(cleanedPc)) lastLookedUpPostcode.current = cleanedPc;

        setFormData((prev) => ({
          ...prev,
          firstName: pickFirst("", draft.firstName as string, si.first_name, cp.contact_first_name),
          lastName: pickFirst("", draft.lastName as string, si.last_name, cp.contact_last_name),
          email: pickFirst("", draft.email as string, si.email, cp.email),
          phone: pickFirst("", draft.phone as string, si.phone, cp.phone),
          line1: pickFirst("", draft.line1 as string, siAddr.line1, cp.address?.street),
          line2: pickFirst("", draft.line2 as string, siAddr.line2),
          city: pickFirst("", draft.city as string, siAddr.city, cp.address?.suburb),
          state: pickFirst("", draft.state as string, siAddr.state, cp.address?.state),
          postalCode: newPostalCode,
          title: pickFirst("", draft.title as string, siRel.title),
          owner: (draft.owner as boolean) ?? siRel.owner ?? prev.owner,
          director: (draft.director as boolean) ?? siRel.director ?? prev.director,
          executive: (draft.executive as boolean) ?? siRel.executive ?? prev.executive,
          percentOwnership: pickFirst("", draft.percentOwnership as string, siRel.percent_ownership ? String(siRel.percent_ownership) : ""),
          dob: pickFirst(null as Date | null, draft.dob ? new Date(draft.dob as string) : null, stripeDobToDate(si.dob)),
        }));
      } catch { /* ignore pre-fill errors */ }
    })();
  }, []);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showStatePicker, setShowStatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // ── Postcode lookup (called manually on blur, NOT on formData change) ──
  const doPostcodeLookup = React.useCallback(async () => {
    const pc = formDataRef.current.postalCode.trim();
    if (!/^\d{4}$/.test(pc) || pc === lastLookedUpPostcode.current) return;
    if (formDataRef.current.city.trim()) return;

    try {
      const result = await lookupPostcode(pc);
      lastLookedUpPostcode.current = pc;
      if (result.suburb) {
        setFormData((prev) => ({
          ...prev,
          city: prev.city || String(result.suburb || ""),
          state: prev.state || String(result.state || ""),
        }));
      }
    } catch { /* ignore */ }
  }, []);

  // ── Field blur handler — save draft + trigger postcode lookup ──
  const handleFieldBlurWithField = React.useCallback((field?: string) => {
    const d = formDataRef.current;
    saveDraftNow({ ...d, dob: d.dob?.toISOString() ?? null });
    if (field === "postalCode") doPostcodeLookup();
  }, [saveDraftNow, doPostcodeLookup]);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = t(
        "stripe.onboarding.representative.errors.firstNameRequired",
      );
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t(
        "stripe.onboarding.representative.errors.lastNameRequired",
      );
    }

    const dobDate = parseDate(formData.dob);
    if (!dobDate) {
      newErrors.dob = t("stripe.onboarding.representative.errors.dobRequired");
    } else if (!validateAge(dobDate)) {
      newErrors.dob = t("stripe.onboarding.representative.errors.dobMinAge");
    }

    if (!formData.email.trim()) {
      newErrors.email = t(
        "stripe.onboarding.representative.errors.emailRequired",
      );
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t(
        "stripe.onboarding.representative.errors.emailInvalid",
      );
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t(
        "stripe.onboarding.representative.errors.phoneRequired",
      );
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t(
        "stripe.onboarding.representative.errors.phoneInvalid",
      );
    }

    if (!formData.line1.trim()) {
      newErrors.line1 = t(
        "stripe.onboarding.representative.errors.line1Required",
      );
    }

    if (!formData.city.trim()) {
      newErrors.city = t(
        "stripe.onboarding.representative.errors.cityRequired",
      );
    }

    if (!formData.state) {
      newErrors.state = t(
        "stripe.onboarding.representative.errors.stateRequired",
      );
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t(
        "stripe.onboarding.representative.errors.postalCodeRequired",
      );
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t(
        "stripe.onboarding.representative.errors.postalCodeInvalid",
      );
    }

    if (!formData.title.trim()) {
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

      const due: string[] = [];

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
      if (!updatedAccount) {
        navigation.navigate("Review");
        return;
      }

      // Always go to next sequential step
      const nextStep = getFixedNextStep("Representative", businessType);
      Keyboard.dismiss();
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
      setFormData(prev => ({ ...prev, dob: selectedDate }));
      setErrors(prev => ({ ...prev, dob: undefined }));
    }
  };

  const formatDate = (date: Date | null): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return parsed.toLocaleDateString("fr-FR");
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
  }), [colors, insets]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="stripe-representative-screen"
    >
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
                  errors.firstName && styles.inputError,
                ]}
                value={String(formData.firstName ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, firstName: text }));
                  setErrors(prev => ({ ...prev, firstName: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.firstNamePlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
                  errors.lastName && styles.inputError,
                ]}
                value={String(formData.lastName ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, lastName: text }));
                  setErrors(prev => ({ ...prev, lastName: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.lastNamePlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
                ]}
                onPress={() => {
                  setShowDatePicker(true);
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
                  errors.email && styles.inputError,
                ]}
                value={String(formData.email ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text }));
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.emailPlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={handleFieldBlur}
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
                  errors.phone && styles.inputError,
                ]}
                value={String(formData.phone ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, phone: text }));
                  setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.phonePlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                onBlur={handleFieldBlur}
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
                  errors.line1 && styles.inputError,
                ]}
                value={String(formData.line1 ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, line1: text }));
                  setErrors(prev => ({ ...prev, line1: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.line1Placeholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
                value={String(formData.line2 ?? "")}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, line2: text }))
                }
                placeholder={t(
                  "stripe.onboarding.representative.line2Placeholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
                  errors.city && styles.inputError,
                ]}
                value={String(formData.city ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, city: text }));
                  setErrors(prev => ({ ...prev, city: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.cityPlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
              <TouchableOpacity
                style={[
                  styles.pickerContainer,
                  errors.state && styles.pickerContainerError,
                  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: DESIGN_TOKENS.spacing.md, paddingVertical: DESIGN_TOKENS.spacing.sm },
                ]}
                onPress={() => setShowStatePicker(true)}
              >
                <Text style={{ color: formData.state ? colors.text : colors.textSecondary, fontSize: DESIGN_TOKENS.typography.body.fontSize }}>
                  {formData.state
                    ? AUSTRALIAN_STATES.find((s) => s.value === formData.state)?.label || formData.state
                    : t("stripe.onboarding.representative.statePlaceholder")}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <Modal visible={showStatePicker} transparent animationType="slide">
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
                  activeOpacity={1}
                  onPress={() => setShowStatePicker(false)}
                >
                  <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: 400 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: DESIGN_TOKENS.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                        {t("stripe.onboarding.representative.state")}
                      </Text>
                      <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={AUSTRALIAN_STATES}
                      keyExtractor={(item) => item.value}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{ padding: DESIGN_TOKENS.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                          onPress={() => {
                            setFormData((prev) => ({ ...prev, state: item.value }));
                            setErrors((prev) => ({ ...prev, state: undefined }));
                            setTimeout(() => saveDraftNow({ ...formDataRef.current, state: item.value }), 100);
                            setShowStatePicker(false);
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: DESIGN_TOKENS.typography.body.fontSize }}>{item.label}</Text>
                          {formData.state === item.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
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
                value={String(formData.postalCode ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, postalCode: text }));
                  setErrors(prev => ({ ...prev, postalCode: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.postalCodePlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                onBlur={() => handleFieldBlurWithField("postalCode")}
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
                value={String(formData.title ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, title: text }));
                  setErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder={t(
                  "stripe.onboarding.representative.titlePlaceholder",
                )}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={handleFieldBlur}
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
                    <Text style={{ color: colors.text }}>{t("stripe.onboarding.representative.owner")}</Text>
                    <Switch
                      value={formData.owner}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, owner: value }));
                        setErrors(prev => ({ ...prev, relationship: undefined }));
                      }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={{ color: colors.text }}>
                      {t("stripe.onboarding.representative.director")}
                    </Text>
                    <Switch
                      value={formData.director}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, director: value }));
                        setErrors(prev => ({ ...prev, relationship: undefined }));
                      }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={{ color: colors.text }}>
                      {t("stripe.onboarding.representative.executive")}
                    </Text>
                    <Switch
                      value={formData.executive}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, executive: value }));
                        setErrors(prev => ({ ...prev, relationship: undefined }));
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
                      value={String(formData.percentOwnership ?? "")}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, percentOwnership: text }));
                        setErrors(prev => ({
                          ...prev,
                          percentOwnership: undefined,
                        }));
                      }}
                      placeholder={t(
                        "stripe.onboarding.representative.percentOwnershipPlaceholder",
                      )}
                      placeholderTextColor={colors.inputPlaceholder}
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
            testID="stripe-representative-next-btn"
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
