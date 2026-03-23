/**
 * RelationsScreen — Carnet de relations B2B
 *
 * Page de la section Business affichant :
 *   - Le code unique de l'entreprise (à partager)
 *   - La liste des relations enregistrées avec actions (renommer, supprimer)
 *   - Bouton "+ Ajouter" pour créer une relation via code ou code company
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import CompanyCodeInput from "../../components/modals/TransferJobModal/CompanyCodeInput";
import RelationsCarnet from "../../components/modals/TransferJobModal/RelationsCarnet";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useCompanyProfile } from "../../hooks/useCompanyProfile";
import {
    deleteRelation,
    listRelations,
    saveRelation,
    updateRelationNickname,
} from "../../services/companyRelations";
import type {
    CompanyLookupResult,
    CompanyRelation,
} from "../../types/jobTransfer";

// ─────────────────────────────────────────────────────────────
// Hook utilitaire : récupère les relations
// ─────────────────────────────────────────────────────────────

function useRelations() {
  const [relations, setRelations] = useState<CompanyRelation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listRelations();
      setRelations(data);
    } catch {
      // silencieux côté affichage, l'utilisateur peut pull-to-refresh
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { relations, isLoading, load, setRelations };
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export default function RelationsScreen() {
  const { colors } = useTheme();
  const { companyCode } = useCompanyProfile(); // hook existant — expose company_code
  const { relations, isLoading, load, setRelations } = useRelations();

  // ── Modal "Ajouter" ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [addNickname, setAddNickname] = useState("");
  const [addLookupResult, setAddLookupResult] =
    useState<CompanyLookupResult | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // ── Modal "Renommer" ──
  const [renameTarget, setRenameTarget] = useState<CompanyRelation | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");

  // ── Toast copie code ──
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  // ── Copier le code ──
  const handleCopyCode = useCallback(() => {
    if (!companyCode) return;
    void Clipboard.setStringAsync(companyCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [companyCode]);

  // ── Ajouter une relation ──
  const handleAdd = useCallback(async () => {
    if (!addLookupResult) return;
    setAddLoading(true);
    try {
      const saved = await saveRelation({
        related_type: "company",
        related_company_id: addLookupResult.id,
        nickname: addNickname.trim() || undefined,
      });
      setRelations((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setShowAddModal(false);
      setAddNickname("");
      setAddLookupResult(null);
    } catch (e: any) {
      if (e?.message?.includes("409") || e?.message?.includes("déjà")) {
        Alert.alert(
          "Déjà enregistré",
          "Cette entreprise est déjà dans votre carnet.",
        );
      } else {
        Alert.alert(
          "Erreur",
          e?.message ?? "Impossible d'enregistrer la relation",
        );
      }
    } finally {
      setAddLoading(false);
    }
  }, [addLookupResult, addNickname, setRelations]);

  // ── Actions kebab (iOS ActionSheet / Alert cross-platform) ──
  const handleKebab = useCallback(
    (relation: CompanyRelation) => {
      const name =
        relation.nickname ||
        relation.related_company_name ||
        relation.related_contractor_name ||
        "cette relation";

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Renommer", "Supprimer", "Annuler"],
            destructiveButtonIndex: 1,
            cancelButtonIndex: 2,
            title: name,
          },
          (idx) => {
            if (idx === 0) {
              setRenameTarget(relation);
              setRenameValue(relation.nickname ?? "");
            }
            if (idx === 1) confirmDelete(relation);
          },
        );
      } else {
        Alert.alert(name, undefined, [
          {
            text: "Renommer",
            onPress: () => {
              setRenameTarget(relation);
              setRenameValue(relation.nickname ?? "");
            },
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => confirmDelete(relation),
          },
          { text: "Annuler", style: "cancel" },
        ]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const confirmDelete = useCallback(
    (relation: CompanyRelation) => {
      const name =
        relation.nickname ||
        relation.related_company_name ||
        relation.related_contractor_name ||
        "cette relation";
      Alert.alert(
        "Supprimer de votre carnet ?",
        `"${name}" sera retirée. Les délégations existantes ne sont pas affectées.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteRelation(relation.id);
                setRelations((prev) =>
                  prev.filter((r) => r.id !== relation.id),
                );
              } catch (e: any) {
                Alert.alert("Erreur", e?.message ?? "Impossible de supprimer");
              }
            },
          },
        ],
      );
    },
    [setRelations],
  );

  const handleRenameConfirm = useCallback(async () => {
    if (!renameTarget) return;
    try {
      const updated = await updateRelationNickname(renameTarget.id, {
        nickname: renameValue.trim(),
      });
      setRelations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setRenameTarget(null);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de renommer");
    }
  }, [renameTarget, renameValue, setRelations]);

  // ─────────────────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1 },
    section: { marginBottom: DESIGN_TOKENS.spacing.xl ?? 24 },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    codeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: DESIGN_TOKENS.spacing.md,
      gap: DESIGN_TOKENS.spacing.md,
    },
    codeText: {
      flex: 1,
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 4,
      fontFamily: "monospace",
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: codeCopied
        ? "#22C55E22"
        : (colors.backgroundTertiary ?? colors.border),
      borderRadius: DESIGN_TOKENS.radius.sm,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    copyLabel: {
      color: codeCopied ? "#22C55E" : colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: DESIGN_TOKENS.spacing.sm,
      lineHeight: 17,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addLabel: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 14,
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    // Modal
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.md,
    },
    modalTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
      fontSize: 15,
      height: 48,
    },
    confirmBtn: {
      height: 48,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 40,
      gap: DESIGN_TOKENS.spacing.md,
    },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
    emptyHint: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
  });

  // ─────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────
  return (
    <View testID="business-relations-screen" style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} />
        }
      >
        {/* ── Section code entreprise ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Votre code entreprise</Text>
          <View style={s.codeCard}>
            <Ionicons name="key" size={20} color={colors.textSecondary} />
            <Text style={s.codeText}>{companyCode ?? "…"}</Text>
            <Pressable
              style={({ pressed }) => [s.copyBtn, pressed && { opacity: 0.7 }]}
              onPress={handleCopyCode}
              disabled={!companyCode}
            >
              <Ionicons
                name={codeCopied ? "checkmark" : "copy-outline"}
                size={14}
                color={codeCopied ? "#22C55E" : colors.textSecondary}
              />
              <Text style={s.copyLabel}>
                {codeCopied ? "Copié !" : "Copier"}
              </Text>
            </Pressable>
          </View>
          <Text style={s.hint}>
            {
              "Partagez ce code à un partenaire pour qu'il puisse vous déléguer un job directement."
            }
          </Text>
        </View>

        {/* ── Section aide ── */}
        <Pressable
          onPress={() => setShowHelp((prev) => !prev)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.info}
            />
            <Text
              style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}
            >
              Comment ajouter un partenaire ?
            </Text>
          </View>
          <Ionicons
            name={showHelp ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
        {showHelp && (
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.xl,
              borderWidth: 1,
              borderColor: colors.border,
              gap: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            >
              <Text style={{ fontSize: 16 }}>1️⃣</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                Envoyez votre code entreprise à votre partenaire (ci-dessus).
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            >
              <Text style={{ fontSize: 16 }}>2️⃣</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                Votre partenaire saisit votre code dans sa propre application
                pour vous ajouter.
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            >
              <Text style={{ fontSize: 16 }}>3️⃣</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                Acceptez la demande de relation quand elle apparaît dans votre
                carnet.
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            >
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                Vous pouvez maintenant vous déléguer des jobs mutuellement !
              </Text>
            </View>
          </View>
        )}

        {/* ── Section carnet ── */}
        <View style={s.section}>
          <View style={s.rowHeader}>
            <Text style={s.sectionTitle}>Carnet de relations</Text>
            <Pressable style={s.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={s.addLabel}>Ajouter</Text>
            </Pressable>
          </View>

          {!isLoading && relations.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={s.emptyTitle}>Votre carnet est vide</Text>
              <Text style={s.emptyHint}>
                Ajoutez votre premier partenaire en saisissant son code
                entreprise pour lui déléguer un job rapidement.
              </Text>
              <Pressable
                style={s.confirmBtn}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  + Ajouter une relation
                </Text>
              </Pressable>
            </View>
          ) : (
            <RelationsCarnet
              relations={relations}
              isLoading={isLoading}
              mode="manage"
              onRename={handleKebab}
              onDelete={handleKebab}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Modal Ajouter ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={s.overlay} onPress={() => setShowAddModal(false)}>
          <Pressable
            onPress={() => {
              /* absorb */
            }}
          >
            <View style={s.sheet}>
              <Text style={s.modalTitle}>Ajouter une relation</Text>

              <CompanyCodeInput
                onSelect={setAddLookupResult}
                onClear={() => setAddLookupResult(null)}
              />

              {addLookupResult && (
                <>
                  <TextInput
                    style={s.input}
                    value={addNickname}
                    onChangeText={setAddNickname}
                    placeholder="Surnom (optionnel)"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      s.confirmBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleAdd}
                    disabled={addLoading}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                    >
                      {addLoading ? "Enregistrement…" : "Enregistrer"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal Renommer ── */}
      <Modal
        visible={!!renameTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameTarget(null)}
      >
        <Pressable style={s.overlay} onPress={() => setRenameTarget(null)}>
          <Pressable
            onPress={() => {
              /* absorb */
            }}
          >
            <View style={s.sheet}>
              <Text style={s.modalTitle}>Renommer</Text>
              <TextInput
                style={s.input}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Nouveau surnom"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  s.confirmBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleRenameConfirm}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                >
                  Enregistrer
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
