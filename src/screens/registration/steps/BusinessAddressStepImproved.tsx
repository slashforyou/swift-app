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
import { validatePostcode } from "../../../utils/validators/australianValidators";

interface BusinessAddressStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const BusinessAddressStepImproved: React.FC<BusinessAddressStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.businessAddress : {};

  const [streetAddress, setStreetAddress] = useState(
    data.streetAddress || autoFillData.streetAddress || "",
  );
  const [suburb, setSuburb] = useState(
    data.suburb || autoFillData.suburb || "",
  );
  const [state, setState] = useState(data.state || autoFillData.state || "NSW");
  const [postcode, setPostcode] = useState(
    data.postcode || autoFillData.postcode || "",
  );
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const suburbRef = useRef<TextInput>(null);
  const postcodeRef = useRef<TextInput>(null);

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

      {/* Section: 📍 Business Address */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          📍 {t("registration.address.title")}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={[styles.inputBase, { backgroundColor: colors.background }]}
            placeholder={t("registration.fields.streetAddress")}
            placeholderTextColor={colors.textSecondary}
            value={streetAddress}
            onChangeText={setStreetAddress}
            returnKeyType="next"
            onSubmitEditing={() => suburbRef.current?.focus()}
            editable={!isLoading}
            autoCapitalize="words"
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 2 }}>
            <TextInput
              ref={suburbRef}
              style={[styles.inputBase, { backgroundColor: colors.background }]}
              placeholder={t("registration.fields.suburb")}
              placeholderTextColor={colors.textSecondary}
              value={suburb}
              onChangeText={setSuburb}
              returnKeyType="next"
              onSubmitEditing={() => postcodeRef.current?.focus()}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.inputBase,
                { backgroundColor: colors.background, paddingHorizontal: 0 },
              ]}
            >
              <Picker
                selectedValue={state}
                onValueChange={(value) => setState(value)}
                enabled={!isLoading}
                style={{ color: colors.text }}
              >
                <Picker.Item label={t("registration.fields.state")} value="" />
                <Picker.Item label="NSW" value="NSW" />
                <Picker.Item label="VIC" value="VIC" />
                <Picker.Item label="QLD" value="QLD" />
                <Picker.Item label="SA" value="SA" />
                <Picker.Item label="WA" value="WA" />
                <Picker.Item label="TAS" value="TAS" />
                <Picker.Item label="NT" value="NT" />
                <Picker.Item label="ACT" value="ACT" />
              </Picker>
            </View>
          </View>
        </View>

        <TextInput
          ref={postcodeRef}
          style={[styles.inputBase, { backgroundColor: colors.background }]}
          placeholder={t("registration.fields.postcode")}
          placeholderTextColor={colors.textSecondary}
          value={postcode}
          onChangeText={setPostcode}
          keyboardType="number-pad"
          maxLength={4}
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

export default BusinessAddressStepImproved;
