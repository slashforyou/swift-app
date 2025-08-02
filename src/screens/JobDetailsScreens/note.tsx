// Note Page for Job Details, displaying notes and alerts related to the job.
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const JobNote = ({ job }: { job: any }) => {
    const Style = {
        jobDetailsPage: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
        },
        jobDetailsPageContainerScroll: {
            padding: 20,
        },
        jobDetailsPageTitle: {
            marginBottom: 20,
        },
        jobDetailsPageTitleText: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        jobDetailsPageNoteText: {
            fontSize: 16,
            marginBottom: 10,
        },
    };

    return (
        <View style={Style.jobDetailsPage}>
            <ScrollView contentContainerStyle={Style.jobDetailsPageContainerScroll}>
                <View style={Style.jobDetailsPageTitle}>
                    <Text style={Style.jobDetailsPageTitleText}>Job Notes</Text>
                </View>
                <Text style={Style.jobDetailsPageNoteText}>{job.note || "No notes available."}</Text>
            </ScrollView>
        </View>
    );
};

export default JobNote;