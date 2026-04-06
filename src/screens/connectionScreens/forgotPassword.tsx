import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import AlertMessage from "../../components/ui/AlertMessage";
import AnimatedBackground from "../../components/ui/AnimatedBackground";
import { HeaderLogo } from "../../components/ui/HeaderLogo";
import MascotLoading from "../../components/ui/MascotLoading";
import { ServerData } from "../../constants/ServerData";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useTranslation } from "../../localization";
import { validatePassword } from "../../utils/validators/passwordValidator";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

interface ForgotPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type Step = "email" | "code" | "newPassword" | "success";

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title?: string;
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string,
  ) => {
    setAlert({ visible: true, type, title, message });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      showAlert("warning", t("auth.forgotPassword.emailRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("error", t("auth.validation.emailInvalid"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${ServerData.serverUrl}auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        showAlert("success", t("auth.forgotPassword.codeSent"));
        setStep("code");
      } else {
        showAlert("error", data.message || t("auth.errors.generic"));
      }
    } catch {
      showAlert("error", t("auth.errors.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      showAlert("warning", t("auth.forgotPassword.codeInvalid"));
      return;
    }
    setStep("newPassword");
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showAlert("warning", t("auth.forgotPassword.passwordRequired"));
      return;
    }

    const pwResult = validatePassword(newPassword);
    if (!pwResult.valid) {
      showAlert("warning", t(pwResult.errorKey!) || t("auth.forgotPassword.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("warning", t("auth.forgotPassword.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${ServerData.serverUrl}auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: code.trim(),
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStep("success");
      } else {
        showAlert("error", data.message || t("auth.errors.generic"));
      }
    } catch {
      showAlert("error", t("auth.errors.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps: Step[] = ["email", "code", "newPassword"];
    const currentIndex = steps.indexOf(step);

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {steps.map((s, i) => (
          <View
            key={s}
            style={{
              width: i <= currentIndex ? 32 : 12,
              height: 4,
              borderRadius: 2,
              backgroundColor:
                i <= currentIndex ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
    );
  };

  const renderEmailStep = () => (
    <>
      <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 8 }]}>
        {t("auth.forgotPassword.title")}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 32,
          },
        ]}
      >
        {t("auth.forgotPassword.subtitle")}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.login.email")}
        </Text>
        <TextInput
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

      <Pressable
        style={[
          styles.buttonPrimary,
          {
            backgroundColor: isLoading ? colors.textSecondary : colors.primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleRequestCode}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {t("auth.forgotPassword.sendCode")}
        </Text>
      </Pressable>
    </>
  );

  const renderCodeStep = () => (
    <>
      <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 8 }]}>
        {t("auth.forgotPassword.enterCode")}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 32,
          },
        ]}
      >
        {t("auth.forgotPassword.codeSentTo", { email })}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <TextInput
          style={[
            styles.inputBase,
            {
              textAlign: "center",
              fontSize: 28,
              letterSpacing: 8,
              fontWeight: "bold",
            },
          ]}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={(text) =>
            setCode(text.replace(/[^0-9]/g, "").slice(0, 6))
          }
          keyboardType="number-pad"
          maxLength={6}
          editable={!isLoading}
        />
      </View>

      <Pressable
        style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
        onPress={handleVerifyCode}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {t("auth.forgotPassword.verify")}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleRequestCode}
        disabled={isLoading}
        style={{ marginTop: 16, alignItems: "center" }}
      >
        <Text style={[styles.body, { color: colors.primary }]}>
          {t("auth.forgotPassword.resendCode")}
        </Text>
      </Pressable>
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 8 }]}>
        {t("auth.forgotPassword.newPasswordTitle")}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 32,
          },
        ]}
      >
        {t("auth.forgotPassword.newPasswordSubtitle")}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.forgotPassword.newPassword")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="••••••"
          placeholderTextColor={colors.textSecondary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.forgotPassword.confirmPassword")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="••••••"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
        />
      </View>

      <Pressable
        style={[
          styles.buttonPrimary,
          {
            backgroundColor: isLoading ? colors.textSecondary : colors.primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {t("auth.forgotPassword.resetPassword")}
        </Text>
      </Pressable>
    </>
  );

  const renderSuccessStep = () => (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
      <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 8 }]}>
        {t("auth.forgotPassword.successTitle")}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 32,
          },
        ]}
      >
        {t("auth.forgotPassword.successMessage")}
      </Text>

      <Pressable
        style={[
          styles.buttonPrimary,
          { backgroundColor: colors.primary, width: "100%" },
        ]}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonPrimaryText}>
          {t("auth.forgotPassword.backToLogin")}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && <MascotLoading text={t("common.loading")} overlay />}
      <AnimatedBackground opacity={0.1} />

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
          <View
            style={{ alignItems: "center", paddingTop: 60, marginBottom: 40 }}
          >
            <HeaderLogo preset="md" variant="square" marginVertical={0} />
            <Text style={{ fontSize: 40, marginTop: 16 }}>🔑</Text>
          </View>

          <AlertMessage
            type={alert.type}
            title={alert.title}
            message={alert.message}
            visible={alert.visible}
            onDismiss={hideAlert}
            autoHide={alert.type === "success"}
          />

          {step !== "success" && renderStepIndicator()}

          <View
            style={{ flex: 1, justifyContent: "center", paddingVertical: 20 }}
          >
            {step === "email" && renderEmailStep()}
            {step === "code" && renderCodeStep()}
            {step === "newPassword" && renderNewPasswordStep()}
            {step === "success" && renderSuccessStep()}
          </View>

          {step !== "success" && (
            <View style={{ alignItems: "center", paddingBottom: 40 }}>
              <Pressable
                onPress={() => {
                  if (step === "email") {
                    navigation.navigate("Login");
                  } else if (step === "code") {
                    setStep("email");
                  } else {
                    setStep("code");
                  }
                }}
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
                    { color: colors.primary, fontWeight: "600" },
                  ]}
                >
                  ← {t("auth.login.back")}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
