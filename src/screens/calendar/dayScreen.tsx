// This page shows the jobs of the day and allows you to navigate to the month or year calendar screens and to choose one of the jobs of the day.

import JobBox from '@/src/components/calendar/jobBox';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

    const DayScreen = ({ route, navigation }: any) => {
        const { day, month, year } = route.params || {};
        const selectedDay = day || new Date().getDate();
        const selectedMonth = month || new Date().getMonth() + 1;
        const selectedYear = year || new Date().getFullYear();

    const Style = {
        dayScreenContainerScroll: {
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        dayScreenContainer: {
            flex: 1,
            backgroundColor: '#f0f0f0',
            padding: 20,
            paddingTop: 100, // Adjusted for the top menu
            paddingBottom: 20,
        },
        dayScreenTitle: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            width: '100%',
        },
        backButton: {
            backgroundColor: '#aaa',
            borderRadius: 5,
            marginRight: 10,
            padding: 10,
        },
        dayScreenText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            flex: 1,
            textAlignVertical: 'center',
        },
    };

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
        <ScrollView style={Style.dayScreenContainer} contentContainerStyle={Style.dayScreenContainerScroll}>
            <View style={Style.dayScreenTitle}>
                <Pressable onPress={() => navigation.navigate('Month', { month: selectedMonth, year: selectedYear })} style={ Style.backButton }>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </Pressable>
                <Text style={Style.dayScreenText}>
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
                        <Text>No jobs available for this day.</Text>
                    )}
            </View>
        </ScrollView>
    );
};
export default DayScreen;

