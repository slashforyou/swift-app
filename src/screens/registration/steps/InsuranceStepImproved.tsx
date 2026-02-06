import React, { useRef, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { TEST_DATA } from "../../../config/testData";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface InsuranceStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const InsuranceStepImproved: React.FC<InsuranceStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.insurance : {};

  const [hasInsurance, setHasInsurance] = useState(
    data.insuranceProvider
      ? !!data.insuranceProvider
      : __DEV__
        ? autoFillData.hasInsurance
        : false,
  );
  const [insuranceProvider, setInsuranceProvider] = useState(
    data.insuranceProvider || autoFillData.insuranceProvider || "",
  );
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    data.insurancePolicyNumber || autoFillData.policyNumber || "",
  );
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(
    data.insuranceExpiryDate || autoFillData.expiryDate || "",
  );

  const policyNumberRef = useRef<TextInput>(null);
  const expiryDateRef = useRef<TextInput>(null);

  const handleNext = () => {
    if (hasInsurance) {
      onNext({ insuranceProvider, insurancePolicyNumber, insuranceExpiryDate });
    } else {
      onNext({
        insuranceProvider: "",
        insurancePolicyNumber: "",
        insuranceExpiryDate: "",
      });
    }
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
    infoBox: {
      padding: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      marginBottom: 16,
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, paddingVertical: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Info Box */}
      <View style={localStyles.infoBox}>
        <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
          ℹ️ {t("registration.insurance.optional")}
        </Text>
      </View>

      {/* Toggle Insurance */}
      <View
        style={[
          localStyles.section,
          {
            backgroundColor: colors.backgroundSecondary,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <Text style={[styles.body, { fontWeight: "600" }]}>
          🛡️ {t("registration.insurance.hasInsurance")}
        </Text>
        <Switch
          value={hasInsurance}
          onValueChange={setHasInsurance}
          disabled={isLoading}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
        />
      </View>

      {/* Insurance Details (conditional) */}
      {hasInsurance && (
        <View
          style={[
            localStyles.section,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text style={localStyles.sectionTitle}>
            🛡️ {t("registration.insurance.title")}
          </Text>

          <View style={{ marginBottom: 12 }}>
            <TextInput
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder={t("registration.fields.insuranceProvider")}
              placeholderTextColor={colors.textSecondary}
              value={insuranceProvider}
              onChangeText={setInsuranceProvider}
              returnKeyType="next"
              onSubmitEditing={() => policyNumberRef.current?.focus()}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <TextInput
              ref={policyNumberRef}
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder={t("registration.fields.insurancePolicyNumber")}
              placeholderTextColor={colors.textSecondary}
              value={insurancePolicyNumber}
              onChangeText={setInsurancePolicyNumber}
              returnKeyType="next"
              onSubmitEditing={() => expiryDateRef.current?.focus()}
              editable={!isLoading}
            />
          </View>

          <TextInput
            ref={expiryDateRef}
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.insuranceExpiryDate")}
            placeholderTextColor={colors.textSecondary}
            value={insuranceExpiryDate}
            onChangeText={setInsuranceExpiryDate}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            editable={!isLoading}
          />
        </View>
      )}

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

export default InsuranceStepImproved;
