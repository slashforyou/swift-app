
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import copyToClipBoard from '../../services/copyToClipBoard';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { Colors } from '../../constants/Colors';


const RefBookMark = ({ jobRef, toastIt }: { jobRef: string, toastIt: any }) => {
    const styles = useThemedStyles(createStyles);
    const colors = useThemeColors();

    const copyRefToClipboard = () => {
        copyToClipBoard(jobRef);
        toastIt(`Job Ref. ${jobRef} copied to clipboard`, 'success', true);
    }

    return (
        <Pressable style={styles.refBookMarkContainer} onPress={copyRefToClipboard}>
            <Text style={styles.refBookMarkText}> Job Ref. { jobRef }</Text>
        </Pressable>
    );
}

// Themed styles function
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    refBookMarkContainer: {
        padding: 10,
        backgroundColor: colors.buttonSecondary,
        justifyContent: 'center',
        width: '80%',
        marginLeft: '10%',
        position: 'absolute',
        top: 75,
        left: 0,
        borderRadius: 10,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 100,
        alignItems: 'center',
        flexDirection: 'row',
    },
    refBookMarkText: {
        fontSize: 16,
        color: colors.buttonSecondaryText,
        textAlign: 'center',
        fontWeight: '500',
    }
});

export default RefBookMark;