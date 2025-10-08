/**
 * ClientDetailsSection - Section modulaire pour les informations client
 */
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';
import { Button } from '../../ui/Button';
import copyToClipBoard from '../../../services/copyToClipBoard';
import contactLink from '../../../services/contactLink';

interface ClientDetailsSectionProps {
    job: any;
}

const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({ job }) => {
    const { colors } = useTheme();

    return (
        <SectionCard level="secondary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Client Information
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Contact details and client information
                </Text>
            </View>

            {/* Nom du client */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
                <Text style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Client Name
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: '500',
                }}>
                    {job.client.firstName} {job.client.lastName}
                </Text>
            </View>

            {/* Numéro de téléphone */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Phone Number
                </Text>
                <Pressable 
                    onPress={() => copyToClipBoard(job.client.phone)}
                    hitSlop={{
                        top: DESIGN_TOKENS.touch.hitSlop,
                        bottom: DESIGN_TOKENS.touch.hitSlop,
                        left: DESIGN_TOKENS.touch.hitSlop,
                        right: DESIGN_TOKENS.touch.hitSlop,
                    }}
                >
                    <Text style={{
                        fontSize: 16,
                        color: colors.primary,
                        fontWeight: '500',
                        textDecorationLine: 'underline',
                    }}>
                        {job.client.phone}
                    </Text>
                </Pressable>
            </View>

            {/* Bouton d'appel */}
            <Button 
                title="📞 Call Client" 
                variant="secondary"
                onPress={() => contactLink(job.client.phone, 'tel')}
                style={{ width: '100%' }}
            />
        </SectionCard>
    );
};

export default ClientDetailsSection;