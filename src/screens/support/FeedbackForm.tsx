/**
 * FeedbackForm — Simple feedback form: one textarea + send button.
 */
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useConversations } from "../../hooks/useSupport";
import { useTranslation } from "../../localization";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const FeedbackForm: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { create } = useConversations();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await create({
        category: "feedback",
        subject: t("home.feedback.cta") || "Feedback",
        message: message.trim(),
      });
      setSent(true);
    } catch {
      Alert.alert(t("common.error"), t("support.errorSending"));
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: DESIGN_TOKENS.spacing.sm,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
              style={{ marginRight: DESIGN_TOKENS.spacing.md }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontSize: DESIGN_TOKENS.typography.title.fontSize,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {t("home.feedback.title")}
            </Text>
          </View>
        </View>

        {/* Success */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: DESIGN_TOKENS.spacing.xl,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.success + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <Ionicons name="checkmark" size={32} color={colors.success} />
          </View>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}
          >
            {t("home.feedback.thankYouTitle")}
          </Text>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.body.fontSize,
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: DESIGN_TOKENS.spacing.xl,
            }}
          >
            {t("home.feedback.thankYouMessage")}
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: colors.primary,
              borderRadius: DESIGN_TOKENS.radius.md,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              paddingHorizontal: DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
              }}
            >
              {t("common.back")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: DESIGN_TOKENS.spacing.sm,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
              style={{ marginRight: DESIGN_TOKENS.spacing.md }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontSize: DESIGN_TOKENS.typography.title.fontSize,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {t("home.feedback.title")}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View
          style={{
            flex: 1,
            padding: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.body.fontSize,
              color: colors.textMuted,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {t("home.feedback.description")}
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t("home.feedback.placeholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={{
              flex: 1,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: DESIGN_TOKENS.spacing.md,
              fontSize: DESIGN_TOKENS.typography.body.fontSize,
              color: colors.text,
              maxHeight: 200,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || sending}
            style={({ pressed }) => ({
              backgroundColor:
                !message.trim() || sending
                  ? colors.textMuted + "40"
                  : pressed
                    ? colors.primary + "CC"
                    : colors.primary,
              borderRadius: DESIGN_TOKENS.radius.md,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              marginTop: DESIGN_TOKENS.spacing.lg,
            })}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
              }}
            >
              {sending ? t("support.sending") : t("support.send")}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FeedbackForm;
