/**
 * Home - Écran d'accueil moderne avec gamification et traductions
 * Architecture moderne avec Safe Areas, ProfileHeader et navigation cohérente
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DevMenu from "../components/dev/DevMenu";
import PendingAssignmentsSection from "../components/home/PendingAssignmentsSection";
import ProfileHeader from "../components/home/ProfileHeader";
import TodaySection from "../components/home/TodaySection";
import { Screen } from "../components/primitives/Screen";
import { HStack, VStack } from "../components/primitives/Stack";
import { HeaderLogo } from "../components/ui/HeaderLogo";
import RoundLanguageButton from "../components/ui/RoundLanguageButton";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useTranslation } from "../localization";
import { clearSession } from "../utils/auth";
import { useAuthCheck } from "../utils/checkAuth";

// Types et interfaces
interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  console.log("\n🏠 ═══════════════════════════════════════");
  console.log("🏠 [HOME] Screen mounted");
  console.log("🏠 ═══════════════════════════════════════\n");

  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );
  const [showDevMenu, setShowDevMenu] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t("settings.alerts.logout.title"),
      t("settings.alerts.logout.message"),
      [
        { text: t("settings.alerts.logout.cancel"), style: "cancel" },
        {
          text: t("settings.alerts.logout.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await clearSession();
              navigation.reset({ index: 0, routes: [{ name: "Connection" }] });
            } catch {
              Alert.alert(t("common.error"), t("settings.alerts.logout.error"));
            }
          },
        },
      ],
    );
  };

  // Dimensions fixes pour garantir que tout rentre dans l'écran
  const LOGO_HEIGHT = 40;
  const PROFILE_HEADER_HEIGHT = 130; // Header + barre progression
  const TODAY_SECTION_HEIGHT = 60; // Ligne compacte
  const MENU_ITEM_HEIGHT = 72; // Hauteur fixe pour chaque item de menu
  const BOTTOM_PADDING = 48; // Espace pour les boutons Samsung

  // Composant MenuItem interne avec accès aux couleurs du thème
  const MenuItem = ({
    title,
    icon,
    description,
    onPress,
    color = colors.primary,
  }: {
    title: string;
    icon: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? colors.backgroundTertiary
          : colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.xs,
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: MENU_ITEM_HEIGHT,
      })}
    >
      <HStack gap="md" align="center">
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: color,
            borderRadius: DESIGN_TOKENS.radius.md,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={icon as any}
            size={24}
            color={colors.buttonPrimaryText}
          />
        </View>

        <VStack gap="xs" style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
              fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
              fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
            }}
          >
            {description}
          </Text>
        </VStack>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </HStack>
    </Pressable>
  );

  if (isLoading) return LoadingComponent;

  return (
    <Screen>
      <VStack
        style={{
          flex: 1,
          paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + BOTTOM_PADDING,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: DESIGN_TOKENS.spacing.sm,
            right: DESIGN_TOKENS.spacing.lg,
            zIndex: 10,
          }}
        >
          <RoundLanguageButton />
        </View>
        {/* Logo en haut */}
        <View
          style={{
            height: LOGO_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <HeaderLogo preset="sm" marginVertical={0} />
        </View>

        {/* Profile Header */}
        <View
          style={{
            height: PROFILE_HEADER_HEIGHT,
            marginHorizontal: -DESIGN_TOKENS.spacing.lg,
          }}
        >
          <ProfileHeader navigation={navigation} />
        </View>

        {/* Today Section */}
        <View
          style={{
            height: TODAY_SECTION_HEIGHT,
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <TodaySection
            onPress={() => {
              const today = new Date();
              navigation.navigate("Calendar", {
                screen: "Day",
                params: {
                  day: today.getDate(),
                  month: today.getMonth() + 1,
                  year: today.getFullYear(),
                },
              });
            }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Pending contractor assignments – visible only when present */}
        <PendingAssignmentsSection navigation={navigation} />

        {/* Menu Items - prennent l'espace restant */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-start",
          }}
        >
          <VStack gap="xs">
            <MenuItem
              title={t("home.calendar.title")}
              icon="calendar"
              description={t("home.calendar.description")}
              onPress={() => navigation.navigate("Calendar")}
              color={colors.primary}
            />

            <MenuItem
              title={t("home.business.title")}
              icon="business"
              description={t("home.business.description")}
              onPress={() => navigation.navigate("Business")}
              color={colors.success}
            />

            {/* Settings (petit, gauche) + Déconnexion (droite) */}
            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}
            >
              {/* Bouton Paramètres — compact */}
              <Pressable
                onPress={() => navigation.navigate("Parameters")}
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xs,
                  paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: colors.warning,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="settings"
                    size={15}
                    color={colors.buttonPrimaryText}
                  />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    fontWeight: "600",
                  }}
                >
                  {t("home.parameters.title")}
                </Text>
              </Pressable>

              {/* Bouton Déconnexion — flex 1 */}
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xs,
                  paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: colors.error + "50",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: colors.error,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="log-out-outline" size={15} color="white" />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {t("settings.items.logout")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </VStack>
        </View>
      </VStack>

      {__DEV__ && (
        <Pressable
          onPress={() => {
            setShowDevMenu(true);
          }}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            right: DESIGN_TOKENS.spacing.lg,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
          hitSlop={DESIGN_TOKENS.touch.hitSlop}
        >
          <Ionicons name="terminal" size={24} color={colors.textSecondary} />
        </Pressable>
      )}

      {__DEV__ && (
        <DevMenu visible={showDevMenu} onClose={() => setShowDevMenu(false)} />
      )}
    </Screen>
  );
};

export default HomeScreen;
