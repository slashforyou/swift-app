/**
 * Summary Page - Page de résumé du job avec modals améliorés
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LanguageButton from '../../components/calendar/LanguageButton';
import { JobStepHistoryCard } from '../../components/jobDetails/JobStepHistoryCard';
import JobTimerDisplay from '../../components/jobDetails/JobTimerDisplay';
import ImprovedNoteModal from '../../components/jobDetails/modals/ImprovedNoteModal';
import JobStepAdvanceModal from '../../components/jobDetails/modals/JobStepAdvanceModal';
import PhotoSelectionModal from '../../components/jobDetails/modals/PhotoSelectionModal';
import AddressesSection from '../../components/jobDetails/sections/AddressesSection';
import ClientDetailsSection from '../../components/jobDetails/sections/ClientDetailsSection';
import ContactDetailsSection from '../../components/jobDetails/sections/ContactDetailsSection';
import QuickActionsSection from '../../components/jobDetails/sections/QuickActionsSection';
import TimeWindowsSection from '../../components/jobDetails/sections/TimeWindowsSection';
import TruckDetailsSection from '../../components/jobDetails/sections/TruckDetailsSection';
import SigningBloc from '../../components/signingBloc';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimerContext } from '../../context/JobTimerProvider';
import { useTheme } from '../../context/ThemeProvider';
import { useToast } from '../../context/ToastProvider';
import { useJobNotes } from '../../hooks/useJobNotes';
import { useJobPhotos } from '../../hooks/useJobPhotos';
import { useLocalization } from '../../localization/useLocalization';
import { saveJobSignature } from '../../services/jobDetails';
import { updateJobStep } from '../../services/jobSteps';

const JobSummary = ({ job, setJob, onOpenPaymentPanel } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>>, onOpenPaymentPanel?: () => void }) => {
    const [isSigningVisible, setIsSigningVisible] = useState(false);
    const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
    const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    const [isStepAdvanceModalVisible, setIsStepAdvanceModalVisible] = useState(false);
    
    const { t } = useLocalization();
    const { colors } = useTheme();

    // ✅ Utiliser le context du timer pour avoir les steps en temps réel
    const { currentStep, totalSteps, nextStep } = useJobTimerContext();
    
    // 🔍 DEBUG: Surveiller les changements de job.step
    React.useEffect(() => {
        console.log('🔍 [SUMMARY] job.step changed:', {
            actualStep: job?.step?.actualStep,
            contextCurrentStep: currentStep
        });
    }, [job?.step, currentStep]);

    // Hooks pour la gestion des notes et photos
    const { addNote } = useJobNotes(job?.id);
    const { uploadPhoto } = useJobPhotos(job?.id);
    const { showSuccess, showError } = useToast();

    const handleSignContract = () => {
        setIsSigningVisible(true);
    };

    // Gestion des notes avec API - nouvelle structure
    const handleAddNote = async (content: string, note_type: 'general' | 'important' | 'client' | 'internal' = 'general', title?: string) => {
        try {
            const result = await addNote({ 
                title: title || `Note du ${new Date().toLocaleDateString()}`,
                content, 
                note_type 
            });
            if (result) {
                showSuccess(t('jobDetails.messages.noteAdded'), t('jobDetails.messages.noteAddedSuccess'));
                return Promise.resolve();
            } else {
                throw new Error(t('jobDetails.messages.noteAddErrorMessage'));
            }
        } catch (error) {
            console.error('Error adding note:', error);
            showError(t('jobDetails.messages.noteAddError'), t('jobDetails.messages.noteAddErrorMessage'));
            throw error;
        }
    };

    // Gestion des photos avec API
    const handlePhotoSelected = async (photoUri: string) => {
        try {
            const result = await uploadPhoto(photoUri, `${t('jobDetails.messages.photoDescription')} ${job?.id || 'N/A'}`);
            if (result) {
                showSuccess(t('jobDetails.messages.photoAdded'), t('jobDetails.messages.photoAddedSuccess'));
            } else {
                throw new Error(t('jobDetails.messages.photoAddErrorMessage'));
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            showError(t('jobDetails.messages.photoAddError'), t('jobDetails.messages.photoAddErrorMessage'));
        }
    };

    // ✅ Gestion de l'avancement des étapes - utilise maintenant le timer context
    const handleAdvanceStep = async (targetStep: number) => {
        try {
            // ✅ Appel API pour mettre à jour sur le serveur
            const jobCode = job?.code || job?.id; // Utiliser le code du job, pas l'ID numérique
            
            if (jobCode) {
                try {
                    console.log(`📊 [SUMMARY] Updating step to ${targetStep} for job ${jobCode}`);
                    
                    const response = await updateJobStep(jobCode, targetStep);
                    
                    console.log(`✅ [SUMMARY] Step updated successfully:`, response);
                    
                    // 🔍 DEBUG: Vérifier response.data
                    console.log('🔍 [SUMMARY] Response analysis:', {
                        hasData: !!response.data,
                        dataCurrentStep: response.data?.currentStep,
                        targetStep,
                        willUse: response.data?.currentStep || targetStep
                    });
                    
                    // 🔍 DEBUG: État avant setJob
                    console.log('🔍 [SUMMARY] BEFORE setJob - job.step:', job?.step);
                    
                    // ✅ Mettre à jour l'objet job local avec la réponse de l'API
                    // L'API retourne: { success: true, data: { currentStep, status, ... } }
                    setJob((prevJob: any) => {
                        console.log('🔍 [SUMMARY] Inside setJob callback:', {
                            prevStep: prevJob?.step,
                            newStep: response.data?.currentStep || targetStep
                        });
                        
                        const updatedJob = {
                            ...prevJob,
                            step: {
                                ...prevJob.step,
                                actualStep: response.data?.currentStep || targetStep
                            },
                            // Mettre à jour le status si le backend l'a changé
                            status: response.data?.status || prevJob.status
                        };
                        
                        console.log('🔍 [SUMMARY] Returning from setJob:', {
                            newStep: updatedJob.step
                        });
                        
                        return updatedJob;
                    });
                    
                    // 🔍 DEBUG: État après setJob (sera encore l'ancien à cause de l'async)
                    console.log('🔍 [SUMMARY] AFTER setJob (async) - job.step:', job?.step);
                    
                    showSuccess(
                        t('jobDetails.messages.nextStep'), 
                        `${t('jobDetails.messages.advancedToStep')} ${targetStep}`
                    );
                } catch (apiError) {
                    console.error('❌ [SUMMARY] API update failed:', apiError);
                    showError(
                        'Erreur de synchronisation',
                        'La mise à jour de l\'étape a échoué. Veuillez réessayer.'
                    );
                    throw apiError;
                }
            } else {
                console.error('❌ [SUMMARY] No job code/id available');
                throw new Error('No job identifier');
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error('❌ [SUMMARY] Error advancing step:', error);
            throw error;
        }
    };

    // ✅ Fonction simple pour avancer à l'étape suivante - délègue au timer context
    const handleNextStep = async () => {
        if (currentStep < totalSteps) {
            const targetStep = currentStep + 1;
            
            try {
                // Avancer dans le timer context
                nextStep();
                
                // Synchroniser avec l'API
                await handleAdvanceStep(targetStep);
            } catch (error) {
                console.error('Failed to advance step:', error);
            }
        }
    };

    // Styles pour le bouton de langue
    const styles = StyleSheet.create({
        languageButtonContainer: {
            position: 'absolute',
            top: DESIGN_TOKENS.spacing.sm,
            right: DESIGN_TOKENS.spacing.lg,
            zIndex: 10,
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.md,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
    });

    return (
        <>
            {/* Modal de signature */}
            {isSigningVisible && (
                <SigningBloc 
                    isVisible={isSigningVisible} 
                    setIsVisible={setIsSigningVisible} 
                    onSave={async (signature: string) => {
                        try {
                            // ✅ Passer l'ID numérique et le type "client"
                            const result = await saveJobSignature(job.id, signature, 'client');
                            console.log('📝 [SUMMARY] Signature save result:', result);
                            
                            if (result.success) {
                                // ✅ Mettre à jour TOUS les champs de signature
                                setJob({ 
                                    ...job, 
                                    signature_blob: result.signatureUrl,
                                    signatureDataUrl: signature, // Garder aussi la data URL locale
                                    signatureFileUri: '' // Sera mis à jour par signingBloc
                                });
                                showSuccess('Signature enregistrée avec succès!');
                            } else {
                                showError('Erreur', result.message || 'Impossible de sauvegarder la signature');
                            }
                        } catch (error) {
                            console.error('Erreur lors de la sauvegarde de la signature:', error);
                            showError('Erreur', 'Une erreur est survenue lors de la sauvegarde');
                        }
                    }}
                    job={job} 
                    setJob={setJob}
                />
            )}

            {/* Modal de sélection de photo */}
            <PhotoSelectionModal
                isVisible={isPhotoModalVisible}
                onClose={() => setIsPhotoModalVisible(false)}
                onPhotoSelected={handlePhotoSelected}
                jobId={job?.id}
            />

            {/* Modal amélioré de note */}
            <ImprovedNoteModal
                isVisible={isNoteModalVisible}
                onClose={() => setIsNoteModalVisible(false)}
                onAddNote={handleAddNote}
                jobId={job?.id}
            />

            {/* Modal d'avancement des étapes */}
            <JobStepAdvanceModal
                isVisible={isStepAdvanceModalVisible}
                onClose={() => setIsStepAdvanceModalVisible(false)}
                job={job}
                onAdvanceStep={handleAdvanceStep}
            />

            {/* Sections modulaires */}
            <View>
                {/* Bouton de langue discret */}
                <View style={styles.languageButtonContainer}>
                    <LanguageButton />
                </View>

                {/* 🆕 Module Timer + Progression fusionnés */}
                <JobTimerDisplay 
                    job={job} 
                    onOpenSignatureModal={() => setIsSigningVisible(true)}
                    onOpenPaymentPanel={onOpenPaymentPanel}
                />

                {/* 📊 NOUVEAU: Afficher step_history si disponible depuis l'API */}
                {job?.timer_info && job.timer_info.step_history && job.timer_info.step_history.length > 0 && (
                    <JobStepHistoryCard timerInfo={job.timer_info} />
                )}

                {/* 🆕 Badge de validation du step - DÉSACTIVÉ car validation déjà faite dans jobDetails.tsx */}
                {/* La validation automatique se fait déjà au chargement du job dans jobDetails.tsx ligne 315-374 */}
                {/* Le badge ici causait une boucle infinie car l'objet 'job' n'a pas le status synchronisé */}
                {/*
                <StepValidationBadge 
                    job={job}
                    onStepCorrected={(newStep) => {
                        setJob((prev: any) => ({
                            ...prev,
                            step: { ...prev.step, actualStep: newStep }
                        }));
                    }}
                />
                */}
                
                {/* Actions rapides */}
                <QuickActionsSection 
                    job={job} 
                    setJob={setJob}
                    onAddNote={handleAddNote}
                    onShowNoteModal={() => setIsNoteModalVisible(true)}
                    onShowPhotoModal={() => setIsPhotoModalVisible(true)}
                    onShowStepAdvanceModal={() => setIsStepAdvanceModalVisible(true)}
                />
                
                {/* Informations client */}
                <ClientDetailsSection job={job} />
                
                {/* Informations contact */}
                <ContactDetailsSection job={job} />
                
                {/* Adresses */}
                <AddressesSection job={job} />
                
                {/* Créneaux horaires */}
                <TimeWindowsSection job={job} />
                
                {/* Détails du camion */}
                <TruckDetailsSection job={job} />
            </View>
        </>
    );
};

export default JobSummary;
