import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useThemedStyles, useThemeColors } from '../../../../hooks/useThemeColor';

const createStyles = (colors: any) => StyleSheet.create({
    jobNote: {
        width: '95%',
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    jobNoteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 5,
        display: 'flex',
        flexDirection: 'row',
        borderBottomWidth: 1,
        width: '100%',
        padding: 10,
    },
    jobNoteIcon: {
        marginRight: 10,
    },
    jobNoteContent: {
        fontSize: 16,
        color: colors.textSecondary,
        padding: 10,
    },
});

const JobNoteItem = ({ note }: { note: any }) => {
    const colors = useThemeColors();
    const styles = useThemedStyles(createStyles);

    const noteTypes = [
        { name: "Classic", color: colors.backgroundSecondary, borderColor: colors.textSecondary, icon: "document-text" },
        { name: "Info", color: colors.info, borderColor: colors.primary, icon: "information-circle" },
        { name: "Warning", color: colors.warning, borderColor: colors.primary, icon: "warning" },
        { name: "Error", color: colors.error, borderColor: colors.primary, icon: "alert-circle" },
        { name: "Success", color: colors.success, borderColor: colors.primary, icon: "checkmark-circle" },
    ]

    return (
        <View style={{ ...styles.jobNote, backgroundColor: noteTypes[note.type].color, borderColor: noteTypes[note.type].borderColor }}>
            <Text style={{ ...styles.jobNoteTitle, borderBottomColor: noteTypes[note.type].borderColor }}>
                <Ionicons name={noteTypes[note.type].icon as any} size={24} color={colors.text} style={styles.jobNoteIcon} />
                {note.title}
            </Text>
            <Text style={styles.jobNoteContent}>{note.content}</Text>
        </View>
    );
}

export default JobNoteItem;