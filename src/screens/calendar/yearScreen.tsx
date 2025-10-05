// This page show all the months of the year, select one month or navigate to the multipleYear calendar screen.

import React from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const YearCalendarScreen = ({ navigation, route }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    const { year } = route.params || {};
    const selectedYear = year || new Date().getFullYear().toString();

    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const screenWidth = Dimensions.get('window').width;
    const monthCaseSize = (screenWidth - 40) / 3; // 3 months in a row

    const useCustomStyles = () => {
        return StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background,
            },
            monthScreenYearSwitchButtons: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '95%',
                marginBottom: 20,
                gap: 5,
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
            PrevNextButton: {
                backgroundColor: colors.primary,
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
                borderColor: colors.border,
                borderRadius: 5,
                paddingVertical: 10,
                backgroundColor: colors.primaryLight,
            },
        });
    };

    const customStyles = useCustomStyles();

    return (
        <View style={customStyles.container}>
            <View style={customStyles.monthScreenYearSwitchButtons}>
                <Pressable style={customStyles.PrevNextButton} onPress={() => navigation.navigate('Year', {year: selectedYear - 1})}>
                    <Text style={[commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }]}> {'<'} </Text>
                </Pressable>
                <Pressable style={customStyles.monthYearSwitchButton} onPress={() => navigation.navigate('MultipleYears')}>
                    <Text style={[commonStyles.h3, { color: colors.buttonPrimaryText }]}>{selectedYear}</Text>
                </Pressable>
                <Pressable style={customStyles.PrevNextButton} onPress={() => navigation.navigate('Year', { year: selectedYear + 1 })}>
                    <Text style={[commonStyles.body, commonStyles.textBold, { color: colors.buttonPrimaryText }]}> {'>'} </Text>
                </Pressable>
            </View>
            <View style={customStyles.monthsContainer}>
                {monthList.map((month, i) => (
                    <Pressable
                        key={i}
                        style={customStyles.monthCaseButton}
                        onPress={() => navigation.navigate('Month', { month: i + 1, year: selectedYear })} // Pass the selected month and year to the Month screen
                    >
                        <Text style={[commonStyles.body, commonStyles.textCenter, commonStyles.textSemiBold, { color: colors.text }]}>{month}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default YearCalendarScreen;