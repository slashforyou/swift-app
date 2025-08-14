import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import TopMenu from '../components/top_menu/top_menu';
import { text } from 'stream/consumers';
import JobMenu from '../components/jobMenu';
import JobSummary from './JobDetailsScreens/summary';
import { useState } from 'react';
import JobClient from './JobDetailsScreens/client';
import JobPage from './JobDetailsScreens/job';
import JobNote from './JobDetailsScreens/note';
import JobPayment from './JobDetailsScreens/payment';
import RefBookMark from '../components/ui/refBookMark';
import { title } from 'process';
import Toast from '../components/ui/toastNotification';

const JobDetails = ({ route, navigation, jobId, day, month, year }: any) => {
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
            amount: 'N/A', // total amount for the job with taxes
            amountWithoutTax: 'N/A', // total amount without taxes
            amountPaid: 'N/A', // total amount paid so far
            amountToBePaid: 'N/A', // amount to be paid
            taxe: {
                gst: 'N/A',
                gstRate: 10, // GST rate in percentage
                amountWithoutTax: 'N/A', // amount without tax
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
    // jobPanel: 0 - Details, 1 - Chat, 2 - Call, 3 - Info, 4 - Settings

    const Style = {
        jobDetailsContainer: {
            backgroundColor: '#fff',
            width: '100%',
            height: '100%',
            position: 'relative',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        
    };

    const [toastDetails, setToastDetails] = useState({
        message: '',
        type: 'info', // info, success, warning, error
        status: false,
    });

    const toastIt = (message: string, type: string, status: boolean) => {
        setToastDetails({ message, type, status });
        setTimeout(() => {
            setToastDetails({ message: '', type: 'info', status: false });
        }, 3000); // Hide toast after 3 seconds
    }

    return (
        <View style={ Style.jobDetailsContainer }>
            <TopMenu navigation={ navigation } />
            <RefBookMark jobRef={ job.id } toastIt={ toastIt } />
            {jobPanel === 0 && (<JobSummary job={job} setJob={setJob} />)}
            {jobPanel === 1 && (<JobPage job={job} setJob={setJob} />)}
            {jobPanel === 2 && (<JobClient job={job} setJob={setJob} />)}
            {jobPanel === 3 && (<JobNote job={job} setJob={setJob} />)}
            {jobPanel === 4 && (<JobPayment job={job} setJob={setJob} />)}
            <JobMenu jobPanel={jobPanel} setJobPanel={setJobPanel} />
            <Toast message={toastDetails.message} type={toastDetails.type} status={toastDetails.status} />
        </View>
    );
}

export default JobDetails;
    