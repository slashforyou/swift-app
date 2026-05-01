/**
 * SupportConversation — Écran de chat avec le support
 * Affiche les messages en mode bulle (user à droite, admin à gauche)
 */
import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useConversationMessages } from "../../hooks/useSupport";
import { useTranslation } from "../../localization";
import { analytics } from "../../services/analytics";
import { Message } from "../../services/supportService";

type SupportStackParamList = {
  SupportInbox: undefined;
  SupportConversation: { conversationId: number; subject: string };
  SupportNewConversation: undefined;
};

interface SupportConversationProps {
  navigation: NativeStackNavigationProp<SupportStackParamList, "SupportConversation">;
  route: RouteProp<SupportStackParamList, "SupportConversation">;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string, t: (key: string) => string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return t("common.today") || "Today";
  if (d.toDateString() === yesterday.toDateString()) return t("common.yesterday") || "Yesterday";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | undefined,
): boolean {
  if (!previous) return true;
  return (
    new Date(current.created_at).toDateString() !==
    new Date(previous.created_at).toDateString()
  );
}

const SupportConversation: React.FC<SupportConversationProps> = ({
  navigation,
  route,
}) => {
  const { conversationId, subject } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { messages, isLoading, send } = useConversationMessages(conversationId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await send(trimmed);
      analytics.trackCustomEvent('message_sent', 'business', { conversation_id: conversationId });
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, send]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender_type === "user";
    const prev = index > 0 ? messages[index - 1] : undefined;
    const showDate = shouldShowDateSeparator(item, prev);

    return (
      <>
        {showDate && (
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={formatDateSeparator(item.created_at, t)}
            style={{
              alignItems: "center",
              marginVertical: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: colors.textMuted,
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                paddingVertical: 2,
                borderRadius: DESIGN_TOKENS.radius.sm,
                overflow: "hidden",
              }}
            >
              {formatDateSeparator(item.created_at, t)}
            </Text>
          </View>
        )}
        <View
          style={{
            alignSelf: isUser ? "flex-end" : "flex-start",
            maxWidth: "80%",
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}
        >
          {!isUser && (
            <Text
              style={{
                fontSize: 10,
                color: colors.textMuted,
                marginBottom: 2,
                marginLeft: 4,
                fontWeight: "600",
              }}
            >
              {t("support.admin")}
            </Text>
          )}
          <View
            style={{
              backgroundColor: isUser
                ? colors.primary
                : colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderBottomRightRadius: isUser ? 4 : DESIGN_TOKENS.radius.lg,
              borderBottomLeftRadius: isUser ? DESIGN_TOKENS.radius.lg : 4,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Text
              style={{
                color: isUser ? "white" : colors.text,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                lineHeight: 20,
              }}
            >
              {item.message}
            </Text>
            <Text
              style={{
                color: isUser ? "rgba(255,255,255,0.6)" : colors.textMuted,
                fontSize: 10,
                alignSelf: "flex-end",
                marginTop: 2,
              }}
            >
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
          }}
        >
          <Pressable
            onPress={() => { analytics.trackButtonPress('back_btn', 'SupportConversation', { conversation_id: conversationId }); navigation.goBack(); }}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("common.back") || "Back"}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {subject}
            </Text>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize - 1,
                color: colors.textMuted,
              }}
            >
              {t("support.title")}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoading && messages.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            flexGrow: 1,
            justifyContent: messages.length === 0 ? "center" : "flex-end",
          }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: colors.textMuted,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
              }}
            >
              {t("support.noMessages")}
            </Text>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* Input Bar */}
      <View
        style={{
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingTop: DESIGN_TOKENS.spacing.sm,
          paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("support.messagePlaceholder")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("support.messagePlaceholder") || "Message"}
          multiline
          maxLength={5000}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: DESIGN_TOKENS.radius.lg,
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            color: colors.text,
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            maxHeight: 100,
            minHeight: 40,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={sending || text.trim().length === 0}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t("support.send") || "Send"}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              sending || text.trim().length === 0
                ? colors.primary + "40"
                : pressed
                  ? colors.primary + "DD"
                  : colors.primary,
            justifyContent: "center",
            alignItems: "center",
          })}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={18} color="white" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SupportConversation;
