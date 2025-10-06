/**
 * Notes Page - Gestion interactive des notes avec actions CRUD
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import Ionicons from '@react-native-vector-icons/ionicons';

interface JobNoteProps {
    job: any;
    setJob: React.Dispatch<React.SetStateAction<any>>;
}

interface NoteItemProps {
    note: any;
    onEdit: (note: any) => void;
    onDelete: (noteId: number) => void;
    onToggleRead: (noteId: number) => void;
}

// Types de notes avec couleurs et icônes
const NOTE_TYPES = [
    { 
        id: 0, 
        name: "Classic", 
        color: Colors.light.backgroundTertiary, 
        borderColor: Colors.light.border, 
        textColor: Colors.light.text,
        icon: "document-text" 
    },
    { 
        id: 1, 
        name: "Info", 
        color: Colors.light.backgroundTertiary, 
        borderColor: Colors.light.tint, 
        textColor: Colors.light.tint,
        icon: "information-circle" 
    },
    { 
        id: 2, 
        name: "Warning", 
        color: '#FFF3CD', 
        borderColor: '#F0AD4E', 
        textColor: '#856404',
        icon: "warning" 
    },
    { 
        id: 3, 
        name: "Error", 
        color: '#F8D7DA', 
        borderColor: '#DC3545', 
        textColor: '#721C24',
        icon: "alert-circle" 
    },
    { 
        id: 4, 
        name: "Success", 
        color: '#D4EDDA', 
        borderColor: '#28A745', 
        textColor: '#155724',
        icon: "checkmark-circle" 
    },
];

// Composant Note Item moderne avec interactions
const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete, onToggleRead }) => {
    const [expanded, setExpanded] = useState(false);
    const noteType = NOTE_TYPES[note.type] || NOTE_TYPES[0];

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
                            color: Colors.light.text,
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
                                    ? Colors.light.backgroundSecondary 
                                    : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                                minHeight: DESIGN_TOKENS.touch.minSize * 0.8,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Edit note"
                        >
                            <Ionicons name="create" size={16} color={Colors.light.tint} />
                            <Text style={{ 
                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                color: Colors.light.tint 
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
};

const JobNote: React.FC<JobNoteProps> = ({ job, setJob }) => {
    const [filter, setFilter] = useState<number | null>(null);

    const handleAddNote = () => {
        Alert.alert("Add Note", "Feature coming soon! You'll be able to add notes here.");
    };

    const handleEditNote = (note: any) => {
        Alert.alert("Edit Note", `Feature coming soon! You'll be able to edit "${note.title}" here.`);
    };

    const handleDeleteNote = (noteId: number) => {
        const updatedJob = {
            ...job,
            notes: job.notes.filter((note: any) => note.id !== noteId)
        };
        setJob(updatedJob);
    };

    const handleToggleRead = (noteId: number) => {
        // Future feature: mark as read/unread
        console.log("Toggle read status for note:", noteId);
    };

    const filteredNotes = filter !== null 
        ? job.notes?.filter((note: any) => note.type === filter) || []
        : job.notes || [];

    return (
        <VStack gap="lg">
                {/* Header avec actions */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <HStack gap="md" align="center" justify="space-between">
                        <VStack gap="xs">
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: Colors.light.text,
                                }}
                            >
                                Job Notes
                            </Text>
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                    color: Colors.light.textSecondary,
                                }}
                            >
                                {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
                                {filter !== null && ` (${NOTE_TYPES[filter]?.name})`}
                            </Text>
                        </VStack>
                        
                        <Pressable
                            onPress={handleAddNote}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                backgroundColor: pressed 
                                    ? Colors.light.backgroundSecondary
                                    : Colors.light.tint,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                minHeight: DESIGN_TOKENS.touch.minSize,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Add new note"
                        >
                            <Ionicons name="add" size={16} color={Colors.light.background} />
                            <Text style={{ 
                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                fontWeight: '500',
                                color: Colors.light.background 
                            }}>
                                Add Note
                            </Text>
                        </Pressable>
                    </HStack>
                </Card>

                {/* Filtres par type */}
                {job.notes && job.notes.length > 1 && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                fontWeight: '500',
                                color: Colors.light.textSecondary,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            Filter by type
                        </Text>
                        <HStack gap="sm" style={{ flexWrap: 'wrap' }}>
                            <Pressable
                                onPress={() => setFilter(null)}
                                style={({ pressed }) => ({
                                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                    backgroundColor: filter === null 
                                        ? Colors.light.tint 
                                        : (pressed ? Colors.light.backgroundSecondary : Colors.light.backgroundTertiary),
                                    borderRadius: DESIGN_TOKENS.radius.sm,
                                })}
                            >
                                <Text style={{
                                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                    color: filter === null ? Colors.light.background : Colors.light.text,
                                }}>
                                    All
                                </Text>
                            </Pressable>
                            
                            {NOTE_TYPES.map(type => {
                                const count = job.notes?.filter((note: any) => note.type === type.id).length || 0;
                                if (count === 0) return null;
                                
                                return (
                                    <Pressable
                                        key={type.id}
                                        onPress={() => setFilter(filter === type.id ? null : type.id)}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: DESIGN_TOKENS.spacing.xs,
                                            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                            backgroundColor: filter === type.id 
                                                ? type.borderColor 
                                                : (pressed ? Colors.light.backgroundSecondary : Colors.light.backgroundTertiary),
                                            borderRadius: DESIGN_TOKENS.radius.sm,
                                        })}
                                    >
                                        <Ionicons 
                                            name={type.icon as any} 
                                            size={12} 
                                            color={filter === type.id ? Colors.light.background : type.textColor}
                                            style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
                                        />
                                        <Text style={{
                                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                            color: filter === type.id ? Colors.light.background : Colors.light.text,
                                        }}>
                                            {type.name} ({count})
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </HStack>
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
                    /* Empty State */
                    <Card style={{ 
                        padding: DESIGN_TOKENS.spacing.xl,
                        alignItems: 'center'
                    }}>
                        <Ionicons 
                            name="document-text-outline" 
                            size={48} 
                            color={Colors.light.textSecondary}
                            style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}
                        />
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                fontWeight: '500',
                                color: Colors.light.text,
                                textAlign: 'center',
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            {filter !== null ? `No ${NOTE_TYPES[filter]?.name} notes` : 'No notes yet'}
                        </Text>
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                color: Colors.light.textSecondary,
                                textAlign: 'center',
                                marginBottom: DESIGN_TOKENS.spacing.lg,
                            }}
                        >
                            {filter !== null 
                                ? `No notes of type "${NOTE_TYPES[filter]?.name}" found.`
                                : 'Add your first note to keep track of important job information.'
                            }
                        </Text>
                        <Pressable
                            onPress={() => filter !== null ? setFilter(null) : handleAddNote()}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                backgroundColor: pressed 
                                    ? Colors.light.backgroundSecondary
                                    : Colors.light.tint,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                minHeight: DESIGN_TOKENS.touch.minSize,
                            })}
                        >
                            <Ionicons 
                                name={filter !== null ? "eye" : "add"} 
                                size={16} 
                                color={Colors.light.background} 
                            />
                            <Text style={{ 
                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                fontWeight: '500',
                                color: Colors.light.background 
                            }}>
                                {filter !== null ? 'Show All Notes' : 'Add First Note'}
                            </Text>
                        </Pressable>
                    </Card>
                )}
        </VStack>
    );
};

export default JobNote;