import { ServerData } from "@/src/constants/ServerData";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { consumePendingDeepLink } from "../../services/navRef";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AlertMessage from "../../components/ui/AlertMessage";
import AnimatedBackground from "../../components/ui/AnimatedBackground";
import { HeaderLogo } from "../../components/ui/HeaderLogo";
import RoundLanguageButton from "../../components/ui/RoundLanguageButton";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useLocalization } from "../../localization/useLocalization";
import { hasPendingProfile } from "../../services/businessOwnerService";
import { collectDevicePayload } from "../../utils/device";

const SubscribeMailVerification = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useLocalization();
  const { mail } = route.params;

  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title?: string;
    message: string;
  }>({
    visible: false,
    type: "info",
    message: "",
  });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string,
  ) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleVerification = async () => {
    // Validation des champs
    if (!verificationCode.trim()) {
      showAlert(
        "warning",
        t("auth.emailVerification.codeRequired"),
        t("auth.emailVerification.codeRequired"),
      );
      return;
    }

    if (!verificationCode.match(/^\d{6}$/)) {
      showAlert(
        "error",
        t("auth.emailVerification.codeInvalidFormat"),
        t("auth.emailVerification.codeInvalid"),
      );
      return;
    }

    if (!mail) {
      showAlert(
        "error",
        t("auth.emailVerification.emailMissing"),
        t("auth.emailVerification.emailMissing"),
      );
      return;
    }

    if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showAlert(
        "error",
        t("auth.emailVerification.emailInvalid"),
        t("auth.emailVerification.emailInvalid"),
      );
      return;
    }

    setIsLoading(true);

    try {
      // MODE TEST : Accepter automatiquement le code 123456 pour les emails de test
      const cleanCode = verificationCode.trim();
      const isTestEmail =
        mail &&
        (mail.endsWith(".test") ||
          mail.includes("@swiftapp.test") ||
          mail.includes("@mailinator.com"));

      if (isTestEmail && cleanCode === "123456") {
        showAlert(
          "success",
          t("auth.emailVerification.verificationSuccess"),
          t("auth.emailVerification.title"),
        );

        // Check for pending business owner profile
        setTimeout(async () => {
          const hasPending = await hasPendingProfile();
          if (hasPending) {
            Alert.alert(
              t("auth.emailVerification.completeProfileTitle"),
              t("auth.emailVerification.completeProfileMessage"),
              [
                {
                  text: t("common.ok"),
                  onPress: () => navigation.navigate("Login"),
                },
              ],
            );
          } else {
            navigation.navigate("Login");
          }
        }, 1500);
        setIsLoading(false);
        return;
      }

      const device = await collectDevicePayload();

      const response = await fetch(`${ServerData.serverUrl}verifyMail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: mail,
          code: verificationCode,
          device,
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success) {
          // Auto-login: store session tokens and navigate to Home
          if (data.autoLogin && data.sessionToken) {
            let storageOk = true;
            try {
              await SecureStore.setItemAsync("session_token", data.sessionToken);
              if (data.sessionExpiry) {
                await SecureStore.setItemAsync("session_expiry", data.sessionExpiry);
              } else {
                const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                await SecureStore.setItemAsync("session_expiry", expiry);
              }
              if (data.refreshToken) {
                await SecureStore.setItemAsync("refresh_token", data.refreshToken);
              }
              if (data.user) {
                await SecureStore.setItemAsync(
                  "user_data",
                  JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    role: data.user.role,
                    company_id: data.user.company_id,
                    company_role: data.user.company_role,
                    company: data.user.company,
                  }),
                );
              }
            } catch (storageError) {
              console.error("SecureStore write failed:", storageError);
              // Storage failed — account is verified but auto-login is not possible
              storageOk = false;
            }

            showAlert(
              "success",
              t("auth.emailVerification.verificationSuccess"),
              t("auth.emailVerification.title"),
            );

            setTimeout(() => {
              if (storageOk) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Home" }],
                });
                // Consume any pending deep-link from cold-start notification
                setTimeout(() => { consumePendingDeepLink(); }, 300);
              } else {
                navigation.navigate("Login");
              }
            }, 1500);
          } else {
            // Fallback: no auto-login, navigate to Login
            showAlert(
              "success",
              t("auth.emailVerification.verificationSuccess"),
              t("auth.emailVerification.title"),
            );

            setTimeout(async () => {
              const hasPending = await hasPendingProfile();
              if (hasPending) {
                Alert.alert(
                  t("auth.emailVerification.completeProfileTitle"),
                  t("auth.emailVerification.completeProfileMessage"),
                  [
                    {
                      text: t("common.ok"),
                      onPress: () => navigation.navigate("Login"),
                    },
                  ],
                );
              } else {
                navigation.navigate("Login");
              }
            }, 1500);
          }
        } else {
          let errorMessage = t("auth.emailVerification.verificationFailed");
          let errorTitle = t("auth.emailVerification.codeIncorrect");

          if (data.message) {
            if (data.message.includes("expired")) {
              errorMessage = t("auth.emailVerification.codeExpired");
              errorTitle = t("auth.emailVerification.codeExpired");
            } else if (data.message.includes("invalid")) {
              errorMessage = t("auth.emailVerification.codeInvalid");
              errorTitle = t("auth.emailVerification.codeInvalid");
            } else {
              errorMessage = data.message;
            }
          }

          showAlert("error", errorMessage, errorTitle);
        }
      } else {
        showAlert(
          "error",
          t("auth.emailVerification.serverError"),
          t("auth.emailVerification.serverError"),
        );
      }
    } catch (error: any) {
      console.error("Verification error:", error);

      let errorMessage = t("auth.emailVerification.networkError");
      if (error.message?.includes("timeout")) {
        errorMessage = t("auth.emailVerification.timeoutError");
      }

      showAlert(
        "error",
        errorMessage,
        t("auth.emailVerification.networkError"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView testID="mail-verification-screen" style={styles.container}>
      <AnimatedBackground opacity={0.15} />

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
          {/* Header avec bouton retour visible */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 20,
              marginBottom: 20,
            }}
          >
            <Pressable
              testID="mail-verification-back-btn"
              onPress={() => navigation.navigate("Subscribe")}
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
                {t("auth.emailVerification.backToRegister")}
              </Text>
            </Pressable>

            <View style={{ marginTop: 8, marginRight: 12 }}>
              <RoundLanguageButton />
            </View>
          </View>

          {/* Header Section */}
          <View
            style={{ alignItems: "center", marginBottom: 40, paddingTop: 40 }}
          >
            <HeaderLogo preset="md" variant="square" marginVertical={0} />

            <Text style={[styles.title, { marginBottom: 8 }]}>
              {t("auth.emailVerification.checkEmail")}
            </Text>

            <Text
              style={[
                styles.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 20,
                  marginBottom: 8,
                },
              ]}
            >
              {t("auth.emailVerification.sentCodeTo")}
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.primary,
                  textAlign: "center",
                },
              ]}
            >
              {mail}
            </Text>

            <Text
              style={[
                styles.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 20,
                  marginTop: 8,
                  fontSize: 14,
                },
              ]}
            >
              {t("auth.emailVerification.checkSpam")}
            </Text>
          </View>

          {/* Alert Section */}
          <AlertMessage
            type={alert.type}
            title={alert.title}
            message={alert.message}
            visible={alert.visible}
            onDismiss={hideAlert}
          />

          {/* Form Section */}
          <View
            style={{ flex: 1, justifyContent: "center", paddingVertical: 20 }}
          >
            <View style={{ marginBottom: 30 }}>
              <Text
                style={[
                  styles.subtitle,
                  { marginBottom: 8, textAlign: "center" },
                ]}
              >
                {t("auth.emailVerification.enterCode")}
              </Text>
              <TextInput
                testID="mail-verification-code-input"
                style={[
                  styles.inputBase,
                  {
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "600",
                    letterSpacing: 4,
                  },
                ]}
                placeholder={t("auth.emailVerification.codePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                maxLength={6}
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <Pressable
              testID="mail-verification-submit-btn"
              style={[
                styles.buttonPrimary,
                {
                  backgroundColor: isLoading
                    ? colors.textSecondary
                    : colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleVerification}
              disabled={isLoading}
            >
              <Text style={styles.buttonPrimaryText}>
                {isLoading
                  ? t("auth.emailVerification.verifying")
                  : t("auth.emailVerification.verify")}
              </Text>
            </Pressable>

            <Text
              style={[
                styles.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 14,
                },
              ]}
            >
              {t("auth.emailVerification.didNotReceive")}{" "}
              {t("auth.emailVerification.checkSpam")}{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {t("auth.emailVerification.restartRegistration")}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SubscribeMailVerification;
