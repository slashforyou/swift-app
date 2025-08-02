// This page show the month calendar screen. Here you can see all the days of the month, select one day or navigate to the year calendar screen.

import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { text } from 'stream/consumers';
const MonthCalendarScreen = ({ navigation, route }: any) => {

    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const { month, year } = route.params || {};

    const selectedYear = year || new Date().getFullYear();
    const selectedMonthIndex = month ? month - 1 : new Date().getMonth();
    const selectedMonth = monthList[month - 1] || new Date().toLocaleString('default', { month: 'long' });

    const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Found the screen width to calculate the button width
    const screenWidth = Dimensions.get('window').width;
    const buttonWidth = (screenWidth - 30) / 7.5; // Assuming 7 buttons in a row with some margin

    // We determine the number of day between the first day of the month and the last monday.
    const firstDayOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Adjusting for Monday as the first day

    const daysBefore = firstDayOfWeek; // Number of days before the first Monday
    const daysAfter = (7 - (daysInMonth + daysBefore) % 7) % 7; // Number of days after the last day of the month

    const today = new Date();
    const isToday = (day: number) => {
        return day === today.getDate() && selectedMonthIndex === today.getMonth() && selectedYear === today.getFullYear();
    }


    const Style = {
        monthScreenCalendarContainer: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
        },
        monthPrevNextButton: {
            backgroundColor: 'rgb(215, 36, 36)',
            padding: 10,
            borderRadius: 5,
            marginBottom: 20,
            flex: 1
        },
        monthYearSwitchButton: {
            backgroundColor: 'rgb(215, 36, 36)',
            padding: 10,
            borderRadius: 5,
            marginBottom: 20,
            flex: 5,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            textAlign: 'center',
        },
        monthPrevNextButtonText: {
            color: '#fff',
            fontSize: 16,
            textAlign: 'center',
        },
        monthYearSwitchButtonText: {
            color: '#fff',
            fontSize: 16,
            textAlign: 'center',
        },
        monthScreenYear: {
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 100,
            marginBottom: 20,
            padding: 10,
            backgroundColor: '#444',
            width: '90%',
            borderRadius: 5,
        },
        monthScreenYearText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
        },
        monthSwitchButtonsContainer: {
            flexDirection: 'row',
            gap: 5,
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: 20,
            paddingHorizontal: 10,
        },
        dayCaseButton: {
            width: buttonWidth,
            height: buttonWidth,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            backgroundColor: '#f0f0f0',
        },
        dayCaseButtonToday: {
            width: buttonWidth,
            height: buttonWidth,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#007bff',
            borderRadius: 5,
            backgroundColor: '#e0f7fa',
        },
        monthScreenCalendar: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 10,
        },
        monthScreenCalendarDaysBanner: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 10,
            marginBottom: 10,
        },
        monthScreenCalendarDaysBannerDay: {
            width: buttonWidth,
            paddingVertical: 5,
            backgroundColor: '#e0e0e0',
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        monthScreenCalendarDaysBannerDayText: {
            fontWeight: 'bold',
            color: '#333',
        },
        monthScreenCalendarDaysContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 10,
            gap: 2,
        },
        dayOffCaseButton: {
            width: buttonWidth,
            height: buttonWidth,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            backgroundColor: '#ccc',
        },
    };

    return (
        <View style={Style.monthScreenCalendarContainer}>
            <Pressable style={Style.monthScreenYear} onPress={() => navigation.navigate('MultipleYears')}>
                <Text style={Style.monthScreenYearText}>
                    {year || new Date().getFullYear()}
                </Text>
            </Pressable>

            <View style={Style.monthSwitchButtonsContainer}>
                <Pressable style={Style.monthPrevNextButton} onPress={() => navigation.navigate('Month', { year: selectedMonthIndex > 0 ? selectedYear : selectedYear - 1, month: selectedMonthIndex > 0 ? selectedMonthIndex : 12 })}>
                    <Text style={Style.monthPrevNextButtonText}> {'<'} </Text>
                </Pressable>
                <Pressable style={Style.monthYearSwitchButton} onPress={() => navigation.navigate('Year', { year: selectedYear, month: selectedMonthIndex + 1 })}>
                    <Text style={Style.monthYearSwitchButtonText}>{selectedMonth}</Text>
                </Pressable>
                <Pressable style={Style.monthPrevNextButton} onPress={() => navigation.navigate('Month', { year: selectedMonthIndex < 11 ? selectedYear : selectedYear + 1, month: selectedMonthIndex < 11 ? selectedMonthIndex + 2 : 1 })}>
                    <Text style={Style.monthPrevNextButtonText}> {'>'} </Text>
                </Pressable>
            </View>
            <View style={Style.monthScreenCalendar}>
               <View style={ Style.monthScreenCalendarDaysBanner}>
                    {daysList.map((day) => (
                        <View key={day} style={Style.monthScreenCalendarDaysBannerDay}>
                            <Text style={Style.monthScreenCalendarDaysBannerDayText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={Style.monthScreenCalendarDaysContainer}>
                {/* Fill the days before the first Monday */}
                {Array.from({ length: daysBefore }, (_, i) => (
                    <View key={`before-${i}`} style={Style.dayOffCaseButton}>
                        <Text style={{ color: '#ccc' }}>{''}</Text>
                    </View>
                ))}
                {/* Display the days of the month */}
                {daysArray.map((day) => (
                    <Pressable
                        key={day}
                        style={isToday(day) ? Style.dayCaseButtonToday : Style.dayCaseButton}
                        onPress={() => navigation.navigate('Day', { day, month: selectedMonthIndex + 1, year: selectedYear })}
                    >
                        <Text>{day}</Text>
                    </Pressable>
                ))}
                {/* Fill the days after the last day of the month */}
                {Array.from({ length: daysAfter }, (_, i) => (
                    <View key={`after-${i}`} style={Style.dayOffCaseButton}>
                        <Text style={{ color: '#ccc' }}>{''}</Text>
                    </View>
                ))}
                </View>
            </View>
        </View>

    );
};

export default MonthCalendarScreen;