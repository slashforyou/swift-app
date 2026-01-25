/**
 * ImprovedNoteModal - Modal amélioré pour l'ajout de notes avec types de problème
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization";

interface NoteType {
  id: "general" | "important" | "client" | "internal";
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface ImprovedNoteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddNote: (
    content: string,
    note_type: "general" | "important" | "client" | "internal",
    title?: string,
  ) => Promise<void>;
  jobId: string;
  editMode?: boolean;
  initialTitle?: string;
  initialContent?: string;
  initialType?: "general" | "important" | "client" | "internal";
}

const ImprovedNoteModal: React.FC<ImprovedNoteModalProps> = ({
  isVisible,
  onClose,
  onAddNote,
  jobId,
  editMode = false,
  initialTitle = "",
  initialContent = "",
  initialType = "general",
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [noteTitle, setNoteTitle] = useState(initialTitle);
  const [noteContent, setNoteContent] = useState(initialContent);
  const [selectedType, setSelectedType] = useState<
    "general" | "important" | "client" | "internal"
  >(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    console.log("🔄 [ImprovedNoteModal] useEffect triggered:", {
      isVisible,
      editMode,
      initialTitle,
      initialContent: initialContent?.substring(0, 50),
      initialType
    });
    // ✅ FIX: Ne reset que si le modal est visible pour éviter de vider les champs
    if (isVisible && editMode) {
      // Mode édition : charger les données
      setNoteTitle(initialTitle);
      setNoteContent(initialContent);
      setSelectedType(initialType);
      setShowTypeSelector(false);
    } else if (isVisible && !editMode) {
      // Mode création : formulaire vide
      setNoteTitle("");
      setNoteContent("");
      setSelectedType("general");
      setShowTypeSelector(false);
    }
    // Ne rien faire si isVisible = false (évite de vider pendant la fermeture)
  }, [isVisible, editMode]);

  // Types de notes avec problèmes spécifiques (adaptés aux types API)
  const noteTypes: NoteType[] = [
    {
      id: "general",
      label: t("jobDetails.notes.types.general"),
      description: t("jobDetails.notes.typeDescriptions.general"),
      icon: "document-text",
      color: colors.tint,
    },
    {
      id: "important",
      label: t("jobDetails.notes.types.important"),
      description: t("jobDetails.notes.typeDescriptions.important"),
      icon: "alert-circle",
      color: colors.warning,
    },
    {
      id: "client",
      label: t("jobDetails.notes.types.client"),
      description: t("jobDetails.notes.typeDescriptions.client"),
      icon: "person",
      color: colors.success,
    },
    {
      id: "internal",
      label: t("jobDetails.notes.types.internal"),
      description: t("jobDetails.notes.typeDescriptions.internal"),
      icon: "shield",
      color: colors.info,
    },
  ];

  const handleSubmit = async () => {
    if (!noteContent.trim()) {
      Alert.alert(
        t("jobDetails.messages.noteAddError"),
        t("jobDetails.notes.modal.emptyContentError"),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const title =
        noteTitle.trim() || `Note du ${new Date().toLocaleDateString()}`;
      await onAddNote(noteContent.trim(), selectedType, title);

      // Reset form only if not in edit mode (edit mode handled by parent)
      if (!editMode) {
        setNoteTitle("");
        setNoteContent("");
        setSelectedType("general");
      }

      onClose();

      // Toast de succès (géré par le parent maintenant)
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert(
        editMode
          ? t("jobDetails.messages.noteUpdateError") || "Update error"
          : t("jobDetails.messages.noteAddError"),
        editMode
          ? t("jobDetails.messages.noteUpdateErrorMessage") ||
              "Failed to update note"
          : t("jobDetails.messages.noteAddErrorMessage"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeData = noteTypes.find((type) => type.id === selectedType);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
      borderTopRightRadius: DESIGN_TOKENS.radius.lg,
      borderBottomLeftRadius: DESIGN_TOKENS.radius.lg,
      borderBottomRightRadius: DESIGN_TOKENS.radius.lg,
      maxHeight: "90%",
      paddingTop: DESIGN_TOKENS.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    header: {
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.tint + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    section: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.md,
      marginHorizontal: -DESIGN_TOKENS.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    typeButton: {
      flex: 1,
      minWidth: "45%",
      maxWidth: "48%",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
    },
    typeButtonSelected: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.primary,
    },
    typeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    typeLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
    typeDescription: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 2,
    },
    textInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      fontSize: 16,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedTypeInfo: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    selectedTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    selectedTypeText: {
      flex: 1,
    },
    selectedTypeLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    selectedTypeDesc: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
      paddingTop: DESIGN_TOKENS.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    cancelButtonPressed: {
      backgroundColor: colors.backgroundSecondary,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    submitButton: {
      flex: 2,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    submitButtonPressed: {
      backgroundColor: colors.primary + "DD",
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.background,
    },
    submitTextDisabled: {
      color: colors.textSecondary,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.container}>
            {/* Handle */}
            <View style={styles.handle} />

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Ionicons
                    name={editMode ? "create" : "document-text-outline"}
                    size={28}
                    color={colors.tint}
                  />
                </View>
                <Text style={styles.title}>
                  {editMode
                    ? t("jobDetails.notes.modal.editTitle") || "Edit Note"
                    : t("jobDetails.notes.modal.title")}
                </Text>
              </View>

              {/* Type Selection - Compact */}
              <View style={styles.section}>
                {!showTypeSelector ? (
                  <Pressable
                    onPress={() => setShowTypeSelector(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: DESIGN_TOKENS.spacing.md,
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      borderWidth: 1,
                      borderColor: selectedTypeData?.color || colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: DESIGN_TOKENS.spacing.sm,
                      }}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          { backgroundColor: selectedTypeData?.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={selectedTypeData?.icon as any}
                          size={18}
                          color={selectedTypeData?.color}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                            marginBottom: 2,
                          }}
                        >
                          {t("jobDetails.notes.modal.typeLabel")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: colors.text,
                          }}
                        >
                          {selectedTypeData?.label}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: DESIGN_TOKENS.spacing.md,
                      }}
                    >
                      <Text style={styles.sectionTitle}>
                        {t("jobDetails.notes.modal.typeLabel")}
                      </Text>
                      <Pressable onPress={() => setShowTypeSelector(false)}>
                        <Ionicons
                          name="chevron-up"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                    <View style={styles.typeGrid}>
                      {noteTypes.map((type) => (
                        <Pressable
                          key={type.id}
                          onPress={() => {
                            setSelectedType(type.id);
                            setShowTypeSelector(false);
                          }}
                          style={[
                            styles.typeButton,
                            selectedType === type.id &&
                              styles.typeButtonSelected,
                          ]}
                        >
                          <View
                            style={[
                              styles.typeIcon,
                              { backgroundColor: type.color + "20" },
                            ]}
                          >
                            <Ionicons
                              name={type.icon as any}
                              size={18}
                              color={type.color}
                            />
                          </View>
                          <Text style={styles.typeLabel}>{type.label}</Text>
                          <Text style={styles.typeDescription}>
                            {type.description}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Note Content - FIRST for better UX */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("jobDetails.notes.modal.contentLabel")}{" "}
                  <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 120 }]}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  placeholder={t("jobDetails.notes.modal.contentPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  autoFocus={!editMode}
                />
              </View>

              {/* Note Title - Optional */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("jobDetails.notes.modal.titleOptional")}
                </Text>
                <TextInput
                  style={[styles.textInput, { height: 50 }]}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  placeholder={t("jobDetails.notes.modal.titlePlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>
                  {t("jobDetails.notes.modal.cancel")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                  (isSubmitting || !noteContent.trim()) &&
                    styles.submitButtonDisabled,
                ]}
                disabled={isSubmitting || !noteContent.trim()}
              >
                <Text
                  style={[
                    styles.submitText,
                    (isSubmitting || !noteContent.trim()) &&
                      styles.submitTextDisabled,
                  ]}
                >
                  {isSubmitting
                    ? t("jobDetails.notes.modal.submitting")
                    : t("jobDetails.notes.modal.submit")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ImprovedNoteModal;
