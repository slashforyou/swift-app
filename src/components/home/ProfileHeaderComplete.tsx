/**
 * ProfileHeaderComplete - Header avec gamification pour la page d'accueil (version complète)
 * Utilise les vraies données du profil utilisateur via useUserProfile
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    Text,
    View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useNotifications } from "../../context/NotificationsProvider";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useTranslation } from "../../localization";
import { VStack } from "../primitives/Stack";
import NotificationsPanel from "./NotificationsPanel";

interface ProfileHeaderProps {
  navigation: any;
}

// Variable pour le double tap
let lastTapTime = 0;

const ProfileHeaderComplete: React.FC<ProfileHeaderProps> = ({
  navigation,
}) => {
  const { profile, isLoading } = useUserProfile();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [progressAnimation] = useState(new Animated.Value(0));

  // Utiliser les données du profil avec des valeurs par défaut robustes
  const user = profile
    ? {
        firstName: profile.firstName || "User",
        lastName: profile.lastName || "",
        title: profile.title || t("profile.defaultTitle"),
        // Gamification par défaut en attendant l'implémentation API complète
        level: profile.level || 1,
        experience: profile.experience || 0,
        experienceToNextLevel: profile.experienceToNextLevel || 1000,
        role: profile.role || "Driver",
      }
    : {
        firstName: "User",
        lastName: "",
        title: t("profile.defaultTitle"),
        level: 1,
        experience: 0,
        experienceToNextLevel: 1000,
        role: "Driver",
      };

  // Protection contre les erreurs - éviter les crashes
  const safeUser = {
    ...user,
    firstName: user.firstName || "User",
    lastName: user.lastName || "",
    level: Math.max(user.level || 1, 1),
    experience: Math.max(user.experience || 0, 0),
    experienceToNextLevel: Math.max(user.experienceToNextLevel || 1000, 1),
  };

  // Si en cours de chargement, afficher un placeholder
  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: Colors.light.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          marginHorizontal: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          height: 90,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <Text
          style={{
            color: Colors.light.textSecondary,
            fontSize: 14,
            marginTop: 8,
          }}
        >
          {t("profile.loading")} ⚡
        </Text>
      </View>
    );
  }

  // Calcul du progrès XP avec protection contre les erreurs
  const getProgressData = () => {
    try {
      const currentXP = safeUser.experience;
      const targetXP = safeUser.experienceToNextLevel;
      const percentage = Math.min(currentXP / targetXP, 1); // Max 100%
      return {
        progressPercentage: percentage,
        xpRemaining: Math.max(targetXP - currentXP, 0),
      };
    } catch (error) {
      return {
        progressPercentage: 0,
        xpRemaining: 1000,
      };
    }
  };

  const { progressPercentage, xpRemaining } = getProgressData();

  // Animation de la barre de progression
  React.useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [safeUser.experience, progressPercentage]);

  // Fonction pour obtenir le rang basé sur le niveau
  const getRankInfo = (level: number = 1) => {
    if (level >= 19)
      return {
        emoji: "👑",
        title: t("profile.ranks.master"),
        color: "#FFD700",
      };
    if (level >= 13)
      return {
        emoji: "💎",
        title: t("profile.ranks.expert"),
        color: "#40E0D0",
      };
    if (level >= 8)
      return {
        emoji: "🥇",
        title: t("profile.ranks.senior"),
        color: "#FFD700",
      };
    if (level >= 4)
      return {
        emoji: "🥈",
        title: t("profile.ranks.driver"),
        color: "#C0C0C0",
      };
    return { emoji: "🥉", title: t("profile.ranks.rookie"), color: "#CD7F32" };
  };

  const rankInfo = getRankInfo(safeUser.level);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
  };

  return (
    <>
      {/* Header pleine largeur sans box */}
      <View
        style={{
          paddingVertical: DESIGN_TOKENS.spacing.xl,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        {/* Avatar avec bordure de progression circulaire */}
        <Pressable
          onPress={() => {
            const now = Date.now();

            if (now - lastTapTime < 500) {
              // Double tap détecté - Easter egg !
            } else {
              setTimeout(() => {
                if (Date.now() - now > 400) {
                  navigation.navigate("Profile");
                }
              }, 450);
            }

            lastTapTime = now;
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            alignItems: "center",
          })}
        >
          {/* Container pour l'avatar avec bordure circulaire */}
          <View
            style={{
              width: 90,
              height: 90,
              position: "relative",
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {/* Bordure grise (background) */}
            <View
              style={{
                position: "absolute",
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 4,
                borderColor: Colors.light.border,
              }}
            />

            {/* Bordure de progression orange/jaune */}
            <Animated.View
              style={{
                position: "absolute",
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 4,
                borderColor: "transparent",
                borderTopColor: "#FF8C00", // Orange
                transform: [
                  {
                    rotate: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-90deg", "270deg"], // Commence en haut et va dans le sens des aiguilles
                    }),
                  },
                ],
              }}
            />

            {/* Deuxième partie du dégradé pour l'effet jaune */}
            <Animated.View
              style={{
                position: "absolute",
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 4,
                borderColor: "transparent",
                borderTopColor: "#FFD700", // Jaune
                opacity: progressAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.3, 1],
                }),
                transform: [
                  {
                    rotate: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-90deg", "270deg"],
                    }),
                  },
                ],
              }}
            />

            {/* Avatar */}
            <View
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                width: 82,
                height: 82,
                borderRadius: 41,
                backgroundColor: Colors.light.backgroundSecondary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="person"
                size={40}
                color={Colors.light.textSecondary}
              />
            </View>
          </View>

          {/* Infos utilisateur centrées */}
          <VStack gap="xs" align="center">
            {/* Nom complet */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.light.text,
                textAlign: "center",
              }}
            >
              {safeUser.firstName} {safeUser.lastName}
            </Text>

            {/* Level et XP - Proéminents */}
            <View
              style={{
                backgroundColor: Colors.light.primary + "15",
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.xs,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: Colors.light.primary + "30",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.light.primary,
                  textAlign: "center",
                }}
              >
                {t("profile.level")} {safeUser.level} •{" "}
                {safeUser.experience?.toLocaleString()} XP
              </Text>
            </View>

            {/* Rang */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: rankInfo.color,
                textAlign: "center",
              }}
            >
              {rankInfo.emoji} {rankInfo.title}
            </Text>

            {/* Progression vers le prochain niveau */}
            <Text
              style={{
                fontSize: 12,
                color: Colors.light.textMuted,
                textAlign: "center",
              }}
            >
              {Math.round(progressPercentage * 100)}% {t("profile.toNextLevel")}{" "}
              {safeUser.level + 1}
            </Text>
          </VStack>
        </Pressable>

        {/* Bouton notifications en haut à droite */}
        <Pressable
          onPress={handleOpenNotifications}
          style={({ pressed }) => ({
            position: "absolute",
            top: DESIGN_TOKENS.spacing.lg,
            right: DESIGN_TOKENS.spacing.lg,
            padding: 8,
            opacity: pressed ? 0.7 : 1,
            backgroundColor: Colors.light.backgroundSecondary,
            borderRadius: 20,
            shadowColor: Colors.light.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          })}
        >
          <Ionicons
            name="notifications"
            size={24}
            color={Colors.light.textSecondary}
          />
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                backgroundColor: Colors.light.error,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: Colors.light.background,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Panel des notifications - NOUVEAU COMPOSANT PLEIN ÉCRAN */}
      <NotificationsPanel
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default ProfileHeaderComplete;
