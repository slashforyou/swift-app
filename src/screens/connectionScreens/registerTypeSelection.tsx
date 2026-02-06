import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedBackground from "../../components/ui/AnimatedBackground";
import { HeaderLogo } from "../../components/ui/HeaderLogo";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useTranslation } from "../../localization";

type RootStackParamList = {
  Connection: undefined;
  Subscribe: undefined;
  BusinessOwnerRegistration: undefined;
};

interface RegisterTypeSelectionProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const RegisterTypeSelection: React.FC<RegisterTypeSelectionProps> = ({
  navigation,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const accountTypes = [
    {
      id: "business",
      title: t("auth.registration.businessOwner.title"),
      subtitle: t("auth.registration.businessOwner.subtitle"),
      icon: "🏢",
      features: [
        t("auth.registration.businessOwner.feature1"),
        t("auth.registration.businessOwner.feature2"),
        t("auth.registration.businessOwner.feature3"),
      ],
      route: "BusinessOwnerRegistration" as const,
      recommended: true,
    },
    {
      id: "employee",
      title: t("auth.registration.employee.title"),
      subtitle: t("auth.registration.employee.subtitle"),
      icon: "👤",
      features: [
        t("auth.registration.employee.feature1"),
        t("auth.registration.employee.feature2"),
        t("auth.registration.employee.feature3"),
      ],
      route: "Subscribe" as const,
      recommended: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground opacity={0.05} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => navigation.navigate("Connection")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.backgroundSecondary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={[
              styles.body,
              { color: colors.textSecondary, fontWeight: "600" },
            ]}
          >
            ← {t("common.back")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Cobbr */}
        <HeaderLogo size={120} variant="square" marginVertical={20} />

        {/* Title Section */}
        <View style={{ marginTop: 0, marginBottom: 30 }}>
          <Text style={[styles.title, { fontSize: 24, marginBottom: 8 }]}>
            {t("auth.registration.selectAccountType.title")}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t("auth.registration.selectAccountType.subtitle")}
          </Text>
        </View>

        {/* Account Type Cards */}
        {accountTypes.map((type) => (
          <Pressable
            key={type.id}
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: type.recommended ? colors.primary : colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => navigation.navigate(type.route)}
          >
            {type.recommended && (
              <View
                style={{
                  position: "absolute",
                  top: -10,
                  right: 20,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={[
                    styles.bodySmall,
                    { color: colors.background, fontWeight: "600" },
                  ]}
                >
                  {t("auth.registration.recommended")}
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary + "15",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>{type.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.subtitle,
                    { fontWeight: "700", marginBottom: 4 },
                  ]}
                >
                  {type.title}
                </Text>
                <Text
                  style={[styles.bodySmall, { color: colors.textSecondary }]}
                >
                  {type.subtitle}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {type.features.map((feature, idx) => (
                <View
                  key={idx}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <Text
                    style={{
                      color: colors.success,
                      marginRight: 8,
                      fontSize: 16,
                    }}
                  >
                    ✓
                  </Text>
                  <Text style={[styles.body, { color: colors.text, flex: 1 }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text
                style={[
                  styles.body,
                  {
                    color: colors.primary,
                    fontWeight: "600",
                    textAlign: "center",
                  },
                ]}
              >
                {t("auth.registration.selectAccountType.continueAs")}{" "}
                {type.title.toLowerCase()} →
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Help Text */}
        <View
          style={{
            marginTop: 20,
            padding: 16,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
          }}
        >
          <Text
            style={[
              styles.bodySmall,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            💡 {t("auth.registration.selectAccountType.helpText")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterTypeSelection;
