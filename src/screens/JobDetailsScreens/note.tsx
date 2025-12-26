/**
 * Notes Page - Gestion des notes avec interface moderne
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ImprovedNoteModal from '../../components/jobDetails/modals/ImprovedNoteModal';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useToast } from '../../context/ToastProvider';
import { useJobNotes } from '../../hooks/useJobNotes';

interface JobNoteProps {
  job: any;
  setJob: React.Dispatch<React.SetStateAction<any>>;
}

const JobNote: React.FC<JobNoteProps> = ({ job, setJob }) => {
    const { colors } = useTheme();
    const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    
    // Hooks pour la gestion des notes
    const { notes, isLoading, addNote, refetch } = useJobNotes(job?.id);
    const { showSuccess, showError } = useToast();

    // Gestion des notes avec API - nouvelle structure
    const handleAddNote = async (content: string, note_type: 'general' | 'important' | 'client' | 'internal' = 'general', title?: string) => {
        try {
            const result = await addNote({ 
                title: title || `Note du ${new Date().toLocaleDateString()}`,
                content, 
                note_type 
            });
            if (result) {
                showSuccess('Note ajoutée', 'La note a été enregistrée avec succès');
                await refetch(); // Actualiser la liste des notes
                return Promise.resolve();
            } else {
                throw new Error('Échec de l\'ajout de la note');
            }
        } catch (error) {
            console.error('Error adding note:', error);
            showError('Erreur', 'Impossible d\'ajouter la note. Veuillez réessayer.');
            throw error;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            
            if (diffHours < 1) return "À l'instant";
            if (diffHours < 24) return `Il y a ${diffHours}h`;
            if (diffHours < 48) return "Hier";
            return date.toLocaleDateString('fr-FR');
        } catch (e) {
            return "Récemment";
        }
    };

    const getNoteTypeInfo = (type: string) => {
        const types = {
            'general': { icon: 'document-text', color: colors.tint, label: 'Générale' },
            'important': { icon: 'alert-circle', color: '#F59E0B', label: 'Important' },
            'client': { icon: 'person', color: '#10B981', label: 'Client' },
            'internal': { icon: 'shield', color: '#8B5CF6', label: 'Interne' }
        };
        return types[type as keyof typeof types] || types.general;
    };

    if (isLoading) {
        return (
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: DESIGN_TOKENS.spacing.xl 
            }}>
                <Text style={{ 
                    fontSize: 16, 
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.md 
                }}>
                    Chargement des notes...
                </Text>
            </View>
        );
    }

    return (
        <>
            {/* Modal de création de note */}
            <ImprovedNoteModal
                isVisible={isNoteModalVisible}
                onClose={() => setIsNoteModalVisible(false)}
                onAddNote={handleAddNote}
                jobId={job?.id}
            />

            <ScrollView 
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.md }}
            >
                {/* Message informatif si en mode local */}
                {notes.length > 0 && notes.some(note => note.id.startsWith('local-')) && (
                    <View style={{
                        backgroundColor: colors.tint + '10',
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        padding: DESIGN_TOKENS.spacing.md,
                        marginBottom: DESIGN_TOKENS.spacing.lg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: DESIGN_TOKENS.spacing.sm,
                    }}>
                        <Ionicons name="information-circle" size={20} color={colors.tint} />
                        <Text style={{
                            fontSize: 14,
                            color: colors.tint,
                            flex: 1,
                        }}>
                            Certaines notes sont sauvegardées localement et seront synchronisées plus tard.
                        </Text>
                    </View>
                )}

                {/* Header avec bouton d'ajout */}
                <View style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 22,
                                fontWeight: '700',
                                color: colors.text,
                                marginBottom: DESIGN_TOKENS.spacing.xs,
                            }}>
                                Notes du Job
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                            }}>
                                {notes.length} note{notes.length !== 1 ? 's' : ''}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setIsNoteModalVisible(true)}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.tint + 'DD' : colors.tint,
                                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.xs,
                            })}
                        >
                            <Ionicons name="add" size={18} color={colors.background} />
                            <Text style={{
                                color: colors.background,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                Ajouter
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Liste des notes */}
                {notes.length > 0 ? (
                    <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
                        {notes.map((note) => {
                            const typeInfo = getNoteTypeInfo(note.note_type || 'general');
                            const isLocalNote = note.id.startsWith('local-');
                            
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
                                    }}
                                >
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        gap: DESIGN_TOKENS.spacing.sm,
                                        marginBottom: DESIGN_TOKENS.spacing.sm,
                                    }}>
                                        <View style={{
                                            backgroundColor: typeInfo.color + '20',
                                            borderRadius: 16,
                                            width: 32,
                                            height: 32,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Ionicons 
                                                name={typeInfo.icon as any} 
                                                size={16} 
                                                color={typeInfo.color} 
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: DESIGN_TOKENS.spacing.xs,
                                            }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={{
                                                        fontSize: 12,
                                                        fontWeight: '600',
                                                        color: typeInfo.color,
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        {typeInfo.label}
                                                    </Text>
                                                    {isLocalNote && (
                                                        <View style={{
                                                            backgroundColor: colors.tint + '20',
                                                            borderRadius: 8,
                                                            paddingHorizontal: 6,
                                                            paddingVertical: 2,
                                                        }}>
                                                            <Text style={{
                                                                fontSize: 10,
                                                                fontWeight: '600',
                                                                color: colors.tint,
                                                            }}>
                                                                LOCAL
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{
                                                    fontSize: 12,
                                                    color: colors.textSecondary,
                                                }}>
                                                    {formatDate(note.created_at)}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontSize: 15,
                                                lineHeight: 22,
                                                color: colors.text,
                                            }}>
                                                {note.content}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: DESIGN_TOKENS.spacing.xxl,
                    }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: colors.backgroundSecondary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.lg,
                        }}>
                            <Ionicons 
                                name="document-text-outline" 
                                size={32} 
                                color={colors.textSecondary} 
                            />
                        </View>
                        
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: colors.text,
                            textAlign: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.sm,
                        }}>
                            Aucune note
                        </Text>
                        
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                            textAlign: 'center',
                            maxWidth: 250,
                            marginBottom: DESIGN_TOKENS.spacing.xl,
                        }}>
                            Commencez à documenter les informations importantes de ce job
                        </Text>

                        <Pressable
                            onPress={() => setIsNoteModalVisible(true)}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.tint + 'DD' : colors.tint,
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.sm,
                            })}
                        >
                            <Ionicons name="add" size={20} color={colors.background} />
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.background,
                            }}>
                                Ajouter la première note
                            </Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </>
    );
};



export default JobNote;
