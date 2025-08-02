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

const JobDetails = ({ route, navigation, jobId, day, month, year }: any) => {
    const job = {
        id: jobId || "#LM0000000001",
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
    };
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

    return (
        <View style={ Style.jobDetailsContainer }>
            <TopMenu navigation={ navigation } />
            <RefBookMark jobRef={ job.id } />
            {jobPanel === 0 && (<JobSummary job={job} />)}
            {jobPanel === 1 && (<JobPage job={job} />)}
            {jobPanel === 2 && (<JobClient job={job} />)}
            {jobPanel === 3 && (<JobNote job={job} />)}
            {jobPanel === 4 && (<JobPayment job={job} />)}
            <JobMenu jobPanel={jobPanel} setJobPanel={setJobPanel} />
        </View>
    );
}

export default JobDetails;
    