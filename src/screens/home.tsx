/**
 * Home - Écran d'accueil moderne avec gamification et traductions
 * Architecture moderne avec Safe Areas, ProfileHeader et navigation cohérente
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DevMenu from "../components/dev/DevMenu";
import PendingAssignmentsSection from "../components/home/PendingAssignmentsSection";
import NotificationsPanel from "../components/home/NotificationsPanel";
import ProfileHeader from "../components/home/ProfileHeader";
import TodaySection from "../components/home/TodaySection";
import { Screen } from "../components/primitives/Screen";
import { HStack, VStack } from "../components/primitives/Stack";
import { HeaderLogo } from "../components/ui/HeaderLogo";
import RoundLanguageButton from "../components/ui/RoundLanguageButton";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useNotifications } from "../context/NotificationsProvider";
import { useTheme } from "../context/ThemeProvider";
import { useStripeConnection } from "../hooks/useStripeConnection";
import { useTranslation } from "../localization";
import { FeedbackType, submitFeedback } from "../services/feedbackService";
import { clearSession } from "../utils/auth";
import { useAuthCheck } from "../utils/checkAuth";
import { clearLocalSession } from "../utils/session";
import { useUserProfile } from "../hooks/useUserProfile";

// Types et interfaces
interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { status: stripeStatus, loading: stripeLoading } =
    useStripeConnection();
  const { isLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const { profile, refreshProfile } = useUserProfile();

  // Rafraîchir le profil quand l'écran revient au focus (ex: après changement d'avatar)
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, []),
  );

  const contactCategories = [
    {
      key: "help" as FeedbackType,
      icon: "help-circle-outline" as const,
      label: t("home.contact.helpLabel"),
      color: colors.info,
    },
    {
      key: "feedback" as FeedbackType,
      icon: "chatbubble-ellipses-outline" as const,
      label: t("home.contact.feedbackLabel"),
      color: colors.success,
    },
    {
      key: "feature" as FeedbackType,
      icon: "bulb-outline" as const,
      label: t("home.contact.featureLabel"),
      color: colors.warning,
    },
    {
      key: "bug" as FeedbackType,
      icon: "bug-outline" as const,
      label: t("home.contact.bugLabel"),
      color: colors.error,
    },
  ];

  const closeContactModal = () => {
    setShowContactModal(false);
    setFeedbackType(null);
    setFeedbackMessage("");
  };

  const handleSendFeedback = async () => {
    if (!feedbackType || !feedbackMessage.trim()) return;
    setFeedbackSending(true);
    try {
      await submitFeedback({
        type: feedbackType,
        message: feedbackMessage.trim(),
      });
      closeContactModal();
      Alert.alert(
        t("home.contact.thankYou"),
        t("home.contact.thankYouMessage"),
      );
    } catch {
      Alert.alert(t("common.error"), t("home.contact.errorSending"));
    } finally {
      setFeedbackSending(false);
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

          <RoundLanguageButton />
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

        {/* Stripe alert – visible si Stripe n'est pas actif */}
        {!stripeLoading && stripeStatus !== "active" && (
          <Pressable
            testID="home-stripe-alert"
            onPress={() =>
              navigation.navigate("Business", { initialTab: "JobsBilling" })
            }
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? colors.error + "30"
                : colors.error + "15",
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.error + "40",
              padding: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: DESIGN_TOKENS.spacing.sm,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.error + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="card-outline" size={22} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: "700",
                  color: colors.error,
                  marginBottom: 2,
                }}
              >
                {t("home.stripeAlert.title")}
              </Text>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  color: colors.text,
                  lineHeight: 18,
                }}
              >
                {t("home.stripeAlert.description")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </Pressable>
        )}

        {/* Menu Items - prennent l'espace restant */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-start",
          }}
        >
          <VStack gap="xs">
            <MenuItem
              testID="home-calendar-btn"
              title={t("home.calendar.title")}
              icon="calendar"
              description={t("home.calendar.description")}
              onPress={() => navigation.navigate("Calendar")}
              color={colors.primary}
            />

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
          </VStack>
        </View>
      </VStack>

      {/* Bouton contact / feedback — FAB en bas à gauche */}
      <Pressable
        testID="home-contact-btn"
        onPress={() => setShowContactModal(true)}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
          left: DESIGN_TOKENS.spacing.lg,
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
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
        hitSlop={DESIGN_TOKENS.touch.hitSlop}
      >
        <Ionicons name="chatbubbles" size={26} color="white" />
      </Pressable>

      {/* Contact modal */}
      <Modal
        testID="contact-modal"
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={closeContactModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-end",
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end",
              }}
              onPress={closeContactModal}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  gap: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.title.fontSize,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  {feedbackType
                    ? t("home.contact.yourMessage")
                    : t("home.contact.title")}
                </Text>

                {!feedbackType ? (
                  /* Step 1 : Choisir une catégorie */
                  contactCategories.map((cat) => (
                    <Pressable
                      key={cat.key}
                      testID={`contact-${cat.key}-btn`}
                      onPress={() => setFeedbackType(cat.key)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: DESIGN_TOKENS.spacing.md,
                        padding: DESIGN_TOKENS.spacing.md,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        backgroundColor: pressed
                          ? cat.color + "15"
                          : "transparent",
                        borderWidth: 1,
                        borderColor: colors.border,
                      })}
                    >
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
                      <Text
                        style={{
                          flex: 1,
                          fontSize: DESIGN_TOKENS.typography.body.fontSize,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {cat.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ))
                ) : (
                  /* Step 2 : Écrire et envoyer le message */
                  <>
                    <Pressable
                      onPress={() => setFeedbackType(null)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: DESIGN_TOKENS.spacing.xs,
                        marginBottom: DESIGN_TOKENS.spacing.xs,
                      }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                          fontWeight: "600",
                        }}
                      >
                        {
                          contactCategories.find((c) => c.key === feedbackType)
                            ?.label
                        }
                      </Text>
                    </Pressable>
                    <TextInput
                      testID="feedback-message-input"
                      placeholder={t("home.contact.placeholder")}
                      placeholderTextColor={colors.textMuted}
                      value={feedbackMessage}
                      onChangeText={setFeedbackMessage}
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
                      }}
                    />
                    <Pressable
                      testID="feedback-send-btn"
                      onPress={handleSendFeedback}
                      disabled={
                        feedbackSending || feedbackMessage.trim().length === 0
                      }
                      style={({ pressed }) => ({
                        backgroundColor:
                          feedbackSending || feedbackMessage.trim().length === 0
                            ? colors.primary + "60"
                            : pressed
                              ? colors.primary + "DD"
                              : colors.primary,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        paddingVertical: DESIGN_TOKENS.spacing.md,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: DESIGN_TOKENS.spacing.sm,
                      })}
                    >
                      {feedbackSending ? (
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
                        {feedbackSending
                          ? t("home.contact.sending")
                          : t("home.contact.send")}
                      </Text>
                    </Pressable>
                  </>
                )}

                <Pressable
                  testID="contact-cancel-btn"
                  onPress={closeContactModal}
                  style={({ pressed }) => ({
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: pressed
                      ? colors.backgroundTertiary
                      : colors.backgroundSecondary,
                    marginTop: DESIGN_TOKENS.spacing.xs,
                  })}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    {t("home.contact.cancel")}
                  </Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

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
    </Screen>
  );
};

export default HomeScreen;
