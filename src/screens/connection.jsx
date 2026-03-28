import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { ensureSession } from "../utils/session";

const { width, height } = Dimensions.get("window");

const ConnectionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const userLoggedIn = await ensureSession();
        // DÉSACTIVÉ TEMPORAIREMENT POUR DEBUG
        // if (userLoggedIn && userLoggedIn.authenticated === true) {} catch (error) {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Vérification de la connexion...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: "red", // TEST: SafeAreaView en rouge
          flex: 1,
        },
      ]}
    >
      <Text
        style={{
          color: "white",
          fontSize: 30,
          textAlign: "center",
          marginTop: 50,
          backgroundColor: "black",
          padding: 20,
        }}
      >
        SAFE AREA VIEW TEST - ES-TU VISIBLE ???
      </Text>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + DESIGN_TOKENS.spacing.xl },
        ]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: "red" }]}>
            <Text style={styles.logoText}>
              {t("connectionScreen.logoText")}
            </Text>
          </View>

          <Text style={[styles.title, { color: "red", fontSize: 50 }]}>
            {t("connectionScreen.title")}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("connectionScreen.subtitle")}
          </Text>
        </View>

        {/* Action Section */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryButtonText}>
              {t("connectionScreen.loginButton")}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
            onPress={() => navigation.navigate("Subscribe")}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              {t("connectionScreen.createAccountButton")}
            </Text>
          </Pressable>
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Text style={{ color: colors.success, fontSize: 20 }}>✓</Text>
            </View>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              {t("connectionScreen.features.simplifiedPlanning")}
            </Text>
          </View>

          <View style={styles.feature}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.info + "20" },
              ]}
            >
              <Text style={{ color: colors.info, fontSize: 20 }}>📱</Text>
            </View>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              {t("connectionScreen.features.realtimeTracking")}
            </Text>
          </View>

          <View style={styles.feature}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Text style={{ color: colors.warning, fontSize: 20 }}>🚛</Text>
            </View>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              {t("connectionScreen.features.completeManagement")}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.lg,
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  header: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_TOKENS.spacing.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: DESIGN_TOKENS.spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
    textAlign: "center",
    maxWidth: width * 0.8,
  },
  actions: {
    flex: 1,
    justifyContent: "center",
    gap: DESIGN_TOKENS.spacing.lg,
  },
  primaryButton: {
    height: DESIGN_TOKENS.touch.minSize + 8,
    borderRadius: DESIGN_TOKENS.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
    color: "#FFFFFF",
  },
  secondaryButton: {
    height: DESIGN_TOKENS.touch.minSize,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
  },
  features: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.md,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
  },
});

export default ConnectionScreen;
