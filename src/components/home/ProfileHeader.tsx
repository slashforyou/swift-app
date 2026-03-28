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
import { getAvatarSource } from "../ui/AvatarPickerModal";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useGamification } from "../../hooks/useGamification";
import { useLocalization } from "../../localization";
import { HStack } from "../primitives/Stack";

interface ProfileHeaderProps {
  navigation: any;
  onLanguagePress?: () => void;
  avatarId?: string | null;
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
  avatarId,
}) => {
  const { data: gamificationData, isLoading, addXP } = useGamification();
  const { colors } = useTheme();
  const { t } = useLocalization();

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
                  source={getAvatarSource(avatarId)}
                  style={{
                    width: "125%",
                    height: "125%",
                    marginLeft: "-12.5%",
                    marginTop: "-12.5%",
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
    </>
  );
};

export default ProfileHeader;
