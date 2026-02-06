// InsuranceStep.tsx - OPTIONAL
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface InsuranceStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const InsuranceStep: React.FC<InsuranceStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [insuranceProvider, setInsuranceProvider] = useState(
    data.insuranceProvider,
  );
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    data.insurancePolicyNumber,
  );
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(
    data.insuranceExpiryDate,
  );

  const handleNext = () => {
    onNext({ insuranceProvider, insurancePolicyNumber, insuranceExpiryDate });
  };

  const handleSkip = () => {
    onNext({
      insuranceProvider: "",
      insurancePolicyNumber: "",
      insuranceExpiryDate: "",
    });
  };

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.insurance.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.insurance.subtitle")}
        </Text>
        <View
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 8,
          }}
        >
          <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
            ℹ️ {t("registration.insurance.optional")}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.insuranceProvider")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="CGU, Allianz, QBE..."
          placeholderTextColor={colors.textSecondary}
          value={insuranceProvider}
          onChangeText={setInsuranceProvider}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.insurancePolicyNumber")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="POL-123456"
          placeholderTextColor={colors.textSecondary}
          value={insurancePolicyNumber}
          onChangeText={setInsurancePolicyNumber}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.insuranceExpiryDate")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          value={insuranceExpiryDate}
          onChangeText={setInsuranceExpiryDate}
          keyboardType="numbers-and-punctuation"
          editable={!isLoading}
        />
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
          style={[styles.buttonSecondary, { flex: 1 }]}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.buttonSecondaryText}>
            {t("registration.buttons.skip")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.buttonPrimary, { flex: 1 }]}
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

export default InsuranceStep;
