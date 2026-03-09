/**
 * LoadingDots - Animated loading text with dots
 * Shows "Loading" followed by animated dots (1, 2, 3, then reset)
 */

import React, { useEffect, useState } from "react";
import { Text, TextStyle } from "react-native";
import { useTranslation } from "../../localization";

interface LoadingDotsProps {
  text?: string;
  style?: TextStyle;
  interval?: number;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  text,
  style,
  interval = 500,
}) => {
  const { t } = useTranslation();
  const displayText = text || t("common.loading") || "Loading";
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => {
        switch (prev) {
          case "":
            return ".";
          case ".":
            return "..";
          case "..":
            return "...";
          default:
            return "";
        }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <Text style={style}>
      {displayText}
      {dots}
    </Text>
  );
};

export default LoadingDots;
