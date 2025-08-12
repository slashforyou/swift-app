import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';



const JobNoteItem = ({ note }: { note: any }) => {

    const Style = {
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
            shadowColor: '#000',
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
            color: '#333',
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
            color: '#555',
            padding: 10,
        },
    };

    const noteTypes = [
        { name: "Classic", color: "#f0f0f0", borderColor: "#ccc", icon: "document-text" },
        { name: "Info", color: "#d1ecf1", borderColor: "#bee5eb", icon: "information-circle" },
        { name: "Warning", color: "#fff3cd", borderColor: "#ffeeba", icon: "warning" },
        { name: "Error", color: "#f8d7da", borderColor: "#f5c6cb", icon: "alert-circle" },
        { name: "Success", color: "#d4edda", borderColor: "#c3e6cb", icon: "checkmark-circle" },
    ]

    return (
        <View style={{ ...Style.jobNote, backgroundColor: noteTypes[note.type].color, borderColor: noteTypes[note.type].borderColor }}>
            <Text style={{ ...Style.jobNoteTitle, borderBottomColor: noteTypes[note.type].borderColor }}>
                <Ionicons name={noteTypes[note.type].icon} size={24} color="#333" style={Style.jobNoteIcon} />
                {note.title}
            </Text>
            <Text style={Style.jobNoteContent}>{note.content}</Text>
        </View>
    );
}

export default JobNoteItem;