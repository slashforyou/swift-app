// This page shows the jobs of the day and allows you to navigate to the month or year calendar screens and to choose one of the jobs of the day.

import JobBox from '@/src/components/calendar/jobBox';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';

    const DayScreen = ({ route, navigation }: any) => {
        const { day, month, year } = route.params || {};
        const selectedDay = day || new Date().getDate();
        const selectedMonth = month || new Date().getMonth() + 1;
        const selectedYear = year || new Date().getFullYear();

        // Get themed colors and styles
        const colors = useThemeColors();
        const styles = useThemedStyles(createDayScreenStyles);

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
        <ScrollView style={styles.dayScreenContainer} contentContainerStyle={styles.dayScreenContainerScroll}>
            <View style={styles.dayScreenTitle}>
                <Pressable onPress={() => navigation.navigate('Month', { month: selectedMonth, year: selectedYear })} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.buttonPrimaryText} />
                </Pressable>
                <Text style={styles.dayScreenText}>
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
                        <Text style={styles.noJobsText}>No jobs available for this day.</Text>
                    )}
            </View>
        </ScrollView>
    );
};

// Create themed styles function
const createDayScreenStyles = (colors: any) => StyleSheet.create({
    dayScreenContainerScroll: {
        flexGrow: 1,
        justifyContent: 'flex-start' as const,
        alignItems: 'center' as const,
    },
    dayScreenContainer: {
        flex: 1,
        backgroundColor: colors.backgroundTertiary,
        padding: 20,
        paddingTop: 100, // Adjusted for the top menu
        paddingBottom: 20,
    },
    dayScreenTitle: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 20,
        width: '100%',
    },
    backButton: {
        backgroundColor: colors.buttonSecondary,
        borderRadius: 5,
        marginRight: 10,
        padding: 10,
    },
    dayScreenText: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: colors.text,
        textAlign: 'center' as const,
        flex: 1,
    },
    noJobsText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center' as const,
        marginTop: 20,
    },
});

export default DayScreen;

