// This page show the month calendar screen. Here you can see all the days of the month, select one day or navigate to the year calendar screen.

import React from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const MonthCalendarScreen = ({ navigation, route }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();
    
    // Calculate button width
    const screenWidth = Dimensions.get('window').width;
    const buttonWidth = (screenWidth - 30) / 7.5; // Assuming 7 buttons in a row with some margin
    


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



    // We determine the number of day between the first day of the month and the last monday.
    const firstDayOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Adjusting for Monday as the first day

    const daysBefore = firstDayOfWeek; // Number of days before the first Monday
    const daysAfter = (7 - (daysInMonth + daysBefore) % 7) % 7; // Number of days after the last day of the month

    const today = new Date();
    const isToday = (day: number) => {
        return day === today.getDate() && selectedMonthIndex === today.getMonth() && selectedYear === today.getFullYear();
    }

    const useCustomStyles = () => {
        return StyleSheet.create({
            monthScreenCalendarContainer: {
                flex: 1,
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: colors.background,
            },
            monthPrevNextButton: {
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 5,
                marginBottom: 20,
                flex: 1
            },
            monthYearSwitchButton: {
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 5,
                marginBottom: 20,
                flex: 5,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
            },
            monthScreenYear: {
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 100,
                marginBottom: 20,
                padding: 10,
                backgroundColor: colors.primaryLight,
                width: '90%',
                borderRadius: 5,
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
                borderColor: colors.border,
                borderRadius: 5,
                backgroundColor: colors.backgroundSecondary,
            },
            dayCaseButtonToday: {
                width: buttonWidth,
                height: buttonWidth,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 5,
                backgroundColor: colors.primary,
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
                backgroundColor: colors.backgroundTertiary,
                borderRadius: 5,
                justifyContent: 'center',
                alignItems: 'center',
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
                borderColor: colors.border,
                borderRadius: 5,
                backgroundColor: colors.backgroundTertiary,
            },
        });
    };

    const customStyles = useCustomStyles();

    return (
        <View style={customStyles.monthScreenCalendarContainer}>
            <Pressable style={customStyles.monthScreenYear} onPress={() => navigation.navigate('MultipleYears')}>
                <Text style={[commonStyles.h2, { color: colors.text }]}>
                    {year || new Date().getFullYear()}
                </Text>
            </Pressable>

            <View style={customStyles.monthSwitchButtonsContainer}>
                <Pressable style={customStyles.monthPrevNextButton} onPress={() => navigation.navigate('Month', { year: selectedMonthIndex > 0 ? selectedYear : selectedYear - 1, month: selectedMonthIndex > 0 ? selectedMonthIndex : 12 })}>
                    <Text style={[commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }]}> {'<'} </Text>
                </Pressable>
                <Pressable style={customStyles.monthYearSwitchButton} onPress={() => navigation.navigate('Year', { year: selectedYear, month: selectedMonthIndex + 1 })}>
                    <Text style={[commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }]}>{selectedMonth}</Text>
                </Pressable>
                <Pressable style={customStyles.monthPrevNextButton} onPress={() => navigation.navigate('Month', { year: selectedMonthIndex < 11 ? selectedYear : selectedYear + 1, month: selectedMonthIndex < 11 ? selectedMonthIndex + 2 : 1 })}>
                    <Text style={[commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }]}> {'>'} </Text>
                </Pressable>
            </View>
            <View style={customStyles.monthScreenCalendar}>
               <View style={customStyles.monthScreenCalendarDaysBanner}>
                    {daysList.map((day) => (
                        <View key={day} style={customStyles.monthScreenCalendarDaysBannerDay}>
                            <Text style={[commonStyles.bodySmall, commonStyles.textBold, { color: colors.text }]}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={customStyles.monthScreenCalendarDaysContainer}>
                {/* Fill the days before the first Monday */}
                {Array.from({ length: daysBefore }, (_, i) => (
                    <View key={`before-${i}`} style={customStyles.dayOffCaseButton}>
                    </View>
                ))}
                {/* Display the days of the month */}
                {daysArray.map((day) => (
                    <Pressable
                        key={day}
                        style={isToday(day) ? customStyles.dayCaseButtonToday : customStyles.dayCaseButton}
                        onPress={() => navigation.navigate('Day', { day, month: selectedMonthIndex + 1, year: selectedYear })}
                    >
                        <Text style={isToday(day) ? 
                            [commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }] : 
                            [commonStyles.body, { color: colors.text }]
                        }>
                            {day}
                        </Text>
                    </Pressable>
                ))}
                {/* Fill the days after the last day of the month */}
                {Array.from({ length: daysAfter }, (_, i) => (
                    <View key={`after-${i}`} style={customStyles.dayOffCaseButton}>
                    </View>
                ))}
                </View>
            </View>
        </View>

    );
};

export default MonthCalendarScreen;