import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AlertMessage from "../../components/ui/AlertMessage";
import AnimatedBackground from "../../components/ui/AnimatedBackground";
import { HeaderLogo } from "../../components/ui/HeaderLogo";
import MascotLoading from "../../components/ui/MascotLoading";
import RoundLanguageButton from "../../components/ui/RoundLanguageButton";
import { usePermissionsContext } from "../../contexts/PermissionsContext";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useTranslation } from "../../localization";
import { login } from "../../utils/auth";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
type RootStackParamList = {
  Home: undefined;
  Subscribe: undefined;
  Connection: undefined;
  ForgotPassword: undefined;
};
interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  const { refreshPermissions } = usePermissionsContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title?: string;
    message: string;
    autoHide?: boolean;
  }>({
    visible: false,
    type: "info",
    message: "",
    autoHide: true,
  });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string,
    autoHide: boolean = true,
  ) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      autoHide,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleLogin = async () => {
    // Validation des champs
    if (!email.trim()) {
      showAlert(
        "warning",
        t("auth.validation.emailRequired"),
        t("auth.login.email"),
      );
      return;
    }

    if (!password.trim()) {
      showAlert(
        "warning",
        t("auth.validation.passwordRequired"),
        t("auth.login.password"),
      );
      return;
    }

    // Validation format email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("error", t("auth.validation.emailInvalid"), t("common.error"));
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);

      // Load user permissions after successful login (with timeout)
      try {
        const permissionsPromise = refreshPermissions();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000),
        );
        await Promise.race([permissionsPromise, timeoutPromise]);
      } catch (error) {
        // Permissions loading failure is non-blocking
      }

      // Navigate to Home
      navigation.navigate("Home");
    } catch (error: any) {
      // Log pour débugger
      console.error("❌ [LoginScreen] Login error:", error);
      console.error("❌ [LoginScreen] Error message:", error?.message);
      console.error("❌ [LoginScreen] Error stack:", error?.stack);

      // Messages d'erreur personnalisés basés sur les nouveaux codes
      let errorMessage = t("auth.errors.generic");
      let errorTitle = t("auth.errors.loginFailed");

      if (error.message) {
        switch (error.message) {
          case "unauthorized":
          case "invalid_credentials":
            errorMessage = t("auth.errors.invalidCredentials");
            errorTitle = t("auth.errors.authenticationError");
            break;
          case "device_info_unavailable":
            errorMessage = t("auth.errors.deviceInfoUnavailable");
            errorTitle = t("auth.errors.deviceError");
            break;
          case "server_error":
            errorMessage = t("auth.errors.serverError");
            errorTitle = t("auth.errors.serverConnectionError");
            break;
          case "invalid_login_response":
            errorMessage = t("auth.errors.invalidResponse");
            errorTitle = t("auth.errors.serverConnectionError");
            break;
          case "timeout":
            errorMessage = t("auth.errors.timeout");
            errorTitle = t("auth.errors.connectionError");
            break;
          case "network_error":
            errorMessage = t("auth.errors.networkError");
            errorTitle = t("auth.errors.connectionError");
            break;
          default:
            if (
              error.message.includes("network") ||
              error.message.includes("Network")
            ) {
              errorMessage = t("auth.errors.networkError");
              errorTitle = t("auth.errors.connectionError");
            } else if (error.message.includes("timeout")) {
              errorMessage = t("auth.errors.timeout");
              errorTitle = t("auth.errors.connectionError");
            } else {
              errorMessage = error.message;
              errorTitle = t("auth.errors.loginFailed");
            }
            break;
        }
      }

      // Afficher l'erreur sans auto-hide pour que l'utilisateur puisse lire
      showAlert("error", errorMessage, errorTitle, false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView testID="login-screen" style={styles.container}>
      {/* Full-screen loading overlay */}
      {isLoading && <MascotLoading text={t("auth.login.submitting")} overlay />}

      {/* Fond animé avec emojis camions et cartons */}
      <AnimatedBackground opacity={0.15} />

      <View
        testID="login-language-container"
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          zIndex: 10,
        }}
      >
        <RoundLanguageButton testID="login-language-btn" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View
            testID="login-header"
            style={{ alignItems: "center", paddingTop: 60, marginBottom: 40 }}
          >
            <HeaderLogo preset="md" variant="square" marginVertical={0} />

            <Text
              testID="login-title-text"
              style={[styles.title, { marginBottom: 8, marginTop: 20 }]}
            >
              {t("auth.login.title")}
            </Text>

            <Text
              testID="login-subtitle-text"
              style={[
                styles.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 20,
                },
              ]}
            >
              {t("auth.login.subtitle")}
            </Text>
          </View>

          {/* Alert Section */}
          <AlertMessage
            type={alert.type}
            title={alert.title}
            message={alert.message}
            visible={alert.visible}
            onDismiss={hideAlert}
            autoHide={alert.autoHide}
            prominent={alert.type === "error"}
          />

          {/* Form Section */}
          <View
            testID="login-form"
            style={{ flex: 1, justifyContent: "center", paddingVertical: 20 }}
          >
            <View testID="login-email-field" style={{ marginBottom: 20 }}>
              <Text
                testID="login-email-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.login.email")}
              </Text>
              <TextInput
                testID="login-email-input"
                style={styles.inputBase}
                placeholder={t("auth.login.emailPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View testID="login-password-field" style={{ marginBottom: 30 }}>
              <Text
                testID="login-password-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.login.password")}
              </Text>
              <TextInput
                testID="login-password-input"
                style={styles.inputBase}
                placeholder={t("auth.login.passwordPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <Pressable
              testID="login-forgot-password-btn"
              onPress={() => navigation.navigate("ForgotPassword")}
              disabled={isLoading}
              style={{
                alignSelf: "flex-end",
                marginBottom: 16,
                marginTop: -10,
              }}
            >
              <Text
                style={[styles.body, { color: colors.primary, fontSize: 14 }]}
              >
                {t("auth.login.forgotPassword")}
              </Text>
            </Pressable>

            <Pressable
              testID="login-submit-btn"
              style={[
                styles.buttonPrimary,
                {
                  backgroundColor: isLoading
                    ? colors.textSecondary
                    : colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text testID="login-submit-text" style={styles.buttonPrimaryText}>
                {isLoading
                  ? t("auth.login.submitting")
                  : t("auth.login.submit")}
              </Text>
            </Pressable>
          </View>

          {/* Footer Section */}
          <View
            testID="login-footer"
            style={{ alignItems: "center", paddingBottom: 40, gap: 16 }}
          >
            <Pressable
              testID="login-create-account-btn"
              style={[styles.buttonSecondary, { width: "100%" }]}
              onPress={() => navigation.navigate("Subscribe")}
              disabled={isLoading}
            >
              <Text
                testID="login-create-account-text"
                style={styles.buttonSecondaryText}
              >
                {t("auth.login.createAccount")}
              </Text>
            </Pressable>

            <Pressable
              testID="login-back-btn"
              onPress={() => navigation.navigate("Connection")}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={[
                  styles.body,
                  {
                    color: colors.primary,
                    fontWeight: "600",
                  },
                ]}
              >
                ← {t("auth.login.back")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const loginStyles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

export default LoginScreen;
