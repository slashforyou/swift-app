/**
 * SignatureSection - Section modulaire pour le statut de signature
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';
import { Button } from '../../ui/Button';

interface SignatureSectionProps {
    job: any;
    onSignContract: () => void;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({ job, onSignContract }) => {
    const { colors } = useTheme();

    const isContractSigned = job.signatureDataUrl !== '' && job.signatureFileUri !== '';

    return (
        <SectionCard level="secondary">
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                }}>
                    Contract Signature
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    Client signature status for this job
                </Text>
            </View>

            {isContractSigned ? (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: DESIGN_TOKENS.spacing.md,
                    backgroundColor: colors.success + '15', // Success avec transparence
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: colors.success,
                }}>
                    <Text style={{
                        fontSize: 24,
                        marginRight: DESIGN_TOKENS.spacing.sm,
                    }}>✅</Text>
                    <Text style={{
                        fontSize: 16,
                        color: colors.success,
                        fontWeight: '600',
                        flex: 1,
                    }}>
                        Contract has been signed by the client
                    </Text>
                </View>
            ) : (
                <View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: DESIGN_TOKENS.spacing.md,
                        backgroundColor: colors.warning + '15', // Warning avec transparence
                        borderRadius: DESIGN_TOKENS.radius.md,
                        borderWidth: 1,
                        borderColor: colors.warning,
                        marginBottom: DESIGN_TOKENS.spacing.md,
                    }}>
                        <Text style={{
                            fontSize: 24,
                            marginRight: DESIGN_TOKENS.spacing.sm,
                        }}>⚠️</Text>
                        <Text style={{
                            fontSize: 14,
                            color: colors.warning,
                            flex: 1,
                        }}>
                            Contract signature is pending from the client
                        </Text>
                    </View>
                    
                    <Button 
                        title="Sign Contract" 
                        variant="secondary"
                        onPress={onSignContract}
                        style={{ width: '100%' }}
                    />
                </View>
            )}
        </SectionCard>
    );
};

export default SignatureSection;