import { Picker } from "@react-native-picker/picker";
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

const BusinessDetailsStepImproved: React.FC<BusinessDetailsStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.businessDetails : {};

  const [companyName, setCompanyName] = useState(
    data.companyName || autoFillData.companyName || "",
  );
  const [tradingName, setTradingName] = useState(
    data.tradingName || autoFillData.tradingName || "",
  );
  const [abn, setAbn] = useState(data.abn || autoFillData.abn || "");
  const [acn, setAcn] = useState(data.acn || autoFillData.acn || "");
  const [businessType, setBusinessType] = useState(
    data.businessType || autoFillData.businessType || "soleTrader",
  );
  const [industryType] = useState("moving"); // Locked to moving for now
  const [companyEmail, setCompanyEmail] = useState(
    data.companyEmail || autoFillData.companyEmail || "",
  );
  const [companyPhone, setCompanyPhone] = useState(
    data.companyPhone || autoFillData.companyPhone || "",
  );
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const tradingNameRef = useRef<TextInput>(null);
  const abnRef = useRef<TextInput>(null);
  const acnRef = useRef<TextInput>(null);
  const companyEmailRef = useRef<TextInput>(null);
  const companyPhoneRef = useRef<TextInput>(null);

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

  const handleAbnBlur = () => {
    setAbn(formatABN(abn));
  };

  const handleAcnBlur = () => {
    setAcn(formatACN(acn));
  };

  const handlePhoneBlur = () => {
    setCompanyPhone(formatAustralianPhone(companyPhone));
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

      {/* Section 1: 🏢 Company Information */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          🏢 {t("registration.businessDetails.companyInfo")}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.companyName")}
            placeholderTextColor={colors.textSecondary}
            value={companyName}
            onChangeText={setCompanyName}
            returnKeyType="next"
            onSubmitEditing={() => tradingNameRef.current?.focus()}
            editable={!isLoading}
            autoCapitalize="words"
          />
        </View>

        <TextInput
          ref={tradingNameRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder={t("registration.fields.tradingName")}
          placeholderTextColor={colors.textSecondary}
          value={tradingName}
          onChangeText={setTradingName}
          returnKeyType="next"
          onSubmitEditing={() => abnRef.current?.focus()}
          editable={!isLoading}
          autoCapitalize="words"
        />
      </View>

      {/* Section 2: 📄 Business Registration */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          📄 {t("registration.businessDetails.registration")}
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              ref={abnRef}
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder={t("registration.fields.abn")}
              placeholderTextColor={colors.textSecondary}
              value={abn}
              onChangeText={setAbn}
              onBlur={handleAbnBlur}
              keyboardType="number-pad"
              maxLength={14}
              returnKeyType="next"
              onSubmitEditing={() => acnRef.current?.focus()}
              editable={!isLoading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              ref={acnRef}
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder={t("registration.fields.acn")}
              placeholderTextColor={colors.textSecondary}
              value={acn}
              onChangeText={setAcn}
              onBlur={handleAcnBlur}
              keyboardType="number-pad"
              maxLength={11}
              returnKeyType="next"
              onSubmitEditing={() => companyEmailRef.current?.focus()}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <View
            style={[
              styles.inputBase,
              { backgroundColor: colors.background, paddingHorizontal: 0 },
            ]}
          >
            <Picker
              selectedValue={businessType}
              onValueChange={(value) => setBusinessType(value)}
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

        <View
          style={[
            styles.inputBase,
            {
              backgroundColor: colors.background,
              paddingHorizontal: 0,
              opacity: 0.7,
            },
          ]}
        >
          <Picker
            selectedValue={industryType}
            enabled={false}
            style={{ color: colors.text }}
          >
            <Picker.Item
              label={t("registration.industryTypes.moving")}
              value="moving"
            />
          </Picker>
        </View>
      </View>

      {/* Section 3: 📞 Business Contact */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          📞 {t("registration.businessDetails.contact")}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <TextInput
            ref={companyEmailRef}
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.companyEmail")}
            placeholderTextColor={colors.textSecondary}
            value={companyEmail}
            onChangeText={setCompanyEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => companyPhoneRef.current?.focus()}
            editable={!isLoading}
          />
        </View>

        <TextInput
          ref={companyPhoneRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder={t("registration.fields.companyPhone")}
          placeholderTextColor={colors.textSecondary}
          value={companyPhone}
          onChangeText={setCompanyPhone}
          onBlur={handlePhoneBlur}
          keyboardType="phone-pad"
          maxLength={15}
          returnKeyType="done"
          editable={!isLoading}
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

export default BusinessDetailsStepImproved;
