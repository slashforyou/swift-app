/**
 * ContactDetailsSection - Section modulaire pour les informations de contact
 */
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';
import { Button } from '../../ui/Button';
import copyToClipBoard from '../../../services/copyToClipBoard';
import contactLink from '../../../services/contactLink';

interface ContactDetailsSectionProps {
    job: any;
}

const ContactDetailsSection: React.FC<ContactDetailsSectionProps> = ({ job }) => {
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
                    Contact Person
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Primary contact for this job
                </Text>
            </View>

            {/* Nom du contact */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
                <Text style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Contact Name
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: '500',
                }}>
                    {job.contact.firstName} {job.contact.lastName}
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
                    onPress={() => copyToClipBoard(job.contact.phone)}
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
                        {job.contact.phone}
                    </Text>
                </Pressable>
            </View>

            {/* Bouton d'appel */}
            <Button 
                title="📞 Call Contact" 
                variant="secondary"
                onPress={() => contactLink(job.contact.phone, 'tel')}
                style={{ width: '100%' }}
            />
        </SectionCard>
    );
};

export default ContactDetailsSection;