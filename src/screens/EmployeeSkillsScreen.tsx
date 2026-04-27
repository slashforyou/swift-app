import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useAuth } from "../hooks/useAuth";
import { useLocalization } from "../localization/useLocalization";
import {
  createEmployeeSkill,
  deleteEmployeeSkill,
  EmployeeSkill,
  getEmployeeSkills,
} from "../services/employeeSkillsService";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#718096",
  intermediate: "#D69E2E",
  advanced: "#3182CE",
  expert: "#805AD5",
};

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];

interface Props {
  route?: any;
  navigation: any;
}

export default function EmployeeSkillsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { user } = useAuth();
  const userId: number = route?.params?.userId ?? user?.id;

  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState("intermediate");
  const [formCertified, setFormCertified] = useState(false);
  const [formExpiry, setFormExpiry] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getEmployeeSkills(userId);
      setSkills(data);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormName("");
    setFormLevel("intermediate");
    setFormCertified(false);
    setFormExpiry("");
    setFormNotes("");
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const skill = await createEmployeeSkill(userId, {
        skill_name: formName.trim(),
        skill_level: formLevel,
        certified: formCertified,
        cert_expiry_date: formExpiry.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setSkills((prev) => [skill, ...prev]);
      setShowModal(false);
      resetForm();
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("skills.saveError") ?? "Impossible d'ajouter");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (skill: EmployeeSkill) => {
    Alert.alert(
      t("common.delete") ?? "Supprimer",
      t("skills.deleteConfirm") ?? `Supprimer "${skill.skill_name}" ?`,
      [
        { text: t("common.cancel") ?? "Annuler", style: "cancel" },
        {
          text: t("common.delete") ?? "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEmployeeSkill(userId, skill.id);
              setSkills((prev) => prev.filter((s) => s.id !== skill.id));
            } catch {
              Alert.alert(t("common.error") ?? "Erreur");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("skills.title") ?? "Compétences"}
        </Text>
        <Pressable
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 8 }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable onPress={load} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {skills.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="school-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>
                {t("skills.empty") ?? "Aucune compétence"}
              </Text>
            </View>
          ) : (
            skills.map((skill) => {
              const levelColor = LEVEL_COLORS[skill.skill_level] ?? "#718096";
              return (
                <View
                  key={skill.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    borderWidth: 1, borderColor: colors.border, gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: levelColor + "20",
                      justifyContent: "center", alignItems: "center",
                    }}
                  >
                    <Ionicons name="ribbon-outline" size={22} color={levelColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                        {skill.skill_name}
                      </Text>
                      {skill.certified && (
                        <View style={{ backgroundColor: "#38A16920", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: "#38A169", fontSize: 11, fontWeight: "700" }}>✓ Certifié</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <View style={{ backgroundColor: levelColor + "20", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: levelColor, fontSize: 11, fontWeight: "600" }}>{skill.skill_level}</Text>
                      </View>
                      {skill.cert_expiry_date && (
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>exp: {skill.cert_expiry_date}</Text>
                      )}
                    </View>
                    {skill.notes ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                        {skill.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable onPress={() => handleDelete(skill)} hitSlop={8} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Skill Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => { setShowModal(false); resetForm(); }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => { setShowModal(false); resetForm(); }} />
          <ScrollView
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("skills.addTitle") ?? "Ajouter une compétence"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("skills.nameLabel") ?? "Nom de la compétence *"}
            </Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="Conduite poids lourds..."
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14 }}
            />

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              {t("skills.levelLabel") ?? "Niveau"}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {LEVELS.map((lvl) => (
                <Pressable
                  key={lvl}
                  onPress={() => setFormLevel(lvl)}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                    backgroundColor: formLevel === lvl ? (LEVEL_COLORS[lvl] ?? colors.primary) : colors.backgroundSecondary,
                    borderWidth: 1, borderColor: formLevel === lvl ? (LEVEL_COLORS[lvl] ?? colors.primary) : colors.border,
                  }}
                >
                  <Text style={{ color: formLevel === lvl ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
                    {lvl}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                {t("skills.certifiedLabel") ?? "Certifié"}
              </Text>
              <Switch
                value={formCertified}
                onValueChange={setFormCertified}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>

            {formCertified && (
              <>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
                  {t("skills.expiryLabel") ?? "Date d'expiration (optionnel)"}
                </Text>
                <TextInput
                  value={formExpiry}
                  onChangeText={setFormExpiry}
                  placeholder="2027-12-31"
                  placeholderTextColor={colors.textSecondary}
                  style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14 }}
                />
              </>
            )}

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("skills.notesLabel") ?? "Notes (optionnel)"}
            </Text>
            <TextInput
              value={formNotes}
              onChangeText={setFormNotes}
              placeholder="..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 20 }}
            />

            <Pressable
              onPress={handleSave}
              disabled={saving || !formName.trim()}
              style={{ backgroundColor: formName.trim() ? colors.primary : colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("common.add") ?? "Ajouter"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
