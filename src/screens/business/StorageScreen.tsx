/**
 * StorageScreen — Main storage management screen
 * Displays units and lots with filters, add/edit capabilities
 * Used as a sub-tab inside Business > Resources
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MascotLoading from "../../components/ui/MascotLoading";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import * as StorageService from "../../services/storageService";
import type {
    BillingType,
    StorageLot,
    StorageStats,
    StorageUnit,
    UnitType,
} from "../../types/storage";

// ── Sub-tabs ──
type StorageSubTab = "lots" | "units";

// ── Color palette ──
const STATUS_COLORS = {
  active: "#10B981",
  completed: "#6B7280",
  overdue: "#EF4444",
  pending_pickup: "#F59E0B",
  available: "#10B981",
  in_use: "#3B82F6",
  full: "#F59E0B",
  maintenance: "#6B7280",
};

const UNIT_TYPE_ICONS: Record<UnitType, string> = {
  container: "cube-outline",
  box: "archive-outline",
  room: "home-outline",
  shelf: "layers-outline",
};

interface StorageScreenProps {
  onOpenLot?: (lotId: number) => void;
  onOpenUnit?: (unitId: number) => void;
}

export default function StorageScreen({ onOpenLot, onOpenUnit }: StorageScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [subTab, setSubTab] = useState<StorageSubTab>("lots");
  const [lots, setLots] = useState<StorageLot[]>([]);
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Help
  const [showStorageHelp, setShowStorageHelp] = useState(false);

  // Modals
  const [showAddLot, setShowAddLot] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [lotsData, unitsData, statsData] = await Promise.all([
        StorageService.listLots(),
        StorageService.listUnits(),
        StorageService.getStorageStats(),
      ]);
      setLots(lotsData);
      setUnits(unitsData);
      setStats(statsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Stats banner ──
  const renderStats = () => {
    if (!stats) return null;
    const hasOverdue = stats.lots.overdue > 0;
    return (
      <View style={[styles.statsRow, { backgroundColor: isDark ? colors.backgroundSecondary : "#F8FAFC", borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#3B82F6" }]}>{stats.units.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("storage.stats.units")}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>{stats.lots.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("storage.stats.activeLots")}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#8B5CF6" }]}>{stats.items_in_storage}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("storage.stats.itemsStored")}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={[styles.statItem, hasOverdue && styles.statItemAlert]}>
          <Text style={[styles.statValue, { color: hasOverdue ? "#EF4444" : colors.textSecondary }]}>
            {stats.lots.overdue}
          </Text>
          <Text style={[styles.statLabel, { color: hasOverdue ? "#EF4444" : colors.textSecondary }]}>
            {t("storage.stats.overdue")}
          </Text>
        </View>
      </View>
    );
  };

  // ── Sub-tab selector ──
  const renderTabs = () => (
    <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
      {(["lots", "units"] as StorageSubTab[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, subTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setSubTab(tab)}
        >
          <Text style={[styles.tabText, { color: subTab === tab ? colors.primary : colors.textSecondary }]}>
            {t(tab === "lots" ? "storage.tabs.lots" : "storage.tabs.units")}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // ── Lot card ──
  const renderLotCard = ({ item: lot }: { item: StorageLot }) => {
    const statusColor = STATUS_COLORS[lot.status] || "#6B7280";
    const isOverdue = lot.status === "overdue";
    return (
      <Pressable
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.backgroundSecondary : "#FFFFFF", borderColor: colors.border },
          isOverdue && { borderColor: "#EF444440" },
        ]}
        onPress={() => onOpenLot?.(lot.id)}
      >
        {/* Accent stripe */}
        <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {lot.client_name}
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {lot.unit_count ?? 0} {t("storage.units")} · {lot.item_count ?? 0} {t("storage.items")}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {t(`storage.status.${lot.status}`)}
              </Text>
            </View>
          </View>
          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <View style={styles.cardFooterItem}>
              <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.cardFooterText, { color: colors.textSecondary }]}>
                ${Number(lot.billing_amount).toFixed(2)} / {t(`storage.billing.${lot.billing_type}`)}
              </Text>
            </View>
            {lot.billing_next_due && (
              <View style={styles.cardFooterItem}>
                <Ionicons name="calendar-outline" size={13} color={isOverdue ? "#EF4444" : colors.textSecondary} />
                <Text style={[styles.cardFooterText, { color: isOverdue ? "#EF4444" : colors.textSecondary }]}>
                  {lot.billing_next_due}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Unit tile (schematic grid) ──
  const renderUnitCard = ({ item: unit }: { item: StorageUnit }) => {
    const statusColor = STATUS_COLORS[unit.status] || "#6B7280";
    const icon = UNIT_TYPE_ICONS[unit.unit_type] || "cube-outline";
    const isFull = unit.status === "in_use" || unit.status === "full";
    return (
      <Pressable
        style={[
          styles.unitTile,
          { backgroundColor: statusColor + (isDark ? "30" : "18"), borderColor: statusColor + "50" },
        ]}
        onPress={() => onOpenUnit?.(unit.id)}
      >
        <Ionicons name={icon as any} size={20} color={statusColor} />
        <Text style={[styles.unitTileName, { color: colors.text }]} numberOfLines={1}>
          {unit.name}
        </Text>
        {unit.capacity_cbm ? (
          <Text style={[styles.unitTileCap, { color: statusColor }]}>{unit.capacity_cbm} m³</Text>
        ) : null}
        {isFull && (unit.active_lots ?? 0) > 0 ? (
          <View style={[styles.unitTileLotBadge, { backgroundColor: statusColor + "30" }]}>
            <Text style={[styles.unitTileLotText, { color: statusColor }]}>{unit.active_lots} lots</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  // ── Add Lot Modal ──
  const AddLotModal = () => {
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [billingType, setBillingType] = useState<BillingType>("monthly");
    const [billingAmount, setBillingAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!clientName.trim()) return;
      setSaving(true);
      try {
        await StorageService.createLot({
          client_name: clientName.trim(),
          client_email: clientEmail || undefined,
          client_phone: clientPhone || undefined,
          billing_type: billingType,
          billing_amount: parseFloat(billingAmount) || 0,
          notes: notes || undefined,
        });
        setShowAddLot(false);
        loadData();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal visible={showAddLot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("storage.addLot")}</Text>
              <Pressable onPress={() => setShowAddLot(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.clientName")} *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={clientName}
                onChangeText={setClientName}
                placeholder={t("storage.fields.clientNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.clientEmail")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={clientEmail}
                onChangeText={setClientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.clientPhone")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={clientPhone}
                onChangeText={setClientPhone}
                keyboardType="phone-pad"
                placeholder="+61 400 000 000"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.billingType")}</Text>
              <View style={styles.billingTypeRow}>
                {(["fixed", "weekly", "monthly"] as BillingType[]).map((bt) => (
                  <Pressable
                    key={bt}
                    style={[
                      styles.billingTypeBtn,
                      { borderColor: billingType === bt ? colors.primary : colors.border },
                      billingType === bt && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => setBillingType(bt)}
                  >
                    <Text style={{ color: billingType === bt ? colors.primary : colors.textSecondary, fontSize: 13 }}>
                      {t(`storage.billing.${bt}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.billingAmount")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={billingAmount}
                onChangeText={setBillingAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.notes")}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder={t("storage.fields.notesPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || !clientName.trim() ? 0.5 : 1 }]}
              onPress={handleSave}
              disabled={saving || !clientName.trim()}
            >
              <Text style={styles.saveBtnText}>{saving ? t("common.saving") : t("storage.createLot")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Add Unit Modal ──
  const AddUnitModal = () => {
    const [name, setName] = useState("");
    const [unitType, setUnitType] = useState<UnitType>("container");
    const [capacity, setCapacity] = useState("");
    const [location, setLocation] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!name.trim()) return;
      setSaving(true);
      try {
        await StorageService.createUnit({
          name: name.trim(),
          unit_type: unitType,
          capacity_cbm: parseFloat(capacity) || undefined,
          location_description: location || undefined,
        });
        setShowAddUnit(false);
        loadData();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal visible={showAddUnit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("storage.addUnit")}</Text>
              <Pressable onPress={() => setShowAddUnit(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.unitName")} *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={name}
                onChangeText={setName}
                placeholder={t("storage.fields.unitNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.unitType")}</Text>
              <View style={styles.billingTypeRow}>
                {(["container", "box", "room", "shelf"] as UnitType[]).map((ut) => (
                  <Pressable
                    key={ut}
                    style={[
                      styles.billingTypeBtn,
                      { borderColor: unitType === ut ? colors.primary : colors.border },
                      unitType === ut && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => setUnitType(ut)}
                  >
                    <Ionicons name={UNIT_TYPE_ICONS[ut] as any} size={14} color={unitType === ut ? colors.primary : colors.textSecondary} />
                    <Text style={{ color: unitType === ut ? colors.primary : colors.textSecondary, fontSize: 13, marginLeft: 4 }}>
                      {t(`storage.unitType.${ut}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.capacity")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="decimal-pad"
                placeholder="m³"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.location")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={location}
                onChangeText={setLocation}
                placeholder={t("storage.fields.locationPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || !name.trim() ? 0.5 : 1 }]}
              onPress={handleSave}
              disabled={saving || !name.trim()}
            >
              <Text style={styles.saveBtnText}>{saving ? t("common.saving") : t("storage.createUnit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return <MascotLoading text={t("storage.loading")} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {renderStats()}

      {/* Collapsible help: lots vs units */}
      <Pressable
        onPress={() => setShowStorageHelp(!showStorageHelp)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
            {t("storage.help.title") ?? "Lots vs Units — what's the difference?"}
          </Text>
        </View>
        <Ionicons name={showStorageHelp ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
      </Pressable>
      {showStorageHelp && (
        <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: colors.primary + "10", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: "700", marginBottom: 6 }}>
            📦 {t("storage.help.lotTitle") ?? "Lots — client billing groups"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 }}>
            {t("storage.help.lotDesc") ?? "A lot groups items belonging to one client. It's what you invoice — it has a client name, billing cycle, and rate."}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: "700", marginBottom: 6 }}>
            🗃️ {t("storage.help.unitTitle") ?? "Units — physical spaces"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
            {t("storage.help.unitDesc") ?? "A unit is a physical space (container, shelf, room…). It belongs to your facility, independent of any client."}
          </Text>
        </View>
      )}

      {renderTabs()}

      {subTab === "lots" ? (
        <FlatList
          data={lots}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderLotCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-stacked-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyLots")}</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t("storage.emptyLotsHint")}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={units}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderUnitCard}
          numColumns={3}
          columnWrapperStyle={styles.unitGrid}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            units.length > 0 ? (
              <View style={styles.unitLegend}>
                {(["available", "in_use", "full", "maintenance"] as const).map((s) => (
                  <View key={s} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[s] }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                      {t(`storage.unitStatus.${s}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyUnits")}</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t("storage.emptyUnitsHint")}</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => (subTab === "lots" ? setShowAddLot(true) : setShowAddUnit(true))}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddLotModal />
      <AddUnitModal />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 4 },
  statItemAlert: { backgroundColor: "#FEF2F230", borderRadius: 8 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },

  listContent: { padding: 16, paddingBottom: 80 },

  card: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 14,
    flexWrap: "wrap",
  },
  cardFooterItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardFooterText: { fontSize: 12 },

  // Unit schematic grid
  unitGrid: { gap: 8, paddingHorizontal: 12 },
  unitTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  unitTileName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  unitTileCap: { fontSize: 10, fontWeight: "500" },
  unitTileLotBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  unitTileLotText: { fontSize: 10, fontWeight: "600" },
  unitLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },

  locationText: { fontSize: 12, marginTop: 8 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16 },

  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },

  billingTypeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  billingTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
