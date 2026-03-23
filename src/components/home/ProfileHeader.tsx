/**
 * ⚠️ ATTENTION - FICHIER PROTÉGÉ ⚠️
 * =================================
 * Ce composant a été soigneusement calibré pour l'UX de l'application.
 * Avant toute modification, veuillez demander confirmation :
 * "Souhaitez-vous vraiment modifier ce fichier ?"
 *
 * ProfileHeader - Header compact avec gamification pour la page d'accueil
 * Affiche le level + barre de progression avec animation d'apparition
 * Supporte les modes Light et Dark
 *
 * @author Romain Giovanni - Slashforyou
 * @lastModified 16/01/2026
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useNotifications } from "../../context/NotificationsProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useGamification } from "../../hooks/useGamification";
import { useLocalization } from "../../localization";
import { HStack } from "../primitives/Stack";
import NotificationsPanel from "./NotificationsPanel";

interface ProfileHeaderProps {
  navigation: any;
  onLanguagePress?: () => void;
  user?: {
    firstName?: string;
    lastName?: string;
    role?: string;
    level?: number;
    xp?: number;
    xpProgress?: number;
    xpToNextLevel?: number;
    totalXpForNextLevel?: number;
    rank?: {
      name: string;
      emoji: string;
      color: string;
    };
  };
}

// Variable pour le double tap
let lastTapTime = 0;

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  navigation,
  onLanguagePress,
}) => {
  const { data: gamificationData, isLoading, addXP } = useGamification();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Utiliser les données de gamification ou des valeurs par défaut
  const user = gamificationData || {
    firstName: "User",
    level: 1,
    xp: 0,
    xpProgress: 0,
    xpToNextLevel: 100,
    totalXpForNextLevel: 100,
  };

  // Calculer le pourcentage de progression
  const progressPercent = Math.round(
    (((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) /
      (user.totalXpForNextLevel || 500)) *
      100,
  );

  return (
    <>
      {/* Container */}
      <View testID="home-profile-header">
        {/* Barre du haut - Notifications + Langue */}
        <HStack
          gap="sm"
          align="center"
          justify="flex-end"
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <Pressable
            testID="home-notifications-btn"
            onPress={() => setShowNotifications(true)}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed
                ? colors.backgroundTertiary
                : colors.backgroundSecondary,
              justifyContent: "center",
              alignItems: "center",
            })}
          >
            <Ionicons
              name="notifications"
              size={20}
              color={colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: colors.error,
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </HStack>

        {/* Card compacte - Avatar + Level + Progression */}
        <Pressable
          testID="home-profile-card"
          onPress={() => {
            const now = Date.now();
            if (now - lastTapTime < 500) {
              // Double tap - Easter egg
              addXP(5, "🎯 Easter egg bonus!");
            }
            lastTapTime = now;
          }}
          onLongPress={() => navigation.navigate("XpHistory")}
          style={({ pressed }) => ({
            marginHorizontal: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.xl,
            padding: DESIGN_TOKENS.spacing.md,
            opacity: pressed ? 0.95 : 1,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          <HStack gap="md" align="center">
            {/* Avatar avec badge Level */}
            <Pressable
              testID="home-avatar-btn"
              onPress={() => navigation.navigate("Profile")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: "#FF8C00",
                }}
              >
                <Image
                  source={require("../../../assets/images/mascot/mascotte_profil.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              </View>
              {/* Badge Level en overlay */}
              <View
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  backgroundColor: "#FF8C00",
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderWidth: 2,
                  borderColor: colors.backgroundSecondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: "white",
                  }}
                >
                  Lv.{user.level || 1}
                </Text>
              </View>
            </Pressable>

            {/* Progression vers le prochain niveau */}
            <View style={{ flex: 1 }}>
              <HStack gap="sm" align="center" style={{ marginBottom: 6 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {user.xp?.toLocaleString() || 0} XP
                </Text>
                <View
                  style={{
                    backgroundColor: colors.backgroundTertiary,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    {t("profile.xpToNextLevelShort", {
                      level: (user.level || 1) + 1,
                      xp: user.xpToNextLevel || 0,
                    })}
                  </Text>
                </View>
              </HStack>

              {/* Barre de progression */}
              <View
                style={{
                  height: 10,
                  backgroundColor: colors.border,
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    borderRadius: 5,
                    backgroundColor: "#FF8C00",
                    width: `${progressPercent}%`,
                  }}
                />
              </View>
            </View>

            {/* Bouton d'action - Badges */}
            <HStack gap="sm">
              <Pressable
                onPress={() => {
                  console.log("🎖️ [NAV] Button pressed → Badges");
                  navigation.navigate("Badges");
                }}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <Ionicons name="ribbon" size={22} color="#00CEC9" />
              </Pressable>
            </HStack>
          </HStack>
        </Pressable>
      </View>

      {/* Panel des notifications */}
      <NotificationsPanel
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default ProfileHeader;
