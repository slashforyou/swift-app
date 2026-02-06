// BankingInfoStep.tsx
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";
import {
    formatBSB,
    validateBSB,
} from "../../../utils/validators/australianValidators";

interface BankingInfoStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const BankingInfoStep: React.FC<BankingInfoStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [bsb, setBsb] = useState(data.bsb);
  const [accountNumber, setAccountNumber] = useState(data.accountNumber);
  const [accountName, setAccountName] = useState(data.accountName);
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

  const handleNext = () => {
    if (!bsb.trim()) {
      showAlert("warning", t("registration.validation.bsbRequired"));
      return;
    }

    const bsbValidation = validateBSB(bsb);
    if (!bsbValidation.isValid) {
      showAlert(
        "error",
        bsbValidation.message || t("registration.validation.bsbInvalid"),
      );
      return;
    }

    if (!accountNumber.trim()) {
      showAlert("warning", t("registration.validation.accountNumberRequired"));
      return;
    }

    if (accountNumber.length < 6 || accountNumber.length > 10) {
      showAlert("error", t("registration.validation.accountNumberInvalid"));
      return;
    }

    if (!accountName.trim()) {
      showAlert("warning", t("registration.validation.accountNameRequired"));
      return;
    }

    onNext({ bsb, accountNumber, accountName });
  };

  const handleBsbBlur = () => {
    setBsb(formatBSB(bsb));
  };

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.banking.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.banking.subtitle")}
        </Text>
      </View>

      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.bsb")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="XXX-XXX"
          placeholderTextColor={colors.textSecondary}
          value={bsb}
          onChangeText={setBsb}
          onBlur={handleBsbBlur}
          keyboardType="number-pad"
          maxLength={7}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.accountNumber")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="12345678"
          placeholderTextColor={colors.textSecondary}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          maxLength={10}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.accountName")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("registration.fields.accountNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={accountName}
          onChangeText={setAccountName}
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.accountNameHelper")}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          style={[styles.buttonSecondary, { flex: 1 }]}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text style={styles.buttonSecondaryText}>
            ← {t("registration.buttons.back")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.buttonPrimary,
            {
              flex: 1,
              backgroundColor: isLoading
                ? colors.textSecondary
                : colors.primary,
            },
          ]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.buttonPrimaryText}>
            {t("registration.buttons.next")} →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BankingInfoStep;
