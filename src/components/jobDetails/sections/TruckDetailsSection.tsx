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
                    🚛 Informations Véhicule
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Véhicule assigné à cette mission
                </Text>
            </View>

            <View style={{
                backgroundColor: colors.backgroundTertiary,
                borderRadius: 12,
                padding: DESIGN_TOKENS.spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
            }}>
                {/* Header avec icône camion */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    paddingBottom: DESIGN_TOKENS.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: DESIGN_TOKENS.spacing.md,
                    }}>
                        <Text style={{ fontSize: 20 }}>🚚</Text>
                    </View>
                    <View>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text,
                        }}>
                            {job.truck.name}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                        }}>
                            Véhicule principal
                        </Text>
                    </View>
                </View>

                {/* Informations détaillées */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                            fontWeight: '500',
                            marginBottom: 4,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            🏷️ Plaque d'immatriculation
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: colors.text,
                            fontWeight: '600',
                            backgroundColor: colors.background,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            textAlign: 'center',
                        }}>
                            {job.truck.licensePlate}
                        </Text>
                    </View>
                </View>
            </View>
        </SectionCard>
    );
};

export default TruckDetailsSection;