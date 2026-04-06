/**
 * SupportNewConversation — Créer une nouvelle conversation de support
 * Étape 1: Choisir catégorie, Étape 2: Écrire sujet + premier message
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useConversations } from "../../hooks/useSupport";
import { useTranslation } from "../../localization";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SupportStackParamList = {
  SupportInbox: undefined;
  SupportConversation: { conversationId: number; subject: string };
  SupportNewConversation: undefined;
};

type Category = "help" | "feedback" | "feature" | "bug";
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const CATEGORIES: {
  key: Category;
  icon: IoniconsName;
  colorKey: "info" | "success" | "warning" | "error";
}[] = [
  { key: "help", icon: "help-circle-outline", colorKey: "info" },
  { key: "feedback", icon: "chatbubble-ellipses-outline", colorKey: "success" },
  { key: "feature", icon: "bulb-outline", colorKey: "warning" },
  { key: "bug", icon: "bug-outline", colorKey: "error" },
];

interface Props {
  navigation: NativeStackNavigationProp<SupportStackParamList, "SupportNewConversation">;
}

const SupportNewConversation: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { create } = useConversations();

  const [category, setCategory] = useState<Category | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!category || !message.trim()) return;
    setSending(true);
    try {
      const finalSubject =
        subject.trim() || t(`support.categories.${category}`);
      const conv = await create({ category, subject: finalSubject, message: message.trim() });
      navigation.replace("SupportConversation", {
        conversationId: conv.id,
        subject: finalSubject,
      });
    } catch {
      Alert.alert(t("common.error"), t("support.errorSending"));
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            {t("support.newConversation")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: DESIGN_TOKENS.spacing.lg,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Category */}
        <Text
          style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: "700",
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          {t("support.chooseCategory")}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: DESIGN_TOKENS.spacing.sm,
            marginBottom: DESIGN_TOKENS.spacing.xl,
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.key;
            const catColor = colors[cat.colorKey];
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={({ pressed }) => ({
                  flexBasis: "47%",
                  flexGrow: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: DESIGN_TOKENS.spacing.sm,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  backgroundColor: isSelected
                    ? catColor + "15"
                    : pressed
                      ? colors.backgroundTertiary
                      : colors.backgroundSecondary,
                  borderWidth: 2,
                  borderColor: isSelected ? catColor : colors.border,
                })}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: catColor + "20",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name={cat.icon} size={20} color={catColor} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    fontWeight: isSelected ? "700" : "600",
                    color: isSelected ? catColor : colors.text,
                  }}
                >
                  {t(`support.categories.${cat.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Step 2: Subject + Message (visible once category selected) */}
        {category && (
          <>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("support.subjectLabel")}
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={t(`support.categories.${category}`)}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t("support.subjectLabel") || "Subject"}
              maxLength={200}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                color: colors.text,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            />

            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("support.messageLabel")}
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t("support.messagePlaceholder")}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t("support.messageLabel") || "Message"}
              multiline
              maxLength={5000}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                minHeight: 120,
                textAlignVertical: "top",
                color: colors.text,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            />

            {/* Send button */}
            <Pressable
              onPress={handleSend}
              disabled={sending || message.trim().length === 0}
              style={({ pressed }) => ({
                backgroundColor:
                  sending || message.trim().length === 0
                    ? colors.primary + "60"
                    : pressed
                      ? colors.primary + "DD"
                      : colors.primary,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: DESIGN_TOKENS.spacing.sm,
              })}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
              <Text
                style={{
                  color: "white",
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: "700",
                }}
              >
                {sending ? t("support.sending") : t("support.send")}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SupportNewConversation;
