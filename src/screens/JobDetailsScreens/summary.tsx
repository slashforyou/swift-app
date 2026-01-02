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
import { useAnalytics } from '../../hooks/useAnalytics';
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
    const { track } = useAnalytics('job_summary', 'job_details');

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
        track.userAction('contract_signing_opened', { 
            jobId: job?.id, 
            jobCode: job?.code 
        });
        setIsSigningVisible(true);
    };

    // Gestion des notes avec API - nouvelle structure
    const handleAddNote = async (content: string, note_type: 'general' | 'important' | 'client' | 'internal' = 'general', title?: string) => {
        try {
            track.userAction('note_add_started', { 
                jobId: job?.id, 
                note_type: note_type,
                content_length: content.length 
            });
            
            const result = await addNote({ 
                title: title || `${t('jobDetails.defaultNote')} ${new Date().toLocaleDateString()}`,
                content, 
                note_type 
            });
            
            if (result) {
                track.businessEvent('note_added', { 
                    jobId: job?.id, 
                    note_type: note_type,
                    success: true 
                });
                showSuccess(t('jobDetails.messages.noteAdded'), t('jobDetails.messages.noteAddedSuccess'));
                return Promise.resolve();
            } else {
                throw new Error(t('jobDetails.messages.noteAddErrorMessage'));
            }
        } catch (error) {

            track.error('api_error', `Failed to add note: ${error}`, { 
                jobId: job?.id, 
                note_type: note_type 
            });
            console.error('Error adding note:', error);
            showError(t('jobDetails.messages.noteAddError'), t('jobDetails.messages.noteAddErrorMessage'));
            throw error;
        }
    };

    // Gestion des photos avec API
    const handlePhotoSelected = async (photoUri: string) => {
        try {
            track.userAction('photo_upload_started', { 
                jobId: job?.id,
                photo_uri: photoUri.substring(0, 50) // Partial URI for privacy
            });
            
            const result = await uploadPhoto(photoUri, `${t('jobDetails.messages.photoDescription')} ${job?.id || 'N/A'}`);
            if (result) {
                track.businessEvent('photo_uploaded', { 
                    jobId: job?.id,
                    success: true 
                });
                showSuccess(t('jobDetails.messages.photoAdded'), t('jobDetails.messages.photoAddedSuccess'));
            } else {
                throw new Error(t('jobDetails.messages.photoAddErrorMessage'));
            }
        } catch (error) {

            console.error('Error uploading photo:', error);
            showError(t('jobDetails.messages.photoAddError'), t('jobDetails.messages.photoAddErrorMessage'));
        }
    };

    // ✅ Gestion de l'avancement des étapes avec nouvelle API backend
    const handleAdvanceStep = async (targetStep: number) => {
        try {
            // Utiliser l'ID numérique du job pour l'API
            const jobId = job?.id?.toString(); 
            
            // TEMP_DISABLED: console.log('� [SUMMARY] Updating step:', {
                // jobId: jobId,
                // targetStep,
                // jobObject: job ? Object.keys(job) : 'no job'
            // });
            
            if (!jobId) {
                throw new Error('No job ID available');
            }

            // TEMP_DISABLED: console.log(`📊 [SUMMARY] Calling updateJobStep API for job ${jobId}, step ${targetStep}`);
            
            const response = await updateJobStep(jobId, targetStep);
            
            if (response.success) {
                // TEMP_DISABLED: console.log(`✅ [SUMMARY] Step updated successfully:`, response.data);
                
                // ✅ Mettre à jour l'objet job local
                setJob((prevJob: any) => {
                    const updatedJob = {
                        ...prevJob,
                        step: {
                            ...prevJob.step,
                            actualStep: targetStep
                        }
                    };
                    
                    // TEMP_DISABLED: console.log('🔍 [SUMMARY] Job updated locally:', {
                        // oldStep: prevJob?.step?.actualStep,
                        // newStep: targetStep
                    // });
                    
                    return updatedJob;
                });
                
                showSuccess(
                    t('jobDetails.messages.nextStep'), 
                    `${t('jobDetails.messages.advancedToStep')} ${targetStep}`
                );
            } else {
                console.error('❌ [SUMMARY] API returned error:', response.error);
                showError(
                    t('jobDetails.messages.syncError'),
                    response.error || t('jobDetails.messages.syncErrorMessage')
                );
                throw new Error(response.error);
            }
            
            return Promise.resolve();
        } catch (error) {

            console.error('❌ [SUMMARY] Error advancing step:', error);
            showError(
                t('jobDetails.messages.stepUpdateError'),
                t('jobDetails.messages.stepUpdateErrorMessage')
            );
            throw error;
        }
    };

    // ✅ FIX BOUCLE INFINIE: Fonction simple pour avancer à l'étape suivante
    // Ne plus appeler handleAdvanceStep car nextStep() fait déjà tout:
    // 1. Met à jour le timer local
    // 2. Appelle syncStepToBackend (API)
    // 3. Appelle onStepChange (met à jour job local via jobDetails)
    const handleNextStep = async () => {
        if (currentStep < totalSteps) {
            try {
                // ✅ nextStep() fait TOUT - pas besoin d'appeler handleAdvanceStep
                nextStep();
                
                // Afficher le message de succès
                const targetStep = currentStep + 1;
                showSuccess(
                    t('jobDetails.messages.nextStep'), 
                    `${t('jobDetails.messages.advancedToStep')} ${targetStep}`
                );
            } catch (error) {
                console.error('Failed to advance step:', error);
                showError(
                    t('jobDetails.messages.stepUpdateError'),
                    t('jobDetails.messages.stepUpdateErrorMessage')
                );
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
                            // TEMP_DISABLED: console.log('📝 [SUMMARY] Signature save result:', result);
                            
                            if (result.success) {setJob({ 
                                    ...job, 
                                    signature_blob: result.signatureUrl,
                                    signatureDataUrl: signature, // Garder aussi la data URL locale
                                    signatureFileUri: '' // Sera mis à jour par signingBloc
                                });
                                showSuccess(t('jobDetails.messages.signatureSaved'));
                            } else {
                                showError(t('jobDetails.messages.signatureSaveError'), result.message || t('jobDetails.messages.signatureSaveErrorMessage'));
                            }
                        } catch (error) {

                            console.error('Erreur lors de la sauvegarde de la signature:', error);
                            showError(t('jobDetails.messages.signatureSaveError'), t('jobDetails.messages.signatureSaveErrorMessage'));
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
