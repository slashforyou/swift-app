/**
 * JobProgressSection - Section modulaire pour la progression du job
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';
import JobTimeLine from '../../ui/jobPage/jobTimeLine';

interface JobProgressSectionProps {
    job: any;
}

const JobProgressSection: React.FC<JobProgressSectionProps> = ({ job }) => {
    const { colors } = useTheme();

    return (
        <SectionCard level="primary" elevated={true}>
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Job Progress
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Track the current status and progress of your job
                </Text>
            </View>
            
            <JobTimeLine job={job} />
        </SectionCard>
    );
};

export default JobProgressSection;