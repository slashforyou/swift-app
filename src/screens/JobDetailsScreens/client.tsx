/**
 * Client Page - Affichage des informations client avec actions rapides
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import SignatureSection from '../../components/jobDetails/sections/SignatureSection';
import { HStack, VStack } from '../../components/primitives/Stack';
import SigningBloc from '../../components/signingBloc';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { useJobDetails } from '../../hooks/useJobDetails';
import { ClientAPI, fetchClientById } from '../../services/clients';
import contactLink from '../../services/contactLink';
import { isLoggedIn } from '../../utils/auth';

interface JobClientProps {
    job: any;
    setJob: (job: any) => void;
}

interface InfoRowProps {
    label: string;
    value: string;
}

// Composant réutilisable pour afficher les informations client
const InfoRow: React.FC<InfoRowProps & { colors: any }> = ({ label, value, colors }) => (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: colors.textSecondary,
            }}
        >
            {label}
        </Text>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                color: colors.text,
            }}
        >
            {value || 'Not specified'}
        </Text>
    </VStack>
);

const JobClient: React.FC<JobClientProps> = ({ job, setJob }) => {
    const { colors } = useCommonThemedStyles();
    const [extendedClientData, setExtendedClientData] = useState<ClientAPI | null>(null);
    const [isLoadingClient, setIsLoadingClient] = useState(false);
    const [isSigningVisible, setIsSigningVisible] = useState(false);

    // ✅ Récupérer jobDetails du context pour avoir les données fraîches (notamment signature_blob)
    // NOTE: L'endpoint /job/:code/full attend un CODE (JOB-XXX), pas un ID numérique
    const jobCode = job?.code || job?.job?.code;
    const { jobDetails } = useJobDetails(jobCode);

    // ✅ SYNC: Synchroniser job state avec jobDetails.job (notamment signature_blob)
    useEffect(() => {
        if (jobDetails?.job) {
            console.log('🔄 [JobClient] Syncing job state with jobDetails:', {
                hasSignatureInContext: !!jobDetails.job.signature_blob,
                hasSignatureInState: !!job?.signature_blob,
                signatureDate: jobDetails.job.signature_date
            });
            
            // Merge pour garder modifications locales + ajouter données backend
            setJob((prev: any) => ({
                ...prev,
                ...jobDetails.job,
                // Préserver certains champs locaux si nécessaire
                signatureDataUrl: prev?.signatureDataUrl || jobDetails.job.signature_blob,
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobDetails?.job?.id, jobDetails?.job?.signature_blob, jobDetails?.job?.signature_date, setJob]);

    const handleSignContract = () => {
        // TEMP_DISABLED: console.log('🖋️ [JobClient] handleSignContract called - Opening signature modal');
        setIsSigningVisible(true);
    };
    
    // Fonction pour charger les données client étendues depuis l'API
    const loadExtendedClientData = useCallback(async () => {
        if (!job?.client_id) return;
        
        try {
            setIsLoadingClient(true);
            const loggedIn = await isLoggedIn();
            
            if (loggedIn) {
                const clientData = await fetchClientById(job.client_id);
                setExtendedClientData(clientData);
            }
        } catch (error) {

            console.error('Error loading extended client data:', error);
            // En cas d'erreur, on continue avec les données de base du job
        } finally {
            setIsLoadingClient(false);
        }
    }, [job?.client_id]);
    
    useEffect(() => {
        loadExtendedClientData();
    }, [loadExtendedClientData]);
    
    // Utiliser les données étendues si disponibles, sinon les données de base
    const clientData = extendedClientData || job.client;
    
    // Données client pour éviter la répétition
    const clientInfo = [
        { label: 'Prénom', value: clientData?.firstName },
        { label: 'Nom', value: clientData?.lastName },
        { label: 'Téléphone', value: clientData?.phone },
        { label: 'Email', value: clientData?.email },
        { label: 'Entreprise', value: clientData?.company },
        { label: 'Adresse', value: clientData?.address ? 
            `${clientData.address.street}, ${clientData.address.city} ${clientData.address.zip}` : null },
        { label: 'Notes', value: clientData?.notes },
    ].filter(item => item.value); // Ne montre que les champs renseignés

    return (
        <>
        <VStack gap="lg">
                {/* Informations Client */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                color: colors.text,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            Client Details
                        </Text>
                        
                        {isLoadingClient ? (
                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                Loading client data...
                            </Text>
                        ) : clientInfo.map((info) => (
                            <InfoRow 
                                key={info.label}
                                label={info.label}
                                value={info.value}
                                colors={colors}
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
                                color: colors.text,
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
                                                    ? colors.backgroundSecondary 
                                                    : colors.backgroundTertiary,
                                                borderRadius: DESIGN_TOKENS.radius.md,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                minHeight: DESIGN_TOKENS.touch.minSize,
                                            }
                                        ])}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Call ${job.client?.firstName || 'client'}`}
                                    >
                                        <Ionicons 
                                            name="call" 
                                            size={20} 
                                            color={colors.tint} 
                                        />
                                        <Text 
                                            style={{
                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                                color: colors.tint,
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
                                                    ? colors.backgroundSecondary 
                                                    : colors.backgroundTertiary,
                                                borderRadius: DESIGN_TOKENS.radius.md,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                minHeight: DESIGN_TOKENS.touch.minSize,
                                            }
                                        ])}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Send SMS to ${job.client?.firstName || 'client'}`}
                                    >
                                        <Ionicons 
                                            name="chatbubble" 
                                            size={20} 
                                            color={colors.tint} 
                                        />
                                        <Text 
                                            style={{
                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                                color: colors.tint,
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
                                                ? colors.backgroundSecondary 
                                                : colors.backgroundTertiary,
                                            borderRadius: DESIGN_TOKENS.radius.md,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            minHeight: DESIGN_TOKENS.touch.minSize,
                                        }
                                    ])}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Send email to ${job.client?.firstName || 'client'}`}
                                >
                                    <Ionicons 
                                        name="mail" 
                                        size={20} 
                                        color={colors.tint} 
                                    />
                                    <Text 
                                        style={{
                                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                            fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                            color: colors.tint,
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
                
                {/* Section signature plus moderne */}
                <SignatureSection job={job} onSignContract={handleSignContract} />
        </VStack>
        
        {/* Modal de signature */}
        {isSigningVisible && (
            <SigningBloc 
                isVisible={isSigningVisible} 
                setIsVisible={setIsSigningVisible} 
                onSave={(signature: any) => {
                    // TEMP_DISABLED: console.log('Signature saved:', signature);
                }}
                job={job} 
                setJob={setJob}
            />
        )}
        </>
    );
};

export default JobClient;
