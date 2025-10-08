/**
 * JobDetails - Écran principal des détails de tâche
 * Architecture moderne avec gestion correcte des Safe Areas et marges
 */
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobMenu from '../components/jobMenu';
import JobSummary from './JobDetailsScreens/summary';
import JobClient from './JobDetailsScreens/client';
import JobPage from './JobDetailsScreens/job';
import JobNote from './JobDetailsScreens/note';
import JobPayment from './JobDetailsScreens/payment';
import JobDetailsHeader from '../components/jobDetails/JobDetailsHeader';
import Toast from '../components/ui/toastNotification';
import { useAuthCheck } from '../utils/checkAuth';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';

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
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const { colors } = useTheme();
    
    const [job, setJob] = useState({
        id: jobId || "#LM0000000001",
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
            },
            {
                type: "intermediate",
                street: "789 Oak St",
                city: "City C",
                state: "State C",
                zip: "11223",
            },
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
        notes: [
            {
                id: 1,
                title: "Note 1",
                content: "This is a note for the job.",
                createdAt: "2023-10-01T08:00:00Z",
                type: 0, // 0 - Classic, 1 - Info, 2 - Warning, 3 - Error, 4 - Success
            },
            {
                id: 2,
                title: "Important Note",
                content: "Note 2",
                createdAt: "2023-10-01T09:00:00Z",
                type: 1, // 0 - Classic, 1 - Info, 2 - Warning, 3 - Error, 4 - Success
            },
            {
                id: 3,
                title: "Warning Note",
                content: "Note 3",
                createdAt: "2023-10-01T10:00:00Z",
                type: 2, // 0 - Classic, 1 - Info, 2 - Warning, 3 - Error, 4 - Success
            },
        ],
        payment: {
            status: "unsettled", // unsettled, pending, accepted, rejected, paid
            amount: '550.00', // total amount for the job with taxes
            amountWithoutTax: '500.00', // total amount without taxes
            amountPaid: '0.00', // total amount paid so far
            amountToBePaid: '550.00', // amount to be paid
            taxe: {
                gst: '50.00',
                gstRate: 10, // GST rate in percentage
                amountWithoutTax: '500.00', // amount without tax
            },
            currency: 'AUD',
            dueDate: 'N/A',
            paymentMethod: 'N/A', // cash, card, bank transfer, etc.
            transactionId: 'N/A',
            paymentLink: 'N/A', // link to payment portal if available
            paymentTime: 'N/A', // time of payment if already paid
            paymentDetails: 'N/A', // additional details about the payment
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
        items : [
            {
                id: 1,
                name: "Toy-boy",
                number: 1,
                checked: false, // true if the item is checked
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

    if (isLoading) return LoadingComponent;

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
                jobRef={job.id}
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
                {jobPanel === 3 && <JobNote job={job} setJob={setJob} />}
                {jobPanel === 4 && <JobPayment job={job} setJob={setJob} />}
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
    