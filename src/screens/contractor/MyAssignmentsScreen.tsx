/**
 * MyAssignmentsScreen — Contractor
 * Liste des jobs confirmés et à venir du contractor.
 * Stub Phase 2 — à implémenter en Phase 3.
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";

export default function MyAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={40}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          My Assignments
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your confirmed jobs will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    gap: DESIGN_TOKENS.spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
