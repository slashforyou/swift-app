/**
 * BusinessSubTabMenu - Sous-onglets légers pour les sections Ressources/Réseau/Finances
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

interface SubTab {
  id: string;
  label: string;
}

interface BusinessSubTabMenuProps {
  tabs: SubTab[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const BusinessSubTabMenu: React.FC<BusinessSubTabMenuProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && { borderBottomColor: colors.primary },
            ]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textSecondary },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  labelActive: {
    fontWeight: "700",
  },
});

export default BusinessSubTabMenu;
