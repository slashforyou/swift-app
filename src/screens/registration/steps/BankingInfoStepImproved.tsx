import React, { useRef, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { TEST_DATA } from "../../../config/testData";
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

const BankingInfoStepImproved: React.FC<BankingInfoStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.bankingInfo : {};

  const [bsb, setBsb] = useState(data.bsb || autoFillData.bsb || "");
  const [accountNumber, setAccountNumber] = useState(
    data.accountNumber || autoFillData.accountNumber || "",
  );
  const [accountName, setAccountName] = useState(
    data.accountName || autoFillData.accountName || "",
  );
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const accountNumberRef = useRef<TextInput>(null);
  const accountNameRef = useRef<TextInput>(null);

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

  const localStyles = StyleSheet.create({
    section: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: colors.textSecondary,
      marginBottom: 12,
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, paddingVertical: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={hideAlert}
      />

      {/* Section: 🏦 Bank Account Details */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          🏦 {t("registration.banking.title")}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.bsb")}
            placeholderTextColor={colors.textSecondary}
            value={bsb}
            onChangeText={setBsb}
            onBlur={handleBsbBlur}
            keyboardType="number-pad"
            maxLength={7}
            returnKeyType="next"
            onSubmitEditing={() => accountNumberRef.current?.focus()}
            editable={!isLoading}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <TextInput
            ref={accountNumberRef}
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.accountNumber")}
            placeholderTextColor={colors.textSecondary}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            maxLength={10}
            returnKeyType="next"
            onSubmitEditing={() => accountNameRef.current?.focus()}
            editable={!isLoading}
          />
        </View>

        <TextInput
          ref={accountNameRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder={t("registration.fields.accountName")}
          placeholderTextColor={colors.textSecondary}
          value={accountName}
          onChangeText={setAccountName}
          returnKeyType="done"
          editable={!isLoading}
          autoCapitalize="words"
        />
      </View>

      {/* Navigation Buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 24,
          marginBottom: 40,
        }}
      >
        <Pressable
          onPress={onBack}
          disabled={isLoading}
          style={[styles.buttonBase, styles.buttonSecondary, { flex: 1 }]}
        >
          <Text style={styles.buttonTextSecondary}>← {t("common.back")}</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={isLoading}
          style={[styles.buttonBase, styles.buttonPrimary, { flex: 1 }]}
        >
          <Text style={styles.buttonTextPrimary}>{t("common.continue")} →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default BankingInfoStepImproved;
