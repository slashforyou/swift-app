/**
 * JobDetailsHeader - Header unifié pour JobDetails
 * Suit le même design pattern que BusinessHeader avec bouton langue circulaire
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import HelpButton from "../ui/HelpButton";

interface JobDetailsHeaderProps {
  navigation: any;
  jobRef: string;
  title: string;
  onToast: (message: string, type: "info" | "success" | "error") => void;
  showHelpButton?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssignStaff?: () => void;
  assignedStaffName?: string;
  /**
   * Fallback route to navigate to when there's no entry in the navigation
   * stack (e.g. JobDetails was opened via a deep link or push notification).
   * If absent, falls back to "Home".
   * Can be a string ("Calendar") or a tuple [name, params] for nested screens.
   */
  fromRoute?: string | [string, Record<string, any> | undefined];
}

const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({
  navigation,
  jobRef,
  title,
  onToast,
  showHelpButton = true,
  onEdit,
  onDelete,
  onAssignStaff,
  assignedStaffName,
  fromRoute,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (fromRoute) {
      if (Array.isArray(fromRoute)) {
        navigation.navigate(fromRoute[0], fromRoute[1]);
      } else {
        navigation.navigate(fromRoute);
      }
      return;
    }
    navigation.navigate("Home");
  };

  return (
    <>
      {/* Header menu */}
      <View
        testID="job-details-header"
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: DESIGN_TOKENS.spacing.sm,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          minHeight: 60,
        }}
      >
        {/* Bouton retour circulaire (style Business) */}
        <TouchableOpacity
          testID="job-details-back-btn"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={handleBackPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Titre centré */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.title.fontSize,
              fontWeight: "600",
              color: colors.text,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {title}
          </Text>

        </View>

        {/* Actions buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Bouton actions menu (Edit/Delete) */}
          {(onEdit || onDelete) && (
            <Pressable
              testID="job-details-actions-menu-btn"
              onPress={() => setShowActionsMenu(!showActionsMenu)}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.backgroundSecondary,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={colors.text}
              />
            </Pressable>
          )}

          {/* Bouton aide circulaire */}
          {showHelpButton && <HelpButton size={40} />}
        </View>
      </View>

      {/* Actions dropdown menu */}
      {showActionsMenu && (onEdit || onDelete) && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 60,
            right: DESIGN_TOKENS.spacing.lg,
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 100,
            minWidth: 150,
          }}
        >
          {onEdit && (
            <Pressable
              testID="job-details-edit-btn"
              onPress={() => {
                setShowActionsMenu(false);
                onEdit();
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: DESIGN_TOKENS.spacing.md,
                borderBottomWidth: onAssignStaff || onDelete ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
              })}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={{ marginLeft: 12, color: colors.text, fontSize: 15 }}
              >
                Edit Job
              </Text>
            </Pressable>
          )}
          {onAssignStaff && (
            <Pressable
              testID="job-details-assign-staff-btn"
              onPress={() => {
                setShowActionsMenu(false);
                onAssignStaff();
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: DESIGN_TOKENS.spacing.md,
                borderBottomWidth: onDelete ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
              })}
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color={colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {assignedStaffName ? "Change Staff" : "Assign Staff"}
                </Text>
                {assignedStaffName && (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Current: {assignedStaffName}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              testID="job-details-delete-btn"
              onPress={() => {
                setShowActionsMenu(false);
                onDelete();
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
              })}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text
                style={{ marginLeft: 12, color: colors.error, fontSize: 15 }}
              >
                Delete Job
              </Text>
            </Pressable>
          )}
        </View>
      )}

    </>
  );
};

export default JobDetailsHeader;
