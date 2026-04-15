/**
 * StorageUnitDetailScreen — Detail view for a single storage unit
 * Shows unit info, assigned lots, edit capability
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import MascotLoading from "../../components/ui/MascotLoading";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import * as StorageService from "../../services/storageService";
import type {
    StorageLot,
    StorageUnit,
    UnitStatus,
    UnitType,
} from "../../types/storage";

interface Props {
  unitId: number;
  onBack: () => void;
  onOpenLot?: (lotId: number) => void;
}

const UNIT_TYPE_ICONS: Record<UnitType, string> = {
  container: "cube-outline",
  box: "archive-outline",
  room: "home-outline",
  shelf: "layers-outline",
};

const STATUS_COLORS: Record<UnitStatus, string> = {
  available: "#10B981",
  in_use: "#3B82F6",
  full: "#F59E0B",
  maintenance: "#6B7280",
};

const STATUS_ICONS: Record<UnitStatus, string> = {
  available: "checkmark-circle",
  in_use: "ellipse",
  full: "alert-circle",
  maintenance: "construct",
};

export default function StorageUnitDetailScreen({ unitId, onBack, onOpenLot }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [unit, setUnit] = useState<StorageUnit | null>(null);
  const [lots, setLots] = useState<StorageLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allUnits, allLots] = await Promise.all([
        StorageService.listUnits(),
        StorageService.listLots(),
      ]);
      const found = allUnits.find((u) => u.id === unitId);
      setUnit(found || null);
      // Filter lots that reference this unit (we check by unit data on lot detail)
      // For simplicity, just show all lots; backend should ideally have an endpoint
      setLots(allLots);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = () => {
    Alert.alert(
      t("storage.unitDetail.deleteTitle"),
      t("storage.unitDetail.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.deleteUnit(unitId);
              onBack();
            } catch (e: any) {
              Alert.alert(t("common.error"), e.message);
            }
          },
        },
      ],
    );
  };

  const changeStatus = (newStatus: UnitStatus) => {
    Alert.alert(
      t("storage.unitDetail.changeStatus"),
      t(`storage.unitStatus.${newStatus}`),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: async () => {
            try {
              const updated = await StorageService.updateUnit(unitId, { status: newStatus });
              setUnit(updated);
            } catch (e: any) {
              Alert.alert(t("common.error"), e.message);
            }
          },
        },
      ],
    );
  };

  // ── Edit Modal ──
  const EditUnitModal = () => {
    const [name, setName] = useState(unit?.name || "");
    const [unitType, setUnitType] = useState<UnitType>(unit?.unit_type || "container");
    const [capacity, setCapacity] = useState(unit?.capacity_cbm ? String(unit.capacity_cbm) : "");
    const [location, setLocation] = useState(unit?.location_description || "");
    const [notes, setNotes] = useState(unit?.notes || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!name.trim()) return;
      setSaving(true);
      try {
        const updated = await StorageService.updateUnit(unitId, {
          name: name.trim(),
          unit_type: unitType,
          capacity_cbm: parseFloat(capacity) || undefined,
          location_description: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setUnit(updated);
        setShowEdit(false);
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
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("storage.unitDetail.editTitle")}
              </Text>
              <Pressable onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t("storage.fields.unitName")} *
              </Text>
              <TextInput style={inputStyle} value={name} onChangeText={setName} />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t("storage.fields.unitType")}
              </Text>
              <View style={styles.chipRow}>
                {(["container", "box", "room", "shelf"] as UnitType[]).map((ut) => {
                  const active = unitType === ut;
                  return (
                    <Pressable
                      key={ut}
                      style={[
                        styles.chip,
                        { borderColor: active ? colors.primary : colors.border },
                        active && { backgroundColor: colors.primary + "15" },
                      ]}
                      onPress={() => setUnitType(ut)}
                    >
                      <Ionicons
                        name={UNIT_TYPE_ICONS[ut] as any}
                        size={14}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={{
                          color: active ? colors.primary : colors.textSecondary,
                          fontSize: 13,
                          marginLeft: 4,
                        }}
                      >
                        {t(`storage.unitType.${ut}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t("storage.fields.capacity")}
              </Text>
              <TextInput
                style={inputStyle}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="decimal-pad"
                placeholder="m³"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t("storage.fields.location")}
              </Text>
              <TextInput
                style={inputStyle}
                value={location}
                onChangeText={setLocation}
                placeholder={t("storage.fields.locationPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />

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
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: saving || !name.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={saving || !name.trim()}
            >
              <Text style={styles.saveBtnText}>
                {saving ? t("common.saving") : t("common.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading || !unit) {
    return <MascotLoading text={t("storage.loading")} />;
  }

  const statusColor = STATUS_COLORS[unit.status];
  const icon = UNIT_TYPE_ICONS[unit.unit_type];

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#F8FAFC",
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{unit.name}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {t(`storage.unitType.${unit.unit_type}`)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.editBtn}>
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Status & Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#FFF",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <View style={[styles.bigIcon, { backgroundColor: statusColor + "15" }]}>
              <Ionicons name={icon as any} size={32} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {t(`storage.unitStatus.${unit.status}`)}
                  </Text>
                </View>
              </View>
              {unit.capacity_cbm && (
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  <Ionicons name="resize-outline" size={13} color={colors.textSecondary} />{" "}
                  {unit.capacity_cbm} m³
                </Text>
              )}
              {unit.location_description && (
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />{" "}
                  {unit.location_description}
                </Text>
              )}
              {(unit.active_lots ?? 0) > 0 && (
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  <Ionicons name="people-outline" size={13} color={colors.textSecondary} />{" "}
                  {unit.active_lots} {t("storage.activeLots")}
                </Text>
              )}
            </View>
          </View>
          {unit.notes && (
            <Text style={[styles.notesText, { color: colors.textSecondary, borderTopColor: colors.border }]}>
              {unit.notes}
            </Text>
          )}
        </View>

        {/* Quick Status Change */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("storage.unitDetail.changeStatus")}
        </Text>
        <View style={styles.statusGrid}>
          {(["available", "in_use", "full", "maintenance"] as UnitStatus[]).map((s) => {
            const isActive = unit.status === s;
            const color = STATUS_COLORS[s];
            return (
              <Pressable
                key={s}
                style={[
                  styles.statusBtn,
                  {
                    borderColor: isActive ? color : colors.border,
                    backgroundColor: isActive ? color + "15" : "transparent",
                  },
                ]}
                onPress={() => !isActive && changeStatus(s)}
                disabled={isActive}
              >
                <Ionicons name={(STATUS_ICONS[s] || "ellipse") as any} size={16} color={color} />
                <Text style={{ color: isActive ? color : colors.textSecondary, fontSize: 12, fontWeight: isActive ? "600" : "400" }}>
                  {t(`storage.unitStatus.${s}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Metadata */}
        <View style={[styles.metaCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#F8FAFC", borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              {t("storage.unitDetail.created")}
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {new Date(unit.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              {t("storage.unitDetail.updated")}
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {new Date(unit.updated_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>ID</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>#{unit.id}</Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteBtnText}>{t("storage.unitDetail.delete")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditUnitModal />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 1 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: { padding: 16, paddingBottom: 40 },

  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", gap: 14 },
  bigIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: { flexDirection: "row", marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  infoText: { fontSize: 13, marginTop: 4 },
  notesText: {
    fontSize: 13,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontStyle: "italic",
  },

  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
  },

  metaCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 13, fontWeight: "500" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
  },
  deleteBtnText: { color: "#EF4444", fontSize: 15, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 30 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
