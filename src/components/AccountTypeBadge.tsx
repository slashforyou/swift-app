import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AccountType } from "../services/user";

const BADGE_CONFIG: Record<
  AccountType,
  { label: string; backgroundColor: string }
> = {
  business_owner: { label: "👔 Boss", backgroundColor: "#1E3A5F" },
  employee: { label: "👷 Employee", backgroundColor: "#2D6A4F" },
  contractor: { label: "🔧 Contractor", backgroundColor: "#B5451B" },
};

interface AccountTypeBadgeProps {
  accountType: AccountType;
}

export const AccountTypeBadge: React.FC<AccountTypeBadgeProps> = ({
  accountType,
}) => {
  const config = BADGE_CONFIG[accountType];
  if (!config) return null;

  return (
    <View
      style={[styles.pill, { backgroundColor: config.backgroundColor }]}
    >
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
