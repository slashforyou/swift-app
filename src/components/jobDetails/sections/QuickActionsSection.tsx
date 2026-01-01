/**
 * QuickActionsSection - Section d'actions rapides pour le job
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { useLocalization } from '../../../localization/useLocalization';
import SectionCard from '../SectionCard';

interface QuickActionsSectionProps {
    job: any;
    setJob: React.Dispatch<React.SetStateAction<any>>;
    onAddNote?: (content: string, type?: 'general' | 'important' | 'client' | 'internal') => Promise<void>;
    onTakePhoto?: () => void;
    onShowNoteModal?: () => void;
    onShowPhotoModal?: () => void;
    onShowStepAdvanceModal?: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ 
    job, 
    setJob, 
    onAddNote,
    onTakePhoto,
    onShowNoteModal,
    onShowPhotoModal,
    onShowStepAdvanceModal
}) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    // Action handlers
    const handleCallClient = () => {
        const phoneNumber = job?.client?.phone || job?.contact?.phone;
        if (phoneNumber) {
            // Nettoie le numéro (enlève espaces, tirets, etc.)
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
            Linking.openURL(`tel:${cleanNumber}`);
        } else {
            Alert.alert(t('jobDetails.components.quickActions.error'), t('jobDetails.components.quickActions.noPhoneAvailable'));
        }
    };

    const handleNavigation = () => {
        // Détermine l'adresse selon l'étape actuelle
        const currentStep = job?.step?.actualStep || 1;
        let address = '';
        
        if (currentStep <= 2) {
            // Étapes de pickup
            const pickupAddress = job?.addresses?.find((addr: any) => addr.type === 'pickup');
            address = pickupAddress ? `${pickupAddress.street}, ${pickupAddress.city}` : '';
        } else {
            // Étapes de dropoff
            const dropoffAddress = job?.addresses?.find((addr: any) => addr.type === 'dropoff');
            address = dropoffAddress ? `${dropoffAddress.street}, ${dropoffAddress.city}` : '';
        }

        if (address) {
            const encodedAddress = encodeURIComponent(address);
            // Utilise Google Maps au lieu de l'app Maps native
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
        } else {
            Alert.alert(t('jobDetails.components.quickActions.error'), 'Adresse non disponible');
        }
    };

    const getStepNames = () => [
        t('jobDetails.components.quickActions.startJob'),
        '🚗 Je suis en route', 
        t('jobDetails.components.quickActions.arrivedAtClient'),
        '🚛 En route prochaine adresse',
        t('jobDetails.components.quickActions.jobFinished')
    ];

    const handleAdvanceStep = () => {
        // Utilise le modal d'avancement des étapes si disponible
        if (onShowStepAdvanceModal) {
            onShowStepAdvanceModal();
        } else {
            // Fallback vers l'ancienne méthode
            const currentStep = job?.step?.actualStep || 1;
            const maxSteps = job?.step?.steps?.length || 4;
            const stepNames = getStepNames();
            
            if (currentStep < maxSteps) {
                const nextStepName = stepNames[currentStep] || `Étape ${currentStep + 1}`;
                
                Alert.alert(
                    t('jobDetails.components.quickActions.advanceStep'),
                    t('jobDetails.components.quickActions.goToStep', { stepName: nextStepName }),
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                            text: 'Confirmer', 
                            onPress: () => {
                                setJob((prevJob: any) => ({
                                    ...prevJob,
                                    step: {
                                        ...prevJob.step,
                                        actualStep: currentStep + 1
                                    }
                                }));
                                Alert.alert(t('jobDetails.components.quickActions.success'), t('jobDetails.components.quickActions.stepActivated', { stepName: nextStepName }));
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(t('jobDetails.components.quickActions.information'), t('jobDetails.components.quickActions.jobAlreadyFinished'));
            }
        }
    };

    const handleQuickNote = () => {
        // Utilise le modal de note complet si disponible, sinon prompt simple
        if (onShowNoteModal) {
            onShowNoteModal();
        } else {
            Alert.prompt(
                'Note Rapide',
                'Ajouter une note au job:',
                (text) => {
                    if (text && text.trim()) {
                        onAddNote?.(text.trim(), 'general');
                        Alert.alert(t('jobDetails.components.quickActions.success'), t('jobDetails.components.quickActions.noteAdded'));
                    }
                },
                'plain-text'
            );
        }
    };

    const handleTakePhoto = () => {
        // Utilise le modal de photo complet si disponible
        if (onShowPhotoModal) {
            onShowPhotoModal();
        } else {
            onTakePhoto?.();
        }
    };



    // Configuration des boutons d'actions
    const quickActions = [
        {
            id: 'call',
            icon: 'call',
            label: 'Appeler',
            color: colors.success,
            onPress: handleCallClient,
        },
        {
            id: 'navigation',
            icon: 'navigate',
            label: 'GPS',
            color: colors.primary,
            onPress: handleNavigation,
        },
        {
            id: 'advance',
            icon: 'checkmark-circle',
            label: 'Avancer',
            color: colors.warning,
            onPress: handleAdvanceStep,
        },
        {
            id: 'note',
            icon: 'create',
            label: 'Note',
            color: colors.tint,
            onPress: handleQuickNote,
        },
        {
            id: 'photo',
            icon: 'camera',
            label: 'Photo',
            color: colors.info,
            onPress: handleTakePhoto,
        },
    ];

    return (
        <SectionCard level="secondary">
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                gap: DESIGN_TOKENS.spacing.md,
            }}>
                {quickActions.map((action) => (
                    <Pressable
                        key={action.id}
                        onPress={action.onPress}
                        style={({ pressed }) => ({
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 80,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            backgroundColor: pressed 
                                ? action.color + '20' 
                                : colors.backgroundTertiary,
                            borderWidth: pressed ? 2 : 1,
                            borderColor: pressed ? action.color : colors.border,
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                    >
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: action.color + '20',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.xs,
                        }}>
                            <Ionicons 
                                name={action.icon as any} 
                                size={22} 
                                color={action.color} 
                            />
                        </View>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.text,
                            textAlign: 'center',
                        }}>
                            {action.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </SectionCard>
    );
};

export default QuickActionsSection;