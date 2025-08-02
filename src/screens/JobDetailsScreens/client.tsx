// Client Page for Job Details, displaying client information such as name, phone, and email.
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text } from 'react-native';

const JobClient = ({ job, navigation }: any) => {
    const Style = {
        jobDetailsPageClientZone: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
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
        jobDetailsPageClientZoneTextType: {
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 10,
        },
    };

    return (
        <View style={Style.jobDetailsPageClientZone}>
            <Text style={Style.jobDetailsPageClientZoneText}>Client Details:</Text>
            <View style={Style.jobDetailsPageClientZoneTextAddressBox}>
                <Text style={Style.jobDetailsPageClientZoneTextAddress}>
                    {job.client.firstName} {job.client.lastName}
                </Text>
                <Text style={Style.jobDetailsPageClientZoneTextAddress}>
                    <Ionicons name="call" size={16} color="#000" />{' '}{job.client.phone}
                </Text>
                <Text style={Style.jobDetailsPageClientZoneTextAddress}>
                    <Ionicons name="mail" size={16} color="#000" />{' '}{job.client.email}
                </Text>
            </View>
            <View style={Style.jobDetailsPageClientZoneTextAddressBox}>
                <Text style={Style.jobDetailsPageClientZoneTextType}>{job.client.type}</Text>
            </View>
        </View>
    );
};

export default JobClient;
