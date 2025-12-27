/**
 * AddressesSection - Section modulaire pour les adresses
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import openMap from '../../../services/openMap';
import SectionCard from '../SectionCard';

interface AddressesSectionProps {
    job: any;
}

const AddressesSection: React.FC<AddressesSectionProps> = ({ job }) => {
    const { colors } = useTheme();

    const getAddressTypeLabel = (type: string) => {
        switch (type) {
            case 'pickup': return 'Pickup Location';
            case 'dropoff': return 'Dropoff Location';
            case 'intermediate': return 'Intermediate Stop';
            default: return 'Location';
        }
    };

    const getAddressEmoji = (type: string) => {
        switch (type) {
            case 'pickup': return '📍';
            case 'dropoff': return '🎯';
            case 'intermediate': return '⭐';
            default: return '📍';
        }
    };

    return (
        <SectionCard level="secondary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Job Locations
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    All addresses associated with this job
                </Text>
            </View>

            {Array.isArray(job.addresses) && job.addresses.length > 0 ? (
                <View>
                    {job.addresses.map((address: any, index: number) => (
                        <Pressable 
                            key={address.id || `${address.street}-${index}`}
                            onPress={() => openMap(address.street, address.latitude, address.longitude)}
                            style={{
                                padding: DESIGN_TOKENS.spacing.md,
                                backgroundColor: colors.backgroundTertiary,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                borderWidth: 1,
                                borderColor: colors.border + '60',
                                marginBottom: index < job.addresses.length - 1 ? DESIGN_TOKENS.spacing.sm : 0,
                            }}
                            hitSlop={{
                                top: DESIGN_TOKENS.touch.hitSlop,
                                bottom: DESIGN_TOKENS.touch.hitSlop,
                                left: DESIGN_TOKENS.touch.hitSlop,
                                right: DESIGN_TOKENS.touch.hitSlop,
                            }}
                        >
                            <View>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: DESIGN_TOKENS.spacing.xs,
                                }}>
                                    <Text style={{ fontSize: 16, marginRight: DESIGN_TOKENS.spacing.xs }}>
                                        {getAddressEmoji(address.type)}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: colors.textSecondary,
                                        fontWeight: '500',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}>
                                        {getAddressTypeLabel(address.type)}
                                    </Text>
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    color: colors.text,
                                    fontWeight: '500',
                                    lineHeight: 22,
                                }}>
                                    {address.street}, {address.city}, {address.state} {address.zip}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            ) : (
                <View style={{
                    padding: DESIGN_TOKENS.spacing.lg,
                    backgroundColor: colors.backgroundTertiary,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    alignItems: 'center',
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: colors.textMuted,
                        textAlign: 'center',
                    }}>
                        No addresses available for this job
                    </Text>
                </View>
            )}
        </SectionCard>
    );
};

export default AddressesSection;