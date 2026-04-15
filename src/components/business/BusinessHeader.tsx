/**
 * BusinessHeader - Composant header réutilisable pour les pages business
 * Inclut un bouton retour et le titre de la page, avec sélecteur de langue rond
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import HelpButton from "../ui/HelpButton";

interface BusinessHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showHelpButton?: boolean;
  navigation?: any; // Prop navigation optionnelle pour cohérence avec JobDetails
  skipSafeAreaTop?: boolean; // Skip top safe area padding when logo already handles it
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  showHelpButton = true,
  navigation: propNavigation,
  skipSafeAreaTop = false,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Utiliser la navigation passée en prop ou celle du hook
  const navToUse = propNavigation || navigation;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Naviguer vers Home au lieu de goBack()
      (navToUse as any).navigate("Home");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: skipSafeAreaTop
        ? DESIGN_TOKENS.spacing.sm
        : insets.top + DESIGN_TOKENS.spacing.md,
      paddingBottom: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: skipSafeAreaTop ? 56 : 76 + insets.top,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: DESIGN_TOKENS.spacing.md,
      // Effet d'ombre légère pour iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      // Élévation pour Android
      elevation: 2,
    },
    backButtonPressed: {
      backgroundColor: colors.primaryLight,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
    },

  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              testID="business-header-back-btn"
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Retour"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {showHelpButton && <HelpButton size={40} />}
        </View>
      </View>
    </>
  );
};

export default BusinessHeader;
