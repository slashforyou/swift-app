/**
 * TruckDetailsSection - Section modulaire pour les détails du camion
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';

interface TruckDetailsSectionProps {
    job: any;
}

const TruckDetailsSection: React.FC<TruckDetailsSectionProps> = ({ job }) => {
    const { colors } = useTheme();

    return (
        <SectionCard level="tertiary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Truck Information
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Vehicle assigned to this job
                </Text>
            </View>

            <View>
                {/* License Plate */}
                <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: '500',
                        marginBottom: DESIGN_TOKENS.spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        License Plate
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: '500',
                    }}>
                        🚚 {job.truck.licensePlate}
                    </Text>
                </View>

                {/* Truck Name */}
                <View>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: '500',
                        marginBottom: DESIGN_TOKENS.spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        Truck Name
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: '500',
                    }}>
                        🚛 {job.truck.name}
                    </Text>
                </View>
            </View>
        </SectionCard>
    );
};

export default TruckDetailsSection;