import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";
import {
  formatAustralianPhone,
  validateAustralianPhone,
} from "../../../utils/validators/australianValidators";
import { TEST_DATA } from "../../../config/testData";

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

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.personalInfo : {};

  const [firstName, setFirstName] = useState(
    data.firstName || autoFillData.firstName || "",
  );
  const [lastName, setLastName] = useState(
    data.lastName || autoFillData.lastName || "",
  );
  const [email, setEmail] = useState(data.email || autoFillData.email || "");
  const [phone, setPhone] = useState(data.phone || autoFillData.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    data.dateOfBirth || autoFillData.dateOfBirth || "",
  );
  const [password, setPassword] = useState(
    data.password || autoFillData.password || "",
  );
  const [confirmPassword, setConfirmPassword] = useState(
    data.confirmPassword || autoFillData.confirmPassword || "",
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Try auto-fill data first in DEV mode
    const dobToUse =
      data.dateOfBirth || (__DEV__ ? autoFillData.dateOfBirth : null);

    if (dobToUse) {
      const parts = dobToUse.split("-");
      if (parts.length === 3) {
        return new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
      }
    }
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 18);
    return defaultDate;
  });
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  // Refs for auto-focus
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
  ) => {
    setAlert({ visible: true, type, message });
  };

  // Vérifier si le mot de passe contient des caractères invalides
  const checkInvalidChars = (
    pwd: string,
  ): { hasInvalid: boolean; invalidChars: string[] } => {
    // Regex pour les caractères autorisés
    const allowedCharsRegex =
      /^[a-zA-Z0-9À-ÿéèêëôùûüçàâäæœ\-_.!@#$%^&*()+={}\[\]<>?~]*$/;

    if (allowedCharsRegex.test(pwd)) {
      return { hasInvalid: false, invalidChars: [] };
    }

    // Extraire les caractères invalides
    const invalidChars = [
      ...new Set(
        pwd
          .split("")
          .filter(
            (char) =>
              !/[a-zA-Z0-9À-ÿéèêëôùûüçàâäæœ\-_.!@#$%^&*()+={}\[\]<>?~]/.test(
                char,
              ),
          ),
      ),
    ];

    return { hasInvalid: true, invalidChars };
  };

  const invalidCharsCheck = checkInvalidChars(password);

  // Calcul de la force du mot de passe
  const getPasswordStrength = (
    pwd: string,
  ): { level: number; color: string; text: string } => {
    if (!pwd) return { level: 0, color: colors.border, text: "" };

    let strength = 0;

    // Longueur
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 10;
    if (pwd.length >= 16) strength += 10;

    // Minuscules et majuscules
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;

    // Chiffres
    if (/[0-9]/.test(pwd)) strength += 15;

    // Caractères spéciaux autorisés
    if (/[-_.]/.test(pwd)) strength += 10; // Ponctuation
    if (/[!@#$%^&*()+={}\[\]<>?~]/.test(pwd)) strength += 10; // Spéciaux

    // Bonus pour diversité
    const types = [
      /[a-z]/.test(pwd),
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[-_.!@#$%^&*()+={}\[\]<>?~]/.test(pwd),
    ].filter(Boolean).length;

    if (types >= 4) strength += 15; // Bonus pour utiliser les 4 types

    if (strength < 40) {
      return { level: strength, color: "#ef4444", text: "Weak" };
    } else if (strength < 70) {
      return { level: strength, color: "#f97316", text: "Medium" };
    } else {
      return { level: strength, color: "#22c55e", text: "Strong" };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handlePhoneBlur = () => {
    const formatted = formatAustralianPhone(phone);
    setPhone(formatted);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // Keep open on iOS

    if (date) {
      setSelectedDate(date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setDateOfBirth(`${year}-${month}-${day}`);
    }
  };

  const handleNext = () => {
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

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      showAlert("error", t("registration.validation.ageTooYoung"));
      return;
    }

    if (password.length < 8) {
      showAlert("error", "Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showAlert("error", "Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      showAlert("error", "Password must contain at least one number");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("error", t("auth.validation.passwordMismatch"));
      return;
    }

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

  return (
    <View style={{ flex: 1, paddingVertical: 8 }}>
      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      {/* Name Section */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text
          style={[localStyles.sectionTitle, { color: colors.textSecondary }]}
        >
          👤 Full Name
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder="First name"
              placeholderTextColor={colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              ref={lastNameRef}
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder="Last name"
              placeholderTextColor={colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text
          style={[localStyles.sectionTitle, { color: colors.textSecondary }]}
        >
          📧 Contact
        </Text>
        <TextInput
          ref={emailRef}
          style={[
            styles.inputBase,
            { backgroundColor: colors.background, marginBottom: 12 },
          ]}
          placeholder="your@email.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <TextInput
          ref={phoneRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder="+61 4XX XXX XXX"
          placeholderTextColor={colors.textSecondary}
          value={phone}
          onChangeText={setPhone}
          onBlur={handlePhoneBlur}
          keyboardType="phone-pad"
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => dobRef.current?.focus()}
        />
      </View>

      {/* Date of Birth */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text
          style={[localStyles.sectionTitle, { color: colors.textSecondary }]}
        >
          🎂 Date of Birth (18+ required)
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.inputBase,
            { backgroundColor: colors.background, justifyContent: "center" },
          ]}
        >
          <Text
            style={{
              color: dateOfBirth ? colors.text : colors.textSecondary,
              fontSize: 16,
            }}
          >
            {dateOfBirth || "Select date of birth"}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </View>

      {/* Password Section */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text
          style={[localStyles.sectionTitle, { color: colors.textSecondary }]}
        >
          🔒 Secure Password
        </Text>
        <TextInput
          ref={passwordRef}
          style={[
            styles.inputBase,
            { backgroundColor: colors.background, marginBottom: 8 },
          ]}
          placeholder="8+ chars, uppercase, number, special (!@#...)"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            {/* Invalid Characters Warning */}
            {invalidCharsCheck.hasInvalid && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fef2f2",
                  padding: 8,
                  borderRadius: 6,
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: "#ef4444",
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>⚠️</Text>
                <Text style={{ flex: 1, fontSize: 12, color: "#dc2626" }}>
                  Invalid character(s):{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {invalidCharsCheck.invalidChars
                      .map((c) => `"${c}"`)
                      .join(", ")}
                  </Text>
                </Text>
              </View>
            )}

            {/* Strength Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Password Strength
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: passwordStrength.color,
                }}
              >
                {passwordStrength.text}
              </Text>
            </View>
            <View
              style={{
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${passwordStrength.level}%`,
                  backgroundColor: passwordStrength.color,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        )}

        <TextInput
          ref={confirmPasswordRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder="Confirm password"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />
      </View>

      {/* Next Button */}
      <Pressable
        style={[
          styles.buttonPrimary,
          {
            marginTop: 24,
            backgroundColor: isLoading ? colors.textSecondary : colors.primary,
          },
        ]}
        onPress={handleNext}
        disabled={isLoading}
      >
        <Text style={[styles.buttonPrimaryText, { fontSize: 16 }]}>
          {isLoading ? t("common.loading") : `Continue →`}
        </Text>
      </Pressable>
    </View>
  );
};

const localStyles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default PersonalInfoStep;
