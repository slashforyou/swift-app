/**
 * Notes Page - Gestion des notes avec interface moderne
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import ImprovedNoteModal from "../../components/jobDetails/modals/ImprovedNoteModal";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useToast } from "../../context/ToastProvider";
import { useJobNotes } from "../../hooks/useJobNotes";
import { useLocalization } from "../../localization/useLocalization";
import { JobNoteAPI } from "../../services/jobNotes";

interface JobNoteProps {
  job: any;
  setJob: React.Dispatch<React.SetStateAction<any>>;
  jobId?: string; // ID numérique du job (ex: "22"), différent de job.id qui est le code
}

const JobNote: React.FC<JobNoteProps> = ({ job, setJob, jobId }) => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLocalization();
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<JobNoteAPI | null>(null);
  const [selectedNoteMenu, setSelectedNoteMenu] = useState<string | null>(null);

  // Map des locales pour le formatage des dates
  const DATE_LOCALES: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
    pt: "pt-BR",
    it: "it-IT",
    zh: "zh-CN",
    hi: "hi-IN",
  };

  // Hooks pour la gestion des notes
  // Utiliser jobId (ID numérique) au lieu de job?.id (code du job)
  const actualJobId = jobId || job?.id;
  const {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    refetch,
    unreadCount,
    markAllAsRead,
  } = useJobNotes(actualJobId);
  const { showSuccess, showError } = useToast();

  // ✅ Marquer automatiquement toutes les notes comme lues quand on ouvre la page
  useEffect(() => {
    if (unreadCount > 0) {
      console.log(
        "📖 [JobNote] Marking all notes as read on mount, unreadCount:",
        unreadCount,
      );
      markAllAsRead();
    }
  }, []); // Exécuter seulement au montage du composant

  // Gestion des notes avec API - nouvelle structure
  const handleAddNote = async (
    content: string,
    note_type: "general" | "important" | "client" | "internal" = "general",
    title?: string,
  ) => {
    try {
      const result = await addNote({
        title:
          title ||
          `${t("jobDetails.defaultNote")} ${new Date().toLocaleDateString()}`,
        content,
        note_type,
      });
      if (result) {
        showSuccess(
          t("jobDetails.messages.noteAdded"),
          t("jobDetails.messages.noteAddedSuccess"),
        );
        // ✅ FIX: Ne pas refetch si la note a été sauvegardée localement
        // L'API retourne un id de type number, les notes locales ont un id string commençant par "local-"
        const isLocalNote =
          typeof result.id === "string" && result.id.startsWith("local-");
        if (!isLocalNote) {
          await refetch(); // Actualiser la liste des notes depuis l'API
        }
        return Promise.resolve();
      } else {
        throw new Error(t("jobDetails.messages.noteAddError"));
      }
    } catch (error) {
      console.error("Error adding note:", error);
      showError(
        t("jobDetails.messages.noteAddError"),
        t("jobDetails.messages.noteAddErrorMessage"),
      );
      throw error;
    }
  };

  // Gestion de l'édition de note
  const handleEditNote = async (
    content: string,
    note_type: "general" | "important" | "client" | "internal" = "general",
    title?: string,
  ) => {
    if (!editingNote) return;

    try {
      const result = await updateNote(editingNote.id, {
        title: title || editingNote.title,
        content,
      });

      if (result) {
        showSuccess(
          t("jobDetails.messages.noteUpdated") || "Note updated",
          t("jobDetails.messages.noteUpdatedSuccess") ||
            "Note updated successfully",
        );
        setEditingNote(null);
        setIsNoteModalVisible(false);
        return Promise.resolve();
      } else {
        throw new Error(
          t("jobDetails.messages.noteUpdateError") || "Failed to update note",
        );
      }
    } catch (error) {
      console.error("Error updating note:", error);
      showError(
        t("jobDetails.messages.noteUpdateError") || "Update error",
        t("jobDetails.messages.noteUpdateErrorMessage") ||
          "Failed to update note",
      );
      throw error;
    }
  };

  // Gestion de la suppression de note
  const handleDeleteNote = async (noteId: string | number) => {
    Alert.alert(
      t("common.confirmDelete") || "Delete Note?",
      t("common.confirmDeleteMessage") ||
        "Are you sure you want to delete this note? This action cannot be undone.",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("common.delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteNote(noteId);
              if (success) {
                showSuccess(
                  t("common.deleted") || "Note deleted",
                  t("jobDetails.messages.noteDeletedSuccess") ||
                    "Note deleted successfully",
                );
              } else {
                throw new Error("Failed to delete note");
              }
            } catch (error) {
              console.error("Error deleting note:", error);
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : "Failed to delete note";

              // Détection du problème de permissions
              if (
                errorMsg.includes("401") ||
                errorMsg.includes("Token invalide")
              ) {
                showError(
                  t("common.error") || "Permission error",
                  "You may not have permission to delete this note. Only the creator can delete it.",
                );
              } else {
                showError(t("common.error") || "Delete error", errorMsg);
              }
            }
          },
        },
      ],
    );
  };

  // Ouvrir le modal d'édition
  const openEditModal = (note: JobNoteAPI) => {
    console.log("📝 [note.tsx] Opening edit modal with:", {
      id: note.id,
      title: note.title,
      titleExists: !!note.title,
      content: note.content?.substring(0, 50),
      contentExists: !!note.content,
      type: note.note_type,
      fullNote: note, // Log complet pour voir la structure
    });
    setEditingNote(note);
    setIsNoteModalVisible(true);
    setSelectedNoteMenu(null);
  };

  // Fermer le modal et réinitialiser l'édition
  const handleCloseModal = () => {
    setIsNoteModalVisible(false);
    setEditingNote(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60),
      );

      if (diffHours < 1) return t("jobDetails.notes.time.justNow");
      if (diffHours < 24)
        return `${diffHours}h ${t("jobDetails.notes.time.hoursAgo")}`;
      if (diffHours < 48) return t("jobDetails.notes.time.yesterday");
      return date.toLocaleDateString(DATE_LOCALES[currentLanguage] || "en-US");
    } catch {
      return t("jobDetails.notes.time.recently");
    }
  };

  const getNoteTypeInfo = (type: string) => {
    const types = {
      general: {
        icon: "document-text",
        color: colors.tint,
        label: t("jobDetails.notes.types.general"),
      },
      important: {
        icon: "alert-circle",
        color: colors.warning,
        label: t("jobDetails.notes.types.important"),
      },
      client: {
        icon: "person",
        color: colors.success,
        label: t("jobDetails.notes.types.client"),
      },
      internal: {
        icon: "shield",
        color: colors.info,
        label: t("jobDetails.notes.types.internal"),
      },
    };
    return types[type as keyof typeof types] || types.general;
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: DESIGN_TOKENS.spacing.xl,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          {t("jobDetails.notes.loading")}
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Modal de création/édition de note */}
      <ImprovedNoteModal
        isVisible={isNoteModalVisible}
        onClose={handleCloseModal}
        onAddNote={editingNote ? handleEditNote : handleAddNote}
        jobId={actualJobId}
        editMode={!!editingNote}
        initialTitle={editingNote?.title}
        initialContent={editingNote?.content}
        initialType={editingNote?.note_type}
      />

      <TouchableWithoutFeedback
        onPress={() => selectedNoteMenu && setSelectedNoteMenu(null)}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.md }}
          >
            {/* Message informatif si en mode local */}
            {notes.length > 0 &&
              notes.some((note) => String(note.id).startsWith("local-")) && (
                <View
                  style={{
                    backgroundColor: colors.tint + "10",
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.tint}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.tint,
                      flex: 1,
                    }}
                  >
                    {t("jobDetails.notes.localSyncInfo")}
                  </Text>
                </View>
              )}

            {/* Header avec bouton d'ajout */}
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      color: colors.text,
                      marginBottom: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    {t("jobDetails.notes.title")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    {notes.length}{" "}
                    {notes.length !== 1
                      ? t("jobDetails.notes.countPlural")
                      : t("jobDetails.notes.count")}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setIsNoteModalVisible(true)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.tint + "DD" : colors.tint,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.xs,
                  })}
                >
                  <Ionicons name="add" size={18} color={colors.background} />
                  <Text
                    style={{
                      color: colors.background,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {t("jobDetails.notes.add")}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Liste des notes */}
            {notes.length > 0 ? (
              <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
                {notes.map((note) => {
                  const typeInfo = getNoteTypeInfo(note.note_type || "general");
                  const isLocalNote = String(note.id).startsWith("local-");

                  return (
                    <View
                      key={note.id}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        padding: DESIGN_TOKENS.spacing.lg,
                        borderLeftWidth: 4,
                        borderLeftColor: typeInfo.color,
                        opacity: isLocalNote ? 0.8 : 1,
                        position: "relative",
                      }}
                    >
                      {/* Indicateur de note non lue (point bleu) */}
                      {!note.is_read && !isLocalNote && (
                        <View
                          style={{
                            position: "absolute",
                            top: DESIGN_TOKENS.spacing.lg,
                            right: DESIGN_TOKENS.spacing.lg,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: colors.primary,
                            borderWidth: 2,
                            borderColor: colors.backgroundSecondary,
                            zIndex: 1,
                          }}
                        />
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: DESIGN_TOKENS.spacing.sm,
                          marginBottom: DESIGN_TOKENS.spacing.sm,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: typeInfo.color + "20",
                            borderRadius: 16,
                            width: 32,
                            height: 32,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={typeInfo.icon as any}
                            size={16}
                            color={typeInfo.color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: DESIGN_TOKENS.spacing.xs,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: typeInfo.color,
                                  textTransform: "uppercase",
                                }}
                              >
                                {typeInfo.label}
                              </Text>
                              {!note.is_read && !isLocalNote && (
                                <View
                                  style={{
                                    backgroundColor: colors.primary + "20",
                                    borderRadius: 8,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderWidth: 1,
                                    borderColor: colors.primary,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: "700",
                                      color: colors.primary,
                                    }}
                                  >
                                    {t("jobDetails.notes.unread") || "NON LU"}
                                  </Text>
                                </View>
                              )}
                              {isLocalNote && (
                                <View
                                  style={{
                                    backgroundColor: colors.tint + "20",
                                    borderRadius: 8,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: "600",
                                      color: colors.tint,
                                    }}
                                  >
                                    LOCAL
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                }}
                              >
                                {formatDate(note.created_at)}
                              </Text>
                              {/* Menu d'actions */}
                              <View style={{ position: "relative" }}>
                                <Pressable
                                  onPress={() =>
                                    setSelectedNoteMenu(
                                      selectedNoteMenu === note.id
                                        ? null
                                        : note.id,
                                    )
                                  }
                                  style={({ pressed }) => ({
                                    padding: 4,
                                    opacity: pressed ? 0.6 : 1,
                                  })}
                                >
                                  <Ionicons
                                    name="ellipsis-vertical"
                                    size={18}
                                    color={colors.textSecondary}
                                  />
                                </Pressable>

                                {/* Dropdown menu */}
                                {selectedNoteMenu === note.id && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      top: 24,
                                      right: 0,
                                      backgroundColor: colors.background,
                                      borderRadius: DESIGN_TOKENS.radius.md,
                                      shadowColor: colors.shadow,
                                      shadowOffset: { width: 0, height: 4 },
                                      shadowOpacity: 0.2,
                                      shadowRadius: 8,
                                      elevation: 8,
                                      minWidth: 150,
                                      zIndex: 1001,
                                    }}
                                  >
                                    <Pressable
                                      onPress={() => openEditModal(note)}
                                      style={({ pressed }) => ({
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: DESIGN_TOKENS.spacing.sm,
                                        padding: DESIGN_TOKENS.spacing.md,
                                        backgroundColor: pressed
                                          ? colors.backgroundSecondary
                                          : "transparent",
                                        borderTopLeftRadius:
                                          DESIGN_TOKENS.radius.md,
                                        borderTopRightRadius:
                                          DESIGN_TOKENS.radius.md,
                                      })}
                                    >
                                      <Ionicons
                                        name="create-outline"
                                        size={18}
                                        color={colors.tint}
                                      />
                                      <Text
                                        style={{
                                          color: colors.text,
                                          fontSize: 14,
                                        }}
                                      >
                                        {t("common.edit") || "Edit"}
                                      </Text>
                                    </Pressable>

                                    <View
                                      style={{
                                        height: 1,
                                        backgroundColor: colors.border,
                                      }}
                                    />

                                    <Pressable
                                      onPress={() => handleDeleteNote(note.id)}
                                      style={({ pressed }) => ({
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: DESIGN_TOKENS.spacing.sm,
                                        padding: DESIGN_TOKENS.spacing.md,
                                        backgroundColor: pressed
                                          ? colors.backgroundSecondary
                                          : "transparent",
                                        borderBottomLeftRadius:
                                          DESIGN_TOKENS.radius.md,
                                        borderBottomRightRadius:
                                          DESIGN_TOKENS.radius.md,
                                      })}
                                    >
                                      <Ionicons
                                        name="trash-outline"
                                        size={18}
                                        color={colors.error}
                                      />
                                      <Text
                                        style={{
                                          color: colors.error,
                                          fontSize: 14,
                                        }}
                                      >
                                        {t("common.delete") || "Delete"}
                                      </Text>
                                    </Pressable>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>

                          {/* Titre de la note (si différent du titre par défaut) */}
                          {note.title &&
                            !note.title.includes("Note du") &&
                            !note.title.includes("defaultNote") && (
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "700",
                                  color: colors.text,
                                  marginBottom: DESIGN_TOKENS.spacing.xs,
                                }}
                              >
                                {note.title}
                              </Text>
                            )}

                          {/* Contenu de la note */}
                          <Text
                            style={{
                              fontSize: 15,
                              lineHeight: 22,
                              color: colors.text,
                            }}
                          >
                            {note.content}
                          </Text>

                          {/* Auteur de la note (si disponible - API v1.1.0) */}
                          {note.created_by_first_name && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: DESIGN_TOKENS.spacing.xs,
                                marginTop: DESIGN_TOKENS.spacing.md,
                                paddingTop: DESIGN_TOKENS.spacing.sm,
                                borderTopWidth: 1,
                                borderTopColor: colors.border + "30",
                              }}
                            >
                              <Ionicons
                                name="person-circle-outline"
                                size={14}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                }}
                              >
                                {t("jobDetails.notes.createdBy") ||
                                  "Created by"}{" "}
                                <Text style={{ fontWeight: "600" }}>
                                  {note.created_by_first_name}{" "}
                                  {note.created_by_last_name}
                                </Text>
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: DESIGN_TOKENS.spacing.xxl,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.backgroundSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  {t("jobDetails.notes.noNotes")}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 250,
                    marginBottom: DESIGN_TOKENS.spacing.xl,
                  }}
                >
                  {t("jobDetails.notes.noNotesDescription")}
                </Text>

                <Pressable
                  onPress={() => setIsNoteModalVisible(true)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.tint + "DD" : colors.tint,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                  })}
                >
                  <Ionicons name="add" size={20} color={colors.background} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.background,
                    }}
                  >
                    {t("jobDetails.notes.addFirstNote")}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default JobNote;
