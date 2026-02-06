// SubscriptionPlanStep.tsx
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface SubscriptionPlanStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const SubscriptionPlanStep: React.FC<SubscriptionPlanStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [planType, setPlanType] = useState(data.planType);
  const [billingFrequency, setBillingFrequency] = useState(
    data.billingFrequency,
  );
  const [estimatedJobsPerMonth, setEstimatedJobsPerMonth] = useState(
    data.estimatedJobsPerMonth,
  );
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
    if (!planType) {
      showAlert("warning", t("registration.validation.planTypeRequired"));
      return;
    }

    if (!billingFrequency) {
      showAlert(
        "warning",
        t("registration.validation.billingFrequencyRequired"),
      );
      return;
    }

    onNext({ planType, billingFrequency, estimatedJobsPerMonth });
  };

  const plans = [
    {
      value: "starter",
      name: "Starter",
      price: "$49",
      priceYearly: "$490",
      features: ["Up to 20 jobs/month", "Basic support", "1 user"],
    },
    {
      value: "professional",
      name: "Professional",
      price: "$99",
      priceYearly: "$990",
      features: [
        "Up to 100 jobs/month",
        "Priority support",
        "5 users",
        "Analytics",
      ],
    },
    {
      value: "enterprise",
      name: "Enterprise",
      price: "$199",
      priceYearly: "$1990",
      features: [
        "Unlimited jobs",
        "24/7 support",
        "Unlimited users",
        "Advanced features",
      ],
    },
  ];

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.subscription.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.subscription.subtitle")}
        </Text>
      </View>

      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      {/* Plan Cards */}
      <View style={{ marginBottom: 24 }}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.value}
            style={{
              padding: 16,
              marginBottom: 12,
              borderRadius: 12,
              borderWidth: 2,
              borderColor:
                planType === plan.value ? colors.primary : colors.border,
              backgroundColor:
                planType === plan.value
                  ? `${colors.primary}10`
                  : colors.backgroundSecondary,
            }}
            onPress={() =>
              setPlanType(
                plan.value as "starter" | "professional" | "enterprise",
              )
            }
            disabled={isLoading}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={[styles.subtitle, { fontWeight: "700" }]}>
                {plan.name}
              </Text>
              <View>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.primary, fontWeight: "700" },
                  ]}
                >
                  {billingFrequency === "yearly"
                    ? plan.priceYearly
                    : plan.price}
                  <Text
                    style={[styles.bodySmall, { color: colors.textSecondary }]}
                  >
                    /{billingFrequency === "yearly" ? "year" : "month"}
                  </Text>
                </Text>
              </View>
            </View>
            {plan.features.map((feature, idx) => (
              <Text
                key={idx}
                style={[
                  styles.bodySmall,
                  { color: colors.textSecondary, marginBottom: 4 },
                ]}
              >
                ✓ {feature}
              </Text>
            ))}
          </TouchableOpacity>
        ))}
      </View>

      {/* Billing Frequency */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.billingFrequency")} *
        </Text>
        <View
          style={[styles.inputBase, { padding: 0, justifyContent: "center" }]}
        >
          <Picker
            selectedValue={billingFrequency}
            onValueChange={(value: "monthly" | "yearly" | "") =>
              setBillingFrequency(value as "monthly" | "yearly")
            }
            enabled={!isLoading}
            style={{ color: colors.text }}
          >
            <Picker.Item
              label={t("registration.fields.selectBillingFrequency")}
              value=""
            />
            <Picker.Item
              label={t("registration.billingFrequency.monthly")}
              value="monthly"
            />
            <Picker.Item
              label={t("registration.billingFrequency.yearly") + " (Save 17%)"}
              value="yearly"
            />
          </Picker>
        </View>
      </View>

      {/* Estimated Jobs */}
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.estimatedJobsPerMonth")}
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="e.g., 25"
          placeholderTextColor={colors.textSecondary}
          value={estimatedJobsPerMonth}
          onChangeText={setEstimatedJobsPerMonth}
          keyboardType="number-pad"
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

export default SubscriptionPlanStep;
