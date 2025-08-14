// Note Page for Job Details, displaying notes and alerts related to the job.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobNoteItem from '@/src/components/ui/jobPage/jobNoteItem';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const JobNote = ({ job, setJob }: { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
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
            width: '100%',
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        jobDetailsPageTitleText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333',
        },
        jobDetailsPageNoteText: {
            fontSize: 16,
            marginBottom: 10,
        },
        jobDetailsPageNotesZone: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
            width: '100%',
            borderRadius: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        jobDetailsPageNotesZoneContainerScroll: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
    };

    console.log("Job Note Component Rendered", job.notes);

    return (
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Job Notes">
                {job && job.notes && job.notes.length > 0 ? (
                    job.notes.map((note: any, index: number) => (
                        <JobNoteItem key={index} note={note} />
                    ))
                ) : (
                    <Text style={Style.jobDetailsPageNoteText}> No notes available.</Text>
                )}
            </JobContainerWithTitle>
        </JobPageScrollContainer>
    );
};

export default JobNote;