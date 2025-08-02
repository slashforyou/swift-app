// This page show all the years of the calendar. You can only select a year.

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
const MultipleYearsScreen = ({ navigation }: any) => {

    const selectedYear = new Date().getFullYear().toString();
    const yearList = Array.from({ length: 20 }, (_, i) => (parseInt(selectedYear) + i).toString());
    const monthYearSwitchButton = {
        backgroundColor: 'rgb(215, 36, 36)',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    };

    const Style = {
        yearSelectTitleContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 100,
            paddingBottom: 20,
            backgroundColor: '#fff',
            width: '100%',
        },
        YearSelectContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
        },
        YearSelectButton: {
            width: '95%',
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            margin: 2,
            borderRadius: 5,
            backgroundColor: '#444',
            color: '#fff',
        },
        YearSelectText: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
            color: '#000',
        },
        YearSelectButtonText: {
            fontSize: 16,
            color: '#fff',
        },
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={ Style.YearSelectContainer}>
           <View style={Style.yearSelectTitleContainer}>
                <Text style={Style.YearSelectText}>Select a Year</Text>
            </View> 
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                {yearList.map((year) => (
                <Pressable
                    key={year}
                    style={Style.YearSelectButton}
                    onPress={() => navigation.navigate('Year', { year })}
                >
                    <Text style={Style.YearSelectButtonText}>{year}</Text>
                </Pressable>
                ))}
            </View>
        </ScrollView>

    );
};

export default MultipleYearsScreen;