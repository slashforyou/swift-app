/**
 * CalendarHeader - Header réutilisable pour les pages Calendar
 * Basé sur BusinessHeader pour une cohérence visuelle
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { getUserCompanyData } from "../../hooks/useCompanyPermissions";
import LanguageButton from "./LanguageButton";

interface CalendarHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  navigation?: any;
  useCompanyLabel?: boolean; // New: use company-based label from permissions
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  navigation: propNavigation,
  useCompanyLabel = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const fallbackNavigation = useNavigation();
  const navigation = propNavigation || fallbackNavigation;

  // State for dynamic title based on company role
  const [displayTitle, setDisplayTitle] = useState(title);

  // Load company data to get the appropriate calendar label
  useEffect(() => {
    if (useCompanyLabel) {
      getUserCompanyData()
        .then((data) => {
          if (data) {
            const role = data.company_role;
            if (role === "patron" || role === "cadre") {
              setDisplayTitle("Jobs de l'entreprise");
            } else {
              setDisplayTitle("Mes jobs assignés");
            }
          } else {
            setDisplayTitle(title); // Fallback to original title
          }
        })
        .catch(() => {
          setDisplayTitle(title); // Fallback on error
        });
    } else {
      setDisplayTitle(title);
    }
  }, [title, useCompanyLabel]);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 76 + insets.top, // Header plus grand
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
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={styles.leftSection}>
          {showBackButton && (
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          )}
          <Text style={styles.title}>{displayTitle}</Text>
        </View>

        <View style={styles.rightSection}>
          {rightComponent || <LanguageButton />}
        </View>
      </View>
    </View>
  );
};

export default CalendarHeader;
