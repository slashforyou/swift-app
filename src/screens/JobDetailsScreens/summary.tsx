// Summary Page for Job Details, displaying main job information such as client details, addresses, and truck information.

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

const JobSummary = ({ job } : { job: any }) => {
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
        jobDetailsPageTitle: {
            marginBottom: 20,
        },
        jobDetailsPageTitleText: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        jobDetailsPageProgressLine: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        jobDetailsPageProgressLineCanvas: {
            flexDirection: 'row',
            flexGrow: 1,
            justifyContent: 'space-between',
        },
        jobDetailsPageProgressLineStepIndicator: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#ccc',
        },
        jobDetailsPageProgressLineStepDescription: {
            marginLeft: 10,
        },
        jobDetailsPageProgressLineStepDescriptionText: {
            fontSize: 16,
        },
        jobDetailsPageClientZone: {
            marginBottom: 20,
        },
        jobDetailsPageClientZoneText: {
            fontSize: 16,
            marginBottom: 5,
        },
        jobDetailsPageClientZoneTextAddressBox: {
            marginBottom: 5,
        },
        jobDetailsPageClientZoneTextAddress: {
            fontSize: 16,
        },
        jobDetailsPageClientZoneAddresses: {
            marginBottom: 10,
        },
        jobDetailsPageTruckZone: {
            marginBottom: 20,
        },
        jobDetailsPageTruckZoneText: {
            fontSize: 16,
            marginBottom: 5,
        },
    };
    const handleAdressPress = (index: number) => {
        // Handle address press, e.g., navigate to a map view or show address details
        console.log(`Address ${index + 1} pressed:`, job.addresses[index]);
    };

    return (
        <ScrollView style={ Style.jobDetailsPage } contentContainerStyle={ Style.jobDetailsPageContainerScroll }>
                <View style={ Style.jobDetailsPageTitle }>
                    <Text style={ Style.jobDetailsPageTitleText }>
                        Job Ref. { job.id }
                    </Text>
                </View>
                <View style={ Style.jobDetailsPageProgressLine }>
                    <View style={ Style.jobDetailsPageProgressLineCanvas }>
                        <View style={ Style.jobDetailsPageProgressLineStepIndicator } />
                        <View style={ Style.jobDetailsPageProgressLineStepIndicator } />
                        <View style={ Style.jobDetailsPageProgressLineStepIndicator } />
                        <View style={ Style.jobDetailsPageProgressLineStepIndicator } />
                        <View style={ Style.jobDetailsPageProgressLineStepIndicator } />
                    </View>
                    <View style={ Style.jobDetailsPageProgressLineStepDescription }>
                        <Text style={ Style.jobDetailsPageProgressLineStepDescriptionText }>Step 1: Job Created</Text>
                    </View>
                </View>
                <View style={ Style.jobDetailsPageClientZone }>
                    <Text style={ Style.jobDetailsPageClientZoneText }>{ job.client.firstName } { job.client.lastName }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Phone: { job.client.phone }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Contact: { job.contact.firstName } { job.contact.lastName }</Text>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Contact Phone: { job.contact.phone }</Text>
                    <View style={ Style.jobDetailsPageClientZoneAddresses }>
                        <Text style={ Style.jobDetailsPageClientZoneText }>Addresses:</Text>
                        {
                            job.addresses.length > 0 &&
                            job.addresses.map((address, index) => (
                                <Pressable key={index} onPress={() => handleAdressPress(index)} style={ Style.jobDetailsPageClientZoneTextAddressBox }>
                                    <Text style={ Style.jobDetailsPageClientZoneTextAddress }>{ address.street }, { address.city }, { address.state } { address.zip }</Text>
                                </Pressable>
                            ))
                        }
                    </View>
                    <Text style={ Style.jobDetailsPageClientZoneText }>Start Window: { new Date(job.time.startWindowStart).toLocaleString() } - { new Date(job.time.startWindowEnd).toLocaleString() }</Text>
                    <Text>End Window: { new Date(job.time.endWindowStart).toLocaleString() } - { new Date(job.time.endWindowEnd).toLocaleString() }</Text>
                </View>
                <View style={ Style.jobDetailsPageTruckZone }>
                    <Text>Truck License Plate: { job.truck.licensePlate }</Text>
                    <Text>Truck Name: { job.truck.name }</Text>


                </View>
            </ScrollView>
    );
};

export default JobSummary;
