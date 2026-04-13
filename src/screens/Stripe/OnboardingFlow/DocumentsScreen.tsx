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
    Keyboard,
    Modal,
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
import { useTranslation } from "../../../localization";
import {
    fetchStripeAccount,
    uploadCompanyDocument,
    uploadDocument,
} from "../../../services/StripeService";
import {
    getOnboardingStepMeta,
    resolveBusinessType,
    type StripeOnboardingBusinessType,
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

  const [businessType, setBusinessType] = React.useState<StripeOnboardingBusinessType>("company");
  const stepMeta = getOnboardingStepMeta("Documents", businessType);
  const stepLabel = t("stripe.onboarding.stepLabel", {
    current: stepMeta.index + 1,
    total: stepMeta.total,
  });

  // Fetch business type + check if company doc needed on mount
  const [companyDocNeeded, setCompanyDocNeeded] = React.useState(false);
  const [isReUpload, setIsReUpload] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        const stripeData = await fetchStripeAccount() as any;
        if (stripeData) {
          const bt = resolveBusinessType(
            stripeData.business_type || stripeData.businessType,
            stripeData.requirements,
          );
          setBusinessType(bt);
          // If details_submitted is true, this is a re-upload from the restricted banner
          if (stripeData.details_submitted) {
            setIsReUpload(true);
          }
          // Check if company.verification.document is in currently_due or past_due
          const currentlyDue: string[] = stripeData.requirements?.currently_due || [];
          const pastDue: string[] = stripeData.requirements?.past_due || [];
          const allDue = [...currentlyDue, ...pastDue];
          if (allDue.some((r: string) => r.includes("company.verification.document"))) {
            setCompanyDocNeeded(true);
          }
        }
      } catch { /* non-critical */ }
    })();
  }, []);

  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);
  const [companyDocImage, setCompanyDocImage] = React.useState<string | null>(null);
  const [documentType, setDocumentType] = React.useState<
    "id_card" | "passport" | "driving_license"
  >("id_card");
  const [isUploading, setIsUploading] = React.useState(false);
  const isUploadingRef = React.useRef(false);

  // Modal state for camera/gallery picker
  const [pickerModalVisible, setPickerModalVisible] = React.useState(false);
  const [pickerModalAction, setPickerModalAction] = React.useState<
    { type: "id"; side: "front" | "back" } | { type: "company" } | null
  >(null);

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

  // Launch camera for ID document
  const launchIdCamera = async (side: "front" | "back") => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        if (side === "front") {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch {
      Alert.alert(
        t("stripe.onboarding.documents.errors.captureTitle"),
        t("stripe.onboarding.documents.errors.captureMessage"),
      );
    }
  };

  // Pick from gallery for ID document
  const launchIdGallery = async (side: "front" | "back") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("stripe.onboarding.documents.errors.permissionTitle"),
          t("stripe.onboarding.documents.errors.permissionMessage"),
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        if (side === "front") {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch {
      Alert.alert(
        t("stripe.onboarding.documents.errors.captureTitle"),
        t("stripe.onboarding.documents.errors.captureMessage"),
      );
    }
  };

  // Open modal for camera/gallery choice for ID document
  const takePicture = (side: "front" | "back") => {
    setPickerModalAction({ type: "id", side });
    setPickerModalVisible(true);
  };

  // Take or pick photo for company document (camera or gallery)
  const launchCompanyCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setCompanyDocImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        t("stripe.onboarding.documents.errors.captureTitle"),
        t("stripe.onboarding.documents.errors.captureMessage"),
      );
    }
  };

  const launchCompanyGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("stripe.onboarding.documents.errors.permissionTitle"),
          t("stripe.onboarding.documents.errors.permissionMessage"),
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setCompanyDocImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        t("stripe.onboarding.documents.errors.captureTitle"),
        t("stripe.onboarding.documents.errors.captureMessage"),
      );
    }
  };

  const takeCompanyDocPicture = () => {
    setPickerModalAction({ type: "company" });
    setPickerModalVisible(true);
  };

  const handlePickerChoice = (choice: "camera" | "gallery") => {
    setPickerModalVisible(false);
    // Small delay to let modal close before launching picker
    setTimeout(() => {
      if (!pickerModalAction) return;
      if (pickerModalAction.type === "id") {
        if (choice === "camera") launchIdCamera(pickerModalAction.side);
        else launchIdGallery(pickerModalAction.side);
      } else {
        if (choice === "camera") launchCompanyCamera();
        else launchCompanyGallery();
      }
    }, 300);
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

    // Company doc required if flagged
    if (companyDocNeeded && !companyDocImage) {
      Alert.alert(
        t("stripe.onboarding.documents.errors.validationTitle"),
        t("stripe.onboarding.documents.companyDocRequired"),
      );
      return;
    }


    isUploadingRef.current = true;
    setIsUploading(true);

    try {
      // Upload person identity documents to Stripe
      await uploadDocument(frontImage, documentType, backImage || undefined);

      // Upload company verification document if needed
      if (companyDocNeeded && companyDocImage) {
        await uploadCompanyDocument(companyDocImage);
      }

      await fetchStripeAccount();

      Keyboard.dismiss();

      // If re-uploading after onboarding is already complete, go back instead of Review
      if (isReUpload) {
        Alert.alert(
          t("stripe.onboarding.documents.reuploadSuccessTitle", { defaultValue: "Documents submitted" }),
          t("stripe.onboarding.documents.reuploadSuccessMessage", { defaultValue: "Your documents have been re-submitted. Stripe will review them shortly." }),
          [{ text: "OK", onPress: () => navigation.getParent()?.goBack() || navigation.goBack() }],
        );
        return;
      }

      // First onboarding: go to Review (last step)
      navigation.navigate("Review", {
        personalInfo: route.params?.personalInfo,
        address: route.params?.address,
        bankAccount: route.params?.bankAccount,
        documents: { frontImage, backImage },
      });
    } catch (error: any) {
      const rawMessage =
        typeof error?.message === "string" ? error.message : String(error);
      const mayAlreadyBeSatisfied =
        rawMessage.includes("already attached") ||
        rawMessage.includes("account is verified");

      if (mayAlreadyBeSatisfied) {
        try {
          await fetchStripeAccount();
          if (isReUpload) {
            navigation.getParent()?.goBack() || navigation.goBack();
            return;
          }
          // Documents already verified — proceed to Review
          navigation.navigate("Review", {
            personalInfo: route.params?.personalInfo,
            address: route.params?.address,
            bankAccount: route.params?.bankAccount,
            documents: { frontImage, backImage },
          });
          return;
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
    loadingImage: {
      width: 120,
      height: 120,
    },
    loadingText: {
      marginTop: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      textAlign: "center",
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: DESIGN_TOKENS.spacing.lg,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
      textAlign: "center",
    },
    modalSubtitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      textAlign: "center",
    },
    modalButton: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: 10,
      backgroundColor: colors.background,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    modalButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginLeft: DESIGN_TOKENS.spacing.md,
    },
    modalCancelButton: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
    },
    modalCancelText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  }), [colors, insets]);

  const canProceed = Boolean(
    frontImage &&
    (documentType === "passport" ? true : backImage) &&
    (!companyDocNeeded || companyDocImage),
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

        {/* Company Verification Document (if required) */}
        {companyDocNeeded && (
          <View style={styles.documentsSection}>
            <View style={styles.documentCard}>
              <Text style={styles.documentHeader}>
                {t("stripe.onboarding.documents.companyDocTitle")}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: DESIGN_TOKENS.spacing.md, lineHeight: 18 }}>
                {t("stripe.onboarding.documents.companyDocSubtitle")}
              </Text>
              <View style={styles.imageContainer}>
                {companyDocImage ? (
                  <Image
                    source={{ uri: companyDocImage }}
                    style={styles.documentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderContent}>
                    <Ionicons
                      name="document-text-outline"
                      size={48}
                      color={colors.textSecondary}
                      style={styles.placeholderIcon}
                    />
                    <Text style={styles.placeholderText}>
                      {t("stripe.onboarding.documents.companyDocPlaceholder")}
                    </Text>
                  </View>
                )}
              </View>
              {companyDocImage ? (
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={takeCompanyDocPicture}
                  disabled={isUploading}
                  testID="stripe-documents-company-retake-btn"
                >
                  <Ionicons name="refresh" size={20} color={colors.text} />
                  <Text style={styles.retakeButtonText}>
                    {t("stripe.onboarding.documents.retakeButton")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={takeCompanyDocPicture}
                  disabled={isUploading}
                  testID="stripe-documents-company-btn"
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.cameraButtonText}>
                    {t("stripe.onboarding.documents.addDocument")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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
            <Image
              source={require("../../../../assets/images/mascot/mascotte_loading.png")}
              style={styles.loadingImage}
              resizeMode="contain"
            />
            <Text style={styles.loadingText}>
              {t("stripe.onboarding.documents.uploading", {
                defaultValue: "Envoi en cours...",
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Camera / Gallery picker modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pickerModalAction?.type === "company"
                ? t("stripe.onboarding.documents.companyDocTitle")
                : t("stripe.onboarding.documents.idDocChoose", { defaultValue: "Photo d'identité" })}
            </Text>
            <Text style={styles.modalSubtitle}>
              {pickerModalAction?.type === "company"
                ? t("stripe.onboarding.documents.companyDocChoose")
                : t("stripe.onboarding.documents.idDocChooseMessage", { defaultValue: "Comment souhaitez-vous ajouter votre photo ?" })}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handlePickerChoice("camera")}
            >
              <Ionicons name="camera" size={22} color="#635BFF" />
              <Text style={styles.modalButtonText}>
                {t("stripe.onboarding.documents.takePhotoButton")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handlePickerChoice("gallery")}
            >
              <Ionicons name="images" size={22} color="#635BFF" />
              <Text style={styles.modalButtonText}>
                {t("stripe.onboarding.documents.pickFromGallery")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setPickerModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
