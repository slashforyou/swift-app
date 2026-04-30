import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    createJobLink,
    deleteJobLink,
    getJobLinks,
    LinkedJob,
} from "../../services/jobLinksService";

const LINK_TYPES = [
  { id: "interstate", label: "Interstate" },
  { id: "follow_up", label: "Follow-up" },
  { id: "related", label: "Lié" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#D69E2E",
  assigned: "#3182CE",
  "in-progress": "#38A169",
  completed: "#718096",
  cancelled: "#E53E3E",
};

interface Props {
  route?: any;
  navigation: any;
  jobId?: number;
}

export default function LinkedJobsScreen({ route, navigation, jobId: propJobId }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const jobId: number = route?.params?.jobId ?? propJobId;

  const [links, setLinks] = useState<LinkedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [selectedType, setSelectedType] = useState("related");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getJobLinks(jobId);
      setLinks(data);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (link: LinkedJob) => {
    Alert.alert(
      t("common.delete") ?? "Supprimer",
      t("linkedJobs.deleteConfirm") ?? "Supprimer ce lien ?",
      [
        { text: t("common.cancel") ?? "Annuler", style: "cancel" },
        {
          text: t("common.delete") ?? "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJobLink(jobId, link.id);
              setLinks((prev) => prev.filter((l) => l.id !== link.id));
            } catch {
              Alert.alert(t("common.error") ?? "Erreur", t("linkedJobs.deleteError") ?? "Impossible de supprimer");
            }
          },
        },
      ],
    );
  };

  const handleLink = async () => {
    const linkedId = parseInt(searchId.trim(), 10);
    if (!linkedId || isNaN(linkedId)) return;
    setSaving(true);
    try {
      await createJobLink(jobId, { linked_job_id: linkedId, link_type: selectedType });
      await load();
      setShowModal(false);
      setSearchId("");
      setSelectedType("related");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("linkedJobs.saveError") ?? "Impossible de lier ce job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("linkedJobs.title") ?? "🔗 Jobs liés"}
        </Text>
        <Pressable
          onPress={() => setShowModal(true)}
          style={{
            backgroundColor: colors.primary,
            borderRadius: DESIGN_TOKENS.radius.md,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            {t("linkedJobs.link") ?? "Lier"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable
            onPress={load}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}
        >
          {links.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="link-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>
                {t("linkedJobs.empty") ?? "Aucun job lié"}
              </Text>
            </View>
          ) : (
            links.map((link) => {
              const statusColor = STATUS_COLORS[link.status] ?? "#718096";
              const linkTypeLabel = LINK_TYPES.find((l) => l.id === link.link_type)?.label ?? link.link_type;
              return (
                <View
                  key={link.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                      {link.title || `Job #${link.id}`}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                      <View
                        style={{
                          backgroundColor: statusColor + "20",
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: statusColor, fontSize: 11, fontWeight: "600" }}>
                          {link.status}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: colors.primary + "15",
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>
                          {linkTypeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable onPress={() => handleDelete(link)} hitSlop={8} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal Lier un job */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowModal(false)} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: DESIGN_TOKENS.spacing.lg,
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("linkedJobs.linkTitle") ?? "Lier un job"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("linkedJobs.jobIdLabel") ?? "ID du job *"}
            </Text>
            <TextInput
              value={searchId}
              onChangeText={setSearchId}
              placeholder="123"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                marginBottom: 16,
              }}
            />

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              {t("linkedJobs.typeLabel") ?? "Type de lien"}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {LINK_TYPES.map((lt) => (
                <Pressable
                  key={lt.id}
                  onPress={() => setSelectedType(lt.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: selectedType === lt.id ? colors.primary : colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: selectedType === lt.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: selectedType === lt.id ? "#fff" : colors.text,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {lt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleLink}
              disabled={saving || !searchId.trim()}
              style={{
                backgroundColor: searchId.trim() ? colors.primary : colors.border,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("linkedJobs.linkAction") ?? "Lier ce job"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
