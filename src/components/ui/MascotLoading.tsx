/**
 * MascotLoading - Unified loading screen with mascot
 * Displays mascot image with animated dots in thought bubble
 */

import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

// Mascot loading image
const mascotLoadingImage = require("../../../assets/images/mascot/mascotte_loading.png");

interface MascotLoadingProps {
  /** Loading text to display (e.g., "Loading calendar") */
  text?: string;
  /** Whether to show the mascot image (default: true) */
  showMascot?: boolean;
  /** Overlay mode - absolute positioning with semi-transparent background */
  overlay?: boolean;
}

/**
 * Animated dots component for thought bubble
 * Pattern: "   " -> ".  " -> ".. " -> "..." -> " .." -> "  ." -> repeat
 */
const ThoughtBubbleDots: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const dotPatterns = [
    "   ", // step 0
    ".  ", // step 1
    ".. ", // step 2
    "...", // step 3
    " ..", // step 4
    "  .", // step 5
  ];

  return <Text style={styles.dots}>{dotPatterns[step]}</Text>;
};

const MascotLoading: React.FC<MascotLoadingProps> = ({
  text,
  showMascot = true,
  overlay = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const displayText = text || t("common.loading") || "Loading";

  const containerStyle = overlay
    ? [styles.overlay, { backgroundColor: colors.background + "F0" }]
    : [styles.container, { backgroundColor: colors.background }];

  return (
    <View style={containerStyle}>
      {showMascot && (
        <View style={styles.mascotContainer}>
          <Image
            source={mascotLoadingImage}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          {/* Dots positioned at top of image (in thought bubble) */}
          <View style={styles.dotsContainer}>
            <ThoughtBubbleDots />
          </View>
        </View>
      )}
      <Text style={[styles.loadingText, { color: colors.text }]}>
        {displayText}...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  mascotContainer: {
    position: "relative",
    alignItems: "center",
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  dotsContainer: {
    position: "absolute",
    top: -8,
    right: 11,
  },
  dots: {
    fontSize: 28,
    lineHeight: 28,
    includeFontPadding: false, // Remove extra Android padding
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 2,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default MascotLoading;
