import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeProvider";

const BANNER_HEIGHT = 44;

interface OfflineBannerProps {
  isConnected: boolean;
}

export function OfflineBanner({ isConnected }: OfflineBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(
    new Animated.Value(-(insets.top + BANNER_HEIGHT)),
  ).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? -(insets.top + BANNER_HEIGHT) : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, insets.top, slideAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          height: insets.top + BANNER_HEIGHT,
          paddingTop: insets.top,
          backgroundColor: colors.warning,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>📵 Vous êtes hors-ligne</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OfflineBanner;
