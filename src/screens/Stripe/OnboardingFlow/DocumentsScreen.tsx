/**
 * DocumentsScreen - Étape 4/5 de l'onboarding Stripe
 * Upload photos ID (recto + verso) via caméra uniquement
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useTranslation } from "../../../localization";

interface DocumentsScreenProps {
  navigation: any;
  route: any;
}

export default function DocumentsScreen({
  navigation,
  route,
}: DocumentsScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);
  // TODO: Afficher loading pendant upload
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

  const handleNext = () => {
    if (!frontImage || !backImage) {
      Alert.alert(
        t("stripe.onboarding.documents.errors.validationTitle"),
        t("stripe.onboarding.documents.errors.validationMessage"),
      );
      return;
    }

    console.log("🚀 [Documents] Valid images:", { frontImage, backImage });
    // TODO: Appeler uploadDocument() quand backend prêt
    navigation.navigate("Review", {
      personalInfo: route.params?.personalInfo,
      address: route.params?.address,
      bankAccount: route.params?.bankAccount,
      documents: { frontImage, backImage },
    });
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
  });

  const canProceed = frontImage && backImage;

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
          {t("stripe.onboarding.documents.step")}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>80%</Text>
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
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text
            style={[
              styles.nextButtonText,
              !canProceed && styles.nextButtonTextDisabled,
            ]}
          >
            {t("stripe.onboarding.documents.nextButton")}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={canProceed ? "#FFFFFF" : colors.textSecondary}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
