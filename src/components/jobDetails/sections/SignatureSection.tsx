/**
 * SignatureSection - Simplified contract signature section
 * Shows "By signing you accept the contract..." with contract link
 * When signed: shows date/time + signature image
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { useLocalization } from '../../../localization/useLocalization';
import { checkJobSignatureExists } from '../../../services/jobDetails';
import {
    fetchJobContract,
    generateJobContract,
    JobContract,
} from '../../../services/contractsService';
import { Card } from '../../ui/Card';

interface SignatureSectionProps {
    job: any;
    onSignContract: () => void;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({ job, onSignContract }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [signatureFromServer, setSignatureFromServer] = useState<{
        exists: boolean;
        signatureId?: number;
        signatureUrl?: string;
        signatureData?: string;
        createdAt?: string;
    }>({ exists: false });
    const [contract, setContract] = useState<JobContract | null>(null);
    const [contractModalVisible, setContractModalVisible] = useState(false);

    // Fetch signature + contract on mount
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const jobId = job?.id || job?.job?.id;
            const numId = typeof jobId === 'number' ? jobId : parseInt(jobId, 10);

            // Fetch signature
            if (numId && !isNaN(numId) && numId > 0) {
                try {
                    const result = await checkJobSignatureExists(numId, 'client');
                    if (!cancelled) setSignatureFromServer(result);
                } catch {}

                // Fetch or generate contract
                try {
                    const existing = await fetchJobContract(numId);
                    if (!cancelled && existing) {
                        setContract(existing);
                    } else {
                        const generated = await generateJobContract(numId);
                        if (!cancelled) setContract(generated);
                    }
                } catch {}
            }

            if (!cancelled) setIsLoading(false);
        };
        load();
        return () => { cancelled = true; };
    }, [job?.id, job?.job?.id]);

    const isContractSigned = !!(
        signatureFromServer.exists ||
        (job.signatureDataUrl && job.signatureFileUri) ||
        job.signature_blob ||
        job.job?.signature_blob
    );

    // Get signature image source
    const getSignatureUri = useCallback(() => {
        if (signatureFromServer.signatureData) return signatureFromServer.signatureData;
        if (signatureFromServer.signatureUrl) return signatureFromServer.signatureUrl;
        if (job.signatureDataUrl) return job.signatureDataUrl;
        if (job.signature_blob) return job.signature_blob;
        if (job.job?.signature_blob) return job.job.signature_blob;
        return null;
    }, [signatureFromServer, job]);

    // Format signature date
    const getSignedDateDisplay = useCallback(() => {
        const dateStr =
            contract?.signed_at ||
            job?.signature_date ||
            job?.job?.signature_date ||
            (signatureFromServer as any)?.createdAt;
        if (!dateStr) return null;

        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return null;
            const day = d.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
            const time = d.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
            });
            return { day, time };
        } catch {
            return null;
        }
    }, [contract?.signed_at, job?.signature_date, job?.job?.signature_date, signatureFromServer]);

    const handleViewContract = () => {
        setContractModalVisible(true);
    };

    if (isLoading) {
        return (
            <Card style={{ padding: DESIGN_TOKENS.spacing.lg, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                    {t('jobDetails.components.signature.verifying')}
                </Text>
            </Card>
        );
    }

    const signatureUri = getSignatureUri();
    const signedDate = getSignedDateDisplay();
    const hasClauses = contract && contract.clauses.length > 0;

    return (
        <>
            <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Ionicons name="pencil" size={22} color={colors.tint} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 }}>
                        {t('signature.title')}
                    </Text>
                    {isContractSigned && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#34C75915',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            gap: 4,
                        }}>
                            <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#34C759' }}>
                                {t('signature.signed')}
                            </Text>
                        </View>
                    )}
                </View>

                {isContractSigned ? (
                    /* ========== SIGNED STATE ========== */
                    <View>
                        {/* Signed date/time */}
                        {signedDate && (
                            <View style={{
                                backgroundColor: '#34C75910',
                                borderRadius: 10,
                                padding: 12,
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}>
                                <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                                <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                                    {t('signature.signedOn', { date: signedDate.day, time: signedDate.time })}
                                </Text>
                            </View>
                        )}

                        {/* View contract link */}
                        {hasClauses && (
                            <Pressable
                                onPress={handleViewContract}
                                style={({ pressed }) => ({
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingVertical: 8,
                                    opacity: pressed ? 0.6 : 1,
                                    marginBottom: 12,
                                })}
                            >
                                <Ionicons name="document-text-outline" size={16} color={colors.tint} />
                                <Text style={{ fontSize: 14, color: colors.tint, textDecorationLine: 'underline' }}>
                                    {t('signature.viewContract')}
                                </Text>
                            </Pressable>
                        )}

                        {/* Signature image */}
                        {signatureUri && (
                            <View style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 12,
                                alignItems: 'center',
                            }}>
                                <Image
                                    source={{ uri: signatureUri }}
                                    style={{ width: '100%', height: 120 }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    /* ========== UNSIGNED STATE ========== */
                    <View>
                        {/* "By signing you accept the contract..." */}
                        <View style={{
                            backgroundColor: colors.background,
                            borderRadius: 10,
                            padding: 14,
                            marginBottom: 16,
                        }}>
                            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                                {t('signature.bySigningPrefix')}
                                {hasClauses ? (
                                    <Text
                                        onPress={handleViewContract}
                                        style={{
                                            color: colors.tint,
                                            fontWeight: '600',
                                            textDecorationLine: 'underline',
                                        }}
                                    >
                                        {t('signature.contractLink')}
                                    </Text>
                                ) : (
                                    <Text style={{ fontWeight: '600', color: colors.text }}>
                                        {t('signature.contractLink')}
                                    </Text>
                                )}
                                {t('signature.bySigningSuffix')}
                            </Text>
                        </View>

                        {/* Sign button */}
                        <Pressable
                            onPress={onSignContract}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.tint,
                                borderRadius: 10,
                                paddingVertical: 14,
                                gap: 8,
                                opacity: pressed ? 0.7 : 1,
                            })}
                            accessibilityLabel={t('signature.signButton')}
                            accessibilityRole="button"
                        >
                            <Ionicons name="pencil-outline" size={18} color="#FFF" />
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>
                                {t('signature.signButton')}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </Card>

            {/* ========== CONTRACT VIEW MODAL ========== */}
            <Modal
                visible={contractModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setContractModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingTop: insets.top,
                }}>
                    {/* Modal header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        gap: 12,
                    }}>
                        <Ionicons name="document-text" size={22} color={colors.tint} />
                        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 }}>
                            {t('signature.contractTitle')}
                        </Text>
                        <Pressable
                            onPress={() => setContractModalVisible(false)}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: colors.backgroundSecondary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: pressed ? 0.6 : 1,
                            })}
                        >
                            <Ionicons name="close" size={18} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Contract clauses */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
                    >
                        {contract?.clauses.map((clause, index) => (
                            <View
                                key={clause.id}
                                style={{
                                    backgroundColor: colors.backgroundSecondary,
                                    borderRadius: 10,
                                    padding: 14,
                                    marginBottom: 10,
                                }}
                            >
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: colors.text,
                                    marginBottom: 6,
                                }}>
                                    {index + 1}. {clause.clause_title}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    color: colors.textSecondary,
                                    lineHeight: 20,
                                }}>
                                    {clause.clause_content}
                                </Text>
                            </View>
                        ))}

                        {(!contract || contract.clauses.length === 0) && (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                                <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12 }}>
                                    {t('signature.noClausesConfigured')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
};

export default SignatureSection;
