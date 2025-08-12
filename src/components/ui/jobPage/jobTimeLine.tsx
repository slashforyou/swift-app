// This component displays a job timeline with step indicators and descriptions.

import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text } from 'react-native';

const JobTimeLine = ({ job } : { job: any }) => {
    const Style = {
        jobDetailsPageTimeLine: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        jobDetailsPageProgressLineCanvas: {
            flexDirection: 'row',
            flexGrow: 1,
            justifyContent: 'space-between',
            width: '90%',
            height: 2,
            backgroundColor: '#e0e0e0',
            zIndex: 1,
            marginTop: 20,
            marginBottom: 10,

        },
        jobDetailsPageProgressLineStepIndicator: {
            width: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: '#ccc',
            position: 'relative',
            zIndex: 2,
            alignSelf: 'center',
            borderWidth: 2,
            borderColor: '#fff',
        },
        jobDetailsPageProgressLineStepDescription: {
            width: '90%',
            padding: 10,
            backgroundColor: '#474747ff',
            borderRadius: 5,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: '#ccc',
            alignSelf: 'center',
            shadowColor: '#000',

        },
        jobDetailsPageProgressLineStepDescriptionText: {
            fontSize: 16,
            color: '#fff',
            textAlign: 'center',
            width: '100%',
        },
        jobDetailsPageProgressLineFloatingTruck: {
            position: 'absolute',
            top: 7,
            left: '50%',
            transform: [{ translateX: -24 }],
            zIndex: 3,
        },
    };

    // Calculate the position of the truck based on the current step
    const truckPositionX = job.step.actualStep * (100 / job.step.steps.length) + '%';

    return (
        <View style={Style.jobDetailsPageTimeLine}>
            <View style={Style.jobDetailsPageProgressLineCanvas}>
                {job.step.steps && job.step.steps.map((step: any, index: number) => (
                    <View key={step.id} style={job.step.actualStep > index ? { ...Style.jobDetailsPageProgressLineStepIndicator, backgroundColor: '#4caf50' } : Style.jobDetailsPageProgressLineStepIndicator} />
                ))}
            </View>
            <View style={Style.jobDetailsPageProgressLineStepDescription}>
                    <Text key={job.step.steps[job.step.actualStep].id} style={Style.jobDetailsPageProgressLineStepDescriptionText}>
                        {job.step.steps[job.step.actualStep].description}
                    </Text>
            </View>
            <View style={{ ...Style.jobDetailsPageProgressLineFloatingTruck, left: truckPositionX }}>
                <Ionicons name="car" size={24} color="#4caf50" />
            </View>
        </View>
    );
};

export default JobTimeLine;

