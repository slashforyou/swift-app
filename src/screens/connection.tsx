import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderLogo from "../components/ui/HeaderLogo";
import MascotLoading from "../components/ui/MascotLoading";
import RoundLanguageButton from "../components/ui/RoundLanguageButton";
import { useCommonThemedStyles } from "../hooks/useCommonStyles";
import { useTranslation } from "../localization";
import { ensureSession } from "../utils/session";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RegisterTypeSelection: undefined;
  Subscribe: undefined;
  Connection: undefined;
};

interface ConnectionScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ navigation }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const userLoggedIn = await ensureSession();
        if (userLoggedIn && userLoggedIn.authenticated === true) {
          navigation.navigate("Home");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [navigation]);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, slideAnim]);

  if (isLoading) {
    return <MascotLoading text={t("common.loading")} />;
  }

  return (
    <View style={[localStyles.root, { backgroundColor: colors.background }]}>
      {/* Gradient décoratif : teinte primaire en haut → background */}
      <LinearGradient
        colors={[colors.primary + "22", colors.background]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView testID="connection-screen" style={localStyles.safeArea}>
        {/* Language switcher */}
        <View style={localStyles.languageBtn}>
          <RoundLanguageButton testID="connection-language-btn" />
        </View>

        {/* Main content with fade+slide-in */}
        <Animated.View
          testID="connection-content"
          style={[
            localStyles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo + Slogan */}
          <View style={localStyles.logoSection}>
            <HeaderLogo preset="lg" variant="square" marginVertical={0} />
            <Text style={[localStyles.slogan, { color: colors.textSecondary }]}>
              Carry less, Move more
            </Text>
          </View>

          {/* CTA Buttons */}
          <View testID="connection-actions" style={localStyles.actions}>
            <Pressable
              testID="connection-login-btn"
              style={[styles.buttonPrimary, localStyles.button]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text testID="connection-login-text" style={styles.buttonPrimaryText}>
                {t("auth.connection.loginButton")}
              </Text>
            </Pressable>

            <Pressable
              testID="connection-register-btn"
              style={[styles.buttonSecondary, localStyles.button]}
              onPress={() => navigation.navigate("RegisterTypeSelection")}
            >
              <Text testID="connection-register-text" style={styles.buttonSecondaryText}>
                {t("auth.connection.registerButton")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  languageBtn: {
    position: "absolute",
    top: 28,
    right: 32,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 48,
  },
  logoSection: {
    alignItems: "center",
    gap: 12,
  },
  slogan: {
    fontSize: 16,
    fontStyle: "italic",
    letterSpacing: 0.5,
    textAlign: "center",
    opacity: 0.85,
    marginTop: 4,
  },
  actions: {
    width: "100%",
    paddingHorizontal: 24,
    gap: 14,
  },
  button: {
    width: "100%",
  },
});

export default ConnectionScreen;
