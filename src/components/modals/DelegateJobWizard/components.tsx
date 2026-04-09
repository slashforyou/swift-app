import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { STEPS, WizardStep } from "./types";

export const SectionTitle: React.FC<{ children: string; colors: any }> = ({
  children,
  colors,
}) => (
  <Text
    style={{
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    }}
  >
    {children}
  </Text>
);

export const ChipButton: React.FC<{
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}> = ({ label, icon, isActive, onPress, colors }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1.5,
      borderColor: isActive ? colors.primary : colors.border,
      backgroundColor: isActive
        ? colors.primary + "18"
        : colors.backgroundSecondary,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      opacity: pressed ? 0.75 : 1,
    })}
  >
    {icon && (
      <Ionicons
        name={icon as any}
        size={16}
        color={isActive ? colors.primary : colors.textSecondary}
      />
    )}
    <Text
      style={{
        color: isActive ? colors.primary : colors.textSecondary,
        fontWeight: isActive ? "700" : "500",
        fontSize: 13,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

export const ModeCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
  disabled?: boolean;
}> = ({ title, description, icon, isActive, onPress, colors, disabled }) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    style={({ pressed }) => ({
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 2,
      borderColor: disabled
        ? colors.border + "60"
        : isActive
          ? colors.primary
          : colors.border,
      backgroundColor: disabled
        ? colors.backgroundSecondary + "80"
        : isActive
          ? colors.primary + "10"
          : colors.backgroundSecondary,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
    })}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isActive
          ? colors.primary + "20"
          : colors.border + "40",
        alignItems: "center",
        justifyContent: "center",
        marginRight: DESIGN_TOKENS.spacing.md,
      }}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={isActive ? colors.primary : colors.textSecondary}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: isActive ? colors.primary : colors.text,
          marginBottom: 2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 16,
        }}
      >
        {description}
      </Text>
    </View>
    {isActive && (
      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
    )}
  </Pressable>
);

export const Stepper: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  colors: any;
}> = ({ label, value, min = 0, max = 10, onChange, colors }) => (
  <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: DESIGN_TOKENS.radius.md,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value <= min ? 0.3 : 1,
        })}
      >
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <View
        style={{
          width: 32,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value >= max ? 0.3 : 1,
        })}
      >
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  </View>
);

export const ProgressDots: React.FC<{ current: WizardStep; colors: any }> = ({
  current,
  colors,
}) => {
  const idx = STEPS.indexOf(current);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}
    >
      {STEPS.map((s, i) => (
        <View
          key={s}
          style={{
            width: i <= idx ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= idx ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
};
