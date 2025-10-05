// This page shows the jobs of the day and allows you to navigate to the month or year calendar screens and to choose one of the jobs of the day.

import JobBox from '@/src/components/calendar/jobBox';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

    const DayScreen = ({ route, navigation }: any) => {
        const { day, month, year } = route.params || {};
        const selectedDay = day || new Date().getDate();
        const selectedMonth = month || new Date().getMonth() + 1;
        const selectedYear = year || new Date().getFullYear();

        // Get themed colors and styles
        const { colors, styles: commonStyles } = useCommonThemedStyles();
        
        // Custom styles for day screen specific elements
        const customStyles = StyleSheet.create({
            dayScreenContainer: {
                ...commonStyles.container,
                ...commonStyles.contentContainer,
                paddingTop: 100, // Adjusted for the top menu
            },
            dayScreenTitle: {
                ...commonStyles.rowBetween,
                marginBottom: 20,
                width: '100%',
            },
            backButton: {
                ...commonStyles.buttonSecondary,
                borderRadius: 8,
                marginRight: 10,
                padding: 10,
            },
        });

    const jobs = [
        {
            id : "#LM0000000001",
            client : {
                firstName: "Client A",
                lastName: "Last Name",
                phone: "+1234567890",
                email: "clienta@example.com"
            },
            contact : {
                firstName: "Contact A",
                lastName: "Last Name",
                phone: "+1234567890",
                email: "contacta@example.com"
            },
            addresses: [
                {
                    type: "Start",
                    street: "123 Main St",
                    city: "City A",
                    state: "State A",
                    zip: "12345",
                    latitude: 40.7128,
                    longitude: -74.0060
                },
                {
                    type: "End",
                    street: "456 Elm Street",
                    city: "City A",
                    state: "State A",
                    zip: "12345",
                    latitude: 40.6128,
                    longitude: -74.1060
                }
            ],
            time : {
                startWindowStart: "2023-10-01T08:00:00Z",
                startWindowEnd: "2023-10-01T10:00:00Z",
                endWindowStart: "2023-10-01T12:00:00Z",
                endWindowEnd: "2023-10-01T14:00:00Z"
            },
            truck: {
                licensePlate: "ABC123",
                name: "Truck A"
            },    
        }
    ]; // This should be replaced with the actual jobs data for the selected day

    return (
        <ScrollView style={customStyles.dayScreenContainer} contentContainerStyle={commonStyles.scrollContainer}>
            <View style={customStyles.dayScreenTitle}>
                <Pressable onPress={() => navigation.navigate('Month', { month: selectedMonth, year: selectedYear })} style={customStyles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[commonStyles.h2, commonStyles.textCenter, { flex: 1 }]}>
                    {/* Date in full letters format */}
                    {`${selectedDay} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1, selectedDay))} ${selectedYear}`}
                </Text>
            </View>
            <View>
                {
                    jobs.length > 0 ? (
                        jobs.map((job: any, index: number) => (
                            <JobBox
                                key={index}
                                job={job}
                                onPress={() => console.log(`Job ${job.id} selected`)}
                                navigation={navigation}
                                day={selectedDay}
                                month={selectedMonth}
                                year={selectedYear}
                            />
                        ))
                    ) : (
                        <Text style={[commonStyles.body, commonStyles.textCenter, { marginTop: 20 }]}>No jobs available for this day.</Text>
                    )}
            </View>
        </ScrollView>
    );
};

export default DayScreen;

