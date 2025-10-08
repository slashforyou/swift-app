import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import { ensureSession } from '../utils/session';

const ConnectionScreen = ({ navigation }) => {
    const { colors, styles } = useCommonThemedStyles();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("ConnectionScreen mounted, checking session...");

        const checkSession = async () => {
            try {
                setIsLoading(true);
                console.log("Checking user session...");
                const userLoggedIn = await ensureSession();
                if (userLoggedIn && userLoggedIn.authenticated === true) {
                    navigation.navigate('Home');
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, [navigation]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.containerCentered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.body, { color: colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                    Vérification de la connexion...
                </Text>
            </SafeAreaView>
        );
    }

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
