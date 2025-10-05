// This page show all the months of the year, select one month or navigate to the multipleYear calendar screen.

import React from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';

const YearCalendarScreen = ({ navigation, route }: any) => {
    const colors = useThemeColors();

    const { year } = route.params || {};
    const selectedYear = year || new Date().getFullYear().toString();

    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const screenWidth = Dimensions.get('window').width;
    const monthCaseSize = (screenWidth - 40) / 3; // 3 months in a row

    const createStyles = (colors: any) =>
        StyleSheet.create({
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
            prevNextButtonText: {
                color: colors.buttonPrimaryText,
                fontSize: 16,
            },
            yearButtonText: {
                color: colors.buttonPrimaryText,
                fontSize: 16,
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
            monthCaseButtonText: {
                fontSize: 16,
                color: colors.text,
                textAlign: 'center',
            },
        });

    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.container}>
            <View style={styles.monthScreenYearSwitchButtons}>
                <Pressable style={styles.PrevNextButton} onPress={() => navigation.navigate('Year', {year: selectedYear - 1})}>
                    <Text style={styles.prevNextButtonText}> {'<'} </Text>
                </Pressable>
                <Pressable style={styles.monthYearSwitchButton} onPress={() => navigation.navigate('MultipleYears')}>
                    <Text style={styles.yearButtonText}>{selectedYear}</Text>
                </Pressable>
                <Pressable style={styles.PrevNextButton} onPress={() => navigation.navigate('Year', { year: selectedYear + 1 })}>
                    <Text style={styles.prevNextButtonText}> {'>'} </Text>
                </Pressable>
            </View>
            <View style={styles.monthsContainer}>
                {monthList.map((month, i) => (
                    <Pressable
                        key={i}
                        style={styles.monthCaseButton}
                        onPress={() => navigation.navigate('Month', { month: i + 1, year: selectedYear })} // Pass the selected month and year to the Month screen
                    >
                        <Text style={styles.monthCaseButtonText}>{month}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default YearCalendarScreen;