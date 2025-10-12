/**
 * Summary Page - Page de résumé du job avec modals améliorés
 */

import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import SigningBloc from '../../components/signingBloc';
import JobProgressSection from '../../components/jobDetails/sections/JobProgressSection';
import SignatureSection from '../../components/jobDetails/sections/SignatureSection';
import ClientDetailsSection from '../../components/jobDetails/sections/ClientDetailsSection';
import ContactDetailsSection from '../../components/jobDetails/sections/ContactDetailsSection';
import AddressesSection from '../../components/jobDetails/sections/AddressesSection';
import TimeWindowsSection from '../../components/jobDetails/sections/TimeWindowsSection';
import TruckDetailsSection from '../../components/jobDetails/sections/TruckDetailsSection';
import QuickActionsSection from '../../components/jobDetails/sections/QuickActionsSection';
import PhotoSelectionModal from '../../components/jobDetails/modals/PhotoSelectionModal';
import ImprovedNoteModal from '../../components/jobDetails/modals/ImprovedNoteModal';
import JobStepAdvanceModal from '../../components/jobDetails/modals/JobStepAdvanceModal';
import JobClock from '../../components/jobDetails/JobClock';
import { useJobNotes } from '../../hooks/useJobNotes';
import { useJobPhotos } from '../../hooks/useJobPhotos';
import { useToast } from '../../context/ToastProvider';
import { updateJobStep } from '../../services/jobSteps';

const JobSummary = ({ job, setJob } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const [isSigningVisible, setIsSigningVisible] = useState(false);
    const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
    const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    const [isStepAdvanceModalVisible, setIsStepAdvanceModalVisible] = useState(false);

    // Hooks pour la gestion des notes et photos
    const { addNote } = useJobNotes(job?.id);
    const { uploadPhoto } = useJobPhotos(job?.id);
    const { showSuccess, showError } = useToast();

    const handleSignContract = () => {
        setIsSigningVisible(true);
    };

    // Gestion des notes avec API
    const handleAddNote = async (content: string, type: 'general' | 'important' | 'client' | 'internal' = 'general') => {
        try {
            const result = await addNote({ content, type });
            if (result) {
                showSuccess('Note ajoutée', 'La note a été enregistrée avec succès');
                return Promise.resolve();
            } else {
                throw new Error('Échec de l\'ajout de la note');
            }
        } catch (error) {
            console.error('Error adding note:', error);
            showError('Erreur', 'Impossible d\'ajouter la note. Veuillez réessayer.');
            throw error;
        }
    };

    // Gestion des photos avec API
    const handlePhotoSelected = async (photoUri: string) => {
        try {
            const result = await uploadPhoto(photoUri, `Photo du job ${job?.id || 'N/A'}`);
            if (result) {
                showSuccess('Photo ajoutée', 'La photo a été uploadée avec succès');
            } else {
                throw new Error('Échec de l\'upload de la photo');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            showError('Erreur', 'Impossible d\'ajouter la photo. Veuillez réessayer.');
        }
    };

    // Gestion de l'avancement des étapes
    const handleAdvanceStep = async (targetStep: number) => {
        try {
            // Mettre à jour le job localement immédiatement pour l'UI
            setJob((prevJob: any) => ({
                ...prevJob,
                step: {
                    ...prevJob.step,
                    actualStep: targetStep
                },
                // Mettre à jour aussi current_step si disponible
                current_step: targetStep
            }));
            
            // Appel API pour mettre à jour sur le serveur
            if (job?.id) {
                try {
                    await updateJobStep(job.id, targetStep);
                } catch (apiError) {
                    console.warn('API update failed, keeping local state:', apiError);
                    // On garde la mise à jour locale même si l'API échoue
                    // L'utilisateur verra le changement et on peut retry plus tard
                }
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error advancing step:', error);
            // Restaurer l'état précédent en cas d'erreur critique
            setJob((prevJob: any) => ({
                ...prevJob,
                step: {
                    ...prevJob.step,
                    actualStep: job?.step?.actualStep || job?.current_step || 1
                }
            }));
            throw error;
        }
    };

    // Fonction simple pour avancer à l'étape suivante
    const handleNextStep = async () => {
        const currentStep = job?.step?.actualStep || job?.current_step || 1;
        const nextStep = currentStep + 1;
        
        if (nextStep <= 5) { // Maximum 5 étapes
            await handleAdvanceStep(nextStep);
            showSuccess('Étape suivante', `Passé à l'étape ${nextStep}`);
        }
    };

    return (
        <>
            {/* Modal de signature */}
            {isSigningVisible && (
                <SigningBloc 
                    isVisible={isSigningVisible} 
                    setIsVisible={setIsSigningVisible} 
                    onSave={(signature: any) => console.log('Signature saved:', signature)} 
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
                {/* Module Clock - Chronométrage du job */}
                <JobClock job={job} />
                
                {/* Section principale : Progression du job */}
                <JobProgressSection job={job} onAdvanceStep={handleNextStep} />
                
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
