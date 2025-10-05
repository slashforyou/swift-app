import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { Colors } from '../../constants/Colors';

const Toast = ({ message, type, status }: { message: string; type: 'info' | 'success' | 'error', status: boolean }) => {
    const colors = useThemeColors();
    const styles = useThemedStyles((colors) => createToastStyles(colors, type, status));

    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastContainerMask}
      >
            <View style={styles.toastContainer}>
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </LinearGradient>
    );
}

// Create themed styles with dynamic toast type
const createToastStyles = (colors: typeof Colors.light, type: 'info' | 'success' | 'error', status: boolean) => StyleSheet.create({
    toastContainerMask: {
        position: 'absolute',
        bottom: status ? 0 : -100, // Change this to control visibility
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100,
        width: '100%',
        height: '25%',
    },
    toastContainer: {
        backgroundColor: type === 'error' ? colors.error : type === 'success' ? colors.success : colors.info,
        padding: 10,
        borderRadius: 5,
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 110,
    },
    toastText: {
        color: colors.buttonPrimaryText,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default Toast;