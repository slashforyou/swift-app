// This page show all the years of the calendar. You can only select a year.

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';

const MultipleYearsScreen = ({ navigation }: any) => {
    const colors = useThemeColors();

    const selectedYear = new Date().getFullYear().toString();
    const yearList = Array.from({ length: 20 }, (_, i) => (parseInt(selectedYear) + i).toString());

    const createStyles = (colors: any) =>
        StyleSheet.create({
            container: {
                flex: 1,
            },
            yearSelectTitleContainer: {
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 100,
                paddingBottom: 20,
                backgroundColor: colors.background,
                width: '100%',
            },
            YearSelectContainer: {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background,
            },
            yearListContainer: {
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
            },
            YearSelectButton: {
                width: '95%',
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                margin: 2,
                borderRadius: 5,
                backgroundColor: colors.primaryLight,
            },
            YearSelectText: {
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
                color: colors.text,
            },
            YearSelectButtonText: {
                fontSize: 16,
                color: colors.text,
            },
        });

    const styles = useThemedStyles(createStyles);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.YearSelectContainer}>
           <View style={styles.yearSelectTitleContainer}>
                <Text style={styles.YearSelectText}>Select a Year</Text>
            </View> 
            <View style={styles.yearListContainer}>
                {yearList.map((year) => (
                <Pressable
                    key={year}
                    style={styles.YearSelectButton}
                    onPress={() => navigation.navigate('Year', { year })}
                >
                    <Text style={styles.YearSelectButtonText}>{year}</Text>
                </Pressable>
                ))}
            </View>
        </ScrollView>

    );
};

export default MultipleYearsScreen;