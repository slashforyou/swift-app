// Job Page for displaying job details including type of job, number of men, number of stops, and more.

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

const JobPage = ({ job }: { job: any }) => {

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
    };

    return (
        <View style={Style.jobDetailsPage}>
            <Text style={Style.jobDetailsPageTitleText}>Job Details</Text>
            <Text style={Style.jobDetailsPageClientZoneText}>Client: {job.client.name}</Text>
            <Text style={Style.jobDetailsPageClientZoneText}>Phone: {job.client.phone}</Text>
            <Text style={Style.jobDetailsPageClientZoneText}>Email: {job.client.email}</Text>
            <Text style={Style.jobDetailsPageClientZoneText}>Addresses:</Text>
            {job.addresses.map((address: any, index: number) => (
                <Pressable key={index} onPress={() => console.log(`Address ${index + 1} pressed`)}>
                    <Text style={Style.jobDetailsPageClientZoneTextAddress}>{`${address.type}: ${address.street}, ${address.city}, ${address.state}, ${address.zip}`}</Text>
                </Pressable>
            ))}
            <Text style={Style.jobDetailsPageClientZoneText}>Truck: {job.truck.name} ({job.truck.licensePlate})</Text>
        </View>
    );
};

export default JobPage;