/**
 * AddressScreen - Étape 2/5 de l'onboarding Stripe
 * Collecte: Adresse ligne 1, ligne 2 (optionnel), Ville, État, Code postal
 */
import { Picker } from "@react-native-picker/picker";
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
import { submitAddress } from "../../../services/StripeService";

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
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState<FormData>({
    line1: __DEV__ ? "123 George Street" : "",
    line2: __DEV__ ? "Apartment 4B" : "",
    city: __DEV__ ? "Sydney" : "",
    state: __DEV__ ? "NSW" : "",
    postalCode: __DEV__ ? "2000" : "",
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
      console.log("🏠 [Address] Submitting data to API...");

      const payload = {
        line1: formData.line1.trim(),
        line2: formData.line2?.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state,
        postal_code: formData.postalCode.trim(),
      };

      const response = await submitAddress(payload);
      console.log("✅ [Address] Success! Progress:", response.progress);

      navigation.navigate("BankAccount", {
        personalInfo: route.params.personalInfo,
        address: formData,
      });
    } catch (error: any) {
      console.error("❌ [Address] Error:", error);
      Alert.alert(
        t("stripe.onboarding.address.errors.submissionTitle"),
        error.message ||
          t("stripe.onboarding.address.errors.submissionMessage"),
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
    },
    pickerContainerError: {
      borderColor: "#EF4444",
    },
    picker: {
      color: colors.text,
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
          {t("stripe.onboarding.address.step")}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>40%</Text>
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
                value={formData.line1}
                onChangeText={(text) => {
                  setFormData({ ...formData, line1: text });
                  setErrors({ ...errors, line1: undefined });
                }}
                placeholder={t("stripe.onboarding.address.line1Placeholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
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
                value={formData.line2}
                onChangeText={(text) =>
                  setFormData({ ...formData, line2: text })
                }
                placeholder={t("stripe.onboarding.address.line2Placeholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
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
                value={formData.city}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text });
                  setErrors({ ...errors, city: undefined });
                }}
                placeholder={t("stripe.onboarding.address.cityPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
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
                    style={styles.picker}
                  >
                    <Picker.Item
                      label={t("stripe.onboarding.address.statePlaceholder")}
                      value=""
                    />
                    {AUSTRALIAN_STATES.map((state) => (
                      <Picker.Item
                        key={state.value}
                        label={state.label}
                        value={state.value}
                      />
                    ))}
                  </Picker>
                </View>
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
                  value={formData.postalCode}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, postalCode: cleaned });
                    setErrors({ ...errors, postalCode: undefined });
                  }}
                  placeholder={t(
                    "stripe.onboarding.address.postalCodePlaceholder",
                  )}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
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
    </SafeAreaView>
  );
}
