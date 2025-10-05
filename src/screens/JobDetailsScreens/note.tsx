// Note Page for Job Details, displaying notes and alerts related to the job.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobNoteItem from '@/src/components/ui/jobPage/jobNoteItem';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import React from 'react';
import { View, Text } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const JobNote = ({ job, setJob }: { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    console.log("Job Note Component Rendered", job.notes);

    return (
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Job Notes">
                {job && job.notes && job.notes.length > 0 ? (
                    job.notes.map((note: any, index: number) => (
                        <JobNoteItem key={index} note={note} />
                    ))
                ) : (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                        <Text style={[commonStyles.textMuted, commonStyles.textCenter]}>
                            No notes available for this job.
                        </Text>
                    </View>
                )}
            </JobContainerWithTitle>
        </JobPageScrollContainer>
    );
};

export default JobNote;