import { backup } from 'node:sqlite';
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const Toast = ({ message, type, status }: { message: string; type: 'info' | 'success' | 'error', status: boolean }) => {
    const [isChanging, setIsChanging] = useState(true);
    const styles = {
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
            backgroundColor: type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3',
            padding: 10,
            borderRadius: 5,
            width: '90%',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            marginBottom: 110, // Default position
        },
        toastText: {
            color: '#fff',
            textAlign: 'center',
        },
    };


    const ToastShow = (status: boolean) => {
        if (status) {
            // We change the toast position to be visible
            styles.toastContainerMask.bottom = 0; // Show the toast
        }
        else {
            // We change the toast position to be hidden
            styles.toastContainerMask.bottom = -100; // Hide the toast
        }
    }

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

export default Toast;