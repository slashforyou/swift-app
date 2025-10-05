import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../../hooks/useThemeColor';

const createStyles = (colors: any) => StyleSheet.create({
    jobDetailsPage: {
        flex: 1,
        marginTop: 80,
        marginBottom: 95,
        backgroundColor: colors.background,
        paddingTop: 50,
        paddingBottom: 50,
        // height: 'calc(100% - 80px)', // calc() not supported in React Native
        width: '100%',
    },
    jobDetailsPageContainerScroll: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: 50,
    },
});

const JobPageScrollContainer = ({ children } : { children: React.ReactNode }) => {
    const colors = useThemeColors();
    const styles = useThemedStyles(createStyles);

    return (
        <ScrollView style={styles.jobDetailsPage} contentContainerStyle={styles.jobDetailsPageContainerScroll}>        
                {
                    children
                }
        </ScrollView>
    );
}
export default JobPageScrollContainer;