/**
 * AddressScreen - Étape 3 de l'onboarding Stripe
 * Collecte: Adresse ligne 1, ligne 2 (optionnel), Ville, État, Code postal
 *
 * Radical rewrite: no native Picker, no useStripeAccount/useUserProfile hooks,
 * postcode lookup onBlur only, StyleSheet in useMemo.
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
import { lookupPostcode } from "../../../services/abnLookupService";
import {
    fetchStripeAccount,
    loadDraft,
    submitAddress,
} from "../../../services/StripeService";
import { authenticatedFetch } from "../../../utils/auth";
import { pickFirst } from "../../../utils/autoFill";
import {
    getFixedNextStep,
    getOnboardingStepMeta,
    resolveBusinessType,
} from "./onboardingSteps";

interface AddressScreenProps {
  navigation: any;
  route: any;
}

interface FormData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

interface FormErrors {
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

export default function AddressScreen({
  navigation,
  route,
}: AddressScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Business type: fetched inline during pre-fill, default "company"
  const [businessType, setBusinessType] = React.useState<"individual" | "company">("company");
  const stepMeta = getOnboardingStepMeta("Address", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const [formData, setFormData] = React.useState<FormData>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const { saveDraftNow } = useOnboardingDraft("Address");
  const formDataRef = React.useRef(formData);
  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  const handleFieldBlur = React.useCallback(() => {
    saveDraftNow(formDataRef.current as unknown as Record<string, unknown>);
  }, [saveDraftNow]);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showStatePicker, setShowStatePicker] = React.useState(false);
  const lastLookedUpPostcode = React.useRef<string>("");

  // Pre-fill from draft > Stripe account > company profile (all fetched inline)
  React.useEffect(() => {
    (async () => {
      try {
        const draft = await loadDraft("Address") as Partial<FormData>;

        const response = await authenticatedFetch(
          `${ServerData.serverUrl}v1/companies/me`,
          { method: "GET" },
        );
        let d: any = {};
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) d = json.data;
        }

        let sa: any = {};
        let bt: "individual" | "company" = "company";
        try {
          const raw = await fetchStripeAccount();
          const rawAny = raw as any;
          bt = resolveBusinessType(rawAny?.business_type, rawAny?.requirements);
          sa = rawAny?.individual?.address || rawAny?.company?.address || {};
        } catch { /* ignore */ }
        setBusinessType(bt);

        const filled: FormData = {
          line1: pickFirst("", draft?.line1 as string, sa.line1, d.address?.street, d.street_address),
          line2: pickFirst("", draft?.line2 as string, sa.line2),
          city: pickFirst("", draft?.city as string, sa.city, d.address?.suburb, d.suburb),
          state: pickFirst("", draft?.state as string, sa.state, d.address?.state, d.state),
          postalCode: pickFirst("", draft?.postalCode as string, sa.postal_code, d.address?.postcode, d.postcode),
        };

        // Mark postcode as already looked up if pre-filled (avoid auto-lookup on blur)
        if (filled.postalCode) lastLookedUpPostcode.current = filled.postalCode;

        setFormData(filled);
      } catch { /* non-critical */ }
    })();
  }, []);

  // Postcode lookup — onBlur only, no reactive useEffect
  const handlePostcodeBlur = React.useCallback(async () => {
    handleFieldBlur();
    const pc = formDataRef.current.postalCode.trim();
    if (!/^\d{4}$/.test(pc) || pc === lastLookedUpPostcode.current) return;
    // Only auto-fill city/state if they're empty
    if (formDataRef.current.city.trim() && formDataRef.current.state.trim()) return;
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
  }, [handleFieldBlur]);

  // Validation code postal australien (4 chiffres)
  const validatePostalCode = (postalCode: string): boolean => {
    const postalCodeRegex = /^[0-9]{4}$/;
    return postalCodeRegex.test(postalCode);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.line1.trim()) {
      newErrors.line1 = t("stripe.onboarding.address.errors.line1Required");
    }

    if (!formData.city.trim()) {
      newErrors.city = t("stripe.onboarding.address.errors.cityRequired");
    }

    if (!formData.state) {
      newErrors.state = t("stripe.onboarding.address.errors.stateRequired");
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t(
        "stripe.onboarding.address.errors.postalCodeRequired",
      );
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t(
        "stripe.onboarding.address.errors.postalCodeInvalid",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert(
        t("stripe.onboarding.address.errors.validationTitle"),
        t("stripe.onboarding.address.errors.validationMessage"),
      );
      return;
    }

    setIsSubmitting(true);

    try {

      const payload = {
        line1: formData.line1.trim(),
        line2: formData.line2?.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state,
        postal_code: formData.postalCode.trim(),
      };

      await submitAddress(payload, businessType);

      // Refresh account to update requirements context
      const updatedAccount = await fetchStripeAccount();
      const acct = updatedAccount as any;
      const nextBusinessType = resolveBusinessType(
        acct?.business_type,
        acct?.requirements,
      );

      // Always go to next sequential step
      const nextStep = getFixedNextStep("Address", nextBusinessType);
      Keyboard.dismiss();
      navigation.navigate(nextStep, {
        personalInfo: route.params?.personalInfo,
        address: formData,
      });
    } catch (error: any) {
      console.error("❌ [Address] Error:", error);

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
          t("stripe.onboarding.address.errors.submissionTitle"),
          error.message ||
            t("stripe.onboarding.address.errors.submissionMessage"),
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
      backgroundColor: "#635BFF", // Stripe purple
      width: "40%",
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
    optional: {
      color: colors.textSecondary,
      fontWeight: "400",
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm + 4,
    },
    pickerContainerError: {
      borderColor: "#EF4444",
    },
    pickerText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    modalContent: {
      borderRadius: 16,
      maxHeight: 420,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "700",
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      flex: 1,
    },
    twoColumnRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    halfWidth: {
      flex: 1,
    },
    helperText: {
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    statesInfo: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      padding: DESIGN_TOKENS.spacing.sm,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 8,
    },
    statesInfoText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      lineHeight: DESIGN_TOKENS.typography.caption.fontSize * 1.4,
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
  }), [colors, insets.bottom]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="stripe-address-screen"
    >
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
            <Text style={styles.icon}>🏠</Text>
            <Text style={styles.title}>
              {t("stripe.onboarding.address.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("stripe.onboarding.address.subtitle")}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formSection}>
            {/* Adresse ligne 1 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.address.line1")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.line1 && styles.inputError]}
                value={String(formData.line1 ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, line1: text }));
                  setErrors(prev => ({ ...prev, line1: undefined }));
                }}
                placeholder={t("stripe.onboarding.address.line1Placeholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                testID="stripe-address-line1"
                onBlur={handleFieldBlur}
              />
              {errors.line1 && (
                <Text style={styles.errorText}>{errors.line1}</Text>
              )}
            </View>

            {/* Adresse ligne 2 (optionnel) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.address.line2")}{" "}
                <Text style={styles.optional}>(optionnel)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={String(formData.line2 ?? "")}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, line2: text }))
                }
                placeholder={t("stripe.onboarding.address.line2Placeholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                testID="stripe-address-line2"
                onBlur={handleFieldBlur}
              />
              <Text style={styles.helperText}>
                {t("stripe.onboarding.address.line2Helper")}
              </Text>
            </View>

            {/* Ville */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("stripe.onboarding.address.city")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={String(formData.city ?? "")}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, city: text }));
                  setErrors(prev => ({ ...prev, city: undefined }));
                }}
                placeholder={t("stripe.onboarding.address.cityPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                testID="stripe-address-city"
                onBlur={handleFieldBlur}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            {/* État + Code postal (2 colonnes) */}
            <View style={styles.twoColumnRow}>
              {/* État */}
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>
                  {t("stripe.onboarding.address.state")}{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pickerContainer,
                    errors.state && styles.pickerContainerError,
                  ]}
                  onPress={() => setShowStatePicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.state && { color: colors.textSecondary }]}>
                    {formData.state
                      ? AUSTRALIAN_STATES.find((s) => s.value === formData.state)?.label || formData.state
                      : t("stripe.onboarding.address.statePlaceholder")}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {errors.state && (
                  <Text style={styles.errorText}>{errors.state}</Text>
                )}
              </View>

              {/* Code postal */}
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>
                  {t("stripe.onboarding.address.postalCode")}{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.postalCode && styles.inputError]}
                  value={String(formData.postalCode ?? "")}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData(prev => ({ ...prev, postalCode: cleaned }));
                    setErrors(prev => ({ ...prev, postalCode: undefined }));
                  }}
                  placeholder={t(
                    "stripe.onboarding.address.postalCodePlaceholder",
                  )}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
                  testID="stripe-address-postalcode"
                  onBlur={handlePostcodeBlur}
                />
                {errors.postalCode && (
                  <Text style={styles.errorText}>{errors.postalCode}</Text>
                )}
              </View>
            </View>

            {/* Info États disponibles */}
            <View style={styles.statesInfo}>
              <Text style={styles.statesInfoText}>
                {t("stripe.onboarding.address.statesAvailable")}
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
            testID="stripe-address-next-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {t("stripe.onboarding.address.nextButton")}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
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
                {t("stripe.onboarding.address.state")}
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
    </SafeAreaView>
  );
}
