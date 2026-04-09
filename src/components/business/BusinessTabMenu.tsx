/**
 * BusinessTabMenu - Navigation 4 onglets du Business Hub
 * Hub · Ressources · Réseau · Finances
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

export type BusinessTab = "Hub" | "Resources" | "Config" | "Finances";

export interface BusinessTabItem {
  id: BusinessTab;
  label: string;
  icon: string;
  accessibilityLabel: string;
}

interface BusinessTabMenuProps {
  activeTab: BusinessTab;
  onTabPress: (tabId: BusinessTab) => void;
  style?: any;
}

const TABS_CONFIG: BusinessTabItem[] = [
  {
    id: "Hub",
    label: "Hub",
    icon: "home-outline",
    accessibilityLabel: "Business Hub Overview Tab",
  },
  {
    id: "Resources",
    label: "Ressources",
    icon: "people",
    accessibilityLabel: "Resources Management Tab",
  },
  {
    id: "Config",
    label: "Config",
    icon: "construct-outline",
    accessibilityLabel: "Job Configuration Tab",
  },
  {
    id: "Finances",
    label: "Finances",
    icon: "wallet-outline",
    accessibilityLabel: "Finances and Payments Tab",
  },
];

const BusinessTabMenu: React.FC<BusinessTabMenuProps> = ({
  activeTab,
  onTabPress,
  style,
}) => {
  const { colors } = useTheme();

  const tabsConfig = TABS_CONFIG;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.background,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      paddingBottom: DESIGN_TOKENS.spacing.lg + 16 + 10, // Safe area padding + 10px extra
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      ...style,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.md,
      minHeight: 56, // Touch target minimum 44pt + padding
    },
    tabButtonActive: {
      backgroundColor: "transparent",
    },
    tabButtonInactive: {
      backgroundColor: "transparent",
    },
    iconContainer: {
      position: "relative",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 14,
    },
    tabLabelActive: {
      color: colors.primary,
    },
    tabLabelInactive: {
      color: colors.textSecondary,
    },
  });

  return (
    <View testID="business-tab-menu" style={styles.container}>
      {tabsConfig.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            testID={`tab-${tab.id}`}
            style={[
              styles.tabButton,
              isActive ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            onPress={() => {
              if (!isActive) {
                onTabPress(tab.id);
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BusinessTabMenu;
