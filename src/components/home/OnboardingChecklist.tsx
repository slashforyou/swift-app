import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    Pressable,
    Text,
    UIManager,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import {
    ChecklistItem,
    useOnboardingChecklist,
} from "../../hooks/useOnboardingChecklist";
import { useStripeConnection } from "../../hooks/useStripeConnection";
import { useTranslation } from "../../localization";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as any).nativeFabricUIManager
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OnboardingChecklistProps {
  navigation: any;
}

const CHECKLIST_CONFIG: Record<
  string,
  { icon: string; nav: string; navParams?: any; xp: number }
> = {
  profile: { icon: "person-circle", nav: "CompleteProfile", xp: 80 },
  first_job: { icon: "briefcase", nav: "Calendar", xp: 50 },
  invite_team: { icon: "people", nav: "Business", navParams: { initialTab: "StaffCrew" }, xp: 30 },
  setup_payments: { icon: "card", nav: "Business", navParams: { initialTab: "JobsBilling" }, xp: 120 },
};

export default function OnboardingChecklistCard({
  navigation,
}: OnboardingChecklistProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { items: rawItems, totalCount, loading: checklistLoading } =
    useOnboardingChecklist();
  const { status: stripeStatus, loading: stripeLoading } = useStripeConnection();
  const [isExpanded, setIsExpanded] = useState(true);
  // Override payments_setup with real Stripe connection status
  const items = rawItems.map((item) =>
    item.id === "setup_payments" && stripeStatus === "active"
      ? { ...item, completed: true }
      : item,
  );
  const completedCount = items.filter((i) => i.completed).length;
  const allCompleted = completedCount === totalCount;

  // Don't show until both data sources have loaded, and hide if all completed
  if (checklistLoading || stripeLoading || allCompleted) return null;

  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;
  const progressPercent = Math.round(progressPct * 100);
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const doneLabel = t("home.onboarding.doneLabel") || "done";
  const leftLabel = t("home.onboarding.leftLabel") || "left";

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const getItemLabel = (id: string): string => {
    const labels: Record<string, string> = {
      profile: t("home.onboarding.completeProfile") || "Complete business profile",
      first_job: t("home.onboarding.createFirstJob") || "Create your first job",
      invite_team: t("home.onboarding.inviteTeam") || "Invite your team",
      setup_payments: t("home.onboarding.setupPayments") || "Setup payments",
    };
    return labels[id] || id;
  };

  const handlePress = (item: ChecklistItem) => {
    if (item.completed) return;
    const config = CHECKLIST_CONFIG[item.id];
    if (config) {
      navigation.navigate(config.nav, config.navParams);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + "30",
      }}
    >
      {/* Header — always visible, tappable to expand/collapse */}
      <Pressable
        onPress={toggleExpanded}
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>🚀</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("home.onboarding.title") || "Get started"}
          </Text>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {completedCount}/{totalCount} {t("home.onboarding.completed") || "completed"} • {progressPercent}%
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.xs,
          marginTop: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <View
          style={{
            backgroundColor: colors.primary + "18",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
            {progressPercent}%
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.success + "18",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.success }}>
            {completedCount} {doneLabel}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.warning + "18",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.warning }}>
            {remainingCount} {leftLabel}
          </Text>
        </View>
      </View>

      {/* Progress bar — always visible */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.border,
          borderRadius: 3,
          marginTop: DESIGN_TOKENS.spacing.sm,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressPct * 100}%`,
            backgroundColor: colors.primary,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Checklist items — only when expanded */}
      {isExpanded && (
        <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
          {items.map((item) => {
        const config = CHECKLIST_CONFIG[item.id];
        return (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            disabled={item.completed}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor:
                pressed && !item.completed
                  ? colors.primary + "10"
                  : "transparent",
              opacity: item.completed ? 0.6 : 1,
            })}
          >
            {/* Status icon */}
            {item.loading ? (
              <ActivityIndicator
                size="small"
                color={colors.textSecondary}
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: item.completed
                    ? colors.success || "#22c55e"
                    : colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {item.completed ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.backgroundSecondary,
                    }}
                  />
                )}
              </View>
            )}

            {/* Item icon */}
            <Ionicons
              name={(config?.icon || "ellipse") as any}
              size={18}
              color={
                item.completed
                  ? colors.textSecondary
                  : colors.primary
              }
              style={{ marginLeft: DESIGN_TOKENS.spacing.sm }}
            />

            {/* Label + XP */}
            <Text
              style={{
                flex: 1,
                marginLeft: DESIGN_TOKENS.spacing.sm,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                fontWeight: item.completed ? "400" : "600",
                color: item.completed ? colors.textSecondary : colors.text,
                textDecorationLine: item.completed ? "line-through" : "none",
              }}
            >
              {getItemLabel(item.id)}
            </Text>

            {/* XP reward */}
            {config?.xp ? (
              <View
                style={{
                  backgroundColor: item.completed
                    ? (colors.success || "#22c55e") + "20"
                    : colors.primary + "15",
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginRight: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: item.completed
                      ? colors.success || "#22c55e"
                      : colors.primary,
                  }}
                >
                  +{config.xp} XP
                </Text>
              </View>
            ) : null}

            {/* Arrow for actionable items */}
            {!item.completed && !item.loading && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            )}
          </Pressable>
        );
      })}
        </View>
      )}
    </View>
  );
}
