import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { TEST_DATA } from "../../../config/testData";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface SubscriptionPlanStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const SubscriptionPlanStepImproved: React.FC<SubscriptionPlanStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.subscription : {};

  const [planType, setPlanType] = useState(
    data.planType || autoFillData.planType || "starter",
  );
  const [billingFrequency, setBillingFrequency] = useState(
    data.billingFrequency || autoFillData.billingFrequency || "monthly",
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

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
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

    onNext({ planType, billingFrequency });
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

  const localStyles = StyleSheet.create({
    planCard: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 2,
    },
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

      {/* Section: 💳 Choose Your Plan */}
      <View style={{ marginBottom: 16 }}>
        <Text style={localStyles.sectionTitle}>
          💳 {t("registration.subscription.title")}
        </Text>

        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.value}
            style={[
              localStyles.planCard,
              {
                borderColor:
                  planType === plan.value ? colors.primary : colors.border,
                backgroundColor:
                  planType === plan.value
                    ? `${colors.primary}10`
                    : colors.backgroundSecondary,
              },
            ]}
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
                    /{billingFrequency === "yearly" ? "yr" : "mo"}
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

      {/* Section: 📊 Billing */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          📊 {t("registration.subscription.billingDetails")}
        </Text>

        <View
          style={[
            styles.inputBase,
            { backgroundColor: colors.background, paddingHorizontal: 0 },
          ]}
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

export default SubscriptionPlanStepImproved;
