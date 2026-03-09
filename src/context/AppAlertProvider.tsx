import Ionicons from "@react-native-vector-icons/ionicons";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { appAlert, AppAlertPayload } from "../services/appAlert";

interface AppAlertContextValue {
  showAlert: (payload: AppAlertPayload) => void;
}

type AlertVariant = "success" | "error" | "warning" | "info";

const inferAlertType = (payload: AppAlertPayload | null): AlertVariant => {
  if (payload?.type) return payload.type;

  const title = (payload?.title || "").toLowerCase();
  const message = (payload?.message || "").toLowerCase();
  const source = `${title} ${message}`;

  if (
    source.includes("success") ||
    source.includes("succes") ||
    source.includes("ok")
  ) {
    return "success";
  }

  if (
    source.includes("error") ||
    source.includes("erreur") ||
    source.includes("echec") ||
    source.includes("failed")
  ) {
    return "error";
  }

  if (
    source.includes("warning") ||
    source.includes("attention") ||
    source.includes("avertissement")
  ) {
    return "warning";
  }

  return "info";
};

export const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export const AppAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<AppAlertPayload[]>([]);
  const [current, setCurrent] = useState<AppAlertPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardTranslateY = useRef(new Animated.Value(32)).current;

  const showAlert = useCallback((payload: AppAlertPayload) => {
    setQueue((prev) => [...prev, payload]);
  }, []);

  useEffect(() => {
    if (!visible && !current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setVisible(true);
    }
  }, [queue, current, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.96,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 32,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setCurrent(null);
        }
      });
    }
  }, [visible, backdropOpacity, cardScale, cardTranslateY]);

  useEffect(() => {
    appAlert.setHandler(showAlert);
    return () => appAlert.setHandler(null);
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const buttons = useMemo(() => {
    if (!current?.buttons || current.buttons.length === 0) {
      return [
        {
          text: "OK",
          style: "default" as const,
          onPress: undefined,
        },
      ];
    }

    return current.buttons;
  }, [current]);

  const resolvedType = useMemo(() => inferAlertType(current), [current]);
  const presentation = current?.options?.presentation || "center";
  const warningColor = (colors as any).warning || colors.tint;
  const typeConfig = useMemo(
    () => ({
      success: {
        icon: "checkmark-circle",
        color: colors.success,
      },
      error: {
        icon: "alert-circle",
        color: colors.error,
      },
      warning: {
        icon: "warning",
        color: warningColor,
      },
      info: {
        icon: "information-circle",
        color: colors.tint,
      },
    }),
    [colors, warningColor],
  );
  const headerColor = typeConfig[resolvedType].color;
  const headerIcon = typeConfig[resolvedType].icon as any;

  return (
    <AppAlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent
        animationType="none"
        visible={visible}
        onRequestClose={closeAlert}
      >
        <Pressable
          onPress={() => {
            if (current?.options?.cancelable === false) return;
            closeAlert();
          }}
          style={{
            flex: 1,
            justifyContent: presentation === "sheet" ? "flex-end" : "center",
            alignItems: "center",
            padding: DESIGN_TOKENS.spacing.lg,
            paddingTop: insets.top + DESIGN_TOKENS.spacing.lg,
            paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              opacity: backdropOpacity,
            }}
          />
          <Animated.View
            style={{
              width: "100%",
              backgroundColor: colors.background,
              borderRadius:
                presentation === "sheet"
                  ? DESIGN_TOKENS.radius.xl
                  : DESIGN_TOKENS.radius.xl,
              borderTopLeftRadius:
                presentation === "sheet"
                  ? DESIGN_TOKENS.radius.xl
                  : DESIGN_TOKENS.radius.xl,
              borderTopRightRadius:
                presentation === "sheet"
                  ? DESIGN_TOKENS.radius.xl
                  : DESIGN_TOKENS.radius.xl,
              borderBottomLeftRadius:
                presentation === "sheet" ? 0 : DESIGN_TOKENS.radius.xl,
              borderBottomRightRadius:
                presentation === "sheet" ? 0 : DESIGN_TOKENS.radius.xl,
              padding: DESIGN_TOKENS.spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
              transform:
                presentation === "sheet"
                  ? [{ translateY: cardTranslateY }]
                  : [{ scale: cardScale }],
            }}
          >
            <View
              style={{
                height: 4,
                borderRadius: 999,
                backgroundColor: headerColor,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Ionicons name={headerIcon} size={24} color={headerColor} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {current?.title || ""}
              </Text>
            </View>

            {current?.message ? (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: DESIGN_TOKENS.spacing.lg,
                }}
              >
                {current.message}
              </Text>
            ) : null}

            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}
            >
              {buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                const backgroundColor = isDestructive
                  ? colors.error
                  : isCancel
                    ? colors.backgroundSecondary
                    : headerColor;
                const textColor =
                  isDestructive || !isCancel ? colors.background : colors.text;

                return (
                  <Pressable
                    key={`${button.text || "action"}-${index}`}
                    onPress={() => {
                      closeAlert();
                      button.onPress?.();
                    }}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: pressed
                        ? `${backgroundColor}CC`
                        : backgroundColor,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      padding: DESIGN_TOKENS.spacing.md,
                      alignItems: "center",
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: colors.border,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: textColor,
                      }}
                    >
                      {button.text || "OK"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
};
