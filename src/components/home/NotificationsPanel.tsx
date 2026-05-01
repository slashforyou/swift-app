/**
 * ⚠️ ATTENTION - FICHIER PROTÉGÉ ⚠️
 * =================================
 * Ce composant gère le panneau des notifications avec animations fluides.
 * Avant toute modification, veuillez demander confirmation :
 * "Souhaitez-vous vraiment modifier ce fichier ?"
 *
 * NotificationsPanel - Panneau de notifications avec slide animation
 * Supporte les modes Light et Dark
 * Utilise NotificationsProvider pour les vraies notifications
 *
 * @author Romain Giovanni - Slashforyou
 * @lastModified 16/01/2026
 */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import {
    formatRelativeTime,
    NotificationType,
    useNotifications,
} from "../../context/NotificationsProvider";
import { useTheme } from "../../context/ThemeProvider";
import { usePendingAssignments } from "../../hooks/usePendingAssignments";
import { useTranslation } from "../../localization";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("screen");

interface NotificationsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

// ─── Config visuelle par type de notification ──────────────────────────────────
const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    emoji: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    hookKey: string;
  }
> = {
  job: {
    emoji: "🚛",
    icon: "car-sport-outline",
    color: "#FF6B35",
    hookKey: "home.notificationsPanel.hookJob",
  },
  bonus: {
    emoji: "⚡",
    icon: "flash",
    color: "#F59E0B",
    hookKey: "home.notificationsPanel.hookBonus",
  },
  payment: {
    emoji: "💰",
    icon: "card",
    color: "#4CAF50",
    hookKey: "home.notificationsPanel.hookPayment",
  },
  call: {
    emoji: "📞",
    icon: "call",
    color: "#2196F3",
    hookKey: "home.notificationsPanel.hookCall",
  },
  reminder: {
    emoji: "⏰",
    icon: "alarm",
    color: "#9C27B0",
    hookKey: "home.notificationsPanel.hookReminder",
  },
  system: {
    emoji: "🔔",
    icon: "notifications",
    color: "#607D8B",
    hookKey: "home.notificationsPanel.hookSystem",
  },
  new_partnership: {
    emoji: "🤝",
    icon: "people",
    color: "#00BCD4",
    hookKey: "home.notificationsPanel.hookNewPartnership",
  },
};

// ─── NotificationItem ──────────────────────────────────────────────────────────
interface NotificationItemProps {
  notif: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string | Date;
    data?: Record<string, any>;
  };
  index: number;
  onRemove: (id: string) => void;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notif,
  index,
  onRemove,
  onPress,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const config = NOTIFICATION_CONFIG[notif.type] || NOTIFICATION_CONFIG.system;
  const accentColor = config.color || "#607D8B";

  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterTranslateY = useRef(new Animated.Value(20)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 320,
        delay: index * 55,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(enterTranslateY, {
        toValue: 0,
        duration: 320,
        delay: index * 55,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    if (!notif.isRead) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: enterOpacity,
        transform: [{ translateY: enterTranslateY }, { scale: pressScale }],
        marginHorizontal: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        borderRadius: DESIGN_TOKENS.radius.lg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          backgroundColor: !notif.isRead
            ? accentColor + "14"
            : colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          overflow: "hidden",
        }}
      >
        {/* Left accent bar */}
        <View
          style={{
            width: 4,
            backgroundColor: accentColor,
            borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
            borderBottomLeftRadius: DESIGN_TOKENS.radius.lg,
          }}
        />

        {/* Card content */}
        <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.md }}>
          {/* Top row : icône + titre + badge NEW */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            {/* Emoji dans cercle coloré */}
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: accentColor + "22",
                borderWidth: 1.5,
                borderColor: accentColor + "44",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
            </View>

            {/* Titre + hook text */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: colors.text,
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {notif.title}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: accentColor,
                  marginTop: 1,
                }}
              >
                {t(config.hookKey)}
              </Text>
            </View>

            {/* Badge NEW animé */}
            {!notif.isRead && (
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: accentColor,
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "900",
                    color: "white",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("home.notificationsPanel.newBadge")}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Message tronqué 2 lignes */}
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 18,
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {notif.message}
          </Text>

          {/* Footer : timestamp + delete */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="time-outline"
                size={11}
                color={accentColor + "99"}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontWeight: "500",
                }}
              >
                {formatRelativeTime(typeof notif.createdAt === 'string' ? new Date(notif.createdAt) : notif.createdAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => onRemove(notif.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: pressed
                  ? colors.error + "30"
                  : colors.error + "12",
                justifyContent: "center",
                alignItems: "center",
              })}
            >
              <Ionicons name="trash-outline" size={14} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isVisible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { assignments: pendingAssignments } = usePendingAssignments();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();

  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Ouvrir avec animation
  const openPanel = useCallback(() => {
    setIsModalVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnimation, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropAnimation, slideAnimation]);

  // Fermer avec animation
  const closePanel = useCallback(() => {
    // Marquer tout comme lu à la fermeture
    markAllAsRead();

    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setIsModalVisible(false);
      onClose();
    });
  }, [backdropAnimation, slideAnimation, onClose, markAllAsRead]);

  useEffect(() => {
    if (isVisible) {
      openPanel();
    }
  }, [isVisible, openPanel]);

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  const handleNotificationPress = useCallback((notif: { type: NotificationType; data?: Record<string, any> }) => {
    const jobId = notif.data?.job?.id;
    closePanel();
    setTimeout(() => {
      if (notif.type === 'job' && jobId) {
        navigation.navigate('JobDetails', { jobId, from: 'Home' });
      } else if (notif.type === 'payment') {
        navigation.navigate('Business', { initialTab: 'Payments' });
      }
    }, 300);
  }, [closePanel, navigation]);

  if (!isModalVisible && !isVisible) return null;

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={closePanel}
    >
      <View testID="notifications-panel" style={{ flex: 1 }}>
        {/* Backdrop animé */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            opacity: backdropAnimation,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closePanel} />
        </Animated.View>

        {/* Panel qui slide depuis le haut */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            maxHeight: SCREEN_HEIGHT * 0.85,
            backgroundColor: colors.background,
            borderBottomLeftRadius: DESIGN_TOKENS.radius.xl,
            borderBottomRightRadius: DESIGN_TOKENS.radius.xl,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 20,
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-SCREEN_HEIGHT * 0.85, 0],
                }),
              },
            ],
          }}
        >
          {/* Safe Area Top */}
          <View
            style={{ height: insets.top, backgroundColor: colors.background }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="notifications" size={24} color={colors.primary} />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    minWidth: 24,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "white",
                    }}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={closePanel}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : colors.backgroundSecondary,
                justifyContent: "center",
                alignItems: "center",
              })}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Section : Demandes de prestation en attente */}
          {pendingAssignments.length > 0 && (
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.warning + "0D",
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.warning,
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.warning,
                  }}
                >
                  {t("home.notificationsPanel.pendingRequests", { count: pendingAssignments.length })}
                </Text>
              </View>
              {pendingAssignments.map((a) => {
                const d = new Date(a.start_window_start);
                const dateStr = d.toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      closePanel();
                      setTimeout(() => {
                        navigation.navigate("Calendar", {
                          screen: "Day",
                          params: {
                            day: d.getDate(),
                            month: d.getMonth() + 1,
                            year: d.getFullYear(),
                          },
                        });
                      }, 300);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: pressed
                        ? colors.warning + "20"
                        : colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 6,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.warning,
                    })}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color={colors.warning}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {a.contractee_company_name || "Entreprise"} — {a.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginTop: 1,
                        }}
                      >
                        {dateStr}
                        {a.requested_drivers
                          ? `  · ${a.requested_drivers} chauffeur${a.requested_drivers > 1 ? "s" : ""}`
                          : ""}
                        {a.requested_offsiders
                          ? `  · ${a.requested_offsiders} offsider${a.requested_offsiders > 1 ? "s" : ""}`
                          : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Liste des notifications */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              /* ── Empty state redesigné ── */
              <View
                style={{
                  paddingVertical: DESIGN_TOKENS.spacing.xxl * 1.5,
                  paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 2,
                    borderColor: colors.border,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                  }}
                >
                  <Text style={{ fontSize: 44 }}>☀️</Text>
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 8,
                    letterSpacing: -0.3,
                  }}
                >
                  {t("home.notificationsPanel.emptyTitle")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  {t("home.notificationsPanel.emptyMessage")}
                </Text>
              </View>
            ) : (
              <View style={{ paddingTop: DESIGN_TOKENS.spacing.sm }}>
                {notifications.map((notif, index) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    index={index}
                    onRemove={handleRemoveNotification}
                    onPress={() => handleNotificationPress(notif)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Barre de glissement (indicateur visuel) */}
          <View
            style={{
              position: "absolute",
              bottom: DESIGN_TOKENS.spacing.sm,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NotificationsPanel;
