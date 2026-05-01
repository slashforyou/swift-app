import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import HeaderLogo from "../../components/ui/HeaderLogo";
import {
    ActivityIndicator,
    Alert,
    Linking,
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
    createJobAttachment,
    deleteJobAttachment,
    getJobAttachments,
    JobAttachment,
} from "../../services/jobAttachmentsService";

const FILE_ICONS: Record<string, string> = {
  pdf: "document-text-outline",
  doc: "document-outline",
  docx: "document-outline",
  xls: "grid-outline",
  xlsx: "grid-outline",
  jpg: "image-outline",
  jpeg: "image-outline",
  png: "image-outline",
  gif: "image-outline",
  default: "attach-outline",
};

const FILE_COLORS: Record<string, string> = {
  pdf: "#E53E3E",
  doc: "#2B6CB0",
  docx: "#2B6CB0",
  xls: "#276749",
  xlsx: "#276749",
  jpg: "#D69E2E",
  jpeg: "#D69E2E",
  png: "#D69E2E",
  gif: "#D69E2E",
  default: "#718096",
};

function getFileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "default";
}

interface Props {
  route?: any;
  navigation: any;
  jobId?: number;
}

export default function JobAttachmentsScreen({ route, navigation, jobId: propJobId }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const jobId: number = route?.params?.jobId ?? propJobId;

  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getJobAttachments(jobId);
      setAttachments(data);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t("common.error") ?? "Erreur", t("attachments.cannotOpen") ?? "Impossible d'ouvrir ce fichier"),
    );
  };

  const handleDelete = (attachment: JobAttachment) => {
    Alert.alert(
      t("common.delete") ?? "Supprimer",
      t("attachments.deleteConfirm") ?? "Supprimer cette pièce jointe ?",
      [
        { text: t("common.cancel") ?? "Annuler", style: "cancel" },
        {
          text: t("common.delete") ?? "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJobAttachment(jobId, attachment.id);
              setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
            } catch {
              Alert.alert(t("common.error") ?? "Erreur", t("attachments.deleteError") ?? "Échec de la suppression");
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!urlInput.trim() || !nameInput.trim()) return;
    setSaving(true);
    try {
      const ext = getFileExt(nameInput);
      const att = await createJobAttachment(jobId, {
        file_url: urlInput.trim(),
        file_name: nameInput.trim(),
        file_type: ext,
        label: labelInput.trim() || undefined,
      });
      setAttachments((prev) => [att, ...prev]);
      setShowModal(false);
      setUrlInput("");
      setNameInput("");
      setLabelInput("");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("attachments.saveError") ?? "Impossible d'ajouter la pièce jointe");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Logo */}
      <View style={{ alignItems: "center", paddingTop: insets.top }}>
        <HeaderLogo preset="sm" variant="rectangle" marginVertical={0} />
      </View>
      {/* Header */}
      <View
        style={{
          paddingTop: DESIGN_TOKENS.spacing.sm,
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
          {t("jobAttachments.title") ?? "📎 Pièces jointes"}
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
            {t("common.add") ?? "Ajouter"}
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
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {attachments.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="attach-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>
                {t("jobAttachments.empty") ?? "Aucune pièce jointe"}
              </Text>
            </View>
          ) : (
            attachments.map((att) => {
              const ext = getFileExt(att.file_name);
              const iconName = FILE_ICONS[ext] ?? FILE_ICONS.default;
              const iconColor = FILE_COLORS[ext] ?? FILE_COLORS.default;
              return (
                <Pressable
                  key={att.id}
                  onPress={() => handleOpen(att.file_url)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 12,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: iconColor + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={iconName as any} size={22} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: colors.text, fontSize: 14 }} numberOfLines={1}>
                      {att.file_name}
                    </Text>
                    {att.label ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                        {att.label}
                      </Text>
                    ) : null}
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {formatDate(att.created_at)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(att)}
                    hitSlop={8}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal Ajouter */}
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
              {t("jobAttachments.addTitle") ?? "Ajouter une pièce jointe"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("attachments.urlLabel") ?? "URL du fichier *"}
            </Text>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                marginBottom: 12,
              }}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("attachments.nameLabel") ?? "Nom du fichier *"}
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="rapport.pdf"
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("attachments.labelLabel") ?? "Label (optionnel)"}
            </Text>
            <TextInput
              value={labelInput}
              onChangeText={setLabelInput}
              placeholder="Contrat signé..."
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                marginBottom: 20,
              }}
            />

            <Pressable
              onPress={handleSave}
              disabled={saving || !urlInput.trim() || !nameInput.trim()}
              style={{
                backgroundColor: urlInput.trim() && nameInput.trim() ? colors.primary : colors.border,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("common.save") ?? "Enregistrer"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
