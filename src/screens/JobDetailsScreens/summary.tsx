// Summary Page for Job Details, displaying main job information such as client details, addresses, and truck information.

import SigningBloc from '@/src/components/signingBloc';
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import JobTimeLine from '@/src/components/ui/jobPage/jobTimeLine';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import contactLink from '@/src/services/contactLink';
import copyToClipBoard from '@/src/services/copyToClipBoard';
import openMap from '@/src/services/openMap';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

const JobSummary = ({ job, setJob } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();
    const [isSigningVisible, setIsSigningVisible] = React.useState(false);

    return (
        <>
        {isSigningVisible && (
        <SigningBloc 
            isVisible={isSigningVisible} setIsVisible={setIsSigningVisible} onSave={(signature: any) => console.log('Signature saved:', signature)} job={job} setJob={setJob}/>
        )}
        <JobPageScrollContainer>
                {/* Job Timeline */}
                <JobContainerWithTitle title="Job Summary">
                    <JobTimeLine job={job} />
                </JobContainerWithTitle>
                
                {/* Signature Status */}
                <JobContainerWithTitle title="Signature Status">
                    <View style={commonStyles.listItem}>
                        {
                            job.signatureDataUrl !== '' && job.signatureFileUri !== '' ?
                            <Text style={[commonStyles.body, { color: colors.success }]}>✅ The client has signed the contract.</Text>
                            :
                            <>
                                <Text style={[commonStyles.bodySmall, { color: colors.textMuted, marginBottom: 12 }]}>⚠️ The client has not signed the contract.</Text>
                                <Pressable onPress={() => setIsSigningVisible(true)} style={commonStyles.buttonSecondary}>
                                    <Text style={commonStyles.buttonSecondaryText}>Sign Contract</Text>
                                </Pressable>
                            </>
                        }
                    </View>
                </JobContainerWithTitle>
                
                {/* Client Information */}
                <JobContainerWithTitle title="Client Details">
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Client Name
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            {job.client.firstName} {job.client.lastName}
                        </Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Phone Number
                        </Text>
                        <Pressable onPress={() => copyToClipBoard(job.client.phone)}>
                            <Text style={[commonStyles.body, { color: colors.primary, marginTop: 4 }]}>{job.client.phone}</Text>
                        </Pressable>
                    </View>
                    
                    <Pressable onPress={() => contactLink(job.client.phone, 'tel')} style={commonStyles.buttonOutline}>
                        <Text style={commonStyles.buttonOutlineText}>📞 Call Client</Text>
                    </Pressable>
                </JobContainerWithTitle>

                {/* Contact Information */}
                <JobContainerWithTitle title="Contact Person">
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Contact Name
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            {job.contact.firstName} {job.contact.lastName}
                        </Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Phone Number
                        </Text>
                        <Pressable onPress={() => copyToClipBoard(job.contact.phone)}>
                            <Text style={[commonStyles.body, { color: colors.primary, marginTop: 4 }]}>{job.contact.phone}</Text>
                        </Pressable>
                    </View>
                    
                    <Pressable onPress={() => contactLink(job.contact.phone, 'tel')} style={commonStyles.buttonOutline}>
                        <Text style={commonStyles.buttonOutlineText}>📞 Call Contact</Text>
                    </Pressable>
                </JobContainerWithTitle>

                {/* Addresses */}
                <JobContainerWithTitle title="Addresses">
                    {job.addresses.length > 0 ? job.addresses.map((address: any, index: number) => (
                        <Pressable 
                            key={index} 
                            onPress={() => openMap(address.street, address.latitude, address.longitude)} 
                            style={commonStyles.listItem}
                        >
                            <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                Address {index + 1}
                            </Text>
                            <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                📍 {address.street}, {address.city}, {address.state} {address.zip}
                            </Text>
                        </Pressable>
                    )) : (
                        <View style={commonStyles.listItem}>
                            <Text style={[commonStyles.body, { color: colors.textMuted }]}>No addresses available</Text>
                        </View>
                    )}
                </JobContainerWithTitle>

                {/* Time Windows */}
                <JobContainerWithTitle title="Time Windows">
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Start Window
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            🕐 {new Date(job.time.startWindowStart).toLocaleString()} - {new Date(job.time.startWindowEnd).toLocaleString()}
                        </Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            End Window
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            🕐 {new Date(job.time.endWindowStart).toLocaleString()} - {new Date(job.time.endWindowEnd).toLocaleString()}
                        </Text>
                    </View>
                </JobContainerWithTitle>

                {/* Truck Details */}
                <JobContainerWithTitle title="Truck Details">
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            License Plate
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            🚚 {job.truck.licensePlate}
                        </Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Truck Name
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            🚛 {job.truck.name}
                        </Text>
                    </View>
                </JobContainerWithTitle>
        </JobPageScrollContainer>
        </>
    );
};

export default JobSummary;
