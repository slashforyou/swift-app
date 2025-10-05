import React from 'react';
import { View, Text, Pressable, TextInput, Platform, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { login } from '../../utils/auth';


import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
type RootStackParamList = {
    Home: undefined;
    Subscribe: undefined;
    Connection: undefined;
    // add other routes if needed
};
interface LoginScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const colors = useThemeColors();

    const createStyles = (colors: any) =>
        StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background,
                padding: 20,
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
            title: {
                marginBottom: 20,
            },
            titleText: {
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.text,
            },
            button: {
                padding: 10,
                backgroundColor: colors.primary,
                borderRadius: 5,
                marginTop: 20,
                alignItems: 'center',
                width: '60%',
            },
            buttonText: {
                color: colors.buttonPrimaryText,
                fontSize: 16,
            },
            backButton: {
                padding: 10,
                backgroundColor: colors.buttonSecondary,
                borderRadius: 5,
                marginTop: 20,
            },
            backButtonText: {
                color: colors.buttonSecondaryText,
                fontSize: 16,
            },
            loginForm: {
                width: '80%',
                marginBottom: 20,
            },
            input: {
                height: 40,
                borderColor: colors.border,
                borderWidth: 1,
                marginBottom: 10,
                paddingHorizontal: 10,
                borderRadius: 5,
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
            },
            linkButton: {
                padding: 10,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 20,
                alignItems: 'center',
                width: '60%',
            },
            linkButtonText: {
                color: colors.textSecondary,
                fontSize: 16,
            },
        });

    const styles = useThemedStyles(createStyles);
    
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    return (
        <View style={styles.container}>
            <View style={styles.logo}>
                {/* Logo can be added here */}
            </View>

            <View style={styles.title}>
                <Text style={styles.titleText}>Login Screen</Text>
            </View>

            <View style={styles.loginForm}>
                <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" autoCapitalize="none" onChange={e => setEmail(e.nativeEvent.text)} value={email} />
                <TextInput placeholder="Password" style={styles.input} secureTextEntry onChange={e => setPassword(e.nativeEvent.text)} value={password} />
            </View>

            <Pressable onPress={async () => {
                try {
                    await login(email, password);
                    navigation.navigate('Home');
                } catch (error) {
                    console.error(error);
                }
            }} style={styles.button}>
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Subscribe')} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>I don't have an account</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Connection')} style={styles.backButton}>
                {/* Back button style can be defined here */}
                <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
        </View>
    );
};

export default LoginScreen;