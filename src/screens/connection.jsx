import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../hooks/useThemeColor';
import { ensureSession } from '../utils/session';

const ConnectionScreen = ({ navigation }) => {
    const colors = useThemeColors();

    const createStyles = (colors) =>
        StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background,
            },
            button: {
                backgroundColor: colors.primary,
                width: '80%',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 15,
                borderRadius: 5,
                marginVertical: 10,
            },
            buttonText: {
                color: colors.buttonPrimaryText,
                fontSize: 16,
            },
        });

    const styles = useThemedStyles(createStyles);

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
        <View style={styles.container}>
            <Pressable
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonText}>Log In</Text>
            </Pressable>
            <Pressable
                style={styles.button}
                onPress={() => navigation.navigate('Subscribe')}
            >
                <Text style={styles.buttonText}>Subscribe</Text>
            </Pressable>
        </View>
    );
};

export default ConnectionScreen;
