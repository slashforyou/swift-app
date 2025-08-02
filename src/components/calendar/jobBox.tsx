import Ionicons from '@react-native-vector-icons/ionicons';
import e from 'express';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
// This component is used to display a job box in the calendar day screen
// It shows basic information about the job

const JobBox = ({ job, navigation, day, month, year }: any) => {

    const Style = {
        dayJobBox: {
            backgroundColor: '#f9f9f9',
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            width: '100%',
            flexDirection: 'column',
        },
        jobTitle: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 5,
            padding : 5,
            backgroundColor: 'rgb(217, 88, 88)',
            color: '#fff',
            justifyContent: 'center',
            borderRadius: 5,
        },
        jobTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
        },
        jobStartSuburb: {
            fontSize: 14,
            color: '#666',
            fontWeight: 'bold',
            marginTop: 5,
        },
        jobClientName: {
            fontSize: 16,
            color: '#333',
            marginTop: 5,
        },
        dayJobBoxRightPanel: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-end',
        },
        jobStartTimeTitle: {
            fontSize: 16,
            color: '#555',
            fontWeight: 'bold',
        },
        jobStartTime: {
            fontSize: 16,
            color: '#333',
            marginTop: 5,
        },
        dayJobBoxLeftPanel: {
            flex: 1,
            justifyContent: 'center',
        },
        dayJobBoxBottomPanel: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: 5,
        },
        jobTruckTitle: {
            fontSize: 16,
            color: '#555',
            fontWeight: 'bold',
            flexDirection: 'row',
            alignItems: 'center',
        },
        jobTruckText: {
            fontSize: 16,
            color: '#333',
            marginLeft: 5,
        },
        dayJobBoxTopPanel: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            width: '100%',
            marginBottom: 10,
        },
        dayJobTruckPlate: {
            backgroundColor: '#eee',
            padding: 5,
            borderRadius: 5,
            marginTop: 5,
            borderWidth: 2,
            borderColor: '#555',
        },
        jobTruckPlateText: {
            fontSize: 16,
            color: '#333',
            fontWeight: 'bold',
            textAlign: 'center',
        },
        jobTruckName: {
            padding: 5,
            borderRadius: 5,
            marginTop: 5,
        },
        jobTruckNameText: {
            fontSize: 16,
            color: '#333',
            fontWeight: 'bold',
        },
        jobTruckIcon: {
            marginRight: 5,
        },
        jobTruckPlateIcon: {
            marginRight: 5,
            color: '#555',
        },
        jobTruckNameIcon: {
            marginRight: 5,
            color: '#555',
        },
        jobQuickActionButtonCall: {
            backgroundColor: '#fff',
            padding: 5,
            borderRadius: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginBottom: 10,
            borderWidth: 1,
            borderColor: 'rgb(4, 223, 146)',
        },
        jobQuickActionButtonCallText: {
            fontSize: 16,
            color: '#555',
            marginBottom: 5,
            textAlign: 'center',
        },
        jobQuickActionButtonMap: {
            backgroundColor: '#fff',
            padding: 5,
            borderRadius: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: 'rgb(4, 143, 223)',
        },
        jobQuickActionButtonMapText: {
            fontSize: 16,
            color: '#555',
            marginBottom: 5,
            textAlign: 'center',
        },
    };

    const handlePress = (e) => {
        e.stopPropagation(); // Prevents the event from bubbling up
        if (navigation && typeof navigation.navigate === 'function') {
            console.log(`Job ${job.id} selected, navigating to details...`);
            navigation.navigate('JobDetails', { jobId: job.id, navigation, day, month, year });
        } else {
            console.log(`Job ${job.id} selected`);
        }
    }


    return (
        <Pressable style={Style.dayJobBox} onPress={handlePress}>
            <View style={ Style.dayJobBoxTopPanel }>
                <View style={ Style.dayJobBoxLeftPanel }>
                    <View style={ Style.jobTitle }>
                    <Text style={Style.jobTitleText}>{job.id}</Text>
                    </View>
                    <Text style={Style.jobStartSuburb }>{job.addresses[0].city}</Text>
                    <Text style={Style.jobClientName}>
                        {job.client.firstName} {job.client.lastName}
                    </Text>
                </View>
                <View style={ Style.dayJobBoxRightPanel }>
                    <Text style={Style.jobStartTimeTitle}>Start Time:</Text>
                    <Text style={Style.jobStartTime}>{
                        new Date(job.time.startWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                    <Text style={Style.jobStartTime}>{
                        new Date(job.time.startWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                </View>
            </View>
            <View style={ Style.dayJobBoxBottomPanel }>
                <View style={Style.dayJobBoxLeftPanel}>
                    <Text style={Style.jobTruckTitle}>
                         <Ionicons name="car" size={16} color="#555" />
                         Truck:
                    </Text>
                    <View style={Style.dayJobTruckPlate}>
                        <Text style={Style.jobTruckPlateText}>{job.truck.licensePlate}</Text>
                    </View>
                    <View style={Style.jobTruckName}>
                        <Text style={Style.jobTruckNameText}>{job.truck.name}</Text>
                    </View>
                </View>
                <View style={Style.dayJobBoxRightPanel}>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Call ${job.client.phone}`)} style={ Style.jobQuickActionButtonCall }>
                        <Ionicons name="call" size={18} color="#555" style={ Style.jobTruckIcon } />
                        <Text style={ Style.jobQuickActionButtonCallText }>Call</Text>
                    </Pressable>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Map to ${job.addresses[0].street}`)} style={ Style.jobQuickActionButtonMap }>
                        <Ionicons name="navigate" size={18} color="#555" style={ Style.jobTruckIcon } />
                        <Text style={ Style.jobQuickActionButtonMapText }>Map</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

export default JobBox;