/**
 * ClauseEditorModal — Modal for creating/editing a contract clause with conditions
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
    ClauseCondition,
    ConditionType,
    ContractClause,
    createClause,
    updateClause,
} from "../../services/contractsService";

interface ClauseEditorModalProps {
  visible: boolean;
  clause: ContractClause | null; // null = create mode
  onClose: (saved: boolean) => void;
}

const SEGMENT_TYPE_OPTIONS = [
  { value: "location", label: "📍 Location", icon: "location" },
  { value: "travel", label: "🚚 Travel", icon: "car" },
  { value: "storage", label: "📦 Storage", icon: "cube" },
  { value: "loading", label: "🏗️ Loading", icon: "build" },
];

const CONDITION_TYPES: { type: ConditionType; label: string; icon: string; needsValue: boolean }[] = [
  { type: "always", label: "Always include", icon: "infinite-outline", needsValue: false },
  { type: "segment_type", label: "When segment type", icon: "layers-outline", needsValue: true },
  { type: "postcode", label: "For postcode", icon: "map-outline", needsValue: true },
  { type: "city", label: "For city", icon: "business-outline", needsValue: true },
  { type: "state", label: "For state", icon: "flag-outline", needsValue: true },
];

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const ClauseEditorModal: React.FC<ClauseEditorModalProps> = ({
  visible,
  clause,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const isEdit = !!clause;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [conditions, setConditions] = useState<ClauseCondition[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (clause) {
        setTitle(clause.title);
        setContent(clause.content);
        setConditions(clause.conditions.map((c) => ({ ...c })));
      } else {
        setTitle("");
        setContent("");
        setConditions([{ condition_type: "always", condition_value: null }]);
      }
    }
  }, [clause, visible]);

  const handleAddCondition = useCallback(() => {
    setConditions((prev) => [
      ...prev,
      { condition_type: "always", condition_value: null },
    ]);
  }, []);

  const handleRemoveCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConditionTypeChange = useCallback(
    (index: number, type: ConditionType) => {
      setConditions((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, condition_type: type, condition_value: null } : c,
        ),
      );
    },
    [],
  );

  const handleConditionValueChange = useCallback(
    (index: number, value: string) => {
      setConditions((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, condition_value: value } : c,
        ),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Error", t("contracts.titleRequired"));
      return;
    }
    if (!content.trim()) {
      Alert.alert("Error", t("contracts.contentRequired"));
      return;
    }

    setSaving(true);
    try {
      const cleanConditions = conditions.filter(
        (c) =>
          c.condition_type === "always" ||
          (c.condition_value && c.condition_value.trim()),
      );

      if (isEdit && clause) {
        await updateClause(clause.id, {
          title: title.trim(),
          content: content.trim(),
          conditions: cleanConditions,
        });
      } else {
        await createClause({
          title: title.trim(),
          content: content.trim(),
          conditions: cleanConditions,
        });
      }
      onClose(true);
    } catch {
      Alert.alert("Error", t("contracts.saveError"));
    } finally {
      setSaving(false);
    }
  }, [title, content, conditions, isEdit, clause, onClose, t]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onClose(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "ios" ? 16 : 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => onClose(false)}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 16, color: colors.tint }}>
              {t("common.cancel")}
            </Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>
            {isEdit ? t("contracts.editClause") : t("contracts.newClause")}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            accessibilityLabel="Save clause"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: saving ? colors.textSecondary : colors.tint,
              }}
            >
              {t("common.save")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="always"
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("contracts.clauseTitle")}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("contracts.clauseTitlePlaceholder")}
            placeholderTextColor={colors.textSecondary}
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: colors.text,
              marginBottom: 20,
            }}
          />

          {/* Content */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("contracts.clauseContent")}
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t("contracts.clauseContentPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: colors.text,
              minHeight: 140,
              marginBottom: 24,
              lineHeight: 22,
            }}
          />

          {/* Conditions section */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("contracts.conditions")}
            </Text>
            <Pressable
              onPress={handleAddCondition}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityLabel="Add condition"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.tint} />
              <Text style={{ fontSize: 13, color: colors.tint, fontWeight: "500" }}>
                {t("common.add")}
              </Text>
            </Pressable>
          </View>

          {conditions.map((condition, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "500",
                  }}
                >
                  {t("contracts.conditionLabel")} #{index + 1}
                </Text>
                {conditions.length > 1 && (
                  <Pressable
                    onPress={() => handleRemoveCondition(index)}
                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                    accessibilityLabel="Remove condition"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </Pressable>
                )}
              </View>

              {/* Condition type chips */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {CONDITION_TYPES.map((ct) => {
                  const isSelected = condition.condition_type === ct.type;
                  return (
                    <Pressable
                      key={ct.type}
                      onPress={() => handleConditionTypeChange(index, ct.type)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isSelected
                          ? colors.tint + "20"
                          : colors.background,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        gap: 4,
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: isSelected ? colors.tint : "transparent",
                      }}
                      accessibilityLabel={ct.label}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={ct.icon as any}
                        size={14}
                        color={isSelected ? colors.tint : colors.textSecondary}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? colors.tint : colors.textSecondary,
                        }}
                      >
                        {ct.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Value input based on condition type */}
              {condition.condition_type === "segment_type" && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {SEGMENT_TYPE_OPTIONS.map((seg) => {
                    const isSelected = condition.condition_value === seg.value;
                    return (
                      <Pressable
                        key={seg.value}
                        onPress={() =>
                          handleConditionValueChange(index, seg.value)
                        }
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? colors.tint
                            : colors.background,
                        }}
                        accessibilityLabel={seg.label}
                        accessibilityRole="button"
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isSelected ? "#FFF" : colors.text,
                            fontWeight: isSelected ? "600" : "400",
                          }}
                        >
                          {seg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {condition.condition_type === "state" && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {AU_STATES.map((state) => {
                    const isSelected =
                      condition.condition_value?.toUpperCase() === state;
                    return (
                      <Pressable
                        key={state}
                        onPress={() =>
                          handleConditionValueChange(index, state)
                        }
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? colors.tint
                            : colors.background,
                        }}
                        accessibilityLabel={state}
                        accessibilityRole="button"
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isSelected ? "#FFF" : colors.text,
                            fontWeight: isSelected ? "600" : "400",
                          }}
                        >
                          {state}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {(condition.condition_type === "postcode" ||
                condition.condition_type === "city") && (
                <TextInput
                  value={condition.condition_value || ""}
                  onChangeText={(v) => handleConditionValueChange(index, v)}
                  placeholder={
                    condition.condition_type === "postcode"
                      ? "e.g. 2000"
                      : "e.g. Sydney"
                  }
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={
                    condition.condition_type === "postcode"
                      ? "number-pad"
                      : "default"
                  }
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 14,
                    color: colors.text,
                  }}
                />
              )}
            </View>
          ))}

          {/* Help text */}
          <View
            style={{
              backgroundColor: colors.tint + "10",
              borderRadius: 12,
              padding: 14,
              marginTop: 12,
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.tint}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                fontSize: 13,
                color: colors.tint,
                flex: 1,
                lineHeight: 18,
              }}
            >
              {t("contracts.conditionsHelp")}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ClauseEditorModal;
