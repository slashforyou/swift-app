import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";
import {
    formatABN,
    formatACN,
    formatAustralianPhone,
    validateABN,
    validateACN,
    validateAustralianPhone,
} from "../../../utils/validators/australianValidators";

interface BusinessDetailsStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [companyName, setCompanyName] = useState(data.companyName);
  const [tradingName, setTradingName] = useState(data.tradingName);
  const [abn, setAbn] = useState(data.abn);
  const [acn, setAcn] = useState(data.acn);
  const [businessType, setBusinessType] = useState(data.businessType);
  const [industryType, setIndustryType] = useState(data.industryType);
  const [companyEmail, setCompanyEmail] = useState(data.companyEmail);
  const [companyPhone, setCompanyPhone] = useState(data.companyPhone);
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
    if (!companyName.trim()) {
      showAlert("warning", t("registration.validation.companyNameRequired"));
      return;
    }

    if (!abn.trim()) {
      showAlert("warning", t("registration.validation.abnRequired"));
      return;
    }

    const abnValidation = validateABN(abn);
    if (!abnValidation.isValid) {
      showAlert(
        "error",
        abnValidation.message || t("registration.validation.abnInvalid"),
      );
      return;
    }

    if (acn.trim()) {
      const acnValidation = validateACN(acn);
      if (!acnValidation.isValid) {
        showAlert(
          "error",
          acnValidation.message || t("registration.validation.acnInvalid"),
        );
        return;
      }
    }

    if (!businessType) {
      showAlert("warning", t("registration.validation.businessTypeRequired"));
      return;
    }

    if (!industryType) {
      showAlert("warning", t("registration.validation.industryTypeRequired"));
      return;
    }

    if (!companyPhone.trim()) {
      showAlert("warning", t("registration.validation.companyPhoneRequired"));
      return;
    }

    const phoneValidation = validateAustralianPhone(companyPhone);
    if (!phoneValidation.isValid) {
      showAlert(
        "error",
        phoneValidation.message || t("registration.validation.phoneInvalid"),
      );
      return;
    }

    // Pass data to next step
    onNext({
      companyName,
      tradingName,
      abn,
      acn,
      businessType,
      industryType,
      companyEmail,
      companyPhone,
    });
  };

  const handleAbnChange = (text: string) => {
    setAbn(text);
  };

  const handleAbnBlur = () => {
    const formatted = formatABN(abn);
    setAbn(formatted);
  };

  const handleAcnChange = (text: string) => {
    setAcn(text);
  };

  const handleAcnBlur = () => {
    if (acn.trim()) {
      const formatted = formatACN(acn);
      setAcn(formatted);
    }
  };

  const handleCompanyPhoneChange = (text: string) => {
    setCompanyPhone(text);
  };

  const handleCompanyPhoneBlur = () => {
    const formatted = formatAustralianPhone(companyPhone);
    setCompanyPhone(formatted);
  };

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      {/* Title */}
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.businessDetails.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.businessDetails.subtitle")}
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
          {t("registration.fields.companyName")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("registration.fields.companyNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.tradingName")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("registration.fields.tradingNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={tradingName}
          onChangeText={setTradingName}
          autoCapitalize="words"
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.tradingNameHelper")}
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.abn")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="XX XXX XXX XXX"
          placeholderTextColor={colors.textSecondary}
          value={abn}
          onChangeText={handleAbnChange}
          onBlur={handleAbnBlur}
          keyboardType="number-pad"
          maxLength={14}
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.abnHelper")}
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.acn")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="XXX XXX XXX"
          placeholderTextColor={colors.textSecondary}
          value={acn}
          onChangeText={handleAcnChange}
          onBlur={handleAcnBlur}
          keyboardType="number-pad"
          maxLength={11}
          editable={!isLoading}
        />
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          {t("registration.fields.acnHelper")}
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.businessType")} *
        </Text>
        <View
          style={[styles.inputBase, { padding: 0, justifyContent: "center" }]}
        >
          <Picker
            selectedValue={businessType}
            onValueChange={(
              value: "sole_trader" | "partnership" | "company" | "trust" | "",
            ) =>
              setBusinessType(
                value as "sole_trader" | "partnership" | "company" | "trust",
              )
            }
            enabled={!isLoading}
            style={{ color: colors.text }}
          >
            <Picker.Item
              label={t("registration.fields.selectBusinessType")}
              value=""
            />
            <Picker.Item
              label={t("registration.businessTypes.soleTrader")}
              value="sole_trader"
            />
            <Picker.Item
              label={t("registration.businessTypes.partnership")}
              value="partnership"
            />
            <Picker.Item
              label={t("registration.businessTypes.company")}
              value="company"
            />
            <Picker.Item
              label={t("registration.businessTypes.trust")}
              value="trust"
            />
          </Picker>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.industryType")} *
        </Text>
        <View
          style={[styles.inputBase, { padding: 0, justifyContent: "center" }]}
        >
          <Picker
            selectedValue={industryType}
            onValueChange={(
              value: "removals" | "logistics" | "storage" | "other" | "",
            ) =>
              setIndustryType(
                value as "removals" | "logistics" | "storage" | "other",
              )
            }
            enabled={!isLoading}
            style={{ color: colors.text }}
          >
            <Picker.Item
              label={t("registration.fields.selectIndustryType")}
              value=""
            />
            <Picker.Item
              label={t("registration.industryTypes.removals")}
              value="removals"
            />
            <Picker.Item
              label={t("registration.industryTypes.logistics")}
              value="logistics"
            />
            <Picker.Item
              label={t("registration.industryTypes.storage")}
              value="storage"
            />
            <Picker.Item
              label={t("registration.industryTypes.other")}
              value="other"
            />
          </Picker>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.companyEmail")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder={t("registration.fields.companyEmailPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={companyEmail}
          onChangeText={setCompanyEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.companyPhone")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="+61 2XX XXX XXX"
          placeholderTextColor={colors.textSecondary}
          value={companyPhone}
          onChangeText={handleCompanyPhoneChange}
          onBlur={handleCompanyPhoneBlur}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      </View>

      {/* Buttons */}
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
              opacity: isLoading ? 0.6 : 1,
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

export default BusinessDetailsStep;
