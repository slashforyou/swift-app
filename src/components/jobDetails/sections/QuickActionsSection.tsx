/**
 * QuickActionsSection - Actions rapides en cartes élevées
 * Design moderne avec icônes colorées et fond subtil
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface QuickActionsSectionProps {
  job: JobSummaryData;
  setJob: React.Dispatch<React.SetStateAction<JobSummaryData>>;
  onAddNote?: (
    content: string,
    type?: "general" | "important" | "client" | "internal",
  ) => Promise<void>;
  onTakePhoto?: () => void;
  onShowNoteModal?: () => void;
  onShowPhotoModal?: () => void;
  onShowStepAdvanceModal?: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  job,
  onAddNote,
  onTakePhoto,
  onShowNoteModal,
  onShowPhotoModal,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const handleCallClient = () => {
    const phoneNumber = job?.client?.phone || job?.contact?.phone;
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
      Linking.openURL(`tel:${cleanNumber}`);
    } else {
      Alert.alert(
        t("jobDetails.components.quickActions.error"),
        t("jobDetails.components.quickActions.noPhoneAvailable"),
      );
    }
  };

  const handleNavigation = () => {
    const currentStep = job?.step?.actualStep || 1;
    let address = "";

    if (currentStep <= 2) {
      const pickupAddress = job?.addresses?.find(
        (addr: any) => addr.type === "pickup",
      );
      address = pickupAddress
        ? `${pickupAddress.street}, ${pickupAddress.city}`
        : "";
    } else {
      const dropoffAddress = job?.addresses?.find(
        (addr: any) => addr.type === "dropoff",
      );
      address = dropoffAddress
        ? `${dropoffAddress.street}, ${dropoffAddress.city}`
        : "";
    }

    if (address) {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      );
    } else {
      Alert.alert(
        t("jobDetails.components.quickActions.error"),
        t("jobDetails.components.quickActions.noAddressAvailable"),
      );
    }
  };

  const handleQuickNote = () => {
    if (onShowNoteModal) {
      onShowNoteModal();
    } else {
      Alert.prompt(
        t("jobDetails.components.quickActions.quickNote"),
        t("jobDetails.components.quickActions.addNoteToJob"),
        (text) => {
          if (text && text.trim()) {
            onAddNote?.(text.trim(), "general");
            Alert.alert(
              t("jobDetails.components.quickActions.success"),
              t("jobDetails.components.quickActions.noteAdded"),
            );
          }
        },
        "plain-text",
      );
    }
  };

  const handleTakePhoto = () => {
    if (onShowPhotoModal) {
      onShowPhotoModal();
    } else {
      onTakePhoto?.();
    }
  };

  const isJobFinished =
    job?.status === "completed" || job?.status === "cancelled";

  const allActions = [
    {
      id: "call",
      icon: "call-outline" as const,
      label: t("jobDetails.components.quickActions.callLabel"),
      color: colors.success,
      onPress: handleCallClient,
      hideWhenFinished: true,
    },
    {
      id: "navigation",
      icon: "navigate-outline" as const,
      label: t("jobDetails.components.quickActions.gpsLabel"),
      color: colors.primary,
      onPress: handleNavigation,
      hideWhenFinished: true,
    },
    {
      id: "note",
      icon: "create-outline" as const,
      label: t("jobDetails.components.quickActions.noteLabel"),
      color: colors.tint,
      onPress: handleQuickNote,
      hideWhenFinished: false,
    },
    {
      id: "photo",
      icon: "camera-outline" as const,
      label: t("jobDetails.components.quickActions.photoLabel"),
      color: colors.info,
      onPress: handleTakePhoto,
      hideWhenFinished: false,
    },
  ];

  const quickActions = isJobFinished
    ? allActions.filter((a) => !a.hideWhenFinished)
    : allActions;

  const s = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: DESIGN_TOKENS.spacing.sm,
        },
        btn: {
          flex: 1,
          minWidth: "45%",
          flexDirection: "row",
          alignItems: "center",
          padding: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border + "40",
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.sm,
        },
        label: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
      }),
    [colors],
  );

  return (
    <SectionCard level="secondary">
      <View style={s.grid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            testID={`job-quick-action-${action.id}`}
            onPress={action.onPress}
            style={({ pressed }) => [
              s.btn,
              {
                backgroundColor: pressed
                  ? action.color + "20"
                  : action.color + "0A",
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View
              style={[s.iconWrap, { backgroundColor: action.color + "18" }]}
            >
              <Ionicons name={action.icon} size={18} color={action.color} />
            </View>
            <Text style={s.label}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </SectionCard>
  );
};

export default QuickActionsSection;
