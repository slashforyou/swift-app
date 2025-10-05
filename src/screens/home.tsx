import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../hooks/useThemeColor';
import HomeButton from '../components/ui/home_button';
import ServerConnectionTest from '@/tests/server/connectionTest';
import { ensureSession } from '../utils/session';

function HomeScreen({ navigation }: any) {
    const colors = useThemeColors();

    const createStyles = (colors: any) =>
        StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background,
            },
            logo: {
                width: 100,
                height: 100,
                backgroundColor: colors.primary,
                borderRadius: 50,
                marginBottom: 20,
                justifyContent: 'center',
                alignItems: 'center',
            },
        });

    const styles = useThemedStyles(createStyles);

    useEffect(() => {
                const checkSession = async () => {
                    const userLoggedIn = await ensureSession();
                    if (!userLoggedIn || userLoggedIn.authenticated === false) {
                        navigation.navigate('Connection');
                    }
                };
                checkSession();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.logo}>
            </View>

        <HomeButton
            title="Calendar"
            onPress={() => navigation.navigate('Calendar')}
        />
        <HomeButton
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
        />
        <HomeButton
            title="Parameter"
            onPress={() => navigation.navigate('Parameters')}
        />

        {/* Connection test button - only appears in dev mode */}

        {__DEV__ && (
            <ServerConnectionTest />
        )}
    </View>
  )
}

export default HomeScreen;