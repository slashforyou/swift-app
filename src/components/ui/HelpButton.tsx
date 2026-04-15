/**
 * HelpButton — Bouton "?" rond qui mène au support/FAQ
 * Remplace le bouton langue omniprésent dans les headers
 */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

interface HelpButtonProps {
  size?: number;
  testID?: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({ size = 44, testID }) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <Pressable
      testID={testID ?? "help-btn"}
      onPress={() => navigation.navigate("SupportFAQ")}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pressed
          ? colors.backgroundTertiary
          : colors.backgroundSecondary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
      hitSlop={DESIGN_TOKENS.touch.hitSlop}
    >
      <Ionicons name="help-circle-outline" size={Math.round(size * 0.5)} color={colors.textSecondary} />
    </Pressable>
  );
};

export default HelpButton;
