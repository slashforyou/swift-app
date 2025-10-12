/**
 * ImprovedNoteModal - Modal amélioré pour l'ajout de notes avec types de problème
 */
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    Pressable, 
    TextInput,
    Alert,
    StyleSheet,
    ScrollView 
} from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import Ionicons from '@react-native-vector-icons/ionicons';

interface NoteType {
    id: 'general' | 'important' | 'client' | 'internal';
    label: string;
    description: string;
    icon: string;
    color: string;
}

interface ImprovedNoteModalProps {
    isVisible: boolean;
    onClose: () => void;
    onAddNote: (content: string, type: 'general' | 'important' | 'client' | 'internal') => Promise<void>;
    jobId: string;
}

const ImprovedNoteModal: React.FC<ImprovedNoteModalProps> = ({
    isVisible,
    onClose,
    onAddNote,
    jobId
}) => {
    const { colors } = useTheme();
    const [noteContent, setNoteContent] = useState('');
    const [selectedType, setSelectedType] = useState<'general' | 'important' | 'client' | 'internal'>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Types de notes avec problèmes spécifiques (adaptés aux types API)
    const noteTypes: NoteType[] = [
        {
            id: 'general',
            label: 'Note générale',
            description: 'Information générale sur le job',
            icon: 'document-text',
            color: colors.tint,
        },
        {
            id: 'important',
            label: 'Important',
            description: 'Information importante à retenir',
            icon: 'alert-circle',
            color: colors.warning,
        },
        {
            id: 'client',
            label: 'Note client',
            description: 'Information concernant le client',
            icon: 'person',
            color: colors.success,
        },
        {
            id: 'internal',
            label: 'Note interne',
            description: 'Note interne pour l\'équipe',
            icon: 'shield',
            color: '#8B5CF6',
        },
    ];

    const handleSubmit = async () => {
        if (!noteContent.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir le contenu de la note.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onAddNote(noteContent.trim(), selectedType);
            
            // Reset form
            setNoteContent('');
            setSelectedType('general');
            onClose();
            
            // Toast de succès (à implémenter)
            Alert.alert('Succès', 'Note ajoutée avec succès !');
        } catch (error) {
            console.error('Error adding note:', error);
            Alert.alert('Erreur', 'Impossible d\'ajouter la note. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTypeData = noteTypes.find(type => type.id === selectedType);

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
            borderTopRightRadius: DESIGN_TOKENS.radius.lg,
            borderBottomLeftRadius: DESIGN_TOKENS.radius.lg,
            borderBottomRightRadius: DESIGN_TOKENS.radius.lg,
            maxHeight: '90%',
            paddingTop: DESIGN_TOKENS.spacing.md,
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        content: {
            padding: DESIGN_TOKENS.spacing.lg,
        },
        header: {
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        headerIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.tint + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        title: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: DESIGN_TOKENS.spacing.xs,
        },
        section: {
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        typeGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: DESIGN_TOKENS.spacing.sm,
        },
        typeButton: {
            flex: 1,
            minWidth: '45%',
            maxWidth: '48%',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 2,
            borderColor: colors.border,
            alignItems: 'center',
        },
        typeButtonSelected: {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.primary,
        },
        typeIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        typeLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
        },
        typeDescription: {
            fontSize: 11,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 2,
        },
        textInput: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            fontSize: 16,
            color: colors.text,
            minHeight: 120,
            textAlignVertical: 'top',
            borderWidth: 1,
            borderColor: colors.border,
        },
        selectedTypeInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        selectedTypeIcon: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: DESIGN_TOKENS.spacing.sm,
        },
        selectedTypeText: {
            flex: 1,
        },
        selectedTypeLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        selectedTypeDesc: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        buttonContainer: {
            flexDirection: 'row',
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
            alignItems: 'center',
        },
        cancelButtonPressed: {
            backgroundColor: colors.backgroundSecondary,
        },
        cancelText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        submitButton: {
            flex: 2,
            padding: DESIGN_TOKENS.spacing.lg,
            borderRadius: DESIGN_TOKENS.radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
        },
        submitButtonPressed: {
            backgroundColor: colors.primary + 'DD',
        },
        submitButtonDisabled: {
            backgroundColor: colors.border,
        },
        submitText: {
            fontSize: 16,
            fontWeight: '700',
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
                <Pressable onPress={e => e.stopPropagation()}>
                    <View style={styles.container}>
                        {/* Handle */}
                        <View style={styles.handle} />
                        
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerIcon}>
                                    <Ionicons name="create" size={28} color={colors.tint} />
                                </View>
                                <Text style={styles.title}>Ajouter une Note</Text>
                                <Text style={styles.subtitle}>
                                    Sélectionnez le type et rédigez votre note
                                </Text>
                            </View>

                            {/* Type Selection */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Type de note</Text>
                                <View style={styles.typeGrid}>
                                    {noteTypes.map((type) => (
                                        <Pressable
                                            key={type.id}
                                            onPress={() => setSelectedType(type.id)}
                                            style={[
                                                styles.typeButton,
                                                selectedType === type.id && styles.typeButtonSelected,
                                            ]}
                                        >
                                            <View style={[
                                                styles.typeIcon,
                                                { backgroundColor: type.color + '20' }
                                            ]}>
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
                            </View>

                            {/* Selected Type Info */}
                            {selectedTypeData && (
                                <View style={styles.selectedTypeInfo}>
                                    <View style={[
                                        styles.selectedTypeIcon,
                                        { backgroundColor: selectedTypeData.color + '20' }
                                    ]}>
                                        <Ionicons 
                                            name={selectedTypeData.icon as any} 
                                            size={16} 
                                            color={selectedTypeData.color} 
                                        />
                                    </View>
                                    <View style={styles.selectedTypeText}>
                                        <Text style={styles.selectedTypeLabel}>
                                            {selectedTypeData.label}
                                        </Text>
                                        <Text style={styles.selectedTypeDesc}>
                                            {selectedTypeData.description}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Note Content */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Contenu de la note</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={noteContent}
                                    onChangeText={setNoteContent}
                                    placeholder="Décrivez la situation, le problème ou l'information à noter..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    autoFocus
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
                                <Text style={styles.cancelText}>Annuler</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleSubmit}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    pressed && styles.submitButtonPressed,
                                    (isSubmitting || !noteContent.trim()) && styles.submitButtonDisabled,
                                ]}
                                disabled={isSubmitting || !noteContent.trim()}
                            >
                                <Text style={[
                                    styles.submitText,
                                    (isSubmitting || !noteContent.trim()) && styles.submitTextDisabled,
                                ]}>
                                    {isSubmitting ? 'Enregistrement...' : 'Ajouter la Note'}
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