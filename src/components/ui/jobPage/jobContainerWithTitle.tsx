import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../../hooks/useThemeColor';

const createStyles = (colors: any) => StyleSheet.create({
    jobContainer: {
        width: '95%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 20,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 10,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    jobContainerTitle: {
        width: '100%',
        padding: 10,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.backgroundSecondary,
        alignItems: 'center',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    jobContainerTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    jobContainerChildrenBloc: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
});

const JobContainerWithTitle = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const colors = useThemeColors();
    const styles = useThemedStyles(createStyles);
    
    return (
        <View style={styles.jobContainer}>
            <View style={styles.jobContainerTitle}>
                <Text style={styles.jobContainerTitleText}>{title}</Text>
            </View>
            <View style={styles.jobContainerChildrenBloc}>
                {children}
            </View>
        </View>
    );
};

export default JobContainerWithTitle;