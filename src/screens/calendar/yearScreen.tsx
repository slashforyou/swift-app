// This page show all the months of the year, select one month or navigate to the multipleYear calendar screen.

import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
const YearCalendarScreen = ({ navigation, route }: any) => {

    const { year } = route.params || {};
    const selectedYear = year || new Date().getFullYear().toString();

    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const screenWidth = Dimensions.get('window').width;
    const monthCaseSize = (screenWidth - 40) / 3; // 3 months in a row

    const Style = {
        monthScreenYearSwitchButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '95%',
            marginBottom: 20,
            gap: 5,

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
        PrevNextButton: {
            backgroundColor: 'rgb(215, 36, 36)',
            padding: 10,
            borderRadius: 5,
            marginBottom: 20,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        },
        monthsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 10,
            gap: 5,
        },
        monthCaseButton: {
            width: monthCaseSize,
            height: monthCaseSize,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderRadius: 5,
            paddingVertical: 10,
            backgroundColor: '#444',
        },
        monthCaseButtonText: {
            fontSize: 16,
            color: '#fff',
            textAlign: 'center',
        },
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={Style.monthScreenYearSwitchButtons}>
                <Pressable style={Style.PrevNextButton} onPress={() => navigation.navigate('Year', {year: selectedYear - 1})}>
                    <Text style={{ color: '#fff', fontSize: 16 }}> {'<'} </Text>
                </Pressable>
                <Pressable style={Style.monthYearSwitchButton} onPress={() => navigation.navigate('MultipleYears')}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>{selectedYear}</Text>
                </Pressable>
                <Pressable style={Style.PrevNextButton} onPress={() => navigation.navigate('Year', { year: selectedYear + 1 })}>
                    <Text style={{ color: '#fff', fontSize: 16 }}> {'>'} </Text>
                </Pressable>
            </View>
            <View style={Style.monthsContainer}>
                {monthList.map((month, i) => (
                    <Pressable
                        key={i}
                        style={Style.monthCaseButton}
                        onPress={() => navigation.navigate('Month', { month: i + 1, year: selectedYear })} // Pass the selected month and year to the Month screen
                    >
                        <Text style={Style.monthCaseButtonText}>{month}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default YearCalendarScreen;