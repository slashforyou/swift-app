import Ionicons from '@react-native-vector-icons/ionicons';
import e from 'express';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
// This component is used to display a job box in the calendar day screen
// It shows basic information about the job

const JobBox = ({ job, navigation, day, month, year }: any) => {
    const colors = useThemeColors();

    const createStyles = (colors: any) =>
        StyleSheet.create({
            dayJobBox: {
                backgroundColor: colors.backgroundSecondary,
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
                shadowColor: colors.shadow,
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
                padding: 5,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                borderRadius: 5,
            },
            jobTitleText: {
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.buttonPrimaryText,
            },
            jobStartSuburb: {
                fontSize: 14,
                color: colors.textSecondary,
                fontWeight: 'bold',
                marginTop: 5,
            },
            jobClientName: {
                fontSize: 16,
                color: colors.text,
            marginTop: 5,
        },
        dayJobBoxRightPanel: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-end',
        },
        jobStartTimeTitle: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: 'bold',
        },
        jobStartTime: {
            fontSize: 16,
            color: colors.text,
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
            color: colors.textSecondary,
            fontWeight: 'bold',
            flexDirection: 'row',
            alignItems: 'center',
        },
        jobTruckText: {
            fontSize: 16,
            color: colors.text,
            marginLeft: 5,
        },
        dayJobBoxTopPanel: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.backgroundSecondary,
            width: '100%',
            marginBottom: 10,
        },
        dayJobTruckPlate: {
            backgroundColor: colors.backgroundSecondary,
            padding: 5,
            borderRadius: 5,
            marginTop: 5,
            borderWidth: 2,
            borderColor: colors.textSecondary,
        },
        jobTruckPlateText: {
            fontSize: 16,
            color: colors.text,
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
            color: colors.text,
            fontWeight: 'bold',
        },
        jobTruckIcon: {
            marginRight: 5,
        },
        jobTruckPlateIcon: {
            marginRight: 5,
            color: colors.textSecondary,
        },
        jobTruckNameIcon: {
            marginRight: 5,
            color: colors.textSecondary,
        },
        jobQuickActionButtonCall: {
            backgroundColor: colors.background,
            padding: 5,
            borderRadius: 5,
            shadowColor: colors.shadow,
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
            borderColor: colors.primary,
        },
        jobQuickActionButtonCallText: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 5,
            textAlign: 'center',
        },
        jobQuickActionButtonMap: {
            backgroundColor: colors.background,
            padding: 5,
            borderRadius: 5,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: colors.primary,
        },
            jobQuickActionButtonMapText: {
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 5,
                textAlign: 'center',
            },
        });

    const styles = useThemedStyles(createStyles);

    const handlePress = (e: any) => {
        e.stopPropagation(); // Prevents the event from bubbling up
        if (navigation && typeof navigation.navigate === 'function') {
            console.log(`Job ${job.id} selected, navigating to details...`);
            navigation.navigate('JobDetails', { jobId: job.id, navigation, day, month, year });
        } else {
            console.log(`Job ${job.id} selected`);
        }
    }


    return (
        <Pressable style={styles.dayJobBox} onPress={handlePress}>
            <View style={ styles.dayJobBoxTopPanel }>
                <View style={ styles.dayJobBoxLeftPanel }>
                    <View style={ styles.jobTitle }>
                    <Text style={styles.jobTitleText}>{job.id}</Text>
                    </View>
                    <Text style={styles.jobStartSuburb }>{job.addresses[0].city}</Text>
                    <Text style={styles.jobClientName}>
                        {job.client.firstName} {job.client.lastName}
                    </Text>
                </View>
                <View style={ styles.dayJobBoxRightPanel }>
                    <Text style={styles.jobStartTimeTitle}>Start Time:</Text>
                    <Text style={styles.jobStartTime}>{
                        new Date(job.time.startWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                    <Text style={styles.jobStartTime}>{
                        new Date(job.time.startWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                </View>
            </View>
            <View style={ styles.dayJobBoxBottomPanel }>
                <View style={styles.dayJobBoxLeftPanel}>
                    <Text style={styles.jobTruckTitle}>
                         <Ionicons name="car" size={16} color="colors.textSecondary" />
                         Truck:
                    </Text>
                    <View style={styles.dayJobTruckPlate}>
                        <Text style={styles.jobTruckPlateText}>{job.truck.licensePlate}</Text>
                    </View>
                    <View style={styles.jobTruckName}>
                        <Text style={styles.jobTruckNameText}>{job.truck.name}</Text>
                    </View>
                </View>
                <View style={styles.dayJobBoxRightPanel}>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Call ${job.client.phone}`)} style={ styles.jobQuickActionButtonCall }>
                        <Ionicons name="call" size={18} color={colors.textSecondary} style={ styles.jobTruckIcon } />
                        <Text style={ styles.jobQuickActionButtonCallText }>Call</Text>
                    </Pressable>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Map to ${job.addresses[0].street}`)} style={ styles.jobQuickActionButtonMap }>
                        <Ionicons name="navigate" size={18} color={colors.textSecondary} style={ styles.jobTruckIcon } />
                        <Text style={ styles.jobQuickActionButtonMapText }>Map</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

export default JobBox;
