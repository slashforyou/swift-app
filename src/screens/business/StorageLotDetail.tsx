/**
 * StorageLotDetail — Detail view for a storage lot
 * Shows units (reorderable), items (add/checkout), photos, billing
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
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
    ItemCondition,
    StorageLotDetail as LotDetailType,
    StorageItem,
    StorageUnit,
} from "../../types/storage";

type DetailTab = "items" | "units" | "photos" | "billing" | "info";

interface StorageLotDetailProps {
  lotId: number;
  onBack: () => void;
  onOpenLayout?: () => void;
  onEditLot?: () => void;
}

const CONDITION_COLORS: Record<ItemCondition, string> = {
  excellent: "#10B981",
  good: "#3B82F6",
  fair: "#F59E0B",
  damaged: "#EF4444",
};

export default function StorageLotDetailScreen({ lotId, onBack, onOpenLayout, onEditLot }: StorageLotDetailProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [lot, setLot] = useState<LotDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("items");

  // Modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAssignUnit, setShowAssignUnit] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<StorageUnit[]>([]);

  const loadLot = useCallback(async () => {
    try {
      const data = await StorageService.getLot(lotId);
      setLot(data);
    } catch {
      Alert.alert("Error", "Failed to load lot details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lotId]);

  useEffect(() => { loadLot(); }, [loadLot]);

  const handleRefresh = () => { setRefreshing(true); loadLot(); };

  // ── Checkout item ──
  const handleCheckout = (item: StorageItem) => {
    Alert.alert(
      t("storage.checkout.title"),
      t("storage.checkout.confirm", { name: item.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("storage.checkout.action"),
          onPress: async () => {
            try {
              await StorageService.checkoutItem(item.id);
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Delete item ──
  const handleDeleteItem = (item: StorageItem) => {
    Alert.alert(
      t("common.delete"),
      t("storage.deleteItem.confirm", { name: item.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.deleteItem(item.id);
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Photo upload ──
  const handleUploadPhoto = async (source: "camera" | "gallery") => {
    let result;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    }
    if (result.canceled || !result.assets?.[0]) return;

    try {
      await StorageService.uploadStoragePhoto(lotId, result.assets[0].uri, {
        photo_type: "inventory",
      });
      loadLot();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(t("storage.photos.add"), t("storage.photos.chooseSource"), [
      { text: t("storage.photos.camera"), onPress: () => handleUploadPhoto("camera") },
      { text: t("storage.photos.gallery"), onPress: () => handleUploadPhoto("gallery") },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  // ── Delete photo ──
  const handleDeletePhoto = (photoId: number) => {
    Alert.alert(
      t("common.delete"),
      t("storage.photos.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.deleteStoragePhoto(photoId);
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Mark billing as paid ──
  const handleMarkPaid = (recordId: number) => {
    Alert.alert(
      t("storage.billingActions.markPaid"),
      t("storage.billingActions.markPaidConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("storage.billingActions.markPaid"),
          onPress: async () => {
            try {
              await StorageService.updateBillingRecord(recordId, { status: "paid" });
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Waive billing ──
  const handleWaiveBilling = (recordId: number) => {
    Alert.alert(
      t("storage.billingActions.waive"),
      t("storage.billingActions.waiveConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("storage.billingActions.waive"),
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.updateBillingRecord(recordId, { status: "waived" });
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Generate billing ──
  const handleGenerateBilling = async () => {
    try {
      const result = await StorageService.generateBilling();
      loadLot();
      if (result.generated > 0) {
        Alert.alert(t("storage.billingActions.generated"), t("storage.billingActions.generatedCount", { count: String(result.generated) }));
      } else {
        Alert.alert(t("storage.billingActions.generated"), t("storage.billingActions.nothingToGenerate"));
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // ── Complete lot ──
  const handleCompleteLot = () => {
    const activeItemCount = lot?.items.filter((i) => !i.checked_out_at).length || 0;
    Alert.alert(
      t("storage.completeLot.title"),
      activeItemCount > 0
        ? t("storage.completeLot.confirmWithItems", { count: String(activeItemCount) })
        : t("storage.completeLot.confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("storage.completeLot.action"),
          onPress: async () => {
            try {
              await StorageService.updateLot(lotId, { status: "completed" });
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Assign unit ──
  const openAssignUnit = async () => {
    try {
      const allUnits = await StorageService.listUnits();
      const assignedIds = new Set(lot?.units.map((u) => u.id) || []);
      setAvailableUnits(allUnits.filter((u) => !assignedIds.has(u.id)));
      setShowAssignUnit(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleAssignUnit = async (unitId: number) => {
    try {
      await StorageService.assignUnitToLot(lotId, unitId);
      setShowAssignUnit(false);
      loadLot();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRemoveUnit = (unitId: number, unitName: string) => {
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
              loadLot();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  // ── Add Item Modal ──
  const AddItemModal = () => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [qty, setQty] = useState("1");
    const [condition, setCondition] = useState<ItemCondition>("good");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!name.trim()) return;
      setSaving(true);
      try {
        await StorageService.addItem(lotId, {
          name: name.trim(),
          description: desc || undefined,
          quantity: parseInt(qty) || 1,
          condition_in: condition,
        });
        setShowAddItem(false);
        loadLot();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal visible={showAddItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("storage.addItem")}</Text>
              <Pressable onPress={() => setShowAddItem(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.itemName")} *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={name}
                onChangeText={setName}
                placeholder={t("storage.fields.itemNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.description")}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB" }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={2}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.quantity")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB", width: 80 }]}
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("storage.fields.condition")}</Text>
              <View style={styles.conditionRow}>
                {(["excellent", "good", "fair", "damaged"] as ItemCondition[]).map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.conditionBtn,
                      { borderColor: condition === c ? CONDITION_COLORS[c] : colors.border },
                      condition === c && { backgroundColor: CONDITION_COLORS[c] + "15" },
                    ]}
                    onPress={() => setCondition(c)}
                  >
                    <View style={[styles.conditionDot, { backgroundColor: CONDITION_COLORS[c] }]} />
                    <Text style={{ color: condition === c ? CONDITION_COLORS[c] : colors.textSecondary, fontSize: 12 }}>
                      {t(`storage.condition.${c}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || !name.trim() ? 0.5 : 1 }]}
              onPress={handleSave}
              disabled={saving || !name.trim()}
            >
              <Text style={styles.saveBtnText}>{saving ? t("common.saving") : t("storage.addItem")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading || !lot) return <MascotLoading text={t("storage.loading")} />;

  const activeItems = lot.items.filter((i) => !i.checked_out_at);
  const checkedOutItems = lot.items.filter((i) => i.checked_out_at);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.detailHeader, { backgroundColor: isDark ? colors.backgroundSecondary : "#F8FAFC" }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>{lot.client_name}</Text>
          <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
            ${Number(lot.billing_amount).toFixed(2)} / {t(`storage.billing.${lot.billing_type}`)}
            {lot.billing_next_due ? ` · ${t("storage.nextDue")}: ${lot.billing_next_due}` : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {onOpenLayout && (
            <TouchableOpacity onPress={onOpenLayout} style={styles.headerAction}>
              <Ionicons name="grid-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onEditLot && (
            <TouchableOpacity onPress={onEditLot} style={styles.headerAction}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View style={[styles.statusBadge, { backgroundColor: (lot.status === "active" ? "#10B981" : lot.status === "overdue" ? "#EF4444" : "#6B7280") + "20" }]}>
            <Text style={{ color: lot.status === "active" ? "#10B981" : lot.status === "overdue" ? "#EF4444" : "#6B7280", fontSize: 12, fontWeight: "600" }}>
              {t(`storage.status.${lot.status}`)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["items", "units", "photos", "billing", "info"] as DetailTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {t(`storage.detailTabs.${tab}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* ── ITEMS TAB ── */}
        {activeTab === "items" && (
          <>
            {activeItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyItems")}</Text>
              </View>
            ) : (
              activeItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFF", borderColor: colors.border }]}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}
                      </Text>
                      {item.description && (
                        <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                      )}
                    </View>
                    <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[item.condition_in] + "20" }]}>
                      <Text style={{ color: CONDITION_COLORS[item.condition_in], fontSize: 11, fontWeight: "600" }}>
                        {t(`storage.condition.${item.condition_in}`)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.itemActionBtn} onPress={() => handleCheckout(item)}>
                      <Ionicons name="exit-outline" size={16} color="#3B82F6" />
                      <Text style={{ color: "#3B82F6", fontSize: 12 }}>{t("storage.checkout.action")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemActionBtn} onPress={() => handleDeleteItem(item)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {checkedOutItems.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
                  {t("storage.checkedOut")} ({checkedOutItems.length})
                </Text>
                {checkedOutItems.map((item) => (
                  <View key={item.id} style={[styles.itemCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFF", borderColor: colors.border, opacity: 0.6 }]}>
                    <Text style={[styles.itemName, { color: colors.text, textDecorationLine: "line-through" }]}>
                      {item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ── UNITS TAB ── */}
        {activeTab === "units" && (
          <>
            {lot.units.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyUnitsInLot")}</Text>
              </View>
            ) : (
              lot.units.map((unit, idx) => (
                <View key={unit.id} style={[styles.unitCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFF", borderColor: colors.border }]}>
                  <View style={styles.unitCardLeft}>
                    <Text style={[styles.unitPosition, { color: colors.textSecondary }]}>#{idx + 1}</Text>
                    <View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{unit.name}</Text>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        {t(`storage.unitType.${unit.unit_type}`)}
                        {unit.capacity_cbm ? ` · ${unit.capacity_cbm} m³` : ""}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveUnit(unit.id, unit.name)}>
                    <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={openAssignUnit}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{t("storage.assignUnit")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === "photos" && (
          <>
            {lot.photos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyPhotos")}</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {lot.photos.map((photo) => (
                  <View key={photo.id} style={styles.photoItem}>
                    {photo.url ? (
                      <Image source={{ uri: photo.url }} style={styles.photoImage} />
                    ) : (
                      <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? colors.backgroundSecondary : "#F3F4F6" }]}>
                        <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.photoFooter}>
                      <Text style={[styles.photoLabel, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
                        {photo.description || photo.photo_type}
                      </Text>
                      <Pressable onPress={() => handleDeletePhoto(photo.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary, marginTop: 16 }]} onPress={showPhotoOptions}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{t("storage.photos.add")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── BILLING TAB ── */}
        {activeTab === "billing" && (
          <>
            <View style={[styles.billingSummary, { backgroundColor: isDark ? colors.backgroundSecondary : "#F0FDF4" }]}>
              <Text style={[styles.billingAmount, { color: colors.text }]}>
                ${Number(lot.billing_amount).toFixed(2)}
              </Text>
              <Text style={[styles.billingPeriod, { color: colors.textSecondary }]}>
                / {t(`storage.billing.${lot.billing_type}`)}
              </Text>
            </View>

            {/* Generate billing button */}
            <TouchableOpacity
              style={[styles.generateBillingBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              onPress={handleGenerateBilling}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{t("storage.billingActions.generate")}</Text>
            </TouchableOpacity>

            {lot.billing.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("storage.emptyBilling")}</Text>
              </View>
            ) : (
              lot.billing.map((record) => {
                const isPending = record.status === "pending";
                const isOverdue = record.status === "overdue";
                const statusColor = record.status === "paid" ? "#10B981" : isOverdue ? "#EF4444" : record.status === "waived" ? "#6B7280" : "#F59E0B";
                return (
                  <View key={record.id} style={[styles.billingRow, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billingRowAmount, { color: colors.text }]}>${Number(record.amount).toFixed(2)}</Text>
                      <Text style={[{ color: colors.textSecondary, fontSize: 12 }]}>
                        {record.period_start} → {record.period_end}
                      </Text>
                      {record.paid_at && (
                        <Text style={{ color: "#10B981", fontSize: 11, marginTop: 2 }}>
                          {t("storage.billingActions.paidOn")} {record.paid_at.split("T")[0]}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={[styles.billingStatusBadge, { backgroundColor: statusColor + "20" }]}>
                        <Text style={{ color: statusColor, fontSize: 11, fontWeight: "600" }}>
                          {t(`storage.billingStatus.${record.status}`)}
                        </Text>
                      </View>
                      {(isPending || isOverdue) && (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Pressable onPress={() => handleMarkPaid(record.id)} hitSlop={6}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                          </Pressable>
                          <Pressable onPress={() => handleWaiveBilling(record.id)} hitSlop={6}>
                            <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* Complete lot action */}
            {lot.status === "active" && (
              <TouchableOpacity
                style={[styles.completeLotBtn, { borderColor: "#6B7280" }]}
                onPress={handleCompleteLot}
              >
                <Ionicons name="checkmark-done-outline" size={18} color="#6B7280" />
                <Text style={{ color: "#6B7280", fontWeight: "600" }}>{t("storage.completeLot.action")}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <>
            <View style={[styles.infoSection, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFF", borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.client")}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{lot.client_name}</Text>
              </View>
              {lot.client_email && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.email")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{lot.client_email}</Text>
                </View>
              )}
              {lot.client_phone && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.phone")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{lot.client_phone}</Text>
                </View>
              )}
              {lot.job_id && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.linkedJob")}</Text>
                  <Text style={[styles.infoValue, { color: colors.primary }]}>#{lot.job_id}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.status")}</Text>
                <Text style={[styles.infoValue, { color: lot.status === "active" ? "#10B981" : lot.status === "overdue" ? "#EF4444" : "#6B7280" }]}>
                  {t(`storage.status.${lot.status}`)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.created")}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{lot.created_at?.split("T")[0]}</Text>
              </View>
              {lot.billing_start_date && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.billingStart")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{lot.billing_start_date}</Text>
                </View>
              )}
              {lot.billing_next_due && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("storage.info.nextDue")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{lot.billing_next_due}</Text>
                </View>
              )}
            </View>
            {lot.notes ? (
              <View style={[styles.infoSection, { backgroundColor: isDark ? colors.backgroundSecondary : "#FFF", borderColor: colors.border, marginTop: 12 }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary, marginBottom: 6 }]}>{t("storage.info.notes")}</Text>
                <Text style={[{ color: colors.text, fontSize: 14, lineHeight: 20 }]}>{lot.notes}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* FAB for items / photos */}
      {(activeTab === "items" || activeTab === "photos") && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => activeTab === "items" ? setShowAddItem(true) : showPhotoOptions()}
        >
          <Ionicons name={activeTab === "items" ? "add" : "camera"} size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <AddItemModal />

      {/* Assign Unit Modal */}
      <Modal visible={showAssignUnit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("storage.assignUnit")}</Text>
              <Pressable onPress={() => setShowAssignUnit(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={availableUnits}
              keyExtractor={(i) => String(i.id)}
              style={{ maxHeight: 300, padding: 16 }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: "center", paddingVertical: 20 }]}>
                  {t("storage.noAvailableUnits")}
                </Text>
              }
              renderItem={({ item: unit }) => (
                <TouchableOpacity
                  style={[styles.unitSelectCard, { borderColor: colors.border }]}
                  onPress={() => handleAssignUnit(unit.id)}
                >
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{unit.name}</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{t(`storage.unitType.${unit.unit_type}`)}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  detailTitle: { fontSize: 18, fontWeight: "700" },
  detailSub: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8 },

  // Items
  itemCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: { flexDirection: "row", alignItems: "center" },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemDesc: { fontSize: 12, marginTop: 2 },
  itemActions: { flexDirection: "row", marginTop: 8, gap: 12 },
  itemActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  conditionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  // Units
  unitCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  unitCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  unitPosition: { fontSize: 14, fontWeight: "700", width: 28 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 1 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    borderStyle: "dashed",
    justifyContent: "center",
    marginTop: 8,
  },

  // Photos
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoItem: { width: "31%", marginBottom: 8 },
  photoImage: { width: "100%", aspectRatio: 1, borderRadius: 8 },
  photoPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: { fontSize: 10, marginTop: 2, textAlign: "center" },
  photoFooter: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 },

  // Billing
  billingSummary: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  billingAmount: { fontSize: 28, fontWeight: "700" },
  billingPeriod: { fontSize: 14, marginLeft: 4 },
  billingRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  billingRowAmount: { fontSize: 16, fontWeight: "600" },
  billingStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  generateBillingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 16,
  },

  completeLotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    borderStyle: "dashed",
    justifyContent: "center",
    marginTop: 24,
  },

  infoSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: "500" },

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

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 30 },
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
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  textArea: { minHeight: 60, textAlignVertical: "top" },
  conditionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  conditionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },

  saveBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  unitSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
