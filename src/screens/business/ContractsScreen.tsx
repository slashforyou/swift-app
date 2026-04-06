/**
 * ContractsScreen — Gestion des clauses de contrat modulaires
 * Intégré dans la navigation Business comme onglet "Contrats"
 * Permet de créer, modifier, supprimer, réordonner les clauses
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Switch,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    ContractClause,
    deleteClause,
    fetchClauses,
    updateClause,
} from "../../services/contractsService";
import ClauseEditorModal from "./ClauseEditorModal";

const CONDITION_ICONS: Record<string, string> = {
  always: "infinite-outline",
  segment_type: "layers-outline",
  postcode: "map-outline",
  city: "business-outline",
  state: "flag-outline",
};

const CONDITION_LABELS: Record<string, string> = {
  always: "Always",
  segment_type: "Segment",
  postcode: "Postcode",
  city: "City",
  state: "State",
};

const ContractsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingClause, setEditingClause] = useState<ContractClause | null>(
    null,
  );

  const loadClauses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClauses();
      setClauses(data);
    } catch {
      // Silent fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClauses();
  }, [loadClauses]);

  const handleCreate = useCallback(() => {
    setEditingClause(null);
    setEditorVisible(true);
  }, []);

  const handleEdit = useCallback((clause: ContractClause) => {
    setEditingClause(clause);
    setEditorVisible(true);
  }, []);

  const handleToggleActive = useCallback(
    async (clause: ContractClause) => {
      try {
        await updateClause(clause.id, { is_active: !clause.is_active });
        setClauses((prev) =>
          prev.map((c) =>
            c.id === clause.id ? { ...c, is_active: !c.is_active } : c,
          ),
        );
      } catch {
        Alert.alert("Error", "Failed to update clause");
      }
    },
    [],
  );

  const handleDelete = useCallback(
    (clause: ContractClause) => {
      Alert.alert(
        t("contracts.deleteTitle"),
        t("contracts.deleteMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteClause(clause.id);
                setClauses((prev) => prev.filter((c) => c.id !== clause.id));
              } catch {
                Alert.alert("Error", "Failed to delete clause");
              }
            },
          },
        ],
      );
    },
    [t],
  );

  const handleEditorClose = useCallback(
    (saved: boolean) => {
      setEditorVisible(false);
      setEditingClause(null);
      if (saved) loadClauses();
    },
    [loadClauses],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {t("contracts.title")}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          {t("contracts.subtitle")}
        </Text>
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => ({
            backgroundColor: colors.tint,
            borderRadius: 12,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
            opacity: pressed ? 0.8 : 1,
          })}
          accessibilityLabel="Add new contract clause"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
            {t("contracts.addClause")}
          </Text>
        </Pressable>
      </View>

      {/* Empty state */}
      {clauses.length === 0 && (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 16,
            padding: 32,
            alignItems: "center",
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginTop: 12,
            }}
          >
            {t("contracts.emptyTitle")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {t("contracts.emptyMessage")}
          </Text>
        </View>
      )}

      {/* Clause cards */}
      {clauses.map((clause, index) => (
        <View
          key={clause.id}
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: clause.is_active ? colors.tint : colors.border,
            opacity: clause.is_active ? 1 : 0.6,
          }}
        >
          {/* Title row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {clause.title}
              </Text>
            </View>
            <Switch
              value={clause.is_active}
              onValueChange={() => handleToggleActive(clause)}
              trackColor={{ false: colors.border, true: colors.tint + "60" }}
              thumbColor={clause.is_active ? colors.tint : "#999"}
            />
          </View>

          {/* Content preview */}
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 8,
              lineHeight: 18,
            }}
            numberOfLines={3}
          >
            {clause.content}
          </Text>

          {/* Conditions badges */}
          {clause.conditions.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              {clause.conditions.map((cond, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name={
                      (CONDITION_ICONS[cond.condition_type] ||
                        "help-circle-outline") as any
                    }
                    size={14}
                    color={colors.tint}
                  />
                  <Text
                    style={{ fontSize: 11, color: colors.text, fontWeight: "500" }}
                  >
                    {CONDITION_LABELS[cond.condition_type] || cond.condition_type}
                    {cond.condition_value ? `: ${cond.condition_value}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Pressable
              onPress={() => handleEdit(clause)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.background,
                opacity: pressed ? 0.7 : 1,
                gap: 4,
              })}
              accessibilityLabel={`Edit ${clause.title}`}
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={14} color={colors.tint} />
              <Text style={{ fontSize: 12, color: colors.tint, fontWeight: "500" }}>
                {t("common.edit")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(clause)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "#FF3B3020",
                opacity: pressed ? 0.7 : 1,
                gap: 4,
              })}
              accessibilityLabel={`Delete ${clause.title}`}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={14} color="#FF3B30" />
              <Text style={{ fontSize: 12, color: "#FF3B30", fontWeight: "500" }}>
                {t("common.delete")}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* Clause Editor Modal */}
      <ClauseEditorModal
        visible={editorVisible}
        clause={editingClause}
        onClose={handleEditorClose}
      />
    </View>
  );
};

export default ContractsScreen;
