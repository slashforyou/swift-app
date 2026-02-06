import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";
import {
    formatAustralianPhone,
    validateAustralianPhone,
} from "../../../utils/validators/australianValidators";

interface PersonalInfoStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  data,
  onNext,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [email, setEmail] = useState(data.email);
  const [phone, setPhone] = useState(data.phone);
  const [dateOfBirth, setDateOfBirth] = useState(data.dateOfBirth);
  const [password, setPassword] = useState(data.password);
  const [confirmPassword, setConfirmPassword] = useState(data.confirmPassword);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
  ) => {
    setAlert({ visible: true, type, message });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleNext = () => {
    // Validation
    if (!firstName.trim()) {
      showAlert("warning", t("auth.validation.firstNameRequired"));
      return;
    }

    if (!lastName.trim()) {
      showAlert("warning", t("auth.validation.lastNameRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("error", t("auth.validation.emailInvalid"));
      return;
    }

    if (!phone.trim()) {
      showAlert("warning", t("registration.validation.phoneRequired"));
      return;
    }

    const phoneValidation = validateAustralianPhone(phone);
    if (!phoneValidation.isValid) {
      showAlert(
        "error",
        phoneValidation.message || t("registration.validation.phoneInvalid"),
      );
      return;
    }

    if (!dateOfBirth) {
      showAlert("warning", t("registration.validation.dateOfBirthRequired"));
      return;
    }

    // Check age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      showAlert("error", t("registration.validation.mustBe18"));
      return;
    }

    if (password.length < 8) {
      showAlert("error", t("auth.validation.passwordTooShort"));
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showAlert("error", t("registration.validation.passwordNeedsUppercase"));
      return;
    }

    if (!/[0-9]/.test(password)) {
      showAlert("error", t("registration.validation.passwordNeedsNumber"));
      return;
    }

    if (password !== confirmPassword) {
      showAlert("error", t("auth.validation.passwordMismatch"));
      return;
    }

    // Pass data to next step
    onNext({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      password,
      confirmPassword,
    });
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
  };

  const handlePhoneBlur = () => {
    // Format phone on blur
    const formatted = formatAustralianPhone(phone);
    setPhone(formatted);
  };

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      {/* Title */}
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.personalInfo.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.personalInfo.subtitle")}
        </Text>
      </View>

      {/* Alert */}
      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={hideAlert}
      />

      {/* Form */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.register.firstName")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("auth.register.firstNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.register.lastName")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("auth.register.lastNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.register.email")} *
        </Text>
        <TextInput
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

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.phone")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="+61 4XX XXX XXX"
          placeholderTextColor={colors.textSecondary}
          value={phone}
          onChangeText={handlePhoneChange}
          onBlur={handlePhoneBlur}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.phoneHelper")}
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.dateOfBirth")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="numbers-and-punctuation"
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.mustBe18")}
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.register.password")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("auth.register.passwordPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.passwordRequirements")}
        </Text>
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("auth.register.confirmPassword")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("auth.register.confirmPasswordPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
        />
      </View>

      {/* Next Button */}
      <Pressable
        style={[
          styles.buttonPrimary,
          {
            backgroundColor: isLoading ? colors.textSecondary : colors.primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleNext}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {isLoading ? t("common.loading") : t("registration.buttons.next")} →
        </Text>
      </Pressable>
    </View>
  );
};

export default PersonalInfoStep;
