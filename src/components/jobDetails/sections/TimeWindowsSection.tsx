/**
 * TimeWindowsSection - Section modulaire pour les créneaux horaires
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';

interface TimeWindowsSectionProps {
    job: any;
}

const TimeWindowsSection: React.FC<TimeWindowsSectionProps> = ({ job }) => {
    const { colors } = useTheme();

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <SectionCard level="tertiary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Time Windows
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Scheduled time slots for this job
                </Text>
            </View>

            <View>
                {/* Start Window */}
                <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: '500',
                        marginBottom: DESIGN_TOKENS.spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        Start Window
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: '500',
                    }}>
                        🕐 {formatDateTime(job.time.startWindowStart)} - {formatDateTime(job.time.startWindowEnd)}
                    </Text>
                </View>

                {/* End Window */}
                <View>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: '500',
                        marginBottom: DESIGN_TOKENS.spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        End Window
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: '500',
                    }}>
                        🕐 {formatDateTime(job.time.endWindowStart)} - {formatDateTime(job.time.endWindowEnd)}
                    </Text>
                </View>
            </View>
        </SectionCard>
    );
};

export default TimeWindowsSection;