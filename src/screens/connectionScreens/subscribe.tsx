import { ServerData } from "@/src/constants/ServerData";
import React, { useMemo, useRef, useState } from "react";
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
import { useTranslation } from "../../localization";
import { validatePassword } from "../../utils/validators/passwordValidator";

import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Subscribe: { accountType?: 'business_owner' | 'employee' } | undefined;
  Connection: undefined;
  SubscribeMailVerification: {
    id: string;
    mail: string;
    firstName: string;
    lastName: string;
  };
};

interface SubscribeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'Subscribe'>;
}

const SubscribeScreen: React.FC<SubscribeScreenProps> = ({ navigation, route }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  const accountType = route.params?.accountType ?? 'business_owner';
  const isBusinessOwner = accountType === 'business_owner';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels: { label: string; color: string }[] = [
      { label: t("auth.register.passwordStrength.veryWeak"), color: '#DC2626' },
      { label: t("auth.register.passwordStrength.weak"), color: '#F97316' },
      { label: t("auth.register.passwordStrength.fair"), color: '#EAB308' },
      { label: t("auth.register.passwordStrength.strong"), color: '#22C55E' },
      { label: t("auth.register.passwordStrength.veryStrong"), color: '#16A34A' },
    ];
    const idx = Math.max(0, Math.min(score - 1, 4));
    return { level: score, label: levels[idx].label, color: levels[idx].color };
  }, [password, t]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
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
    // Scroll to bottom so alert near button is visible
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const subscribe = async () => {

    // Validation des champs
    if (!firstName.trim()) {
      showAlert(
        "warning",
        t("auth.validation.firstNameRequired"),
        t("auth.register.firstName"),
      );
      return;
    }

    if (!lastName.trim()) {
      showAlert(
        "warning",
        t("auth.validation.lastNameRequired"),
        t("auth.register.lastName"),
      );
      return;
    }

    if (isBusinessOwner && !companyName.trim()) {
      showAlert(
        "warning",
        t("auth.validation.companyNameRequired"),
        t("auth.register.companyName"),
      );
      return;
    }

    if (!email.trim()) {
      showAlert(
        "warning",
        t("auth.validation.emailRequired"),
        t("auth.register.email"),
      );
      return;
    }

    if (!password.trim()) {
      showAlert(
        "warning",
        t("auth.validation.passwordRequired"),
        t("auth.register.password"),
      );
      return;
    }

    if (!confirmPassword.trim()) {
      showAlert(
        "warning",
        t("auth.validation.passwordRequired"),
        t("auth.register.confirmPassword"),
      );
      return;
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("error", t("auth.validation.emailInvalid"), t("common.error"));
      return;
    }

    // Validation mot de passe
    const pwResult = validatePassword(password);
    if (!pwResult.valid) {
      showAlert(
        "error",
        t(pwResult.errorKey!) || t("auth.validation.passwordTooShort"),
        t("common.error"),
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(
        "error",
        t("auth.validation.passwordMismatch"),
        t("common.error"),
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${ServerData.serverUrl}subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: email,
          password,
          firstName,
          lastName,
          ...(isBusinessOwner ? { companyName: companyName.trim() } : {}),
          accountType,
        }),
      });


      if (response.status === 200) {
        const data = await response.json();
        if (data.success) {
          showAlert(
            "success",
            t("auth.success.registerSuccess"),
            t("common.success"),
          );

          setTimeout(() => {
            navigation.navigate("SubscribeMailVerification", {
              id: data.user.id,
              mail: email,
              firstName: firstName,
              lastName: lastName,
            });
          }, 1500);
        } else {
          if (data.message && data.message.includes("already in use")) {
            Alert.alert(
              t("auth.errors.emailAlreadyUsed"),
              t("auth.errors.emailAlreadyUsedMessage"),
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("auth.login.title"),
                  onPress: () => navigation.navigate("Login"),
                },
              ],
            );
          } else {
            let errorMessage = t("auth.errors.generic");
            if (data.message) {
              errorMessage = data.message;
            }
            showAlert("error", errorMessage, t("common.error"));
          }
        }
      } else {
        await response.json();
        showAlert("error", t("auth.errors.serverError"), t("common.error"));
      }
    } catch (error: any) {
      console.error("Subscription error:", error);

      let errorMessage = t("auth.errors.networkError");
      if (error.message?.includes("timeout")) {
        errorMessage = t("auth.errors.timeout");
      }

      showAlert("error", errorMessage, t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView testID="subscribe-screen" style={styles.container}>
      {/* Fond animé avec emojis camions et cartons */}
      <AnimatedBackground opacity={0.15} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          testID="subscribe-scroll"
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 60,
          }}
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
              testID="subscribe-back-btn"
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

            <View style={{ marginTop: 8, marginRight: 12 }}>
              <RoundLanguageButton testID="subscribe-language-btn" />
            </View>
          </View>

          {/* Header Section */}
          <View
            testID="subscribe-header"
            style={{ alignItems: "center", marginBottom: 40 }}
          >
            <HeaderLogo preset="md" variant="square" marginVertical={0} />

            {isBusinessOwner && (
              <View style={{
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                marginTop: 16,
              }}>
                <Text style={[styles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                  🏢 {t("auth.registration.businessOwner.title")}
                </Text>
              </View>
            )}

            <Text
              testID="subscribe-title-text"
              style={[styles.title, { marginBottom: 8, marginTop: isBusinessOwner ? 12 : 20 }]}
            >
              {t("auth.register.title")}
            </Text>

            <Text
              testID="subscribe-subtitle-text"
              style={[
                styles.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 20,
                },
              ]}
            >
              {isBusinessOwner
                ? t("auth.register.businessSubtitle")
                : t("auth.register.subtitle")}
            </Text>
          </View>

          {/* Form Section */}
          <View
            testID="subscribe-form"
            style={{ flex: 1, paddingVertical: 20 }}
          >
            <View
              testID="subscribe-firstname-field"
              style={{ marginBottom: 20 }}
            >
              <Text
                testID="subscribe-firstname-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.firstName")}
              </Text>
              <TextInput
                testID="subscribe-firstname-input"
                style={styles.inputBase}
                placeholder={t("auth.register.firstNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View
              testID="subscribe-lastname-field"
              style={{ marginBottom: 20 }}
            >
              <Text
                testID="subscribe-lastname-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.lastName")}
              </Text>
              <TextInput
                testID="subscribe-lastname-input"
                style={styles.inputBase}
                placeholder={t("auth.register.lastNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {isBusinessOwner && (
            <View
              testID="subscribe-companyname-field"
              style={{ marginBottom: 20 }}
            >
              <Text
                testID="subscribe-companyname-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.companyName")}
              </Text>
              <TextInput
                testID="subscribe-companyname-input"
                style={styles.inputBase}
                placeholder={t("auth.register.companyNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            )}

            <View testID="subscribe-email-field" style={{ marginBottom: 20 }}>
              <Text
                testID="subscribe-email-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.email")}
              </Text>
              <TextInput
                testID="subscribe-email-input"
                style={styles.inputBase}
                placeholder={t("auth.register.emailPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View
              testID="subscribe-password-field"
              style={{ marginBottom: 20 }}
            >
              <Text
                testID="subscribe-password-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.password")}
              </Text>
              <TextInput
                testID="subscribe-password-input"
                style={styles.inputBase}
                placeholder={t("auth.register.passwordPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          marginRight: i < 5 ? 2 : 0,
                          backgroundColor: i <= passwordStrength.level ? passwordStrength.color : colors.border,
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, color: passwordStrength.color, marginTop: 4, fontWeight: '600' }}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              {/* Password criteria when focused */}
              {passwordFocused && (
                <View style={{ marginTop: 8, backgroundColor: colors.backgroundSecondary, padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>
                    {t("auth.register.passwordCriteria.title")}
                  </Text>
                  {[
                    { check: password.length >= 8, label: t("auth.register.passwordCriteria.minLength") },
                    { check: /[A-Z]/.test(password), label: t("auth.register.passwordCriteria.uppercase") },
                    { check: /[a-z]/.test(password), label: t("auth.register.passwordCriteria.lowercase") },
                    { check: /[0-9]/.test(password), label: t("auth.register.passwordCriteria.number") },
                    { check: /[^A-Za-z0-9]/.test(password), label: t("auth.register.passwordCriteria.special") },
                  ].map((criterion, idx) => (
                    <Text key={idx} style={{ fontSize: 12, color: criterion.check ? '#22C55E' : colors.textSecondary, marginTop: 2 }}>
                      {criterion.check ? '✓' : '○'} {criterion.label}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <View
              testID="subscribe-confirm-password-field"
              style={{ marginBottom: 30 }}
            >
              <Text
                testID="subscribe-confirm-password-label"
                style={[styles.subtitle, { marginBottom: 8 }]}
              >
                {t("auth.register.confirmPassword")}
              </Text>
              <TextInput
                testID="subscribe-confirm-password-input"
                style={styles.inputBase}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />

              {/* Password match banner */}
              {passwordsMatch && (
                <View style={{
                  marginTop: 8,
                  backgroundColor: '#22C55E15',
                  borderWidth: 1,
                  borderColor: '#22C55E',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 14 }}>✓ </Text>
                  <Text style={{ fontSize: 13, color: '#16A34A', fontWeight: '600' }}>
                    {t("auth.register.passwordsMatch")}
                  </Text>
                </View>
              )}
            </View>

            {/* Alert Section - near button for visibility */}
            <AlertMessage
              type={alert.type}
              title={alert.title}
              message={alert.message}
              visible={alert.visible}
              onDismiss={hideAlert}
            />

            <Pressable
              testID="subscribe-submit-btn"
              style={[
                styles.buttonPrimary,
                {
                  backgroundColor: isLoading
                    ? colors.textSecondary
                    : colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              onPress={subscribe}
              disabled={isLoading}
            >
              <Text
                testID="subscribe-submit-text"
                style={styles.buttonPrimaryText}
              >
                {isLoading
                  ? t("auth.register.submitting")
                  : t("auth.register.submit")}
              </Text>
            </Pressable>
          </View>

          {/* Footer Section */}
          <View
            testID="subscribe-footer"
            style={{ alignItems: "center", paddingBottom: 40 }}
          >
            <Pressable
              testID="subscribe-already-account-btn"
              style={[styles.buttonSecondary, { width: "100%" }]}
              onPress={() => navigation.navigate("Login")}
              disabled={isLoading}
            >
              <Text
                testID="subscribe-already-account-text"
                style={styles.buttonSecondaryText}
              >
                {t("auth.register.alreadyHaveAccount")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default SubscribeScreen;
