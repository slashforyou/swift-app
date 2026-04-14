/**
 * SupportFAQ — Écran d'aide avec FAQ par catégories
 * L'utilisateur doit d'abord explorer les FAQ avant de pouvoir contacter le support
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  key: string;
  icon: IoniconsName;
  color: string;
}

const FAQ_CATEGORIES: FAQCategory[] = [
  { key: "gettingStarted", icon: "rocket-outline", color: "#3B82F6" },
  { key: "jobsCalendar", icon: "calendar-outline", color: "#10B981" },
  { key: "payments", icon: "card-outline", color: "#8B5CF6" },
  { key: "teams", icon: "people-outline", color: "#F59E0B" },
  { key: "technical", icon: "construct-outline", color: "#EF4444" },
];

interface Props {
  navigation: any;
}

const SupportFAQ: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const getFAQItems = (categoryKey: string): FAQItem[] => {
    const items: FAQItem[] = [];
    for (let i = 1; i <= 5; i++) {
      const q = t(`supportFAQ.categories.${categoryKey}.q${i}` as any);
      const a = t(`supportFAQ.categories.${categoryKey}.a${i}` as any);
      if (q && a && !q.includes("supportFAQ.")) {
        items.push({ question: q, answer: a });
      }
    }
    return items;
  };

  const renderCategoryList = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        paddingBottom: insets.bottom + 100,
        gap: DESIGN_TOKENS.spacing.sm,
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        {t("supportFAQ.title")}
      </Text>
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.body.fontSize,
          color: colors.textSecondary,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          lineHeight: 22,
        }}
      >
        {t("supportFAQ.subtitle")}
      </Text>

      {/* Categories */}
      {FAQ_CATEGORIES.map((cat) => (
        <Pressable
          key={cat.key}
          onPress={() => setSelectedCategory(cat.key)}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: cat.color + "15",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={cat.icon} size={22} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {t(`supportFAQ.categories.${cat.key}.title` as any)}
            </Text>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {t(`supportFAQ.categories.${cat.key}.subtitle` as any)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderFAQDetail = () => {
    const items = getFAQItems(selectedCategory!);
    const cat = FAQ_CATEGORIES.find((c) => c.key === selectedCategory)!;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {/* Category title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.sm,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: cat.color + "15",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={cat.icon} size={18} color={cat.color} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t(`supportFAQ.categories.${selectedCategory}.title` as any)}
          </Text>
        </View>

        {/* FAQ items */}
        {items.map((item, index) => (
          <Pressable
            key={index}
            onPress={() =>
              setExpandedQuestion(expandedQuestion === index ? null : index)
            }
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: DESIGN_TOKENS.spacing.md,
                gap: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: "600",
                  color: colors.text,
                  lineHeight: 22,
                }}
              >
                {item.question}
              </Text>
              <Ionicons
                name={
                  expandedQuestion === index
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={20}
                color={colors.textMuted}
              />
            </View>
            {expandedQuestion === index && (
              <View
                style={{
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  paddingBottom: DESIGN_TOKENS.spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    color: colors.textSecondary,
                    lineHeight: 22,
                  }}
                >
                  {item.answer}
                </Text>
              </View>
            )}
          </Pressable>
        ))}

        {/* Didn't find answer — CTA to contact support */}
        <View
          style={{
            marginTop: DESIGN_TOKENS.spacing.lg,
            backgroundColor: colors.primary + "10",
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.sm,
            borderWidth: 1,
            borderColor: colors.primary + "30",
          }}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={32}
            color={colors.primary}
          />
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: "600",
              color: colors.text,
              textAlign: "center",
            }}
          >
            {t("supportFAQ.stillNeedHelp")}
          </Text>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            {t("supportFAQ.stillNeedHelpDesc")}
          </Text>
          <Pressable
            onPress={() => navigation.navigate("SupportInbox")}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? colors.primary + "DD"
                : colors.primary,
              borderRadius: DESIGN_TOKENS.radius.md,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              paddingHorizontal: DESIGN_TOKENS.spacing.xl,
              marginTop: DESIGN_TOKENS.spacing.xs,
            })}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
              }}
            >
              {t("supportFAQ.contactSupport")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

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
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
              setExpandedQuestion(null);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={DESIGN_TOKENS.touch.hitSlop}
          style={{ marginRight: DESIGN_TOKENS.spacing.md }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: DESIGN_TOKENS.typography.title.fontSize,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {t("supportFAQ.headerTitle")}
        </Text>
      </View>

      {/* Content */}
      {selectedCategory ? renderFAQDetail() : renderCategoryList()}
    </View>
  );
};

export default SupportFAQ;
