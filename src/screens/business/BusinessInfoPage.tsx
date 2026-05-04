/**
 * BusinessInfoPage - Page d'informations business bien structurée
 * Affiche les informations de l'entreprise avec sections organisées (contenu seulement, header géré par Business.tsx)
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
import { VStack } from "../../components/primitives/Stack";
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
  isLast?: boolean;
}

// Composant InfoRow avec séparateur
const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, isLast }) => {
  const { colors } = useTheme();

  return (
    <>
      <View style={styles.infoRow}>
        {icon && <Text style={styles.infoIcon}>{icon}</Text>}
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
      {!isLast && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
    </>
  );
};

// En-tête de section avec icône colorée
const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBadge, { backgroundColor: colors.primary + "18" }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero : Logo + Nom de l'entreprise */}
      <View style={[styles.heroCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <Pressable
          onPress={handlePickLogo}
          disabled={isUploadingLogo}
          style={({ pressed }) => [
            styles.logoPressable,
            {
              backgroundColor: pressed ? colors.backgroundTertiary : colors.background,
              borderColor: colors.primary + "40",
            },
          ]}
        >
          {isUploadingLogo ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
          ) : (
            <VStack style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 36 }}>🏢</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: "center", paddingHorizontal: 6 }}>
                {t("business.info.addLogo")}
              </Text>
            </VStack>
          )}
        </Pressable>

        <View style={styles.heroText}>
          <Text style={[styles.heroName, { color: colors.text }]}>
            {businessData.name || t("businessHub.company.default")}
          </Text>
          {businessData.abn ? (
            <View style={[styles.abnBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.abnText, { color: colors.primary }]}>ABN {businessData.abn}</Text>
            </View>
          ) : null}
          <Pressable onPress={handlePickLogo}>
            <Text style={[styles.changeLogoLink, { color: colors.primary }]}>
              {logoUri ? t("business.info.changeLogo") : t("business.info.addLogo")} →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Section des informations générales */}
      <View style={styles.section}>
        <SectionHeader icon="🏢" title={t("business.info.companyInformation")} />
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <InfoRow icon="🆔" label={t("business.info.abn")} value={businessData.abn || t("business.info.notSpecified")} />
          <InfoRow icon="📅" label={t("business.info.establishedDate")} value={new Date(businessData.created_at).toLocaleDateString("en-AU")} />
          <InfoRow icon="💼" label={t("business.info.businessType")} value={businessData.businessType || t("business.info.movingServices")} isLast />
        </View>
      </View>

      {/* Section des coordonnées */}
      <View style={styles.section}>
        <SectionHeader icon="📞" title={t("business.info.contactDetails")} />
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <InfoRow icon="📱" label={t("business.info.phone")} value={businessData.phone || "—"} />
          <InfoRow icon="✉️" label={t("business.info.email")} value={businessData.email || "—"} />
          <InfoRow icon="🌐" label={t("business.info.website")} value={businessData.website || "—"} isLast />
        </View>
      </View>

      {/* Section de l'adresse */}
      <View style={styles.section}>
        <SectionHeader icon="📍" title={t("business.info.businessAddress")} />
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <InfoRow icon="🏘️" label={t("business.info.streetAddress")} value={businessData.address || "—"} />
          <InfoRow icon="🏙️" label={t("business.info.city")} value={businessData.city || "—"} />
          <InfoRow icon="🗺️" label={t("business.info.state")} value={businessData.state || "—"} />
          <InfoRow icon="📮" label={t("business.info.postcode")} value={businessData.postcode || "—"} isLast />
        </View>
      </View>

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
  },
  content: {
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.lg,
  },
  // Hero card
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.md,
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  logoPressable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  abnBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  abnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  changeLogoLink: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Cards
  infoCard: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: DESIGN_TOKENS.spacing.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: DESIGN_TOKENS.spacing.sm,
    marginTop: 1,
    width: 22,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  // States
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
  bottomSpacer: {
    height: DESIGN_TOKENS.spacing.xl * 2,
  },
});

export default BusinessInfoPage;
