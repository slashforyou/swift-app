// Summary Page for Job Details, displaying main job information such as client details, addresses, and truck information.

import SigningBloc from '@/src/components/signingBloc';
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import JobTimeLine from '@/src/components/ui/jobPage/jobTimeLine';
import contactLink from '@/src/services/contactLink';
import copyToClipBoard from '@/src/services/copyToClipBoard';
import openMap from '@/src/services/openMap';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { Colors } from '../../constants/Colors';

const JobSummary = ({ job, setJob } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const Style = {
        jobDetailsPage: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
        },
        jobDetailsPageContainerScroll: {
            padding: 20,
        },
        jobDetailsPageProgressLine: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        jobDetailsPageClientZone: {
            marginBottom: 20,
        },
        jobDetailsPageClientZoneText: {
            fontSize: 16,
            marginBottom: 5,
            width: '100%',
            color: '#333',
            textAlign: 'left',
            lineHeight: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            padding: 10,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        },
        jobDetailsPageClientZoneTextName: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
            color: '#000',
            textAlign: 'left',
            lineHeight: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            width: '100%',
            padding: 10,
        },
        jobDetailsPageClientZoneTextAddressBox: {
            marginBottom: 5,
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#ccc',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            cursor: 'pointer',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            gap: 10,
        },
        jobDetailsPageClientZoneTextAddress: {
            fontSize: 16,
        },
        jobDetailsPageClientZoneAddresses: {
            marginBottom: 10,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 10,
        },
        jobDetailsPageClientZonePhoneButton: {
            backgroundColor: '#e0e0e0',
            padding: 2,
            borderRadius: 5,
            marginLeft: 10,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#ccc',
            selfAlign: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            width: '100%',
            maxWidth: 200,
            paddingVertical: 5,
            
        },
        jobDetailsPageClientZonePhoneButtonText: {
            fontSize: 16,
            color: '#333',
            marginRight: 5,
        },
        jobDetailsPageTruckZone: {
            marginBottom: 20,
        },
        jobDetailsPageTruckZoneText: {
            fontSize: 16,
            marginBottom: 5,
        },
        jobDetailsPageClientZoneSigning: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        jobDetailsPageClientSignatureText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 10,
        },
        jobDetailsPageClientSignatureButton: {
            backgroundColor: '#e0e0e0',
            padding: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            display: 'flex',
            gap: 10,
        },
        jobDetailsPageClientSignatureButtonText: {
            fontSize: 16,
            color: '#333',
        },
    };
    const handleAdressPress = (index: number) => {
        // Handle address press, e.g., navigate to a map view or show address details
        console.log(`Address ${index + 1} pressed:`, job.addresses[index]);
    };
    const handlePhonePress = (phone: string) => {
        // Handle phone press, e.g., initiate a call or show a phone number modal
        console.log(`Phone number pressed: ${phone}`);
    };

    const [isSigningVisible, setIsSigningVisible] = React.useState(false);

    return (
        <>
        {isSigningVisible && (
        <SigningBloc 
            isVisible={isSigningVisible} setIsVisible={setIsSigningVisible} onSave={(signature) => console.log('Signature saved:', signature)} job={job} setJob={setJob}/>
        )}
        <JobPageScrollContainer>
                <JobContainerWithTitle title="Job Summary">
                    <JobTimeLine job={job} />
                </JobContainerWithTitle>
                <JobContainerWithTitle title="Client Details">
                    <View style={ Style.jobDetailsPageClientZoneSigning }>
                        {
                            job.signatureDataUrl !== '' && job.signatureFileUri !== '' ?
                            <Text style={ Style.jobDetailsPageClientSignatureText }>The client has signed the contract.</Text>
                            :
                            <>
                                <Text style={ Style.jobDetailsPageClientSignatureText }>The client has not signed the contract.</Text>
                                <Pressable onPress={() => setIsSigningVisible(true)} style={ Style.jobDetailsPageClientSignatureButton }>
                                    <Text style={ Style.jobDetailsPageClientSignatureButtonText }>Sign Contract</Text>
                                    <Ionicons name="create-outline" size={20} color="#333" />
                                </Pressable>
                            </>
                        }
                        
                    </View>
                    <Text style={ Style.jobDetailsPageClientZoneTextName }>{ job.client.firstName } { job.client.lastName }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Phone:  
                        <Pressable onPress={() => copyToClipBoard(job.client.phone)} >
                            <Text>
                                { job.client.phone }
                            </Text>
                        </Pressable>
                    </Text>
                    <Pressable onPress={() => contactLink(job.client.phone, 'tel')} style={ Style.jobDetailsPageClientZonePhoneButton }>
                            <Text style={ Style.jobDetailsPageClientZonePhoneButtonText }>Call Client</Text>
                            <Ionicons name="call" size={20} color="#333" />
                        </Pressable>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Contact: { job.contact.firstName } { job.contact.lastName }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Contact Phone: 
                        <Pressable onPress={() => copyToClipBoard(job.contact.phone)} >
                            <Text>
                                { job.contact.phone }
                            </Text>
                        </Pressable></Text>
                    <Pressable onPress={() => contactLink(job.contact.phone, 'tel')} style={ Style.jobDetailsPageClientZonePhoneButton }>
                            <Text style={ Style.jobDetailsPageClientZonePhoneButtonText }>Call Contact</Text>
                            <Ionicons name="call" size={20} color="#333" />
                        </Pressable>
                    <View style={ Style.jobDetailsPageClientZoneAddresses }>
                        <Text style={ Style.jobDetailsPageClientZoneText }>Addresses:</Text>
                        {
                            job.addresses.length > 0 &&
                            job.addresses.map((address, index) => (
                                <Pressable key={index} onPress={() => openMap(address.street, address.latitude, address.longitude)} style={ Style.jobDetailsPageClientZoneTextAddressBox }>
                                    <Ionicons name="location-outline" size={20} color="#333" />
                                    <Text style={ Style.jobDetailsPageClientZoneTextAddress }>{ address.street }, { address.city }, { address.state } { address.zip }</Text>
                                </Pressable>
                            ))
                        }
                    </View>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Start Window: { new Date(job.time.startWindowStart).toLocaleString() } - { new Date(job.time.startWindowEnd).toLocaleString() }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>End Window: { new Date(job.time.endWindowStart).toLocaleString() } - { new Date(job.time.endWindowEnd).toLocaleString() }</Text>
                </JobContainerWithTitle>
                <JobContainerWithTitle title="Truck Details">
                    <Text style={ Style.jobDetailsPageClientZoneText }>Truck License Plate: { job.truck.licensePlate }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Truck Name: { job.truck.name }</Text>
                </JobContainerWithTitle>
        </JobPageScrollContainer>
        </>
    );
};

export default JobSummary;
