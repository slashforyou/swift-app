/**
 * Parameters - Modern settings screen with functional preferences
 * Architecture moderne avec design system, toggles interactifs et persistence
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../components/primitives/Screen";
import { HStack, VStack } from "../components/primitives/Stack";
import LanguageSelector from "../components/ui/LanguageSelector";
import {
    hasPlanAccess,
    normalizePlanId,
    PLAN_FEATURE_RULES,
    type PlanFeatureKey,
} from "../constants/planAccess";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useSubscription } from "../hooks/usePlans";
import { useLocalization, useTranslation } from "../localization/useLocalization";
import { trackCustomEvent } from "../services/analytics";
import {
    getNotificationPreferences,
    updateNotificationPreferences,
} from "../services/pushNotifications";
import { deleteUserAccount } from "../services/user";
import { clearSession } from "../utils/auth";
import { useAuthCheck } from "../utils/checkAuth";

// Types et interfaces
interface ParametersProps {
  navigation?: any;
}

interface AppSettings {
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    taskReminders: boolean;
  };
  preferences: {
    darkMode: boolean;
    autoSync: boolean;
    offlineMode: boolean;
    soundEnabled: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareAnalytics: boolean;
    biometricAuth: boolean;
  };
}

interface SettingSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  colors: any;
}

interface SettingItemProps {
  label: string;
  description: string;
  icon: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  color?: string;
  colors: any;
}

interface PlanFeatureRowProps {
  featureKey: PlanFeatureKey;
  canUse: boolean;
  onLockedPress: (featureKey: PlanFeatureKey) => void;
  colors: any;
  t: (key: string) => string;
}

// Composant SettingSection
const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  icon,
  children,
  colors,
}) => (
  <VStack
    gap="md"
    style={{
      backgroundColor: colors.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}
  >
    <HStack gap="sm" align="center">
      <Ionicons name={icon as any} size={24} color={colors.primary} />
      <Text
        style={{
          color: colors.text,
          fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
          fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
        }}
      >
        {title}
      </Text>
    </HStack>
    <VStack gap="sm">{children}</VStack>
  </VStack>
);

// Composant SettingItem avec Switch
const SettingItem: React.FC<SettingItemProps> = ({
  label,
  description,
  icon,
  value,
  onToggle,
  color,
  colors,
}) => {
  const accentColor = color || colors.primary;
  return (
    <HStack
      gap="md"
      align="center"
      justify="space-between"
      style={{
        backgroundColor: colors.background,
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: DESIGN_TOKENS.touch.minSize + 10,
      }}
    >
      <HStack gap="md" align="center" style={{ flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: `${accentColor}15`,
            borderRadius: DESIGN_TOKENS.radius.sm,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name={icon as any} size={20} color={accentColor} />
        </View>

        <VStack gap="xs" style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: DESIGN_TOKENS.typography.body.fontSize,
              fontWeight: "500",
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
        </VStack>
      </HStack>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: colors.backgroundTertiary,
          true: `${accentColor}40`,
        }}
        thumbColor={value ? accentColor : colors.textMuted}
        ios_backgroundColor={colors.backgroundTertiary}
      />
    </HStack>
  );
};

const PlanFeatureRow: React.FC<PlanFeatureRowProps> = ({
  featureKey,
  canUse,
  onLockedPress,
  colors,
  t,
}) => {
  const feature = PLAN_FEATURE_RULES[featureKey];

  return (
    <Pressable
      onPress={() => {
        if (!canUse) {
          onLockedPress(featureKey);
        }
      }}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? colors.backgroundTertiary
          : colors.background,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        borderWidth: 1,
        borderColor: canUse ? colors.border : colors.warning + "55",
      })}
    >
      <HStack gap="sm" align="center" justify="space-between">
        <VStack gap="xs" style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: DESIGN_TOKENS.typography.body.fontSize,
              fontWeight: "600",
            }}
          >
            {feature.label}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
            }}
          >
            {feature.description}
          </Text>
        </VStack>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: DESIGN_TOKENS.radius.sm,
            backgroundColor: canUse ? colors.success + "20" : colors.warning + "20",
          }}
        >
          <Ionicons
            name={canUse ? "checkmark-circle" : "lock-closed"}
            size={14}
            color={canUse ? colors.success : colors.warning}
          />
          <Text
            style={{
              color: canUse ? colors.success : colors.warning,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {canUse
              ? t("subscription.includedBadge") || "Inclus"
              : (t("subscription.fromPlanShort") || "Dès {{plan}}")
                  .replace("{{plan}}", feature.minPlan)}
          </Text>
        </View>
      </HStack>
    </Pressable>
  );
};

const Parameters: React.FC<ParametersProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage, getSupportedLanguages } = useLocalization();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { isLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );
  const { companyPlan, isLoading: planLoading } = useSubscription();
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      pushNotifications: true,
      emailNotifications: false,
      smsNotifications: false,
      taskReminders: true,
    },
    preferences: {
      darkMode: isDark, // SETTINGS-03: Sync with actual theme
      autoSync: true,
      offlineMode: false,
      soundEnabled: true,
    },
    privacy: {
      shareLocation: false,
      shareAnalytics: false,
      biometricAuth: true,
    },
  });

  const currentPlanTier = normalizePlanId(companyPlan?.plan?.id);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      const prefs = await getNotificationPreferences();
      if (!prefs) return;

      setSettings((prev) => ({
        ...prev,
        notifications: {
          pushNotifications: Boolean(prefs.push_enabled),
          emailNotifications: Boolean(prefs.email_enabled),
          smsNotifications: Boolean(prefs.sms_enabled),
          taskReminders: Boolean(prefs.job_reminders),
        },
      }));
    };

    loadNotificationSettings();
  }, []);

  if (isLoading) return LoadingComponent;

  const updateSetting = (
    category: keyof AppSettings,
    key: string,
    value: boolean,
  ) => {
    const previousNotifications = settings.notifications;
    const nextNotifications = {
      ...settings.notifications,
      ...(category === "notifications" ? { [key]: value } : {}),
    };

    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));

    if (category === "notifications") {
      void (async () => {
        const updated = await updateNotificationPreferences({
          push_enabled: nextNotifications.pushNotifications,
          email_enabled: nextNotifications.emailNotifications,
          sms_enabled: nextNotifications.smsNotifications,
          job_reminders: nextNotifications.taskReminders,
        });

        if (!updated) {
          setSettings((prev) => ({
            ...prev,
            notifications: previousNotifications,
          }));
          Alert.alert(
            t("common.error"),
            "Impossible de sauvegarder vos préférences de notifications.",
          );
        }
      })();
    }

    // SETTINGS-03: Handle dark mode toggle via ThemeProvider
    if (key === "darkMode") {
      toggleTheme();
    }

    // Show feedback for important changes
    if (key === "biometricAuth" && value) {
      Alert.alert(
        t("settings.alerts.biometricEnabled.title"),
        t("settings.alerts.biometricEnabled.message"),
        [{ text: t("common.ok") }],
      );
    }
  };

  const openUpgradePaywall = (featureKey: PlanFeatureKey) => {
    const feature = PLAN_FEATURE_RULES[featureKey];
    trackCustomEvent("paywall_lock_clicked", "business", {
      source: "settings_plan_access",
      feature_key: featureKey,
      current_plan: currentPlanTier,
    });

    Alert.alert(
      t("subscription.title") || "Abonnement",
      `${feature.label} ${
        (t("subscription.availableFromPlan") || "requires {{plan}}").replace(
          "{{plan}}",
          feature.minPlan,
        )
      }\n\n${t("subscription.currentPlan") || "Current"}: ${currentPlanTier}.`,
      [
        { text: t("common.cancel") || "Plus tard", style: "cancel" },
        {
          text:
            t("subscription.unlockCta") ||
            t("subscription.changePlan") ||
            "Voir les formules",
          onPress: () => {
            trackCustomEvent("paywall_upgrade_cta_clicked", "business", {
              source: "settings_plan_access_alert",
              feature_key: featureKey,
              current_plan: currentPlanTier,
            });
            navigation?.navigate("Subscription");
          },
        },
      ],
    );
  };

  const resetSettings = () => {
    Alert.alert(
      t("settings.alerts.resetSettings.title"),
      t("settings.alerts.resetSettings.message"),
      [
        { text: t("settings.alerts.resetSettings.cancel"), style: "cancel" },
        {
          text: t("settings.alerts.resetSettings.confirm"),
          style: "destructive",
          onPress: () => {
            setSettings({
              notifications: {
                pushNotifications: true,
                emailNotifications: false,
                smsNotifications: false,
                taskReminders: true,
              },
              preferences: {
                darkMode: false,
                autoSync: true,
                offlineMode: false,
                soundEnabled: true,
              },
              privacy: {
                shareLocation: false,
                shareAnalytics: false,
                biometricAuth: false,
              },
            });
            Alert.alert(
              t("settings.alerts.resetSuccess.title"),
              t("settings.alerts.resetSuccess.message"),
            );
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Toutes vos données seront supprimées.",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmer la suppression",
              "Êtes-vous sûr(e) ? Cette action ne peut pas être annulée.",
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: "Supprimer définitivement",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteUserAccount();
                      await clearSession();
                      navigation?.reset({
                        index: 0,
                        routes: [{ name: "Connection" }],
                      });
                    } catch (error) {
                      Alert.alert(
                        t("common.error"),
                        "Impossible de supprimer le compte. Veuillez réessayer.",
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t("settings.alerts.logout.title"),
      t("settings.alerts.logout.message"),
      [
        { text: t("settings.alerts.logout.cancel"), style: "cancel" },
        {
          text: t("settings.alerts.logout.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await clearSession();
              // Navigate to login screen and reset navigation stack
              navigation?.reset({
                index: 0,
                routes: [{ name: "Connection" }],
              });
            } catch (error) {
              console.error("[Logout] Error:", error);
              Alert.alert(t("common.error"), t("settings.alerts.logout.error"));
            }
          },
        },
      ],
    );
  };

  return (
    <Screen testID="parameters-screen">
      {/* Simple Back Button Header */}
      <View
        testID="parameters-header"
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.background,
        }}
      >
        <HStack gap="md" align="center" justify="space-between">
          <Pressable
            testID="parameters-back-btn"
            onPress={() => navigation?.goBack()}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? colors.backgroundTertiary
                : colors.backgroundSecondary,
              width: DESIGN_TOKENS.touch.minSize,
              height: DESIGN_TOKENS.touch.minSize,
              borderRadius: DESIGN_TOKENS.radius.md,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            })}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <Text
            testID="parameters-title-text"
            style={{
              color: colors.text,
              fontSize: DESIGN_TOKENS.typography.title.fontSize,
              fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
            }}
          >
            {t("settings.title")}
          </Text>

          <Pressable
            testID="parameters-reset-btn"
            onPress={resetSettings}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.errorLight : "transparent",
              padding: DESIGN_TOKENS.spacing.xs,
              borderRadius: DESIGN_TOKENS.radius.sm,
            })}
          >
            <Ionicons name="refresh" size={24} color={colors.error} />
          </Pressable>
        </HStack>
      </View>

      {/* Settings Content */}
      <ScrollView
        testID="parameters-scroll"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
          gap: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <VStack gap="lg">
          {/* Notifications Section */}
          <SettingSection
            colors={colors}
            title={t("settings.sections.notifications")}
            icon="notifications-outline"
          >
            <SettingItem
              colors={colors}
              label={t("settings.items.pushNotifications")}
              description={t("settings.items.pushDescription")}
              icon="phone-portrait-outline"
              value={settings.notifications.pushNotifications}
              onToggle={(value) =>
                updateSetting("notifications", "pushNotifications", value)
              }
              color={colors.primary}
            />
            <SettingItem
              colors={colors}
              label={t("settings.items.emailNotifications")}
              description={t("settings.items.emailDescription")}
              icon="mail-outline"
              value={settings.notifications.emailNotifications}
              onToggle={(value) =>
                updateSetting("notifications", "emailNotifications", value)
              }
              color={colors.info}
            />
            <SettingItem
              colors={colors}
              label={t("settings.items.smsNotifications")}
              description={t("settings.items.smsDescription")}
              icon="chatbubble-ellipses-outline"
              value={settings.notifications.smsNotifications}
              onToggle={(value) =>
                updateSetting("notifications", "smsNotifications", value)
              }
              color={colors.warning}
            />
            <SettingItem
              colors={colors}
              label={t("settings.items.taskReminders")}
              description={t("settings.items.taskRemindersDescription")}
              icon="alarm-outline"
              value={settings.notifications.taskReminders}
              onToggle={(value) =>
                updateSetting("notifications", "taskReminders", value)
              }
              color={colors.success}
            />
          </SettingSection>

          {/* Preferences Section */}
          <SettingSection
            colors={colors}
            title={t("settings.sections.preferences")}
            icon="options-outline"
          >
            <SettingItem
              colors={colors}
              label={t("settings.items.darkMode")}
              description={t("settings.items.darkModeDescription")}
              icon="moon-outline"
              value={settings.preferences.darkMode}
              onToggle={(value) =>
                updateSetting("preferences", "darkMode", value)
              }
              color={colors.textSecondary}
            />
          </SettingSection>

          {/* Language Section */}
          <SettingSection
            colors={colors}
            title={t("settings.sections.language") || "Language"}
            icon="language-outline"
          >
            <Pressable
              testID="parameters-language-btn"
              onPress={() => setShowLanguageSelector(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: DESIGN_TOKENS.touch.minSize + 10,
              })}
            >
              <HStack gap="md" align="center">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "15",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {getSupportedLanguages()[currentLanguage]?.flag}
                  </Text>
                </View>
                <VStack gap={2} style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {getSupportedLanguages()[currentLanguage]?.nativeName}
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("settings.items.changeLanguage") || "Change language"}
                  </Text>
                </VStack>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </HStack>
            </Pressable>

          </SettingSection>

          {/* Privacy Section */}
          <SettingSection
            colors={colors}
            title={t("settings.sections.privacy")}
            icon="shield-outline"
          >
            {/* Share Location — opens system settings */}
            <Pressable
              onPress={() => Linking.openSettings()}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: DESIGN_TOKENS.touch.minSize + 10,
              })}
            >
              <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                <View
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: `${colors.error}15`,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.error}
                  />
                </View>
                <VStack gap="xs" style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "500",
                    }}
                  >
                    {t("settings.items.shareLocation")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                    }}
                    numberOfLines={2}
                  >
                    {t("settings.items.shareLocationDescription") ||
                      "Tap to manage location permissions in system settings"}
                  </Text>
                </VStack>
                <Ionicons
                  name="open-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </HStack>
            </Pressable>

            {/* Privacy Policy & Terms links */}
            <Pressable
              onPress={() => Linking.openURL("https://cobbr-app.com/privacy")}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : "transparent",
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              })}
            >
              <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    color: colors.primary,
                  }}
                >
                  {t("settings.sections.privacy")} →
                </Text>
              </HStack>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL("https://cobbr-app.com/terms")}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : "transparent",
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              })}
            >
              <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                <Ionicons
                  name="reader-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    color: colors.primary,
                  }}
                >
                  {t("registration.legal.termsAndConditions") ||
                    "Terms of Service"}{" "}
                  →
                </Text>
              </HStack>
            </Pressable>

            <VStack gap="sm">
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {t("subscription.planAccessTitle") || "Accès par formule"}
              </Text>

              <PlanFeatureRow
                featureKey="advanced_notifications"
                canUse={hasPlanAccess(
                  currentPlanTier,
                  PLAN_FEATURE_RULES.advanced_notifications.minPlan,
                )}
                onLockedPress={openUpgradePaywall}
                colors={colors}
                t={t}
              />

              <PlanFeatureRow
                featureKey="invoice_branding"
                canUse={hasPlanAccess(
                  currentPlanTier,
                  PLAN_FEATURE_RULES.invoice_branding.minPlan,
                )}
                onLockedPress={openUpgradePaywall}
                colors={colors}
                t={t}
              />

              <PlanFeatureRow
                featureKey="inter_contractor_billing"
                canUse={hasPlanAccess(
                  currentPlanTier,
                  PLAN_FEATURE_RULES.inter_contractor_billing.minPlan,
                )}
                onLockedPress={openUpgradePaywall}
                colors={colors}
                t={t}
              />

              <PlanFeatureRow
                featureKey="priority_support"
                canUse={hasPlanAccess(
                  currentPlanTier,
                  PLAN_FEATURE_RULES.priority_support.minPlan,
                )}
                onLockedPress={openUpgradePaywall}
                colors={colors}
                t={t}
              />
            </VStack>
          </SettingSection>

          {/* Subscription / Plan Section */}
          <SettingSection
            colors={colors}
            title={t("subscription.title") || "Subscription"}
            icon="diamond-outline"
          >
            <Pressable
              testID="parameters-subscription-btn"
              onPress={() => navigation?.navigate("Subscription")}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: DESIGN_TOKENS.touch.minSize + 10,
              })}
            >
              <HStack gap="md" align="center">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#8B5CF615",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="card-outline" size={22} color="#8B5CF6" />
                </View>
                <VStack gap={2} style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {planLoading ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      companyPlan?.plan?.display_name || companyPlan?.plan?.label || "Free"
                    )}
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("subscription.changePlan") || "Change plan"}
                  </Text>
                </VStack>
                <View
                  style={{
                    backgroundColor: "#8B5CF620",
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#8B5CF6",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("subscription.currentPlan") || "Current"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </HStack>
            </Pressable>
          </SettingSection>

          {/* Account Section with Logout */}
          <SettingSection
            colors={colors}
            title={t("settings.sections.account")}
            icon="person-outline"
          >
            <Pressable
              testID="profile-delete-account-btn"
              onPress={handleDeleteAccount}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.errorLight : "transparent",
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              })}
            >
              <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.error}15`,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={colors.error}
                  />
                </View>
                <VStack gap={2} style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "600",
                      color: colors.error,
                    }}
                  >
                    Supprimer mon compte
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    Supprimer définitivement mon compte et mes données
                  </Text>
                </VStack>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </HStack>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.errorLight : "transparent",
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              })}
            >
              <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.error}15`,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={colors.error}
                  />
                </View>
                <VStack gap={2} style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "600",
                      color: colors.error,
                    }}
                  >
                    {t("settings.items.logout")}
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("settings.items.logoutDescription")}
                  </Text>
                </VStack>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </HStack>
            </Pressable>
          </SettingSection>
        </VStack>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </Screen>
  );
};

export default Parameters;
