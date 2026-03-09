/**
 * HeaderLogo - Composant réutilisable pour afficher le logo Cobbr
 *
 * Support :
 * - Mode sombre automatique
 * - Différentes variantes (carré, horizontal, icon seul)
 * - Tailles personnalisables
 * - Accessibilité
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeProvider";

export const HEADER_LOGO_SIZES = {
  sm: 44,
  md: 80,
  lg: 120,
} as const;

export type HeaderLogoSizePreset = keyof typeof HEADER_LOGO_SIZES;

export interface HeaderLogoProps {
  /** Preset size to keep logos consistent across the app (sm/md/lg) */
  preset?: HeaderLogoSizePreset;

  /** Taille du logo en pixels (default: 80) */
  size?: number;

  /** Variante du logo à afficher */
  variant?: "square" | "horizontal" | "icon-only" | "rectangle";

  /** Marge verticale (default: 16) */
  marginVertical?: number;

  /** Marge horizontale (default: 0) */
  marginHorizontal?: number;

  /** Style personnalisé pour le conteneur */
  style?: any;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
  preset,
  size = 80,
  variant = "square",
  marginVertical = 16,
  marginHorizontal = 0,
  style,
}) => {
  const { colors } = useTheme();
  const resolvedSize = preset ? HEADER_LOGO_SIZES[preset] : size;
  const fontSize = Math.max(18, Math.round(resolvedSize * 0.6));
  const letterSpacing = Math.max(0.5, Math.round(fontSize * 0.04));

  return (
    <View
      style={[
        styles.container,
        {
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.logoText,
          {
            color: colors.text,
            fontSize,
            letterSpacing,
          },
        ]}
        accessible={true}
        accessibilityLabel="Cobbr"
      >
        Cobbr
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "SpaceGrotesk_700Bold",
  },
});

export default HeaderLogo;
