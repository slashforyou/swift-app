/**
 * JobNotesSection — Notes/commentaires internes sur un job
 * Permet aux membres de l'équipe d'ajouter des notes visibles uniquement en interne.
 * #33 Communication équipe
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useJobNotes } from "../../../hooks/useJobNotes";
import { useLocalization } from "../../../localization/useLocalization";
import { JobNoteAPI } from "../../../services/jobNotes";
import { Card } from "../../ui/Card";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatNoteDate(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

function getAuthorInitials(note: JobNoteAPI): string {
  if (note.created_by_first_name || note.created_by_last_name) {
    const first = (note.created_by_first_name || "").charAt(0).toUpperCase();
    const last = (note.created_by_last_name || "").charAt(0).toUpperCase();
    return (first + last) || "?";
  }
  if (note.created_by_email) {
    return note.created_by_email.charAt(0).toUpperCase();
  }
  return "?";
}

function getAuthorName(note: JobNoteAPI): string {
  if (note.created_by_first_name || note.created_by_last_name) {
    return `${note.created_by_first_name ?? ""} ${note.created_by_last_name ?? ""}`.trim();
  }
  if (note.created_by_email) return note.created_by_email;
  return "Équipe";
}

// ─────────────────────────────────────────────────────────────
// NoteItem
// ─────────────────────────────────────────────────────────────

interface NoteItemProps {
  note: JobNoteAPI;
  onDelete: (noteId: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete }) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const initials = getAuthorInitials(note);
  const authorName = getAuthorName(note);
  const dateStr = formatNoteDate(note.created_at);

  const avatarColors = [
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];
  const colorIdx =
    String(note.created_by).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    avatarColors.length;
  const avatarBg = avatarColors[colorIdx];

  const handleLongPress = () => {
    Alert.alert(
      t("jobDetails.components.notes.deleteTitle"),
      t("jobDetails.components.notes.deleteConfirm"),
      [
        { text: t("jobDetails.components.notes.cancel"), style: "cancel" },
        {
          text: t("jobDetails.components.notes.delete"),
          style: "destructive",
          onPress: () => onDelete(String(note.id)),
        },
      ],
    );
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.sm,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: avatarBg,
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>
            {initials}
          </Text>
        </View>

        {/* Bubble */}
        <View
          style={{
            flex: 1,
          backgroundColor: colors.background,
          borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {authorName}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {dateStr}
            </Text>
          </View>

          {/* Content */}
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
            {note.content}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────
// JobNotesSection
// ─────────────────────────────────────────────────────────────

interface JobNotesSectionProps {
  jobId: string;
}

export const JobNotesSection: React.FC<JobNotesSectionProps> = ({ jobId }) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { notes, isLoading, addNote, deleteNote, totalNotes } =
    useJobNotes(jobId);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      Alert.alert(
        t("jobDetails.components.notes.error"),
        t("jobDetails.components.notes.emptyContent"),
      );
      return;
    }

    setIsSending(true);
    try {
      await addNote({ title: "", content: trimmed, note_type: "internal" });
      setInputText("");
    } catch {
      Alert.alert(
        t("jobDetails.components.notes.error"),
        t("jobDetails.components.notes.addError"),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch {
      Alert.alert(
        t("jobDetails.components.notes.error"),
        t("jobDetails.components.notes.deleteError"),
      );
    }
  };

  return (
    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
      {/* ── Header (toggle) ─── */}
      <Pressable
        onPress={() => setIsExpanded((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: DESIGN_TOKENS.spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          </View>
          <Text
            style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {t("jobDetails.components.notes.title")}
          </Text>
          {totalNotes > 0 && (
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                {totalNotes}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
          size={24}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* ── Body ─── */}
      {isExpanded && (
        <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
          {/* Notes list */}
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: DESIGN_TOKENS.spacing.md }}
            />
          ) : notes.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: DESIGN_TOKENS.spacing.xl,
                gap: DESIGN_TOKENS.spacing.xs,
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginTop: DESIGN_TOKENS.spacing.sm,
                }}
              >
                {t("jobDetails.components.notes.noNotes")}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {t("jobDetails.components.notes.noNotesSubtitle")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={notes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <NoteItem note={item} onDelete={handleDelete} />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginHorizontal: DESIGN_TOKENS.spacing.xs,
                  }}
                />
              )}
            />
          )}

          {/* Input bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: DESIGN_TOKENS.spacing.sm,
              marginTop: DESIGN_TOKENS.spacing.md,
              paddingTop: DESIGN_TOKENS.spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t("jobDetails.components.notes.placeholder")}
              placeholderTextColor={colors.textSecondary}
              multiline
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                fontSize: 14,
                color: colors.text,
                maxHeight: 100,
              }}
            />
            <Pressable
              onPress={handleSend}
              disabled={isSending || !inputText.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor:
                  inputText.trim() ? colors.primary : colors.primary + "40",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
};
