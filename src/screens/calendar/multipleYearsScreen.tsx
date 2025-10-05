// This page show all the years of the calendar. You can only select a year.

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const MultipleYearsScreen = ({ navigation }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    const selectedYear = new Date().getFullYear().toString();
    const yearList = Array.from({ length: 20 }, (_, i) => (parseInt(selectedYear) + i).toString());

    const useCustomStyles = () => {
        return StyleSheet.create({
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
        });
    };

    const customStyles = useCustomStyles();

    return (
        <ScrollView style={customStyles.container} contentContainerStyle={customStyles.YearSelectContainer}>
           <View style={customStyles.yearSelectTitleContainer}>
                <Text style={[commonStyles.h2, commonStyles.textCenter, { color: colors.text }]}>Select a Year</Text>
            </View> 
            <View style={customStyles.yearListContainer}>
                {yearList.map((year) => (
                <Pressable
                    key={year}
                    style={customStyles.YearSelectButton}
                    onPress={() => navigation.navigate('Year', { year })}
                >
                    <Text style={[commonStyles.body, commonStyles.textSemiBold, { color: colors.text }]}>{year}</Text>
                </Pressable>
                ))}
            </View>
        </ScrollView>

    );
};

export default MultipleYearsScreen;