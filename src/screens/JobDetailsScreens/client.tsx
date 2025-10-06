/**
 * Client Page - Affichage des informations client avec actions rapides
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import contactLink from '../../services/contactLink';
import Ionicons from '@react-native-vector-icons/ionicons';

interface JobClientProps {
    job: any;
    setJob: (job: any) => void;
}

interface InfoRowProps {
    label: string;
    value: string;
}

// Composant réutilisable pour afficher les informations client
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: Colors.light.textSecondary,
            }}
        >
            {label}
        </Text>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                color: Colors.light.text,
            }}
        >
            {value || 'Not specified'}
        </Text>
    </VStack>
);

const JobClient: React.FC<JobClientProps> = ({ job, setJob }) => {
    // Données client pour éviter la répétition
    const clientInfo = [
        { label: 'First Name', value: job.client?.firstName },
        { label: 'Last Name', value: job.client?.lastName },
        { label: 'Phone', value: job.client?.phone },
        { label: 'Email', value: job.client?.email },
        { label: 'Client Type', value: job.client?.type },
    ].filter(item => item.value); // Ne montre que les champs renseignés

    return (
        <VStack gap="lg">
                {/* Informations Client */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                color: Colors.light.text,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            Client Details
                        </Text>
                        
                        {clientInfo.map((info, index) => (
                            <InfoRow 
                                key={index}
                                label={info.label}
                                value={info.value}
                            />
                        ))}
                    </VStack>
                </Card>

                {/* Actions Rapides */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="lg">
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                color: Colors.light.text,
                            }}
                        >
                            Quick Actions
                        </Text>
                        
                        <VStack gap="sm">
                            {/* Actions téléphone */}
                            {job.client?.phone && (
                                <HStack gap="sm">
                                    <Pressable
                                        onPress={() => contactLink(job.client?.phone, 'tel')}
                                        hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                        style={({ pressed }) => ([
                                            {
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                                backgroundColor: pressed 
                                                    ? Colors.light.backgroundSecondary 
                                                    : Colors.light.backgroundTertiary,
                                                borderRadius: DESIGN_TOKENS.radius.md,
                                                borderWidth: 1,
                                                borderColor: Colors.light.border,
                                                minHeight: DESIGN_TOKENS.touch.minSize,
                                            }
                                        ])}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Call ${job.client?.firstName || 'client'}`}
                                    >
                                        <Ionicons 
                                            name="call" 
                                            size={20} 
                                            color={Colors.light.tint} 
                                        />
                                        <Text 
                                            style={{
                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                                color: Colors.light.tint,
                                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                            }}
                                        >
                                            Call
                                        </Text>
                                    </Pressable>
                                    
                                    <Pressable
                                        onPress={() => contactLink(job.client?.phone, 'sms')}
                                        hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                        style={({ pressed }) => ([
                                            {
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                                backgroundColor: pressed 
                                                    ? Colors.light.backgroundSecondary 
                                                    : Colors.light.backgroundTertiary,
                                                borderRadius: DESIGN_TOKENS.radius.md,
                                                borderWidth: 1,
                                                borderColor: Colors.light.border,
                                                minHeight: DESIGN_TOKENS.touch.minSize,
                                            }
                                        ])}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Send SMS to ${job.client?.firstName || 'client'}`}
                                    >
                                        <Ionicons 
                                            name="chatbubble" 
                                            size={20} 
                                            color={Colors.light.tint} 
                                        />
                                        <Text 
                                            style={{
                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                                color: Colors.light.tint,
                                                marginLeft: DESIGN_TOKENS.spacing.xs,
                                            }}
                                        >
                                            SMS
                                        </Text>
                                    </Pressable>
                                </HStack>
                            )}
                            
                            {/* Action email */}
                            {job.client?.email && (
                                <Pressable
                                    onPress={() => contactLink(job.client?.email, 'mailto')}
                                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                    style={({ pressed }) => ([
                                        {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingVertical: DESIGN_TOKENS.spacing.md,
                                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                            backgroundColor: pressed 
                                                ? Colors.light.backgroundSecondary 
                                                : Colors.light.backgroundTertiary,
                                            borderRadius: DESIGN_TOKENS.radius.md,
                                            borderWidth: 1,
                                            borderColor: Colors.light.border,
                                            minHeight: DESIGN_TOKENS.touch.minSize,
                                        }
                                    ])}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Send email to ${job.client?.firstName || 'client'}`}
                                >
                                    <Ionicons 
                                        name="mail" 
                                        size={20} 
                                        color={Colors.light.tint} 
                                    />
                                    <Text 
                                        style={{
                                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                            fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                            color: Colors.light.tint,
                                            marginLeft: DESIGN_TOKENS.spacing.xs,
                                        }}
                                    >
                                        Email
                                    </Text>
                                </Pressable>
                            )}
                        </VStack>
                    </VStack>
                </Card>
        </VStack>
    );
};

export default JobClient;