/**
 * DocumentsScreen - Étape 4/6 de l'onboarding Stripe
 * Upload photos ID (recto + verso) via caméra uniquement
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useStripeAccount } from "../../../hooks/useStripe";
import { useTranslation } from "../../../localization";
import {
    fetchStripeAccount,
    uploadDocument,
} from "../../../services/StripeService";
import {
    getMissingOnboardingSteps,
    getNextOnboardingStep,
    getOnboardingStepMeta,
    resolveBusinessType,
} from "./onboardingSteps";

interface DocumentsScreenProps {
  navigation: any;
  route: any;
}

export default function DocumentsScreen({
  navigation,
  route,
}: DocumentsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const stripeAccount = useStripeAccount();

  const businessType = resolveBusinessType(
    stripeAccount.account?.business_type || stripeAccount.account?.businessType,
    stripeAccount.account?.requirements,
  );
  const stepMeta = getOnboardingStepMeta("Documents", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);
  const [documentType, setDocumentType] = React.useState<
    "id_card" | "passport" | "driving_license"
  >("id_card");
  const [hasAutoSkipped, setHasAutoSkipped] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const isUploadingRef = React.useRef(false);
  React.useEffect(() => {
    if (hasAutoSkipped || stripeAccount.loading) return;

    const requirements = stripeAccount.account?.requirements;
    if (!requirements) return;

    const missing = getMissingOnboardingSteps(requirements, businessType).steps;
    if (missing.length > 0 && !missing.includes("Documents")) {
      const nextStep = getNextOnboardingStep(
        "Documents",
        requirements,
        businessType,
      );
      setHasAutoSkipped(true);
      navigation.replace(nextStep, route.params);
    }
  }, [
    businessType,
    hasAutoSkipped,
    navigation,
    route.params,
    stripeAccount.account?.requirements,
    stripeAccount.loading,
  ]);
  // const [isUploading, setIsUploading] = React.useState(false);
  // const [uploadingSide, setUploadingSide] = React.useState<'front' | 'back' | null>(null);

  // Demander permissions caméra
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("stripe.onboarding.documents.errors.permissionTitle"),
        t("stripe.onboarding.documents.errors.permissionMessage"),
      );
      return false;
    }

    return true;
  };

  // Prendre photo avec caméra
  const takePicture = async (side: "front" | "back") => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log(`📸 [Documents] Photo ${side} captured:`, imageUri);

        if (side === "front") {
          setFrontImage(imageUri);
        } else {
          setBackImage(imageUri);
        }
      }
    } catch (error) {
      console.error("[Documents] Error taking picture:", error);
      Alert.alert(
        t("stripe.onboarding.documents.errors.captureTitle"),
        t("stripe.onboarding.documents.errors.captureMessage"),
      );
    }
  };

  const handleNext = async () => {
    if (isUploadingRef.current || isUploading) return;

    if (!frontImage) {
      Alert.alert(
        t("stripe.onboarding.documents.errors.validationTitle"),
        t("stripe.onboarding.documents.errors.validationMessage", {
          defaultValue:
            "Veuillez prendre une photo recto de votre pièce d'identité.",
        }),
      );
      return;
    }

    // Passport doesn't require back image
    if (documentType !== "passport" && !backImage) {
      Alert.alert(
        t("stripe.onboarding.documents.errors.validationTitle"),
        t("stripe.onboarding.documents.errors.backRequired", {
          defaultValue:
            "Veuillez prendre une photo verso de votre pièce d'identité.",
        }),
      );
      return;
    }

    console.log("🚀 [Documents] Uploading documents:", {
      frontImage,
      backImage,
      documentType,
    });

    isUploadingRef.current = true;
    setIsUploading(true);

    try {
      // Upload documents to Stripe
      await uploadDocument(frontImage, documentType, backImage || undefined);

      const updatedAccount = await fetchStripeAccount();
      const nextBusinessType = resolveBusinessType(
        (updatedAccount as any)?.business_type ||
          (updatedAccount as any)?.businessType,
        updatedAccount?.requirements,
      );
      const nextStep = getNextOnboardingStep(
        "Documents",
        updatedAccount?.requirements,
        nextBusinessType,
      );
      const nextParams = {
        personalInfo: route.params?.personalInfo,
        address: route.params?.address,
        bankAccount: route.params?.bankAccount,
        documents: { frontImage, backImage },
      };

      if (nextStep === "Review") {
        navigation.navigate("Review", nextParams);
      } else {
        navigation.navigate(nextStep, nextParams);
      }
    } catch (error: any) {
      console.error("❌ [Documents] Upload error:", error);

      const rawMessage =
        typeof error?.message === "string" ? error.message : String(error);
      const mayAlreadyBeSatisfied =
        rawMessage.includes("already attached") ||
        rawMessage.includes("account is verified");

      if (mayAlreadyBeSatisfied) {
        try {
          const updatedAccount = await fetchStripeAccount();
          const nextBusinessType = resolveBusinessType(
            (updatedAccount as any)?.business_type ||
              (updatedAccount as any)?.businessType,
            updatedAccount?.requirements,
          );
          const nextStep = getNextOnboardingStep(
            "Documents",
            updatedAccount?.requirements,
            nextBusinessType,
          );

          if (nextStep && nextStep !== "Documents") {
            const nextParams = {
              personalInfo: route.params?.personalInfo,
              address: route.params?.address,
              bankAccount: route.params?.bankAccount,
              documents: { frontImage, backImage },
            };

            navigation.navigate(nextStep, nextParams);
            return;
          }
        } catch {
          // Ignore refresh errors; fall through to user-facing alert.
        }
      }

      Alert.alert(
        t("stripe.onboarding.documents.errors.uploadTitle"),
        error.message || t("stripe.onboarding.documents.errors.uploadMessage"),
      );
    } finally {
      setIsUploading(false);
      isUploadingRef.current = false;
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
      width: "80%",
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
    documentsSection: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    documentCard: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
    },
    documentHeader: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    imageContainer: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.backgroundTertiary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    documentImage: {
      width: "100%",
      height: "100%",
    },
    placeholderContent: {
      alignItems: "center",
    },
    placeholderIcon: {
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    placeholderText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    cameraButton: {
      backgroundColor: "#635BFF", // Stripe purple
      borderRadius: 8,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraButtonText: {
      color: "#FFFFFF",
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
    retakeButton: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    retakeButtonText: {
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
    checklistSection: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: "#FFF7ED", // Light orange
      borderLeftWidth: 4,
      borderLeftColor: "#F97316", // Orange
      borderRadius: 8,
    },
    checklistTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: "#9A3412", // Dark orange
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    checklistItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    checklistIcon: {
      marginRight: DESIGN_TOKENS.spacing.xs,
    },
    checklistText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: "#9A3412",
      lineHeight: DESIGN_TOKENS.typography.body.fontSize * 1.4,
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
      backgroundColor: colors.border,
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginRight: DESIGN_TOKENS.spacing.xs,
    },
    nextButtonTextDisabled: {
      color: colors.textSecondary,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.lg,
    },
    loadingCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: DESIGN_TOKENS.spacing.lg,
      alignItems: "center",
    },
    loadingText: {
      marginTop: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      textAlign: "center",
      fontWeight: "600",
    },
  });

  const canProceed = Boolean(
    frontImage && (documentType === "passport" ? true : backImage),
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="stripe-documents-screen"
    >
      {/* Header avec retour et étape */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isUploading}
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>📸</Text>
          <Text style={styles.title}>
            {t("stripe.onboarding.documents.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("stripe.onboarding.documents.subtitle")}
          </Text>
        </View>

        {/* Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>
            {t("stripe.onboarding.documents.checklistTitle")}
          </Text>
          <View style={styles.checklistItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#F97316"
              style={styles.checklistIcon}
            />
            <Text style={styles.checklistText}>
              {t("stripe.onboarding.documents.checklist1")}
            </Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#F97316"
              style={styles.checklistIcon}
            />
            <Text style={styles.checklistText}>
              {t("stripe.onboarding.documents.checklist2")}
            </Text>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.documentsSection}>
          {/* Recto */}
          <View style={styles.documentCard}>
            <Text style={styles.documentHeader}>
              {t("stripe.onboarding.documents.frontTitle")}
            </Text>
            <View style={styles.imageContainer}>
              {frontImage ? (
                <Image
                  source={{ uri: frontImage }}
                  style={styles.documentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderContent}>
                  <Ionicons
                    name="card-outline"
                    size={48}
                    color={colors.textSecondary}
                    style={styles.placeholderIcon}
                  />
                  <Text style={styles.placeholderText}>
                    {t("stripe.onboarding.documents.frontPlaceholder")}
                  </Text>
                </View>
              )}
            </View>
            {frontImage ? (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => takePicture("front")}
                disabled={isUploading}
                testID="stripe-documents-front-retake-btn"
              >
                <Ionicons name="refresh" size={20} color={colors.text} />
                <Text style={styles.retakeButtonText}>
                  {t("stripe.onboarding.documents.retakeButton")}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => takePicture("front")}
                disabled={isUploading}
                testID="stripe-documents-front-btn"
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.cameraButtonText}>
                  {t("stripe.onboarding.documents.takePhotoButton")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verso */}
          <View style={styles.documentCard}>
            <Text style={styles.documentHeader}>
              {t("stripe.onboarding.documents.backTitle")}
            </Text>
            <View style={styles.imageContainer}>
              {backImage ? (
                <Image
                  source={{ uri: backImage }}
                  style={styles.documentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderContent}>
                  <Ionicons
                    name="card-outline"
                    size={48}
                    color={colors.textSecondary}
                    style={styles.placeholderIcon}
                  />
                  <Text style={styles.placeholderText}>
                    {t("stripe.onboarding.documents.backPlaceholder")}
                  </Text>
                </View>
              )}
            </View>
            {backImage ? (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => takePicture("back")}
                disabled={isUploading}
                testID="stripe-documents-back-retake-btn"
              >
                <Ionicons name="refresh" size={20} color={colors.text} />
                <Text style={styles.retakeButtonText}>
                  {t("stripe.onboarding.documents.retakeButton")}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => takePicture("back")}
                disabled={isUploading}
                testID="stripe-documents-back-btn"
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.cameraButtonText}>
                  {t("stripe.onboarding.documents.takePhotoButton")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bouton Suivant */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!canProceed || isUploading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed || isUploading}
          testID="stripe-documents-next-btn"
        >
          <Text
            style={[
              styles.nextButtonText,
              (!canProceed || isUploading) && styles.nextButtonTextDisabled,
            ]}
          >
            {t("stripe.onboarding.documents.nextButton")}
          </Text>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons
              name="arrow-forward"
              size={20}
              color={canProceed ? "#FFFFFF" : colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      </ScrollView>

      {isUploading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={styles.loadingText}>
              {t("stripe.onboarding.documents.uploading", {
                defaultValue: "Envoi en cours...",
              })}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
