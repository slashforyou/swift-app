import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

interface PremiumLockCardProps {
  title: string;
  description: string;
  minPlan: string;
  ctaLabel: string;
  availabilityLabel: string;
  onPressUpgrade: () => void;
}

export default function PremiumLockCard({
  title,
  description,
  minPlan,
  ctaLabel,
  availabilityLabel,
  onPressUpgrade,
}: PremiumLockCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: DESIGN_TOKENS.spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.warning + "55",
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
          {title}
        </Text>
      </View>

      <Text
        style={{
          marginTop: DESIGN_TOKENS.spacing.xs,
          color: colors.textSecondary,
        }}
      >
        {description}
      </Text>

      <Text
        style={{
          marginTop: DESIGN_TOKENS.spacing.sm,
          color: colors.warning,
          fontWeight: "600",
        }}
      >
        {availabilityLabel.replace("{{plan}}", minPlan)}
      </Text>

      <Pressable
        onPress={onPressUpgrade}
        style={({ pressed }) => ({
          marginTop: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          alignItems: "center",
            backgroundColor: pressed ? colors.primaryHover : colors.primary,
        })}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}
