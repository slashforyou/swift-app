/**
 * AgreementsScreen — Vue combinée Modèles de job + Clauses de contrat
 * Sous-tab "Accords" de l'onglet Réseau
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import {
  fetchModularTemplates,
} from "../../services/business/templatesService";
import {
  ContractClause,
  fetchClauses,
} from "../../services/contractsService";
import type { ModularJobTemplate } from "../../types/jobSegment";

interface AgreementsScreenProps {
  onOpenTemplateEditor: (template?: ModularJobTemplate) => void;
  onOpenClauseEditor: (clause?: ContractClause) => void;
}

export default function AgreementsScreen({
  onOpenTemplateEditor,
  onOpenClauseEditor,
}: AgreementsScreenProps) {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<ModularJobTemplate[]>([]);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.allSettled([
        fetchModularTemplates(),
        fetchClauses(),
      ]);
      if (tRes.status === "fulfilled") setTemplates(tRes.value);
      if (cRes.status === "fulfilled") setClauses(cRes.value);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = getStyles(colors);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {/* ── Modèles de job ── */}
      <View style={[s.section, { borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <Ionicons name="documents-outline" size={20} color={colors.primary} />
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            Modèles de job ({templates.length})
          </Text>
          <TouchableOpacity onPress={() => onOpenTemplateEditor()} style={s.addBtn}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {templates.length === 0 ? (
          <Text style={[s.empty, { color: colors.textSecondary }]}>Aucun modèle créé</Text>
        ) : (
          templates.map((tpl) => (
            <TouchableOpacity
              key={tpl.id}
              style={[s.itemRow, { borderBottomColor: colors.border }]}
              onPress={() => onOpenTemplateEditor(tpl)}
              activeOpacity={0.7}
            >
              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: colors.text }]}>{tpl.name}</Text>
                {tpl.billing_mode && (
                  <Text style={[s.itemMeta, { color: colors.textSecondary }]}>{tpl.billing_mode}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ── Clauses de contrat ── */}
      <View style={[s.section, { borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            Clauses de contrat ({clauses.length})
          </Text>
          <TouchableOpacity onPress={() => onOpenClauseEditor()} style={s.addBtn}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {clauses.length === 0 ? (
          <Text style={[s.empty, { color: colors.textSecondary }]}>Aucune clause créée</Text>
        ) : (
          clauses.map((clause) => (
            <TouchableOpacity
              key={clause.id}
              style={[s.itemRow, { borderBottomColor: colors.border }]}
              onPress={() => onOpenClauseEditor(clause)}
              activeOpacity={0.7}
            >
              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: colors.text }]}>{clause.title}</Text>
                <Text style={[s.itemMeta, { color: colors.textSecondary }]}>
                  {clause.is_active ? "Actif" : "Inactif"}
                  {clause.condition_type && clause.condition_type !== "always"
                    ? ` · ${clause.condition_type}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    center: {
      flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60,
    },
    section: {
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
    },
    addBtn: {
      padding: 4,
    },
    empty: {
      fontSize: 13,
      fontStyle: "italic",
      paddingVertical: DESIGN_TOKENS.spacing.sm,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemName: {
      fontSize: 14,
      fontWeight: "500",
    },
    itemMeta: {
      fontSize: 12,
    },
  });
