/**
 * Home - Écran d'accueil moderne avec gamification et traductions
 * Architecture moderne avec Safe Areas, ProfileHeader et navigation cohérente
 */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, InteractionManager, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DevMenu from "../components/dev/DevMenu";
import NotificationsPanel from "../components/home/NotificationsPanel";
import OnboardingChecklistCard from "../components/home/OnboardingChecklist";
import PendingAssignmentsSection from "../components/home/PendingAssignmentsSection";
import ProfileHeader from "../components/home/ProfileHeader";
import TodaySection from "../components/home/TodaySection";
import { Screen } from "../components/primitives/Screen";
import { HStack, VStack } from "../components/primitives/Stack";
import { HeaderLogo } from "../components/ui/HeaderLogo";
import HelpButton from "../components/ui/HelpButton";
import { ONBOARDING_CONFIG } from "../constants/onboarding";
import { ServerData } from "../constants/ServerData";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useNotifications } from "../context/NotificationsProvider";
import { useOnboardingTarget } from "../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../context/OnboardingTourContext";
import { useTheme } from "../context/ThemeProvider";
import { usePushNotifications } from "../hooks/usePushNotifications";
import DailyRecapModal, { recapSeenKey } from "./DailyRecapModal";

import { useUserProfile } from "../hooks/useUserProfile";
import { useTranslation } from "../localization";
import { DailyRecapData, fetchDailyRecap } from "../services/gamificationV2";
import { clearSession } from "../utils/auth";
import { useAuthCheck } from "../utils/checkAuth";
import { clearLocalSession } from "../utils/session";

// Types et interfaces
interface HomeScreenProps {
  navigation: any;
}

const NOTIFICATION_WIZARD_DISMISSED_KEY = "notification_wizard_dismissed_v1";

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, setCompanyColor } = useTheme();
  const { t } = useTranslation();
  const {
    currentStep: onboardingStep,
    isActive: onboardingActive,
    setStep1Ready,
  } = useOnboardingTour();
  const calendarPulse = useRef(new Animated.Value(1)).current;
  const step1DelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step1FallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionsRef = useRef<{ cancel?: () => void } | null>(null);
  const [isHomeLaidOut, setIsHomeLaidOut] = useState(false);
  const calendarTarget = useOnboardingTarget(2);

  const clearStep1GateTimers = useCallback(() => {
    if (step1DelayTimerRef.current) {
      clearTimeout(step1DelayTimerRef.current);
      step1DelayTimerRef.current = null;
    }
    if (step1FallbackTimerRef.current) {
      clearTimeout(step1FallbackTimerRef.current);
      step1FallbackTimerRef.current = null;
    }
    interactionsRef.current?.cancel?.();
    interactionsRef.current = null;
  }, []);

  // Pulsing animation on Calendar button during step 2
  useEffect(() => {
    if (onboardingActive && onboardingStep === 2) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(calendarPulse, { toValue: 1.03, duration: 600, useNativeDriver: true }),
          Animated.timing(calendarPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      calendarPulse.setValue(1);
    }
  }, [onboardingActive, onboardingStep, calendarPulse]);

  // Step 1 modal: wait until Home is laid out, then add a small delay.
  // Hard fallback kicks in if onLayout never fires (e.g., screen error).
  useEffect(() => {
    clearStep1GateTimers();

    if (!onboardingActive || onboardingStep !== 1 || isLoading) {
      setStep1Ready(false);
      return;
    }

    if (!isHomeLaidOut) {
      // Layout not yet reported — arm the hard fallback so the tour can
      // still start even if onLayout never fires.
      step1FallbackTimerRef.current = setTimeout(() => {
        setStep1Ready(true);
      }, ONBOARDING_CONFIG.STEP1_LAYOUT_FALLBACK_MS);
      return () => {
        clearStep1GateTimers();
      };
    }

    interactionsRef.current = InteractionManager.runAfterInteractions(() => {
      step1DelayTimerRef.current = setTimeout(() => {
        setStep1Ready(true);
      }, ONBOARDING_CONFIG.STEP1_REVEAL_DELAY_MS);
    });

    return () => {
      clearStep1GateTimers();
    };
  }, [
    onboardingActive,
    onboardingStep,
    isLoading,
    isHomeLaidOut,
    clearStep1GateTimers,
    setStep1Ready,
  ]);

  useEffect(() => {
    return () => {
      clearStep1GateTimers();
      setStep1Ready(false);
    };
  }, [clearStep1GateTimers, setStep1Ready]);
  const { isLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotificationWizard, setShowNotificationWizard] = useState(false);
  const [dailyRecapData, setDailyRecapData] = useState<DailyRecapData | null>(null);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const { profile, refreshProfile } = useUserProfile();
  const { permissionStatus, requestPermission, isLoading: isPushLoading } =
    usePushNotifications();


  // Sync company brand color on first load
  useEffect(() => {
    (async () => {
      try {
        const headers = await (await import("../utils/auth")).getAuthHeaders();
        const res = await fetch(`${ServerData.serverUrl}v1/companies/me`, { headers });
        const json = await res.json();
        if (json.success && json.data?.primary_color) {
          setCompanyColor(json.data.primary_color);
        }
      } catch {}
    })();
  }, []);

  // Rafraîchir le profil quand l'écran revient au focus (ex: après changement d'avatar)
  // Vérifier aussi le récap quotidien
  useFocusEffect(
    useCallback(() => {
      refreshProfile();

      // Récap quotidien : vérifier si disponible et pas encore affiché
      (async () => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const seen = await AsyncStorage.getItem(recapSeenKey(today));
          if (seen) return;
          const recap = await fetchDailyRecap(today);
          if (recap) setDailyRecapData(recap);
        } catch {}
      })();
    }, []),
  );

  useEffect(() => {
    (async () => {
      try {
        if (permissionStatus !== "undetermined") {
          setShowNotificationWizard(false);
          return;
        }

        const dismissed = await AsyncStorage.getItem(
          NOTIFICATION_WIZARD_DISMISSED_KEY,
        );
        if (!dismissed) {
          setShowNotificationWizard(true);
        }
      } catch {
        // Ignore storage errors: wizard is non-critical.
      }
    })();
  }, [permissionStatus]);

  const dismissNotificationWizard = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_WIZARD_DISMISSED_KEY, "1");
    } catch {}
    setShowNotificationWizard(false);
  };

  const enableNotificationsFromWizard = async () => {
    const granted = await requestPermission();
    await dismissNotificationWizard();

    if (!granted) {
      Alert.alert(
        t("home.notificationsPrompt.permissionDeniedTitle") ||
          "Notifications disabled",
        t("home.notificationsPrompt.permissionDeniedMessage") ||
          "You can enable notifications later in Settings.",
      );
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await clearSession();
      await clearLocalSession();
      navigation.reset({ index: 0, routes: [{ name: "Connection" }] });
    } catch {
      Alert.alert(t("common.error"), t("settings.alerts.logout.error"));
    }
  };

  // Dimensions fixes pour garantir que tout rentre dans l'écran
  const LOGO_HEIGHT = 32;
  const PROFILE_HEADER_HEIGHT = 95; // Header + barre progression
  const TODAY_SECTION_HEIGHT = 56; // Ligne compacte
  const MENU_ITEM_HEIGHT = 60; // Hauteur fixe pour chaque item de menu
  const BOTTOM_PADDING = 32; // Espace pour les boutons Samsung

  // Composant MenuItem interne avec accès aux couleurs du thème
  const MenuItem = ({
    title,
    icon,
    description,
    onPress,
    color = colors.primary,
    testID,
  }: {
    title: string;
    icon: string;
    description: string;
    onPress: () => void;
    color?: string;
    testID?: string;
  }) => (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? colors.backgroundTertiary
          : colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.sm,
        marginBottom: DESIGN_TOKENS.spacing.xs,
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: MENU_ITEM_HEIGHT,
      })}
    >
      <HStack gap="md" align="center">
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: color,
            borderRadius: DESIGN_TOKENS.radius.md,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={icon as any}
            size={24}
            color={colors.buttonPrimaryText}
          />
        </View>

        <VStack gap="xs" style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
              fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
              fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
            }}
          >
            {description}
          </Text>
        </VStack>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </HStack>
    </Pressable>
  );

  if (isLoading) return LoadingComponent;

  return (
    <Screen testID="home-screen">
      <VStack
        onLayout={() => {
          if (!isHomeLaidOut) setIsHomeLaidOut(true);
        }}
        style={{
          flex: 1,
          paddingTop: insets.top + DESIGN_TOKENS.spacing.xs,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + BOTTOM_PADDING,
        }}
      >
        {/* Barre du haut - Notifications (gauche) + Logo (centre) + Langue (droite) */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 0,
          }}
        >
          <Pressable
            testID="home-notifications-btn"
            onPress={() => setShowNotifications(true)}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed
                ? colors.backgroundTertiary
                : colors.backgroundSecondary,
              justifyContent: "center",
              alignItems: "center",
            })}
          >
            <Ionicons
              name="notifications"
              size={20}
              color={colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: colors.error,
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "700" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <HeaderLogo preset="sm" marginVertical={0} />

          <HelpButton />
        </View>

        {/* Profile Header */}
        <View
          style={{
            height: PROFILE_HEADER_HEIGHT,
            marginHorizontal: -DESIGN_TOKENS.spacing.lg,
          }}
        >
          <ProfileHeader navigation={navigation} avatarId={profile?.avatarId} />
        </View>

        {/* Today Section */}
        <View
          style={{
            height: TODAY_SECTION_HEIGHT,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}
        >
          <TodaySection
            onPress={() => {
              const today = new Date();
              navigation.navigate("Calendar", {
                screen: "Day",
                params: {
                  day: today.getDate(),
                  month: today.getMonth() + 1,
                  year: today.getFullYear(),
                },
              });
            }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Pending contractor assignments – visible only when present */}
        <PendingAssignmentsSection navigation={navigation} />

        {/* Onboarding checklist – visible until all steps completed */}
        <OnboardingChecklistCard navigation={navigation} />

        {/* Menu Items - prennent l'espace restant */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-start",
          }}
        >
          <VStack gap="xs">
            <Animated.View
              ref={calendarTarget.ref}
              onLayout={calendarTarget.onLayout}
              style={[
                onboardingActive && onboardingStep === 2 && {
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 10,
                  elevation: 6,
                },
                { transform: [{ scale: calendarPulse }] },
              ]}
            >
              <MenuItem
                testID="home-calendar-btn"
                title={t("home.calendar.title")}
                icon="calendar"
                description={t("home.calendar.description")}
                onPress={() => navigation.navigate("Calendar")}
                color={colors.primary}
              />
            </Animated.View>

            <MenuItem
              testID="home-business-btn"
              title={t("home.business.title")}
              icon="business"
              description={t("home.business.description")}
              onPress={() => navigation.navigate("Business")}
              color={colors.success}
            />

            {/* Settings (petit, gauche) + Déconnexion (droite) */}
            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}
            >
              {/* Bouton Paramètres — compact */}
              <Pressable
                testID="home-parameters-btn"
                onPress={() => navigation.navigate("Parameters")}
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xs,
                  paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: colors.warning,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="settings"
                    size={15}
                    color={colors.buttonPrimaryText}
                  />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    fontWeight: "600",
                  }}
                >
                  {t("home.parameters.title")}
                </Text>
              </Pressable>

              {/* Bouton Déconnexion — flex 1 */}
              <Pressable
                testID="home-logout-btn"
                onPress={handleLogout}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.xs,
                  paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: colors.error + "50",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: colors.error,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="log-out-outline" size={15} color="white" />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {t("settings.items.logout")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            {/* Feedback CTA — Share your ideas */}
            <Pressable
              testID="home-feedback-btn"
              onPress={() => navigation.navigate("FeedbackForm")}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.primary + "20"
                  : colors.primary + "10",
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.primary + "30",
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
              })}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: colors.primary + "20",
                  borderRadius: DESIGN_TOKENS.radius.sm,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="bulb-outline" size={15} color={colors.primary} />
              </View>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                {t("home.feedback.cta")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </VStack>
        </View>
      </VStack>



      {__DEV__ && (
        <Pressable
          testID="home-dev-menu-btn"
          onPress={() => {
            setShowDevMenu(true);
          }}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            right: DESIGN_TOKENS.spacing.lg,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
          hitSlop={DESIGN_TOKENS.touch.hitSlop}
        >
          <Ionicons name="terminal" size={24} color={colors.textSecondary} />
        </Pressable>
      )}

      {__DEV__ && (
        <DevMenu visible={showDevMenu} onClose={() => setShowDevMenu(false)} />
      )}

      {/* Récap XP quotidien — affiché 15 min après le dernier job de la journée */}
      {dailyRecapData && (
        <DailyRecapModal
          data={dailyRecapData}
          onClose={() => setDailyRecapData(null)}
        />
      )}

      {/* Logout confirmation modal — testID-based so Maestro can interact reliably */}
      <Modal
        testID="logout-confirm-modal"
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.xl,
              width: "100%",
              gap: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: DESIGN_TOKENS.typography.title.fontSize,
                fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
                textAlign: "center",
              }}
            >
              {t("settings.alerts.logout.title")}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                textAlign: "center",
              }}
            >
              {t("settings.alerts.logout.message")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: DESIGN_TOKENS.spacing.sm,
                marginTop: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Pressable
                testID="logout-cancel-btn"
                onPress={() => setShowLogoutConfirm(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("settings.alerts.logout.cancel")}
                </Text>
              </Pressable>
              <Pressable
                testID="logout-confirm-btn"
                onPress={confirmLogout}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? (colors.errorDark ?? colors.error)
                    : colors.error,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  alignItems: "center",
                })}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {t("settings.alerts.logout.confirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <NotificationsPanel
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <Modal
        testID="notification-wizard-modal"
        visible={showNotificationWizard}
        transparent
        animationType="fade"
        onRequestClose={dismissNotificationWizard}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 28,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.xl,
              width: "100%",
              gap: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: DESIGN_TOKENS.typography.title.fontSize,
                fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
                textAlign: "center",
              }}
            >
              {t("home.notificationsPrompt.title") ||
                "Enable notifications"}
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {t("home.notificationsPrompt.message") ||
                "Get job updates, reminders, and payment alerts in real time."}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: DESIGN_TOKENS.spacing.sm,
                marginTop: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Pressable
                testID="notification-wizard-later-btn"
                onPress={dismissNotificationWizard}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("home.notificationsPrompt.later") || "Later"}
                </Text>
              </Pressable>

              <Pressable
                testID="notification-wizard-enable-btn"
                onPress={enableNotificationsFromWizard}
                disabled={isPushLoading}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? colors.primaryDark : colors.primary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  alignItems: "center",
                  opacity: isPushLoading ? 0.6 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {t("home.notificationsPrompt.enable") || "Enable"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

export default HomeScreen;
