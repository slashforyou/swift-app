/**
 * ContainerLayoutScreen — Visual drag-and-drop layout for lot units
 * Displays units as cards that can be reordered by pressing move up/down buttons
 * (React Native doesn't natively support drag-and-drop easily, so we use move buttons)
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import * as StorageService from "../../services/storageService";
import type { StorageUnit, UnitType } from "../../types/storage";

interface Props {
  lotId: number;
  initialUnits: (StorageUnit & { position: number; assignment_id: number })[];
  onBack: () => void;
  onChanged: () => void;
}

const UNIT_TYPE_ICONS: Record<UnitType, string> = {
  container: "cube-outline",
  box: "archive-outline",
  room: "home-outline",
  shelf: "layers-outline",
};

const STATUS_COLORS: Record<string, string> = {
  available: "#10B981",
  in_use: "#3B82F6",
  full: "#F59E0B",
  maintenance: "#6B7280",
};

export default function ContainerLayoutScreen({
  lotId,
  initialUnits,
  onBack,
  onChanged,
}: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [units, setUnits] = useState(
    [...initialUnits].sort((a, b) => a.position - b.position),
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Available units for adding ──
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<StorageUnit[]>([]);

  const moveUnit = (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= units.length) return;

    const newUnits = [...units];
    [newUnits[index], newUnits[swapIdx]] = [newUnits[swapIdx], newUnits[index]];
    // Update positions
    newUnits.forEach((u, i) => {
      u.position = i + 1;
    });
    setUnits(newUnits);
    setHasChanges(true);
  };

  const removeUnit = (unitId: number, unitName: string) => {
    Alert.alert(
      t("storage.removeUnit.title"),
      t("storage.removeUnit.confirm", { name: unitName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.removeUnitFromLot(lotId, unitId);
              setUnits((prev) => prev.filter((u) => u.id !== unitId));
              setHasChanges(true);
              onChanged();
            } catch (e: any) {
              Alert.alert(t("common.error"), e.message);
            }
          },
        },
      ],
    );
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      await StorageService.reorderLotUnits(
        lotId,
        units.map((u) => u.id),
      );
      setHasChanges(false);
      onChanged();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddUnit = async () => {
    try {
      const allUnits = await StorageService.listUnits();
      const assignedIds = new Set(units.map((u) => u.id));
      setAvailableUnits(allUnits.filter((u) => !assignedIds.has(u.id)));
      setShowAddUnit(true);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    }
  };

  const addUnit = async (unitId: number) => {
    try {
      await StorageService.assignUnitToLot(lotId, unitId);
      // Refresh
      const lotData = await StorageService.getLot(lotId);
      setUnits([...lotData.units].sort((a, b) => a.position - b.position));
      setShowAddUnit(false);
      onChanged();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    }
  };

  const renderUnit = ({
    item,
    index,
  }: {
    item: StorageUnit & { position: number; assignment_id: number };
    index: number;
  }) => {
    const icon = UNIT_TYPE_ICONS[item.unit_type] || "cube-outline";
    const statusColor = STATUS_COLORS[item.status] || "#6B7280";

    return (
      <View
        style={[
          styles.unitCard,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#FFF",
            borderColor: colors.border,
          },
        ]}
      >
        {/* Position badge */}
        <View style={[styles.positionBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.positionText, { color: colors.primary }]}>
            {index + 1}
          </Text>
        </View>

        {/* Unit info */}
        <View style={[styles.unitIconBox, { backgroundColor: statusColor + "15" }]}>
          <Ionicons name={icon as any} size={24} color={statusColor} />
        </View>

        <View style={styles.unitInfo}>
          <Text style={[styles.unitName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.unitMeta, { color: colors.textSecondary }]}>
            {t(`storage.unitType.${item.unit_type}`)}
            {item.capacity_cbm ? ` · ${item.capacity_cbm} m³` : ""}
          </Text>
          {item.location_description && (
            <Text style={[styles.unitLocation, { color: colors.textSecondary }]}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />{" "}
              {item.location_description}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => moveUnit(index, "up")}
            disabled={index === 0}
            style={[styles.moveBtn, { opacity: index === 0 ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-up" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => moveUnit(index, "down")}
            disabled={index === units.length - 1}
            style={[styles.moveBtn, { opacity: index === units.length - 1 ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => removeUnit(item.id, item.name)}
            style={styles.removeBtn}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("storage.layout.title")}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {units.length} {t("storage.units")}
          </Text>
        </View>
        {hasChanges && (
          <TouchableOpacity
            style={[styles.saveHeaderBtn, { backgroundColor: colors.primary }]}
            onPress={saveOrder}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.saveHeaderText}>
              {saving ? "..." : t("common.save")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Layout hint */}
      <View style={[styles.hintRow, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFFBEB" }]}>
        <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
        <Text style={[styles.hintText, { color: isDark ? colors.textSecondary : "#92400E" }]}>
          {t("storage.layout.hint")}
        </Text>
      </View>

      {/* Units list */}
      {units.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("storage.emptyUnitsInLot")}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            {t("storage.layout.addHint")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderUnit}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Unit button */}
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={openAddUnit}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>
          {t("storage.assignUnit")}
        </Text>
      </TouchableOpacity>

      {/* Simple unit picker overlay */}
      {showAddUnit && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {t("storage.assignUnit")}
              </Text>
              <Pressable onPress={() => setShowAddUnit(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={availableUnits}
              keyExtractor={(u) => String(u.id)}
              style={{ maxHeight: 300, padding: 12 }}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.textSecondary, textAlign: "center", paddingVertical: 20 },
                  ]}
                >
                  {t("storage.noAvailableUnits")}
                </Text>
              }
              renderItem={({ item: unit }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerRow,
                    { borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#FFF" },
                  ]}
                  onPress={() => addUnit(unit.id)}
                >
                  <Ionicons
                    name={(UNIT_TYPE_ICONS[unit.unit_type] || "cube-outline") as any}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.unitName, { color: colors.text }]}>{unit.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {t(`storage.unitType.${unit.unit_type}`)}
                      {unit.capacity_cbm ? ` · ${unit.capacity_cbm} m³` : ""}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
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
  saveHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveHeaderText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  hintText: { fontSize: 12, flex: 1 },

  listContent: { padding: 16, paddingBottom: 100 },

  unitCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: { fontSize: 14, fontWeight: "700" },
  unitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unitInfo: { flex: 1 },
  unitName: { fontSize: 15, fontWeight: "600" },
  unitMeta: { fontSize: 12, marginTop: 1 },
  unitLocation: { fontSize: 11, marginTop: 2 },

  actions: { alignItems: "center", gap: 2 },
  moveBtn: { padding: 4 },
  removeBtn: { padding: 4, marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
  },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  emptyHint: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },

  // Picker overlay
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 17, fontWeight: "700" },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
