/**
 * SignatureSection - Section modulaire pour le statut de signature
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { checkJobSignatureExists } from '../../../services/jobDetails';
import { Button } from '../../ui/Button';
import SectionCard from '../SectionCard';

interface SignatureSectionProps {
    job: any;
    onSignContract: () => void;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({ job, onSignContract }) => {
    const { colors } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [signatureFromServer, setSignatureFromServer] = useState<{
        exists: boolean;
        signatureId?: number;
        signatureUrl?: string;
    }>({ exists: false });

    // ✅ Récupérer les signatures depuis le serveur au montage
    useEffect(() => {
        const checkSignature = async () => {
            const jobId = job?.id || job?.job?.id;
            if (!jobId) {
                setIsLoading(false);
                return;
            }

            try {
                console.log('🔍 [SignatureSection] Checking signature for job:', jobId);
                const result = await checkJobSignatureExists(jobId, 'client');
                console.log('🔍 [SignatureSection] Signature check result:', result);
                setSignatureFromServer(result);
            } catch (error) {
                console.error('❌ [SignatureSection] Error checking signature:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSignature();
    }, [job?.id, job?.job?.id]);

    // ✅ Vérifier signature (local OU API OU serveur)
    const isContractSigned = !!(
        signatureFromServer.exists ||
        (job.signatureDataUrl && job.signatureFileUri) ||
        job.signature_blob ||
        job.job?.signature_blob
    );

    // Log pour debug
    useEffect(() => {
        console.log('🔍 [SignatureSection] isContractSigned:', {
            signatureFromServer: signatureFromServer.exists,
            localSignature: !!(job.signatureDataUrl && job.signatureFileUri),
            signatureBlob: !!job.signature_blob,
            jobSignatureBlob: !!job.job?.signature_blob,
            final: isContractSigned
        });
    }, [isContractSigned, signatureFromServer, job]);

    return (
        <SectionCard level="secondary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    ✍️ Signature Contrat
                </Text>
                <Text style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Validation et signature du contrat client
                </Text>
            </View>

            {isLoading ? (
                <View style={{
                    padding: DESIGN_TOKENS.spacing.lg,
                    alignItems: 'center',
                }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginTop: DESIGN_TOKENS.spacing.sm,
                    }}>
                        Vérification de la signature...
                    </Text>
                </View>
            ) : isContractSigned ? (
                <View style={{
                    padding: DESIGN_TOKENS.spacing.lg,
                    backgroundColor: colors.success + '15',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: colors.success,
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.success,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: DESIGN_TOKENS.spacing.md,
                    }}>
                        <Text style={{ fontSize: 30, color: 'white' }}>✓</Text>
                    </View>
                    <Text style={{
                        fontSize: 18,
                        color: colors.success,
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: 4,
                    }}>
                        Contrat Signé !
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        textAlign: 'center',
                    }}>
                        Le client a validé et signé le contrat
                    </Text>
                </View>
            ) : (
                <View>
                    {/* État en attente avec design moderne */}
                    <View style={{
                        padding: DESIGN_TOKENS.spacing.lg,
                        backgroundColor: colors.backgroundTertiary,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginBottom: DESIGN_TOKENS.spacing.lg,
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: colors.warning + '30',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.md,
                        }}>
                            <Text style={{ fontSize: 28 }}>📝</Text>
                        </View>
                        <Text style={{
                            fontSize: 16,
                            color: colors.text,
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: 4,
                        }}>
                            Signature En Attente
                        </Text>
                        <Text style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            textAlign: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.md,
                        }}>
                            Le contrat doit être signé par le client
                        </Text>
                    </View>
                    
                    {/* Bouton call-to-action stylé */}
                    <View style={{
                        backgroundColor: colors.primary + '10',
                        borderRadius: 12,
                        padding: 4,
                    }}>
                        <Button 
                            title="🖋️ Faire Signer le Contrat" 
                            variant="primary"
                            onPress={onSignContract}
                            style={{ 
                                width: '100%',
                                paddingVertical: 16,
                                borderRadius: 8,
                            }}
                        />
                    </View>
                </View>
            )}
        </SectionCard>
    );
};

export default SignatureSection;