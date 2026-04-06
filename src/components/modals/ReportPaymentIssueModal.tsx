/**
 * ReportPaymentIssueModal — Modal permettant au staff terrain de signaler
 * un problème de paiement au bureau
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    PaymentIssueType,
    reportPaymentIssue,
} from "../../services/paymentIssueService";

interface Props {
  visible: boolean;
  onClose: () => void;
  jobId: number;
}

const ISSUE_TYPES: { type: PaymentIssueType; icon: string }[] = [
  { type: "wrong_amount", icon: "cash-outline" },
  { type: "wrong_billing_mode", icon: "swap-horizontal-outline" },
  { type: "missing_hours", icon: "time-outline" },
  { type: "double_charge", icon: "copy-outline" },
  { type: "client_dispute", icon: "people-outline" },
  { type: "other", icon: "help-circle-outline" },
];

const ReportPaymentIssueModal: React.FC<Props> = ({
  visible,
  onClose,
  jobId,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [selectedType, setSelectedType] = useState<PaymentIssueType | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSending(true);
    try {
      const result = await reportPaymentIssue(
        jobId,
        selectedType,
        description,
      );
      if (result.success) {
        Alert.alert(
          t("jobDetails.payment.reportIssue.successTitle"),
          t("jobDetails.payment.reportIssue.successMessage"),
        );
        setSelectedType(null);
        setDescription("");
        onClose();
      } else {
        Alert.alert(
          t("common.error") || "Error",
          t("jobDetails.payment.reportIssue.errorMessage"),
        );
      }
    } catch {
      Alert.alert(
        t("common.error") || "Error",
        t("jobDetails.payment.reportIssue.errorMessage"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
            borderTopRightRadius: DESIGN_TOKENS.radius.lg,
            maxHeight: "80%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: DESIGN_TOKENS.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Ionicons
                name="alert-circle"
                size={24}
                color={colors.warning}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {t("jobDetails.payment.reportIssue.title")}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ padding: DESIGN_TOKENS.spacing.lg }}
            contentContainerStyle={{
              paddingBottom: DESIGN_TOKENS.spacing.xl,
            }}
          >
            {/* Subtitle */}
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                lineHeight: 20,
              }}
            >
              {t("jobDetails.payment.reportIssue.subtitle")}
            </Text>

            {/* Issue type selection */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("jobDetails.payment.reportIssue.selectType")}
            </Text>

            <View
              style={{
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {ISSUE_TYPES.map(({ type, icon }) => {
                const isSelected = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: DESIGN_TOKENS.spacing.md,
                      padding: DESIGN_TOKENS.spacing.md,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      borderWidth: 2,
                      borderColor: isSelected
                        ? colors.warning
                        : colors.border,
                      backgroundColor: isSelected
                        ? colors.warning + "15"
                        : colors.backgroundSecondary,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isSelected
                          ? colors.warning + "30"
                          : colors.backgroundSecondary,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={icon as any}
                        size={20}
                        color={
                          isSelected ? colors.warning : colors.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected ? "600" : "400",
                        color: isSelected ? colors.warning : colors.text,
                        flex: 1,
                      }}
                    >
                      {t(
                        `jobDetails.payment.reportIssue.types.${type}` as any,
                      )}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.warning}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("jobDetails.payment.reportIssue.descriptionLabel")}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 14,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: "top",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
              placeholder={t(
                "jobDetails.payment.reportIssue.descriptionPlaceholder",
              )}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={2000}
              value={description}
              onChangeText={setDescription}
            />

            {/* Submit button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedType || sending}
              style={({ pressed }) => ({
                backgroundColor:
                  !selectedType || sending
                    ? colors.textSecondary + "40"
                    : pressed
                      ? colors.warning + "DD"
                      : colors.warning,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                minHeight: 50,
              })}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {t("jobDetails.payment.reportIssue.submit")}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ReportPaymentIssueModal;
