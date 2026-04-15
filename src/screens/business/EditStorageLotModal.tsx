/**
 * EditStorageLotModal — Edit an existing storage lot's info & billing
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import * as StorageService from "../../services/storageService";
import type { BillingType, LotStatus, StorageLot } from "../../types/storage";

interface Props {
  visible: boolean;
  lot: StorageLot | null;
  onClose: () => void;
  onUpdated: (lot: StorageLot) => void;
}

const BILLING_TYPES: BillingType[] = ["fixed", "weekly", "monthly"];
const LOT_STATUSES: LotStatus[] = ["active", "completed", "overdue", "pending_pickup"];

const STATUS_COLORS: Record<LotStatus, string> = {
  active: "#10B981",
  completed: "#6B7280",
  overdue: "#EF4444",
  pending_pickup: "#F59E0B",
};

export default function EditStorageLotModal({ visible, lot, onClose, onUpdated }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [billingType, setBillingType] = useState<BillingType>("monthly");
  const [billingAmount, setBillingAmount] = useState("");
  const [status, setStatus] = useState<LotStatus>("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && lot) {
      setClientName(lot.client_name);
      setClientEmail(lot.client_email || "");
      setClientPhone(lot.client_phone || "");
      setBillingType(lot.billing_type);
      setBillingAmount(String(lot.billing_amount || ""));
      setStatus(lot.status);
      setNotes(lot.notes || "");
    }
  }, [visible, lot]);

  const handleSave = async () => {
    if (!lot || !clientName.trim()) return;
    setSaving(true);
    try {
      const updated = await StorageService.updateLot(lot.id, {
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        billing_type: billingType,
        billing_amount: parseFloat(billingAmount) || 0,
        status,
        notes: notes.trim() || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB",
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("storage.editLot.title")}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.clientName")} *
            </Text>
            <TextInput style={inputStyle} value={clientName} onChangeText={setClientName} />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.clientEmail")}
            </Text>
            <TextInput
              style={inputStyle}
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.clientPhone")}
            </Text>
            <TextInput
              style={inputStyle}
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.billingType")}
            </Text>
            <View style={styles.chipRow}>
              {BILLING_TYPES.map((bt) => {
                const active = billingType === bt;
                return (
                  <Pressable
                    key={bt}
                    style={[
                      styles.chip,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => setBillingType(bt)}
                  >
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: active ? "600" : "400" }}>
                      {t(`storage.billing.${bt}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.billingAmount")} ($)
            </Text>
            <TextInput
              style={inputStyle}
              value={billingAmount}
              onChangeText={setBillingAmount}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.editLot.status")}
            </Text>
            <View style={styles.chipRow}>
              {LOT_STATUSES.map((s) => {
                const active = status === s;
                const color = STATUS_COLORS[s];
                return (
                  <Pressable
                    key={s}
                    style={[
                      styles.chip,
                      { borderColor: active ? color : colors.border },
                      active && { backgroundColor: color + "15" },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={{ color: active ? color : colors.textSecondary, fontSize: 13, fontWeight: active ? "600" : "400" }}>
                      {t(`storage.status.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("storage.fields.notes")}
            </Text>
            <TextInput
              style={[...inputStyle, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder={t("storage.fields.notesPlaceholder")}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={{ height: 16 }} />
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                opacity: saving || !clientName.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving || !clientName.trim()}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t("common.saving") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  body: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  saveBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
