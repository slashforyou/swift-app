import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";
import { validatePostcode } from "../../../utils/validators/australianValidators";

interface BusinessAddressStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const BusinessAddressStep: React.FC<BusinessAddressStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [streetAddress, setStreetAddress] = useState(data.streetAddress);
  const [suburb, setSuburb] = useState(data.suburb);
  const [state, setState] = useState(data.state);
  const [postcode, setPostcode] = useState(data.postcode);
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
    if (!streetAddress.trim()) {
      showAlert("warning", t("registration.validation.streetAddressRequired"));
      return;
    }

    if (!suburb.trim()) {
      showAlert("warning", t("registration.validation.suburbRequired"));
      return;
    }

    if (!state) {
      showAlert("warning", t("registration.validation.stateRequired"));
      return;
    }

    if (!postcode.trim()) {
      showAlert("warning", t("registration.validation.postcodeRequired"));
      return;
    }

    const postcodeValidation = validatePostcode(postcode);
    if (!postcodeValidation.isValid) {
      showAlert(
        "error",
        postcodeValidation.message ||
          t("registration.validation.postcodeInvalid"),
      );
      return;
    }

    onNext({
      streetAddress,
      suburb,
      state,
      postcode,
      country: "Australia",
    });
  };

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.address.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.address.subtitle")}
        </Text>
      </View>

      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={hideAlert}
      />

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.streetAddress")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="123 Main Street"
          placeholderTextColor={colors.textSecondary}
          value={streetAddress}
          onChangeText={setStreetAddress}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.suburb")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="Sydney"
          placeholderTextColor={colors.textSecondary}
          value={suburb}
          onChangeText={setSuburb}
          editable={!isLoading}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.state")} *
        </Text>
        <View
          style={[styles.inputBase, { padding: 0, justifyContent: "center" }]}
        >
          <Picker
            selectedValue={state}
            onValueChange={(
              value:
                | "NSW"
                | "VIC"
                | "QLD"
                | "SA"
                | "WA"
                | "TAS"
                | "NT"
                | "ACT"
                | "",
            ) =>
              setState(
                value as
                  | "NSW"
                  | "VIC"
                  | "QLD"
                  | "SA"
                  | "WA"
                  | "TAS"
                  | "NT"
                  | "ACT",
              )
            }
            enabled={!isLoading}
            style={{ color: colors.text }}
          >
            <Picker.Item
              label={t("registration.fields.selectState")}
              value=""
            />
            <Picker.Item label="New South Wales (NSW)" value="NSW" />
            <Picker.Item label="Victoria (VIC)" value="VIC" />
            <Picker.Item label="Queensland (QLD)" value="QLD" />
            <Picker.Item label="South Australia (SA)" value="SA" />
            <Picker.Item label="Western Australia (WA)" value="WA" />
            <Picker.Item label="Tasmania (TAS)" value="TAS" />
            <Picker.Item label="Northern Territory (NT)" value="NT" />
            <Picker.Item
              label="Australian Capital Territory (ACT)"
              value="ACT"
            />
          </Picker>
        </View>
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          {t("registration.fields.postcode")} *
        </Text>
        <TextInput
          style={styles.inputBase}
          placeholder="2000"
          placeholderTextColor={colors.textSecondary}
          value={postcode}
          onChangeText={setPostcode}
          keyboardType="number-pad"
          maxLength={4}
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

export default BusinessAddressStep;
