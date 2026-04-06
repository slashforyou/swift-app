/**
 * SupportInbox — Liste des conversations de support
 * Accessible depuis le FAB sur la page Home
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useConversations } from "../../hooks/useSupport";
import { useTranslation } from "../../localization";
import { Conversation } from "../../services/supportService";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SupportStackParamList = {
  SupportInbox: undefined;
  SupportConversation: { conversationId: number; subject: string };
  SupportNewConversation: undefined;
};

interface SupportInboxProps {
  navigation: NativeStackNavigationProp<SupportStackParamList, "SupportInbox">;
}

const CATEGORY_CONFIG = {
  help: { icon: "help-circle-outline", color: "#3B82F6" },
  feedback: { icon: "chatbubble-ellipses-outline", color: "#10B981" },
  feature: { icon: "bulb-outline", color: "#F59E0B" },
  bug: { icon: "bug-outline", color: "#EF4444" },
} as const;

const STATUS_CONFIG = {
  open: { color: "#3B82F6" },
  answered: { color: "#10B981" },
  closed: { color: "#9CA3AF" },
} as const;

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

const SupportInbox: React.FC<SupportInboxProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { conversations, isLoading, refresh } = useConversations();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const cat = CATEGORY_CONFIG[item.category];
    const status = STATUS_CONFIG[item.status];

    return (
      <Pressable
        onPress={() =>
          navigation.navigate("SupportConversation", {
            conversationId: item.id,
            subject: item.subject,
          })
        }
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.subject} — ${t(`support.status.${item.status}`)}`}
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? colors.backgroundTertiary
            : colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.sm,
          borderWidth: 1,
          borderColor:
            item.unread_count > 0 ? colors.primary + "40" : colors.border,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
          }}
        >
          {/* Category icon */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: cat.color + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={cat.icon} size={22} color={cat.color} />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.xs,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: item.unread_count > 0 ? "700" : "600",
                  color: colors.text,
                }}
              >
                {item.subject}
              </Text>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize - 1,
                  color: colors.textMuted,
                }}
              >
                {formatRelative(item.updated_at)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.xs,
                marginTop: 2,
              }}
            >
              {/* Status badge */}
              <View
                style={{
                  backgroundColor: status.color + "20",
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: DESIGN_TOKENS.radius.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: status.color,
                    textTransform: "uppercase",
                  }}
                >
                  {t(`support.status.${item.status}`)}
                </Text>
              </View>

              {/* Last message preview */}
              {item.last_message && (
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    color: colors.textMuted,
                  }}
                >
                  {item.last_sender === "admin"
                    ? `${t("support.admin")}: `
                    : ""}
                  {item.last_message}
                </Text>
              )}
            </View>
          </View>

          {/* Unread badge */}
          {item.unread_count > 0 && (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>
                {item.unread_count}
              </Text>
            </View>
          )}

          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    );
  };

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primary + "15",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <Ionicons name="chatbubbles-outline" size={40} color={colors.primary} />
      </View>
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        {t("support.emptyTitle")}
      </Text>
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.body.fontSize,
          color: colors.textMuted,
          textAlign: "center",
        }}
      >
        {t("support.emptyDescription")}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={{ marginRight: DESIGN_TOKENS.spacing.md }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("common.back") || "Back"}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text
            accessibilityRole="header"
            style={{
              flex: 1,
              fontSize: DESIGN_TOKENS.typography.title.fontSize,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("support.title")}
          </Text>
        </View>
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConversation}
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            flexGrow: 1,
          }}
          ListEmptyComponent={EmptyState}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* New conversation FAB */}
      <Pressable
        onPress={() => navigation.navigate("SupportNewConversation")}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t("support.newConversation") || "New conversation"}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
          right: DESIGN_TOKENS.spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: pressed ? colors.primary + "DD" : colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        })}
        hitSlop={DESIGN_TOKENS.touch.hitSlop}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
};

export default SupportInbox;
