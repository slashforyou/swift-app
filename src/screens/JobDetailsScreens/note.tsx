/**
 * Notes Page - Gestion interactive des notes avec actions CRUD
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import Ionicons from '@react-native-vector-icons/ionicons';

// Types stricts
export enum NoteType {
  CLASSIC = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  SUCCESS = 4
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  createdAt: string;
  updatedAt?: string;
  isRead?: boolean;
}

export interface Job {
  id: string;
  notes?: Note[];
  [key: string]: any;
}

interface JobNoteProps {
  job: Job;
  setJob: React.Dispatch<React.SetStateAction<Job>>;
  notes?: Note[];
  onAddNote?: (noteData: { content: string; type: string }) => Promise<void>;
}

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleRead: (noteId: string) => void;
}

interface NoteTypeConfig {
  id: NoteType;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

// Configuration des types de notes (constante pour éviter les recréations)
const NOTE_TYPES_CONFIG = [
  { 
    id: NoteType.CLASSIC, 
    name: "Classic", 
    icon: "document-text" 
  },
  { 
    id: NoteType.INFO, 
    name: "Info", 
    icon: "information-circle" 
  },
  { 
    id: NoteType.WARNING, 
    name: "Warning", 
    icon: "warning" 
  },
  { 
    id: NoteType.ERROR, 
    name: "Error", 
    icon: "alert-circle" 
  },
  { 
    id: NoteType.SUCCESS, 
    name: "Success", 
    icon: "checkmark-circle" 
  },
] as const;

// Fonction memoizée pour générer les couleurs
const getNoteTypes = (colors: any): NoteTypeConfig[] => [
  { 
    ...NOTE_TYPES_CONFIG[0],
    color: colors.backgroundTertiary, 
    borderColor: colors.border, 
    textColor: colors.text,
  },
  { 
    ...NOTE_TYPES_CONFIG[1],
    color: colors.backgroundTertiary, 
    borderColor: colors.tint, 
    textColor: colors.tint,
  },
  { 
    ...NOTE_TYPES_CONFIG[2],
    color: '#FFF3CD', 
    borderColor: '#F0AD4E', 
    textColor: '#856404',
  },
  { 
    ...NOTE_TYPES_CONFIG[3],
    color: '#F8D7DA', 
    borderColor: '#DC3545', 
    textColor: '#721C24',
  },
  { 
    ...NOTE_TYPES_CONFIG[4],
    color: '#D4EDDA', 
    borderColor: '#28A745', 
    textColor: '#155724',
  },
];

// Composant Note Item moderne avec interactions (memoizé pour performance)
const NoteItem: React.FC<NoteItemProps> = React.memo(({ note, onEdit, onDelete, onToggleRead }) => {
    const { colors } = useCommonThemedStyles();
    const [expanded, setExpanded] = useState(false);
    
    // Memoization des types de notes
    const NOTE_TYPES = useMemo(() => getNoteTypes(colors), [colors]);
    const noteType = useMemo(() => NOTE_TYPES[note.type] || NOTE_TYPES[NoteType.CLASSIC], [NOTE_TYPES, note.type]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            
            if (diffHours < 1) return "Just now";
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffHours < 48) return "Yesterday";
            return date.toLocaleDateString();
        } catch {
            return "Recently";
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(note.id) }
            ]
        );
    };

    return (
        <Card style={{ 
            backgroundColor: noteType.color,
            borderWidth: 1,
            borderColor: noteType.borderColor,
            padding: 0,
            overflow: 'hidden'
        }}>
            {/* Header cliquable */}
            <Pressable
                onPress={() => setExpanded(!expanded)}
                hitSlop={DESIGN_TOKENS.touch.hitSlop}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
                    padding: DESIGN_TOKENS.spacing.lg,
                    minHeight: DESIGN_TOKENS.touch.minSize,
                })}
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} note: ${note.title}`}
                accessibilityState={{ expanded }}
            >
                <HStack gap="md" align="center" justify="space-between">
                    <HStack gap="sm" align="center" style={{ flex: 1 }}>
                        <Ionicons 
                            name={noteType.icon as any} 
                            size={20} 
                            color={noteType.textColor}
                        />
                        <VStack gap="xs" style={{ flex: 1 }}>
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                    fontWeight: '600',
                                    color: noteType.textColor,
                                }}
                                numberOfLines={expanded ? undefined : 1}
                            >
                                {note.title}
                            </Text>
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                    color: noteType.textColor,
                                    opacity: 0.7,
                                }}
                            >
                                {formatDate(note.createdAt)}
                            </Text>
                        </VStack>
                    </HStack>
                    
                    <Ionicons 
                        name={expanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={noteType.textColor}
                        style={{ opacity: 0.7 }}
                    />
                </HStack>
            </Pressable>

            {/* Contenu expansible */}
            {expanded && (
                <VStack gap="md" style={{ 
                    padding: DESIGN_TOKENS.spacing.lg,
                    paddingTop: 0,
                    borderTopWidth: 1,
                    borderTopColor: noteType.borderColor,
                    backgroundColor: 'rgba(255,255,255,0.3)'
                }}>
                    <Text 
                        style={{
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                            color: colors.text,
                        }}
                    >
                        {note.content}
                    </Text>
                    
                    {/* Actions */}
                    <HStack gap="sm" justify="flex-end">
                        <Pressable
                            onPress={() => onEdit(note)}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: DESIGN_TOKENS.spacing.xs,
                                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                backgroundColor: pressed 
                                    ? colors.backgroundSecondary 
                                    : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                                minHeight: DESIGN_TOKENS.touch.minSize * 0.8,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Edit note"
                        >
                            <Ionicons name="create" size={16} color={colors.tint} />
                            <Text style={{ 
                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                color: colors.tint 
                            }}>
                                Edit
                            </Text>
                        </Pressable>
                        
                        <Pressable
                            onPress={handleDelete}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: DESIGN_TOKENS.spacing.xs,
                                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                backgroundColor: pressed 
                                    ? 'rgba(220, 53, 69, 0.1)' 
                                    : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                                minHeight: DESIGN_TOKENS.touch.minSize * 0.8,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Delete note"
                        >
                            <Ionicons name="trash" size={16} color="#DC3545" />
                            <Text style={{ 
                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                color: '#DC3545' 
                            }}>
                                Delete
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
            )}
        </Card>
    );
});

const JobNote: React.FC<JobNoteProps> = React.memo(({ job, setJob, notes, onAddNote }) => {
    const { colors } = useCommonThemedStyles();
    const [filter, setFilter] = useState<NoteType | null>(null);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);
    
    // Memoization des types et données
    const NOTE_TYPES = useMemo(() => getNoteTypes(colors), [colors]);
    
    // Utiliser les notes passées en props plutôt que de faire un appel API
    const effectiveNotes = useMemo(() => {
        const notesData = notes || job?.notes || [];

        return notesData;
    }, [notes, job?.notes]);

    // Handler pour changer le filtre avec logging
    const handleFilterChange = useCallback((newFilter: NoteType | null) => {

        setFilter(newFilter);
    }, [filter]);

    const handleAddNote = useCallback(async () => {

        setIsAddingNote(true);
        Alert.prompt(
            "Ajouter une note",
            "Saisissez le contenu de votre note :",
            [
                { 
                    text: "Annuler", 
                    style: "cancel", 
                    onPress: () => {

                        setIsAddingNote(false);
                    }
                },
                {
                    text: "Ajouter",
                    onPress: async (text) => {
                        if (text && text.trim()) {
                            try {

                                // Utiliser le callback fourni par le parent
                                if (onAddNote) {
                                    await onAddNote({ 
                                        content: text.trim(),
                                        type: 'general' 
                                    });
                                }

                                Alert.alert("Succès", "Note ajoutée avec succès !");
                            } catch (error) {

                                Alert.alert("Erreur", "Impossible d'ajouter la note.");
                            }
                        } else {

                        }
                        setIsAddingNote(false);
                    }
                }
            ]
        );
    }, [onAddNote]);

    const handleEditNote = useCallback((note: Note) => {
        Alert.alert("Edit Note", `Feature coming soon! You'll be able to edit "${note.title}" here.`);
    }, []);

    const handleDeleteNote = useCallback(async (noteId: string) => {

        setIsDeletingNote(noteId);
        try {
            // Optimistic update
            const updatedJob = {
                ...job,
                notes: job.notes?.filter((note: Note) => note.id !== noteId) || []
            };
            setJob(updatedJob);

            
            // Ici on pourrait ajouter un appel API si nécessaire
            // await deleteNoteAPI(noteId);
        } catch (error) {

            // Rollback en cas d'erreur
        } finally {
            setIsDeletingNote(null);
        }
    }, [job, setJob]);

    const handleToggleRead = useCallback((noteId: string) => {
        // Future feature: mark as read/unread
        console.log("Toggle read status for note:", noteId);
    }, []);

    // Filtrage optimisé avec memoization
    const filteredNotes = useMemo(() => {
        return filter !== null 
            ? effectiveNotes.filter((note: Note) => note.type === filter)
            : effectiveNotes;
    }, [effectiveNotes, filter]);

    return (
        <VStack gap="lg">
                {/* Header avec actions */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <NoteHeader
                        filteredNotesLength={filteredNotes.length}
                        filter={filter}
                        noteTypes={NOTE_TYPES}
                        onAddNote={handleAddNote}
                        isAddingNote={isAddingNote}
                        colors={colors}
                    />
                </Card>

                {/* Modern Filter System */}
                {effectiveNotes && effectiveNotes.length > 1 && (
                    <Card style={{ paddingVertical: DESIGN_TOKENS.spacing.md }}>
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                fontWeight: '500',
                                color: colors.textSecondary,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            }}
                        >
                            Filter by type
                        </Text>
                        <NoteFilter
                            typeColors={NOTE_TYPES}
                            filter={filter !== null ? filter.toString() : null}
                            onFilterChange={(type) => handleFilterChange(type !== null ? parseInt(type) as NoteType : null)}
                            colors={colors}
                        />
                    </Card>
                )}

                {/* Liste des notes */}
                {filteredNotes.length > 0 ? (
                    <VStack gap="sm">
                        {filteredNotes.map((note: any) => (
                            <NoteItem
                                key={note.id}
                                note={note}
                                onEdit={handleEditNote}
                                onDelete={handleDeleteNote}
                                onToggleRead={handleToggleRead}
                            />
                        ))}
                    </VStack>
                ) : (
                    <EmptyState 
                        onAddNote={() => filter !== null ? handleFilterChange(null) : handleAddNote()}
                        colors={colors}
                        filter={filter}
                    />
                )}
        </VStack>
    );
});

// Extracted Components
const NoteFilter = React.memo<{
    typeColors: any[];
    filter: string | null;
    onFilterChange: (type: string | null) => void;
    colors: any;
}>(({ typeColors, filter, onFilterChange, colors }) => (
    <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            gap: DESIGN_TOKENS.spacing.sm,
        }}
    >
        <Pressable
            onPress={() => onFilterChange(null)}
            style={({ pressed }) => [
                {
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    borderWidth: 1,
                },
                filter === null
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : { 
                        backgroundColor: colors.backgroundSecondary, 
                        borderColor: colors.border 
                    },
                pressed && { opacity: 0.7 }
            ]}
        >
            <Text style={{
                color: filter === null ? colors.background : colors.text,
                fontWeight: '500'
            }}>
                All
            </Text>
        </Pressable>
        {typeColors.map((type, index) => (
            <Pressable
                key={index}
                onPress={() => onFilterChange(index.toString())}
                style={({ pressed }) => [
                    {
                        paddingHorizontal: DESIGN_TOKENS.spacing.md,
                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        borderWidth: 1,
                    },
                    filter === index.toString()
                        ? { backgroundColor: type.borderColor, borderColor: type.borderColor }
                        : { 
                            backgroundColor: type.color, 
                            borderColor: type.borderColor 
                        },
                    pressed && { opacity: 0.7 }
                ]}
            >
                <Text style={{
                    color: filter === index.toString() ? '#FFFFFF' : type.textColor,
                    fontWeight: '500'
                }}>
                    {type.name}
                </Text>
            </Pressable>
        ))}
    </ScrollView>
));

const NoteHeader = React.memo<{ 
    filteredNotesLength: number; 
    filter: NoteType | null; 
    noteTypes: any; 
    onAddNote: () => void; 
    isAddingNote: boolean; 
    colors: any; 
}>(({ filteredNotesLength, filter, noteTypes, onAddNote, isAddingNote, colors }) => (
    <HStack gap="md" align="center" justify="space-between">
        <VStack gap="xs">
            <Text 
                style={{
                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                    color: colors.text,
                }}
            >
                Job Notes
            </Text>
            <Text 
                style={{
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    color: colors.textSecondary,
                }}
            >
                {filteredNotesLength} note{filteredNotesLength !== 1 ? 's' : ''}
                {filter !== null && ` (${noteTypes[filter]?.name})`}
            </Text>
        </VStack>
        
        <Pressable
            onPress={onAddNote}
            disabled={isAddingNote}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                backgroundColor: isAddingNote 
                    ? colors.backgroundSecondary
                    : (pressed 
                        ? colors.backgroundSecondary
                        : colors.tint),
                borderRadius: DESIGN_TOKENS.radius.md,
                opacity: isAddingNote ? 0.6 : 1,
            })}
        >
            <Ionicons 
                name="add" 
                size={16} 
                color={isAddingNote ? colors.textSecondary : colors.background} 
            />
            <Text style={{
                marginLeft: DESIGN_TOKENS.spacing.xs,
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                fontWeight: '600',
                color: isAddingNote ? colors.textSecondary : colors.background,
            }}>
                {isAddingNote ? 'Adding...' : 'Add'}
            </Text>
        </Pressable>
    </HStack>
));

// Animated Components pour UX améliorée
const AnimatedCard = React.memo<{
    children: React.ReactNode;
    onPress?: () => void;
    style?: any;
}>(({ children, onPress, style }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={style}
            >
                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                }}>
                    {children}
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <Animated.View style={[style, {
            transform: [{ scale: scaleAnim }],
        }]}>
            {children}
        </Animated.View>
    );
});

// Loading State Component
const LoadingState = React.memo<{ colors: any }>(({ colors }) => (
    <VStack
        align="center"
        justify="center"
        gap={DESIGN_TOKENS.spacing.md}
        style={{ paddingVertical: DESIGN_TOKENS.spacing.xl }}
    >
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            color: colors.textSecondary,
            textAlign: 'center',
        }}>
            Loading notes...
        </Text>
    </VStack>
));

// Empty State Component
const EmptyState = React.memo<{ 
    onAddNote: () => void; 
    colors: any; 
    filter: NoteType | null;
}>(({ onAddNote, colors, filter }) => (
    <VStack
        align="center"
        justify="center"
        gap={DESIGN_TOKENS.spacing.lg}
        style={{ paddingVertical: DESIGN_TOKENS.spacing.xxl }}
    >
        <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.backgroundSecondary,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Ionicons 
                name="document-text-outline" 
                size={32} 
                color={colors.textSecondary} 
            />
        </View>
        
        <VStack align="center" gap={DESIGN_TOKENS.spacing.sm}>
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                color: colors.text,
                textAlign: 'center',
            }}>
                {filter !== null ? 'No filtered notes' : 'No notes yet'}
            </Text>
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 250,
            }}>
                {filter !== null 
                    ? 'Try changing your filter or add a new note'
                    : 'Start documenting important information about this job'
                }
            </Text>
        </VStack>

        <Pressable
            onPress={onAddNote}
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.tintPressed : colors.tint,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: DESIGN_TOKENS.spacing.sm,
            })}
            accessibilityRole="button"
            accessibilityLabel={filter !== null ? 'Clear filter or add note' : 'Add first note'}
        >
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                fontWeight: '600',
                color: colors.background,
            }}>
                {filter !== null ? 'Add Note' : 'Add First Note'}
            </Text>
        </Pressable>
    </VStack>
));

// Business Logic Service (séparation des responsabilités)
class NoteService {
    static validateNote(content: string): { isValid: boolean; error?: string } {
        if (!content.trim()) {
            return { isValid: false, error: 'Note content cannot be empty' };
        }
        if (content.length > 1000) {
            return { isValid: false, error: 'Note is too long (max 1000 characters)' };
        }
        return { isValid: true };
    }

    static formatNoteDate(createdAt: string): string {
        return new Date(createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    static getTypeConfig(type: string | number, noteTypes: any[]): any {
        const index = typeof type === 'string' ? parseInt(type) : type;
        return noteTypes[index] || noteTypes[0];
    }

    static sortNotesByDate(notes: Note[]): Note[] {
        return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}

export default JobNote;
