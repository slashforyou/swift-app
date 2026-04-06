/**
 * JobTemplatesPanel — Panneau listant les modèles de job modulaires
 * Intégré dans la navigation Business comme onglet "Modèles"
 * Permet de voir, créer, modifier, supprimer des templates
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import {
    deleteModularTemplate,
    fetchModularTemplates,
    getDefaultModularTemplates,
} from "../../services/business/templatesService";
import type { ModularJobTemplate } from "../../types/jobSegment";

const BILLING_MODE_LABELS: Record<string, string> = {
  location_to_location: "Lieu à lieu",
  depot_to_depot: "Dépôt à dépôt",
  flat_rate: "Forfait",
  packing_only: "Packing",
  unpacking_only: "Unpacking",
};

const BILLING_MODE_ICONS: Record<string, string> = {
  location_to_location: "location-outline",
  depot_to_depot: "business-outline",
  flat_rate: "cash-outline",
  packing_only: "cube-outline",
  unpacking_only: "download-outline",
};

interface JobTemplatesPanelProps {
  navigation: any;
}

const JobTemplatesPanel: React.FC<JobTemplatesPanelProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<ModularJobTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const serverTemplates = await fetchModularTemplates();
      if (serverTemplates.length > 0) {
        setTemplates(serverTemplates);
      } else {
        // Utiliser les templates par défaut tant que le backend n'est pas prêt
        setTemplates(getDefaultModularTemplates());
      }
    } catch {
      // Fallback vers les templates par défaut
      setTemplates(getDefaultModularTemplates());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = useCallback(() => {
    navigation.navigate("JobTemplateEditor");
  }, [navigation]);

  const handleEdit = useCallback(
    (template: ModularJobTemplate) => {
      navigation.navigate("JobTemplateEditor", { template });
    },
    [navigation],
  );

  const handleDelete = useCallback(
    (template: ModularJobTemplate) => {
      if (template.isDefault) {
        Alert.alert("Info", "Les modèles par défaut ne peuvent pas être supprimés.");
        return;
      }
      Alert.alert(
        "Supprimer le modèle",
        `Voulez-vous vraiment supprimer "${template.name}" ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteModularTemplate(template.id);
                setTemplates((prev) => prev.filter((t) => t.id !== template.id));
              } catch {
                Alert.alert("Erreur", "Impossible de supprimer le modèle.");
              }
            },
          },
        ],
      );
    },
    [],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Modèles de job
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {templates.length} modèle{templates.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable
          onPress={handleCreate}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: DESIGN_TOKENS.radius.md,
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            gap: 6,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
            Nouveau
          </Text>
        </Pressable>
      </View>

      {/* Templates list */}
      <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
        {templates.map((template) => {
          const modeIcon = BILLING_MODE_ICONS[template.billingMode] ?? "ellipse-outline";
          const modeLabel = BILLING_MODE_LABELS[template.billingMode] ?? template.billingMode;

          return (
            <Pressable
              key={template.id}
              onPress={() => handleEdit(template)}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: DESIGN_TOKENS.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                    {template.name}
                  </Text>
                  {template.description ? (
                    <Text
                      style={{ fontSize: 12, color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {template.description}
                    </Text>
                  ) : null}
                </View>

                {!template.isDefault && (
                  <Pressable
                    onPress={() => handleDelete(template)}
                    hitSlop={12}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </Pressable>
                )}
              </View>

              {/* Metadata row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: DESIGN_TOKENS.spacing.sm,
                  gap: DESIGN_TOKENS.spacing.md,
                }}
              >
                {/* Billing mode */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name={modeIcon as any}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {modeLabel}
                  </Text>
                </View>

                {/* Segments count */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {template.segments.length} segment{template.segments.length !== 1 ? "s" : ""}
                  </Text>
                </View>

                {/* Category */}
                <View
                  style={{
                    backgroundColor: colors.primary + "15",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: colors.primary,
                      textTransform: "capitalize",
                    }}
                  >
                    {template.category}
                  </Text>
                </View>

                {/* Default badge */}
                {template.isDefault && (
                  <View
                    style={{
                      backgroundColor: colors.textSecondary + "20",
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: colors.textSecondary,
                      }}
                    >
                      par défaut
                    </Text>
                  </View>
                )}
              </View>

              {/* Flat rate amount if applicable */}
              {template.billingMode === "flat_rate" && template.flatRateAmount && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.primary,
                    marginTop: 4,
                  }}
                >
                  ${template.flatRateAmount.toLocaleString()}
                  {template.flatRateMaxHours ? ` (≤ ${template.flatRateMaxHours}h)` : ""}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default JobTemplatesPanel;
