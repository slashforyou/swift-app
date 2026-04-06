/**
 * RelationsCarnet
 *
 * Affiche le carnet de relations de l'entreprise connectée.
 * Utilisé dans TransferJobModal pour sélectionner rapidement un destinataire,
 * et dans RelationsScreen pour gérer le carnet.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import type { CompanyRelation } from "../../../types/jobTransfer";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function relativeDate(iso?: string): string {
  if (!iso) return "jamais utilisé";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  if (days < 7) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "il y a 1 semaine";
  if (weeks < 5) return `il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  if (months === 1) return "il y a 1 mois";
  return `il y a ${months} mois`;
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface RelationsCarnetProps {
  relations: CompanyRelation[];
  isLoading: boolean;
  /** Mode sélection (dans TransferJobModal) vs mode gestion (dans RelationsScreen) */
  mode: "select" | "manage";
  selectedId?: number | null;
  onSelect?: (relation: CompanyRelation) => void;
  onRename?: (relation: CompanyRelation) => void;
  onDelete?: (relation: CompanyRelation) => void;
}

// ─────────────────────────────────────────────────────────────
// Composant ligne
// ─────────────────────────────────────────────────────────────

const RelationRow: React.FC<{
  relation: CompanyRelation;
  isSelected: boolean;
  mode: "select" | "manage";
  onPress: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  colors: any;
}> = ({ relation, isSelected, mode, onPress, onRename, onDelete, colors }) => {
  const displayName =
    relation.nickname ||
    relation.related_company_name ||
    relation.related_contractor_name ||
    "Entreprise inconnue";

  const subtitle =
    relation.related_type === "company"
      ? relation.related_company_code
      : "Prestataire";

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: isSelected
        ? colors.primary + "18"
        : colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: isSelected ? colors.primary : colors.border,
      marginBottom: DESIGN_TOKENS.spacing.xs,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundTertiary ?? colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1 },
    name: { color: colors.text, fontWeight: "600", fontSize: 15 },
    nickname: {
      color: colors.textSecondary,
      fontSize: 12,
      fontStyle: "italic",
    },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    selectedCheck: { marginLeft: 4 },
  });

  return (
    <Pressable
      testID={`transfer-relation-${relation.id}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Ionicons
          name={relation.related_type === "contractor" ? "person" : "business"}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.name}>{displayName}</Text>
          {relation.source === "transfer" && (
            <View style={{
              backgroundColor: colors.info + "22",
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
              <Text style={{ color: colors.info, fontSize: 10, fontWeight: "600" }}>Auto</Text>
            </View>
          )}
        </View>
        {relation.nickname &&
          (relation.related_company_name ||
            relation.related_contractor_name) && (
            <Text style={styles.nickname}>
              {relation.related_company_name ??
                relation.related_contractor_name}
            </Text>
          )}
        <Text style={styles.meta}>
          {subtitle ? `${subtitle}  ·  ` : ""}
          {relativeDate(relation.last_used_at)}
        </Text>
      </View>

      {/* Mode sélection → coche */}
      {mode === "select" && isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={colors.primary}
          style={styles.selectedCheck}
        />
      )}

      {/* Mode gestion → kebab (only for manual relations) */}
      {mode === "manage" && relation.source !== "transfer" && (onRename || onDelete) && (
        <Pressable
          hitSlop={8}
          onPress={() => {
            // Délégué au parent via ActionSheet / AlertDialog
            onRename?.();
          }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

const RelationsCarnet: React.FC<RelationsCarnetProps> = ({
  relations,
  isLoading,
  mode,
  selectedId,
  onSelect,
  onRename,
  onDelete,
}) => {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          alignItems: "center",
          paddingVertical: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (relations.length === 0) {
    return (
      <View
        style={{
          alignItems: "center",
          paddingVertical: DESIGN_TOKENS.spacing.xl ?? 24,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <Ionicons
          name="people-outline"
          size={40}
          color={colors.textSecondary}
        />
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          {mode === "select"
            ? "Aucune relation enregistrée.\nSaisissez un code ci-dessous."
            : "Votre carnet est vide.\nAjoutez votre premier partenaire."}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={relations}
      keyExtractor={(item) => item.id ? String(item.id) : `transfer-${item.related_company_id}`}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <RelationRow
          relation={item}
          isSelected={selectedId === item.id}
          mode={mode}
          onPress={() => onSelect?.(item)}
          onRename={() => onRename?.(item)}
          onDelete={() => onDelete?.(item)}
          colors={colors}
        />
      )}
    />
  );
};

export default RelationsCarnet;
