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
import { Image, StyleSheet, View, useColorScheme } from "react-native";

export interface HeaderLogoProps {
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
  size = 80,
  variant = "square",
  marginVertical = 16,
  marginHorizontal = 0,
  style,
}) => {
  const colorScheme = useColorScheme();

  /**
   * Sélectionne le bon logo selon la variante et le mode (clair/sombre)
   */
  const getLogoSource = () => {
    const isDark = colorScheme === "dark";

    switch (variant) {
      case "icon-only":
        return isDark
          ? require("../../../assets/images/logo-dark-192.png")
          : require("../../../assets/images/logo-192.png");

      case "horizontal":
        // Pour l'instant pas de version dark du logo horizontal
        return require("../../../assets/images/logo-horizontal.png");

      case "rectangle":
        return isDark
          ? require("../../../assets/images/logo-rectangle-dark-192.png")
          : require("../../../assets/images/logo-rectangle-192.png");

      case "square":
      default:
        return isDark
          ? require("../../../assets/images/logo-nom-dark-512.png")
          : require("../../../assets/images/logo-nom-512.png");
    }
  };

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
      <Image
        source={getLogoSource()}
        style={[
          styles.logo,
          {
            width: size,
            height: size,
          },
        ]}
        accessible={true}
        accessibilityLabel="Logo Cobbr"
        accessibilityRole="image"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    resizeMode: "contain",
  },
});

export default HeaderLogo;
