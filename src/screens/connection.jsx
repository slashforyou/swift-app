import React, { useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import { ensureSession } from '../utils/session';

const ConnectionScreen = ({ navigation }) => {
    const { colors, styles } = useCommonThemedStyles();

    useEffect(() => {
        console.log("ConnectionScreen mounted, checking session...");

        const checkSession = async () => {
            console.log("Checking user session...");
            const userLoggedIn = await ensureSession();
            if (userLoggedIn && userLoggedIn.authenticated === true) {
                navigation.navigate('Home');
            }
        };
        checkSession();
    }, [navigation]);

    return (
        <SafeAreaView style={styles.containerCentered}>
            <Pressable
                style={[styles.buttonPrimary, { width: '80%', marginVertical: 10 }]}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonPrimaryText}>Log In</Text>
            </Pressable>
            <Pressable
                style={[styles.buttonPrimary, { width: '80%', marginVertical: 10 }]}
                onPress={() => navigation.navigate('Subscribe')}
            >
                <Text style={styles.buttonPrimaryText}>Subscribe</Text>
            </Pressable>
        </SafeAreaView>
    );
};

export default ConnectionScreen;
