/**
 * JobDetails - Écran principal des détails de tâche
 * Architecture moderne avec gestion correcte des Safe Areas et marges
 */
import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobMenu from '../components/jobMenu';
import JobSummary from './JobDetailsScreens/summary';
import JobClient from './JobDetailsScreens/client';
import JobPage from './JobDetailsScreens/job';
import JobNote from './JobDetailsScreens/note';
import PaymentScreen from './JobDetailsScreens/payment';
import JobDetailsHeader from '../components/jobDetails/JobDetailsHeader';
import Toast from '../components/ui/toastNotification';
import { useAuthCheck } from '../utils/checkAuth';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useJobDetails } from '../hooks/useJobDetails';

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
    
    // Récupération de l'ID du job depuis les paramètres de route ou props
    const actualJobId = route?.params?.jobId || jobId || route?.params?.id;
    
    console.log('🔍 [JobDetails] Component props:', {
        routeParams: route?.params,
        propJobId: jobId,
        actualJobId,
        day, month, year
    });
    
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
    
    console.log('🔍 [JobDetails] Hook state:', {
        hasJobDetails: !!jobDetails,
        jobTitle: jobDetails?.job?.title,
        clientName: jobDetails?.client?.name,
        isLoading: jobLoading,
        hasError: !!error,
        errorMessage: error
    });
    
    // États locaux pour l'UI et données adaptées des vraies données API
    const [job, setJob] = useState({
        id: actualJobId || "#LM0000000001",
        code: actualJobId || "#LM0000000001", // Ajouter le code dans la structure par défaut
        signatureDataUrl: '',
        signatureFileUri: '',
        step : {
            actualStep: 1,
            steps : [
                { id: 1, name: "Pickup", description: "Pickup from the client location"},
                { id: 2, name: "Intermediate", description: "Dropoff at the intermediate location"},
                { id: 3, name: "Dropoff", description: "Dropoff at the final location"},
            ],
        },
        client: {
            firstName: "Client A",
            lastName: "Last Name", 
            phone: "+1234567890",
            email: "mail@mail.com",
            type: "First Time Client",
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
            setJob((prevJob: any) => ({
                ...prevJob,
                id: jobDetails.job?.id || actualJobId,
                code: jobDetails.job?.code || actualJobId, // Ajouter le code du job
                client: {
                    firstName: jobDetails.client?.firstName || 'Client',
                    lastName: jobDetails.client?.lastName || 'Inconnu', 
                    phone: jobDetails.client?.phone || 'N/A',
                    email: jobDetails.job?.client_email || 'N/A', // Fallback sur job.client_email
                    type: 'Client', // Pour l'instant on met une valeur par défaut
                },
                notes: jobDetails.notes?.map((note: any) => ({
                    id: parseInt(note.id),
                    title: note.title || 'Note',
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
            }));
            
            console.log('✅ [JobDetails] Local job data updated with API data');
        }
    }, [jobDetails]);
    
    const [jobPanel, setJobPanel] = useState(0);
    // jobPanel: 0 - Summary, 1 - Job Details, 2 - Client, 3 - Notes, 4 - Payment

    // Titres des panneaux
    const getPanelTitle = () => {
        switch (jobPanel) {
            case 0: return 'Job Summary';
            case 1: return 'Job Details';
            case 2: return 'Client Information';
            case 3: return 'Notes';
            case 4: return 'Payment';
            default: return 'Job Details';
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
                    ❌ ID de job invalide
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
                    Impossible de charger les détails du job
                </Text>
            </View>
        );
    }

    // Affichage d'erreur
    if (error && !isSessionExpired) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
                <Text style={{ color: colors.error, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                    ❌ Erreur de chargement
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                    {error}
                </Text>
            </View>
        );
    }

    return (
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
                {jobPanel === 0 && <JobSummary job={job} setJob={setJob} />}
                {jobPanel === 1 && <JobPage job={job} setJob={setJob} />}
                {jobPanel === 2 && <JobClient job={job} setJob={setJob} />}
                {jobPanel === 3 && (
                    <JobNote 
                        job={job} 
                        setJob={setJob}
                    />
                )}
                {jobPanel === 4 && <PaymentScreen job={job} setJob={setJob} />}
            </ScrollView>
            
            {/* Job Menu fixé en bas */}
            <View style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: insets.bottom,
                backgroundColor: colors.backgroundSecondary,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                zIndex: 10,
            }}>
                <JobMenu jobPanel={jobPanel} setJobPanel={setJobPanel} />
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
    );
};

export default JobDetails;
    