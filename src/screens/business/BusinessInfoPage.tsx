/**
 * BusinessInfoPage - Page d'informations business bien structurée
 * Affiche les informations de l'entreprise avec sections organisées (cont        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>       <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>nu seulement, header géré par Business.tsx)
 */
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Components
import { HStack, VStack } from "../../components/primitives/Stack";
import MascotLoading from "../../components/ui/MascotLoading";

// Hooks & Utils
import { DESIGN_TOKENS, useCommonThemedStyles } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useBusinessInfo } from "../../hooks/business";
import { useLocalization } from "../../localization/useLocalization";
import { uploadCompanyLogo } from "../../services/business/businessService";

// Types
interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

// Composant InfoRow pour afficher une ligne d'information
const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const { colors } = useTheme();

  return (
    <HStack style={styles.infoRow}>
      {icon && <Text style={styles.infoIcon}>{icon}</Text>}
      <VStack style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </VStack>
    </HStack>
  );
};

/**
 * Composant principal BusinessInfoPage
 */
const BusinessInfoPage: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const commonStyles = useCommonThemedStyles();

  // Hook business info avec gestion d'état
  const {
    currentBusiness: businessData,
    isLoading,
    error,
    refreshData,
  } = useBusinessInfo();

  const [logoUri, setLogoUri] = React.useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  // Set logo from business data
  React.useEffect(() => {
    if (businessData?.logo_url) {
      setLogoUri(businessData.logo_url);
    }
  }, [businessData?.logo_url]);

  const handlePickLogo = () => {
    Alert.alert(t("business.info.companyLogo"), "", [
      {
        text: t("business.info.takePhoto"),
        onPress: handleTakePhoto,
      },
      {
        text: t("business.info.chooseFromGallery"),
        onPress: handleChooseFromGallery,
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("business.info.permissionRequired"),
        t("business.info.cameraPermissionMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleLogoSelected(result.assets[0].uri);
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("business.info.permissionRequired"),
        t("business.info.galleryPermissionMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleLogoSelected(result.assets[0].uri);
    }
  };

  const handleLogoSelected = async (uri: string) => {
    setLogoUri(uri);
    if (!businessData?.id) return;
    setIsUploadingLogo(true);
    try {
      const result = await uploadCompanyLogo(businessData.id, uri);
      if (result.success && result.logo_url) {
        setLogoUri(result.logo_url);
      }
    } catch {
      // Logo is still shown locally even if upload fails
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Gestion des erreurs
  React.useEffect(() => {
    if (error) {
      Alert.alert(t("common.error"), error);
    }
  }, [error, t]);

  // État de chargement
  if (isLoading) {
    return <MascotLoading text={t("common.loading")} />;
  }

  // Aucune donnée disponible
  if (!businessData) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t("business.info.noDataAvailable")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="business-info-scroll"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Section Logo */}
      <VStack style={[styles.section, { alignItems: "center" }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, alignSelf: "flex-start" },
          ]}
        >
          {t("business.info.companyLogo")}
        </Text>
        <Pressable
          onPress={handlePickLogo}
          disabled={isUploadingLogo}
          style={({ pressed }) => ({
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: pressed
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderWidth: 2,
            borderColor: colors.border,
            borderStyle: "dashed",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            opacity: isUploadingLogo ? 0.6 : 1,
          })}
        >
          {isUploadingLogo ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={{ width: 120, height: 120, borderRadius: 60 }}
            />
          ) : (
            <VStack style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 32 }}>📷</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 8,
                }}
              >
                {t("business.info.addLogo")}
              </Text>
            </VStack>
          )}
        </Pressable>
        {logoUri && (
          <Pressable
            onPress={handlePickLogo}
            style={{ marginTop: DESIGN_TOKENS.spacing.sm }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.primary,
                fontWeight: "600",
              }}
            >
              {t("business.info.changeLogo")}
            </Text>
          </Pressable>
        )}
      </VStack>

      {/* Section des informations générales */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("business.info.companyInformation")}
        </Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <InfoRow
            icon="🏢"
            label={t("business.info.companyName")}
            value={businessData.name || "Swift Removals"}
          />

          <InfoRow
            icon="🆔"
            label={t("business.info.abn")}
            value={businessData.abn || t("business.info.notSpecified")}
          />

          <InfoRow
            icon="📅"
            label={t("business.info.establishedDate")}
            value={new Date(businessData.created_at).toLocaleDateString(
              "en-AU",
            )}
          />

          <InfoRow
            icon="💼"
            label={t("business.info.businessType")}
            value={
              businessData.businessType || t("business.info.movingServices")
            }
          />
        </View>
      </VStack>

      {/* Section des coordonnées */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("business.info.contactDetails")}
        </Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <InfoRow
            icon="📱"
            label={t("business.info.phone")}
            value={businessData.phone || "+61 2 9000 0000"}
          />

          <InfoRow
            icon="✉️"
            label={t("business.info.email")}
            value={businessData.email || "info@swiftremoval.com.au"}
          />

          <InfoRow
            icon="🌐"
            label={t("business.info.website")}
            value={businessData.website || "www.swiftremoval.com.au"}
          />
        </View>
      </VStack>

      {/* Section de l'adresse */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("business.info.businessAddress")}
        </Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <InfoRow
            icon="📍"
            label={t("business.info.streetAddress")}
            value={businessData.address || "123 Business Street"}
          />

          <InfoRow
            icon="🏙️"
            label={t("business.info.city")}
            value={businessData.city || "Sydney"}
          />

          <InfoRow
            icon="🗺️"
            label={t("business.info.state")}
            value={businessData.state || "NSW"}
          />

          <InfoRow
            icon="📮"
            label={t("business.info.postcode")}
            value={businessData.postcode || "2000"}
          />
        </View>
      </VStack>

      {/* Espacement final */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

/**
 * Styles du composant
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  infoCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: 12,
  },
  infoRow: {
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 18,
    marginRight: DESIGN_TOKENS.spacing.sm,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "400",
  },
  bottomSpacer: {
    height: DESIGN_TOKENS.spacing.xl,
  },
});

export default BusinessInfoPage;
