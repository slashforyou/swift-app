/**
 * JobDetails - Écran principal des détails de tâche
 * Architecture moderne avec gestion correcte des Safe Areas et marges
 */
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobDetailsHeader from '../components/jobDetails/JobDetailsHeader';
import TabMenu from '../components/ui/TabMenu';
import Toast from '../components/ui/toastNotification';
import { DESIGN_TOKENS } from '../constants/Styles';
import { getTemplateSteps, JobTemplate } from '../constants/JobSteps';
import { JobStateProvider } from '../context/JobStateProvider';
import { JobTimerProvider } from '../context/JobTimerProvider';
import { useTheme } from '../context/ThemeProvider';
import { useJobDetails } from '../hooks/useJobDetails';
import { useLocalization } from '../localization/useLocalization';
import { useAuthCheck } from '../utils/checkAuth';
import JobClient from './JobDetailsScreens/client';
import JobPage from './JobDetailsScreens/job';
import JobNote from './JobDetailsScreens/note';
import PaymentScreen from './JobDetailsScreens/payment';
import JobSummary from './JobDetailsScreens/summary';

// Types et interfaces
interface JobDetailsProps {
    route?: any;
    navigation: any;
    jobId?: string;
    day?: string;
    month?: string;
    year?: string;
}

interface ToastState {
    message: string;
    type: 'info' | 'success' | 'error';
    status: boolean;
}

// Hook personnalisé pour les toasts
const useToast = () => {
    const [toastDetails, setToastDetails] = useState<ToastState>({
        message: '',
        type: 'info',
        status: false,
    });

    const showToast = (message: string, type: 'info' | 'success' | 'error') => {
        setToastDetails({ message, type, status: true });
        setTimeout(() => {
            setToastDetails({ message: '', type: 'info', status: false });
        }, 3000);
    };

    return { toastDetails, showToast };
};

const JobDetails: React.FC<JobDetailsProps> = ({ route, navigation, jobId, day, month, year }) => {
    const insets = useSafeAreaInsets();
    const { toastDetails, showToast } = useToast();
    const { isLoading: authLoading, LoadingComponent } = useAuthCheck(navigation);
    const { colors } = useTheme();
    const { t } = useLocalization();
    
    // Récupération de l'ID du job depuis les paramètres de route ou props
    const actualJobId = route?.params?.jobId || jobId || route?.params?.id;
    // Hook principal pour les données du job
    const { 
        jobDetails, 
        isLoading: jobLoading, 
        error, 
        refreshJobDetails,
        updateJob,
        addNote,
        startJob,
        pauseJob,
        resumeJob,
        completeJob,
        isUpdating,
        isAddingNote,
        isPerformingAction,
        isSessionExpired
    } = useJobDetails(actualJobId);
    
    // États locaux pour l'UI et données adaptées des vraies données API
    const [job, setJob] = useState({
        id: actualJobId || "#LM0000000001",
        code: actualJobId || "#LM0000000001", // Ajouter le code dans la structure par défaut
        signatureDataUrl: '',
        signatureFileUri: '',
        step : {
            actualStep: 0, // ✅ Commence à 0 (job pas démarré)
            steps : [
                { id: 1, name: t('jobDetails.steps.pickup'), description: t('jobDetails.steps.pickupDescription')},
                { id: 2, name: t('jobDetails.steps.intermediate'), description: t('jobDetails.steps.intermediateDescription')},
                { id: 3, name: t('jobDetails.steps.dropoff'), description: t('jobDetails.steps.dropoffDescription')},
            ],
        },
        // ✅ Steps dynamiques du nouveau système
        steps: getTemplateSteps(JobTemplate.SIMPLE_MOVE), // Template par défaut
        client: {
            firstName: "Client A",
            lastName: "Last Name", 
            phone: "+1234567890",
            email: "mail@mail.com",
            type: t('jobDetails.client.firstTimeClient'),
        },
        contact: {
            firstName: "Contact A",
            lastName: "Last Name",
            phone: "+1234567890",
        },
        addresses: [
            {
                type: "pickup",
                street: "123 Main St",
                city: "City A",
                state: "State A", 
                zip: "12345",
            },
            {
                type: "dropoff",
                street: "456 Elm St",
                city: "City B",
                state: "State B",
                zip: "67890",
            }
        ],
        time: {
            startWindowStart: "2023-10-01T08:00:00Z",
            startWindowEnd: "2023-10-01T10:00:00Z",
            endWindowStart: "2023-10-01T12:00:00Z", 
            endWindowEnd: "2023-10-01T14:00:00Z",
        },
        truck: {
            licensePlate: "ABC123",
            name: "Truck A",
        },
        notes: [],
        payment: {
            status: "unsettled", 
            amount: '550.00',
            amountWithoutTax: '500.00',
            amountPaid: '0.00',
            amountToBePaid: '550.00',
            taxe: {
                gst: '50.00',
                gstRate: 10,
                amountWithoutTax: '500.00',
            },
            currency: 'AUD',
            dueDate: 'N/A',
            paymentMethod: 'N/A',
            transactionId: 'N/A',
            paymentLink: 'N/A',
            paymentTime: 'N/A',
            paymentDetails: 'N/A',
            savedCards: [
                {
                    id: 1,
                    cardNumber: '4242 4242 4242 4242',
                    cardHolderName: 'John Doe',
                    expiryDate: '12/25',
                    cvv: '123',
                },
                {
                    id: 2,
                    cardNumber: '5555 5555 5555 4444',
                    cardHolderName: 'Jane Doe',
                    expiryDate: '11/24',
                    cvv: '456',
                },
            ],
        },
        items: [
            {
                id: 1,
                name: "Toy-boy",
                number: 1,
                checked: false,
            },
            {
                id: 2,
                name: "TV Unit",
                number: 1,
                checked: false, // true if the item is checked
            },
            {
                id: 3,
                name: "Sofa",
                number: 1,
                checked: false, // true if the item is checked
            },
            {
                id: 4,
                name: "Bed",
                number: 1,
                checked: false, // true if the item is checked
            },
        ],
        contractor : {
            Name: "Contractor A",
            ContactName: "Contact A",
            Phone: "+1234567890",
            Email: "contractor@example.com"
        },
        contractee : {
            Name: "Contractee A",
            ContactName: "Contact A",
            Phone: "+1234567890",
            Email: "contractee@example.com"
        }
    });
    
    // Effet pour mettre à jour les données locales quand jobDetails change
    React.useEffect(() => {
        if (jobDetails) {
            console.log('🔄 [JobDetails] Updating local job data from API data...');
            console.log('🔍 [JobDetails] jobDetails structure:', {
                hasJob: !!jobDetails.job,
                hasClient: !!jobDetails.client,
                clientKeys: jobDetails.client ? Object.keys(jobDetails.client) : [],
                jobKeys: jobDetails.job ? Object.keys(jobDetails.job) : []
            });
            
            // Mise à jour des données avec les vraies données de l'API transformées
            setJob((prevJob: any) => {
                // ✅ Déterminer le template de steps basé sur les données du job
                let jobTemplate = JobTemplate.SIMPLE_MOVE; // Par défaut
                
                // TODO: Logique pour déterminer le template depuis l'API
                // Exemple: if (jobDetails.job?.has_storage) jobTemplate = JobTemplate.WITH_STORAGE;
                // Exemple: if (jobDetails.addresses?.length > 2) jobTemplate = JobTemplate.MULTI_STOP;
                
                const dynamicSteps = getTemplateSteps(jobTemplate);
                
                return {
                    ...prevJob,
                    id: jobDetails.job?.id || actualJobId,
                    code: jobDetails.job?.code || actualJobId, // Ajouter le code du job
                    // ✅ Steps dynamiques basés sur le job
                    steps: dynamicSteps,
                    step: {
                        ...prevJob.step,
                        actualStep: jobDetails.job?.current_step || prevJob.step?.actualStep || 0,
                    },
                    client: {
                        firstName: jobDetails.client?.firstName || 'Client',
                        lastName: jobDetails.client?.lastName || 'Inconnu', 
                        phone: jobDetails.client?.phone || 'N/A',
                        email: jobDetails.job?.client_email || 'N/A', // Fallback sur job.client_email
                        type: 'Client', // Pour l'instant on met une valeur par défaut
                    },
                    notes: jobDetails.notes?.map((note: any) => ({
                        id: parseInt(note.id),
                        title: note.title || t('jobDetails.defaultNote'),
                        content: note.content,
                        createdAt: note.created_at,
                        type: note.note_type || 0
                    })) || [],
                    truck: jobDetails.trucks?.length > 0 ? {
                        licensePlate: jobDetails.trucks[0].license_plate,
                        name: jobDetails.trucks[0].truck_name,
                    } : prevJob.truck,
                    items: jobDetails.items?.map((item: any, index: number) => ({
                        id: item.id, // Garder l'ID API réel !
                        name: item.name,
                        number: item.quantity,
                        checked: item.is_checked === 1,
                        item_checked: item.is_checked === 1,
                    })) || [],
                    addresses: jobDetails.addresses && jobDetails.addresses.length > 0 
                        ? jobDetails.addresses.map((address: any) => ({
                            id: address.id,
                            type: address.type,
                            street: address.street,
                            city: address.city,
                            state: address.state,
                            zip: address.zip,
                            position: address.position,
                        }))
                        : prevJob.addresses, // Fallback sur les adresses par défaut si pas d'adresses API
                    time: {
                        startWindowStart: jobDetails.job?.start_window_start || prevJob.time.startWindowStart,
                        startWindowEnd: jobDetails.job?.start_window_end || prevJob.time.startWindowEnd,
                        endWindowStart: jobDetails.job?.end_window_start || prevJob.time.endWindowStart,
                        endWindowEnd: jobDetails.job?.end_window_end || prevJob.time.endWindowEnd,
                    },
                    // Ajouter aussi les champs directement sur l'objet pour compatibilité
                    start_window_start: jobDetails.job?.start_window_start,
                    start_window_end: jobDetails.job?.start_window_end,
                    end_window_start: jobDetails.job?.end_window_start,
                    end_window_end: jobDetails.job?.end_window_end
                };
            });            console.log('✅ [JobDetails] Local job data updated with API data');
        }
    }, [jobDetails]);
    
    const [jobPanel, setJobPanel] = useState('summary');
    // jobPanel: 'summary', 'job', 'client', 'notes', 'payment'

    // ✅ Handler pour mettre à jour l'étape du job quand le timer change
    const handleStepChange = (newStep: number) => {
        console.log('🔄 [JobDetails] Timer step changed to:', newStep);
        setJob((prevJob: any) => ({
            ...prevJob,
            step: {
                ...prevJob.step,
                actualStep: newStep
            },
            current_step: newStep
        }));
    };

    // ✅ Handler pour la complétion du job
    const handleJobCompleted = (finalCost: number, billableHours: number) => {
        console.log('🎉 [JobDetails] Job completed!', { finalCost, billableHours });
        
        // Basculer automatiquement vers le panel de paiement
        setJobPanel('payment');
        
        // Afficher un toast de succès
        showToast(
            `Job terminé ! Montant: $${finalCost.toFixed(2)} AUD (${billableHours.toFixed(2)}h facturables)`,
            'success'
        );
    };

    // Handler pour TabMenu
    const handleTabPress = (tabId: string) => {
        setJobPanel(tabId);
    };

    // Titres des panneaux
    const getPanelTitle = () => {
        switch (jobPanel) {
            case 'summary': return t('jobDetails.panels.summary');
            case 'job': return t('jobDetails.panels.jobDetails');
            case 'client': return t('jobDetails.panels.clientInfo');
            case 'notes': return t('jobDetails.panels.notes');
            case 'payment': return t('jobDetails.panels.payment');
            default: return t('jobDetails.panels.jobDetails');
        }
    };

    // Gestion des états de chargement
    if (authLoading || (jobLoading && !jobDetails)) {
        return LoadingComponent;
    }
    
    // Si on n'a pas d'ID de job valide
    if (!actualJobId || actualJobId === 'undefined' || actualJobId === 'null') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
                    ❌ {t('jobDetails.errors.invalidJobId')}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
                    {t('jobDetails.errors.cannotLoadDetails')}
                </Text>
            </View>
        );
    }

    // Affichage d'erreur
    if (error && !isSessionExpired) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
                <Text style={{ color: colors.error, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                    ❌ {t('jobDetails.errors.loadingError')}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                    {error}
                </Text>
            </View>
        );
    }

    const currentStep = job.step.actualStep || 0;
    const totalSteps = job.step.steps.length || 6;

    return (
        <JobTimerProvider
            jobId={actualJobId}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepChange={handleStepChange}
            onJobCompleted={handleJobCompleted}
        >
            <View style={{
                backgroundColor: colors.background,
                width: '100%',
                height: '100%',
                flex: 1,
            }}>
                {/* Header moderne avec navigation et RefBookMark */}
                <JobDetailsHeader
                    navigation={navigation}
                    jobRef={job.code || jobDetails?.job?.code || job.id}
                    title={getPanelTitle()}
                    onToast={showToast}
                />
                
                {/* ScrollView principal */}
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: DESIGN_TOKENS.spacing.lg,
                        paddingBottom: 60 + insets.bottom + DESIGN_TOKENS.spacing.lg, // JobMenu + Safe area + espacement
                        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    }}
                >
                    {jobPanel === 'summary' && <JobSummary job={job} setJob={setJob} />}
                    {jobPanel === 'job' && <JobPage job={job} setJob={setJob} />}
                    {jobPanel === 'client' && <JobClient job={job} setJob={setJob} />}
                    {jobPanel === 'notes' && (
                        <JobNote 
                            job={job} 
                            setJob={setJob}
                        />
                    )}
                    {jobPanel === 'payment' && <PaymentScreen job={job} setJob={setJob} />}
                </ScrollView>
                
                {/* Job Menu fixé en bas */}
                <View style={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.backgroundSecondary,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    zIndex: 10,
                }}>
                    <TabMenu
                        activeTab={jobPanel}
                        onTabPress={handleTabPress}
                        page="jobDetails"
                    />
                </View>
                
                {/* Toast au-dessus de tout */}
                <View style={{
                    position: 'absolute',
                    top: 100, // Position fixe sous le header
                    left: DESIGN_TOKENS.spacing.lg,
                    right: DESIGN_TOKENS.spacing.lg,
                    zIndex: 20,
                    pointerEvents: 'none',
                }}>
                    <Toast 
                        message={toastDetails.message} 
                        type={toastDetails.type} 
                        status={toastDetails.status} 
                    />
                </View>
            </View>
        </JobTimerProvider>
    );
};

// Wrapper avec JobStateProvider pour persistence et state management
const JobDetailsWithProvider: React.FC<JobDetailsProps> = (props) => {
    const actualJobId = props.route?.params?.jobId || props.jobId || props.route?.params?.id;
    
    // Si pas de jobId, afficher le composant sans provider (fallback)
    if (!actualJobId) {
        return <JobDetails {...props} />;
    }
    
    return (
        <JobStateProvider jobId={actualJobId}>
            <JobDetails {...props} />
        </JobStateProvider>
    );
};

export default JobDetailsWithProvider;
    