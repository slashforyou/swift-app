import { ServerData } from "@/src/constants/ServerData";
import { useNavigation } from "@react-navigation/native";
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
import HeaderLogo from "../../components/ui/HeaderLogo";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useLocalization } from "../../localization/useLocalization";
import { hasPendingProfile } from "../../services/businessOwnerService";

type RootStackParamList = {
  Subscribe: undefined;
  Login: undefined;
  // add other routes here if needed
};

const SubscribeMailVerification = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useLocalization();
  const { id, mail, firstName, lastName } = route.params;

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
    // TEMP_DISABLED: console.log('Verification function called with code:', verificationCode, 'and email:', mail);

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
        mail && (mail.endsWith(".test") || mail.includes("@swiftapp.test"));
      console.log("[TEST MODE] Email:", mail);
      console.log("[TEST MODE] Code:", `"${cleanCode}"`);
      console.log("[TEST MODE] Is test email?", isTestEmail);
      console.log("[TEST MODE] Is code 123456?", cleanCode === "123456");

      if (isTestEmail && cleanCode === "123456") {
        console.log(
          "[TEST MODE] ✅ Bypassing server verification for test email",
        );
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
              "📋 Complete Your Profile",
              "Your email is verified! You can now login and complete your business owner profile.",
              [{ text: "OK", onPress: () => navigation.navigate("Login") }],
            );
          } else {
            navigation.navigate("Login");
          }
        }, 1500);
        setIsLoading(false);
        return;
      }

      console.log("[TEST MODE] ❌ Not bypassing - calling server");

      // TEMP_DISABLED: console.log('[ Verify Mail endpoint called ]', mail, verificationCode);
      const response = await fetch(`${ServerData.serverUrl}verifyMail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: mail,
          code: verificationCode,
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success) {
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
                "📋 Complete Your Profile",
                "Your email is verified! You can now login and complete your business owner profile.",
                [{ text: "OK", onPress: () => navigation.navigate("Login") }],
              );
            } else {
              navigation.navigate("Login");
            }
          }, 1500);
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
    <SafeAreaView style={styles.container}>
      {/* Fond animé avec emojis camions et cartons */}
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
              paddingTop: 20,
              marginBottom: 20,
            }}
          >
            <Pressable
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
          </View>

          {/* Header Section */}
          <View
            style={{ alignItems: "center", marginBottom: 40, paddingTop: 40 }}
          >
            <HeaderLogo size={80} variant="square" marginVertical={0} />

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
                style={[
                  styles.inputBase,
                  {
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "600",
                    letterSpacing: 4,
                  },
                ]}
                placeholder="000000"
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
