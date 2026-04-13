/**
 * CompanyDetailsScreen - Company details for Stripe
 */
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
import { lookupAbn, lookupPostcode } from "../../../services/abnLookupService";
import {
    fetchStripeAccount,
    loadDraft,
    submitCompanyDetails,
} from "../../../services/StripeService";
import { authenticatedFetch } from "../../../utils/auth";
import { pickFirst } from "../../../utils/autoFill";
import {
    getFixedNextStep,
    getOnboardingStepMeta,
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

  // This screen is company-only — hardcode businessType
  const businessType = "company" as const;
  const stepMeta = getOnboardingStepMeta("CompanyDetails", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const [abnStatus, setAbnStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [gstInfo, setGstInfo] = React.useState<{ registered: boolean; effectiveFrom: string | null } | null>(null);
  const lastLookedUpAbn = React.useRef("");
  const lastLookedUpPostcode = React.useRef("");
  const prefillDone = React.useRef(false);

  const { saveDraftNow } = useOnboardingDraft("CompanyDetails");

  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    taxId: "",
    companyNumber: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Auto-save ref (always tracks latest formData for blur handler)
  const formDataRef = React.useRef<FormData>(formData);
  React.useEffect(() => { formDataRef.current = formData; }, [formData]);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showStatePicker, setShowStatePicker] = React.useState(false);

  // ── ABN lookup (called manually on blur, NOT on formData change) ──
  const doAbnLookup = React.useCallback(async () => {
    const cleaned = formDataRef.current.taxId.replace(/\s/g, "");
    if (!/^\d{11}$/.test(cleaned) || cleaned === lastLookedUpAbn.current) return;

    setAbnStatus("loading");
    try {
      const result = await lookupAbn(cleaned);
      lastLookedUpAbn.current = cleaned;

      if (result.abn_status !== "Active") {
        Alert.alert("ABN Inactive", `This ABN status is: ${result.abn_status}`);
      }

      // Look up city from postcode
      let cityFromPostcode = "";
      const pc = result.address_postcode;
      if (pc && /^\d{4}$/.test(pc)) {
        try {
          const pcResult = await lookupPostcode(pc);
          cityFromPostcode = pcResult.suburb || "";
          lastLookedUpPostcode.current = pc;
        } catch { /* ignore */ }
      }

      setFormData((prev) => ({
        ...prev,
        name: prev.name || result.entity_name || "",
        companyNumber: prev.companyNumber || result.acn || "",
        state: prev.state || result.address_state || "",
        postalCode: prev.postalCode || result.address_postcode || "",
        city: prev.city || cityFromPostcode || "",
      }));
      setGstInfo({ registered: result.gst_registered, effectiveFrom: result.gst_effective_from });
      setAbnStatus("success");
    } catch {
      setAbnStatus("error");
    }
  }, []);

  // ── Postcode lookup (called manually on blur) ──
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

  // ── Field blur handler — save draft + trigger lookups ──
  const handleFieldBlur = React.useCallback((field?: string) => {
    saveDraftNow(formDataRef.current);
    if (field === "taxId") doAbnLookup();
    if (field === "postalCode") doPostcodeLookup();
  }, [saveDraftNow, doAbnLookup, doPostcodeLookup]);

  // ── Pre-fill from draft > company profile (runs ONCE) ──
  React.useEffect(() => {
    if (prefillDone.current) return;
    prefillDone.current = true;

    (async () => {
      try {
        const draft = await loadDraft("CompanyDetails") as Partial<FormData>;

        let d: any = {};
        try {
          const response = await authenticatedFetch(
            `${ServerData.serverUrl}v1/companies/me`,
            { method: "GET" },
          );
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data) d = json.data;
          }
        } catch { /* ignore */ }

        const newTaxId = pickFirst("", draft?.taxId, d.abn);
        const newPostalCode = pickFirst("", draft?.postalCode, d.address?.postcode, d.postcode);

        // Mark as already looked up so blur won't re-trigger
        const cleanedTaxId = (newTaxId || "").replace(/\s/g, "");
        if (/^\d{11}$/.test(cleanedTaxId)) lastLookedUpAbn.current = cleanedTaxId;
        const cleanedPostcode = (newPostalCode || "").trim();
        if (/^\d{4}$/.test(cleanedPostcode)) lastLookedUpPostcode.current = cleanedPostcode;

        setFormData({
          name: pickFirst("", draft?.name, d.name),
          taxId: newTaxId,
          companyNumber: pickFirst("", draft?.companyNumber, d.acn),
          phone: pickFirst("", draft?.phone, d.phone ? d.phone.replace(/^0/, "") : ""),
          line1: pickFirst("", draft?.line1, d.address?.street, d.street_address),
          line2: pickFirst("", draft?.line2),
          city: pickFirst("", draft?.city, d.address?.suburb, d.suburb),
          state: pickFirst("", draft?.state, d.address?.state, d.state),
          postalCode: newPostalCode,
        });
      } catch { /* ignore pre-fill errors */ }
    })();
  }, []);

  // ── Reset ABN status when taxId changes (typing) ──
  const prevTaxId = React.useRef("");
  React.useEffect(() => {
    const cleaned = formData.taxId.replace(/\s/g, "");
    if (cleaned !== prevTaxId.current && abnStatus === "success" && cleaned !== lastLookedUpAbn.current) {
      setAbnStatus("idle");
      setGstInfo(null);
    }
    prevTaxId.current = cleaned;
  }, [formData.taxId, abnStatus]);

  const validatePhone = (phone: string): boolean => {
    return /^[0-9]{9,10}$/.test(phone.replace(/\s/g, ""));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = t("stripe.onboarding.companyDetails.errors.nameRequired");
    if (!formData.taxId.trim()) newErrors.taxId = t("stripe.onboarding.companyDetails.errors.taxIdRequired");
    if (!formData.phone.trim()) {
      newErrors.phone = t("stripe.onboarding.companyDetails.errors.phoneRequired");
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("stripe.onboarding.companyDetails.errors.phoneInvalid");
    }
    if (!formData.line1.trim()) newErrors.line1 = t("stripe.onboarding.companyDetails.errors.line1Required");
    if (!formData.city.trim()) newErrors.city = t("stripe.onboarding.companyDetails.errors.cityRequired");
    if (!formData.state) newErrors.state = t("stripe.onboarding.companyDetails.errors.stateRequired");
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t("stripe.onboarding.companyDetails.errors.postalCodeRequired");
    } else if (!/^[0-9]{4}$/.test(formData.postalCode)) {
      newErrors.postalCode = t("stripe.onboarding.companyDetails.errors.postalCodeInvalid");
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
      await submitCompanyDetails({
        name: formData.name.trim(),
        tax_id: formData.taxId.trim(),
        company_number: formData.companyNumber.trim() || undefined,
        phone: `+61${formData.phone.replace(/\s/g, "").replace(/^0/, "")}`,
        address: {
          line1: formData.line1.trim(),
          line2: formData.line2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state,
          postal_code: formData.postalCode.trim(),
        },
      });
      await fetchStripeAccount();

      const nextStep = getFixedNextStep("CompanyDetails", businessType);
      Keyboard.dismiss();
      navigation.navigate(nextStep);
    } catch (error: any) {
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
          error.message || t("stripe.onboarding.companyDetails.errors.submissionMessage"),
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
    pickerTouchable: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm + 4,
    },
    pickerText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center" as const,
      paddingHorizontal: 24,
    },
    modalContent: {
      borderRadius: 16,
      maxHeight: 420,
      overflow: "hidden" as const,
    },
    modalHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "700" as const,
    },
    modalItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      flex: 1,
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
  }), [colors, insets.bottom]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="stripe-company-screen"
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
                {t("stripe.onboarding.companyDetails.taxId")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={[
                    styles.input,
                    errors.taxId && styles.inputError,
                    abnStatus === "success" && { borderColor: "#22C55E" },
                    abnStatus === "error" && { borderColor: "#EF4444" },
                  ]}
                  value={formData.taxId}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, taxId: text }));
                    setErrors(prev => ({ ...prev, taxId: undefined }));
                  }}
                  placeholder={t("stripe.onboarding.companyDetails.taxIdPlaceholder")}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  maxLength={14}
                  onBlur={() => handleFieldBlur("taxId")}
                />
                {abnStatus === "loading" && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ position: "absolute", right: 12, top: 12 }} />
                )}
                {abnStatus === "success" && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ position: "absolute", right: 12, top: 12 }} />
                )}
                {abnStatus === "error" && (
                  <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ position: "absolute", right: 12, top: 12 }} />
                )}
              </View>
              <Text style={{ fontSize: 11, color: abnStatus === "success" ? "#22C55E" : abnStatus === "error" ? "#EF4444" : colors.textSecondary, marginTop: 4 }}>
                {abnStatus === "success"
                  ? "✓ Business details auto-filled from ABN."
                  : abnStatus === "error"
                    ? "ABN not found. Please check and try again."
                    : "Enter your 11-digit ABN to auto-fill business details."}
              </Text>
              {abnStatus === "success" && gstInfo && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: gstInfo.registered ? "#F0FDF4" : "#FFF7ED" }}>
                  <Ionicons name={gstInfo.registered ? "checkmark-circle" : "information-circle"} size={16} color={gstInfo.registered ? "#16A34A" : "#EA580C"} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: gstInfo.registered ? "#16A34A" : "#EA580C", fontWeight: "500" }}>
                    {gstInfo.registered
                      ? `GST Registered${gstInfo.effectiveFrom ? ` since ${gstInfo.effectiveFrom}` : ""}`
                      : "Not registered for GST"}
                  </Text>
                </View>
              )}
              {errors.taxId && (
                <Text style={styles.errorText}>{errors.taxId}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.name")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError,
                ]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, name: text }));
                  setErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder={t("stripe.onboarding.companyDetails.namePlaceholder")}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={() => handleFieldBlur()}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.companyDetails.companyNumber")}
              </Text>
              <TextInput
                style={[styles.input]}
                value={formData.companyNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, companyNumber: text }))}
                placeholder={t("stripe.onboarding.companyDetails.companyNumberPlaceholder")}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={() => handleFieldBlur()}
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
                  errors.phone && styles.inputError,
                ]}
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, phone: text }));
                  setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                placeholder={t("stripe.onboarding.companyDetails.phonePlaceholder")}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                onBlur={() => handleFieldBlur()}
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
                  setFormData(prev => ({ ...prev, line1: text }));
                  setErrors(prev => ({ ...prev, line1: undefined }));
                }}
                placeholder={t("stripe.onboarding.companyDetails.line1Placeholder")}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={() => handleFieldBlur()}
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
                onChangeText={(text) => setFormData(prev => ({ ...prev, line2: text }))}
                placeholder={t("stripe.onboarding.companyDetails.line2Placeholder")}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={() => handleFieldBlur()}
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
                  setFormData(prev => ({ ...prev, city: text }));
                  setErrors(prev => ({ ...prev, city: undefined }));
                }}
                placeholder={t("stripe.onboarding.companyDetails.cityPlaceholder")}
                placeholderTextColor={colors.inputPlaceholder}
                onBlur={() => handleFieldBlur()}
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
                <TouchableOpacity
                  style={styles.pickerTouchable}
                  onPress={() => setShowStatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      !formData.state && { color: colors.textSecondary },
                    ]}
                  >
                    {formData.state
                      ? AUSTRALIAN_STATES.find((s) => s.value === formData.state)?.label || formData.state
                      : t("stripe.onboarding.companyDetails.statePlaceholder")}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Modal
                visible={showStatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowStatePicker(false)}
                >
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {t("stripe.onboarding.companyDetails.state")}
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
                          style={[
                            styles.modalItem,
                            formData.state === item.value && { backgroundColor: colors.primary + "20" },
                          ]}
                          onPress={() => {
                            setFormData((prev) => ({ ...prev, state: item.value }));
                            setErrors((prev) => ({ ...prev, state: undefined }));
                            setTimeout(() => saveDraftNow({ ...formDataRef.current, state: item.value }), 100);
                            setShowStatePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalItemText,
                              { color: colors.text },
                              formData.state === item.value && { color: colors.primary, fontWeight: "700" },
                            ]}
                          >
                            {item.label}
                          </Text>
                          {formData.state === item.value && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                          )}
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
                {t("stripe.onboarding.companyDetails.postalCode")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.postalCode && styles.inputError]}
                value={formData.postalCode}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, postalCode: text }));
                  setErrors(prev => ({ ...prev, postalCode: undefined }));
                }}
                placeholder={t("stripe.onboarding.companyDetails.postalCodePlaceholder")}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                onBlur={() => handleFieldBlur("postalCode")}
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
            testID="stripe-company-next-btn"
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
