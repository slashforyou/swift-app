import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ServerData } from '@/src/constants/ServerData';

type RootStackParamList = {
    Subscribe: undefined;
    Login: undefined;
    // add other routes here if needed
};

const SubscribeMailVerification = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { id, mail, firstName, lastName } = route.params;

    const [verificationCode, setVerificationCode] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const handleVerification = async () => {
        // Handle verification logic here

        console.log('Verification function called with code:', verificationCode, 'and email:', mail);

        if (!verificationCode) {
            console.log('Please enter the verification code.');
            setAlertMessage('Please enter the verification code. Please go back and try again.');
            return;
        } else if (!verificationCode.match(/^\d{6}$/)) {
            console.log('The verification code must be a 6-digit number.');
            setAlertMessage('The verification code must be a 6-digit number. Please go back and try again.');
            return;
        } else if (!mail) {
            console.log('Email is missing.');
            setAlertMessage('Email is missing. Please go back and try again.');
        } else if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            console.log('The email format is invalid.');
            setAlertMessage('The email format is invalid. Please go back and try again.');
        } else {
            console.log('[ Verify Mail endpoint called ]', mail, verificationCode);
            const response = await fetch(`${ServerData.serverUrl}verifyMail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                    mail: mail,
                    code: verificationCode,
                }),
            });
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    // Verification successful, navigate to Login
                    navigation.navigate('Login');
                } else {
                    setAlertMessage(data.message || 'Verification failed. Please try again.');
                }
            } else {
                setAlertMessage('An error occurred. Please try again later.');
            }
        }
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
        },
        logo: {
            marginBottom: 32,
        },
        title: {
            marginBottom: 16,
        },
        titleText: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        verificationMessage: {
            marginBottom: 32,
        },
        verificationText: {
            fontSize: 16,
            textAlign: 'center',
        },
        input: {
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 8,
            marginBottom: 16,
            width: '100%',
        },
        button: {
            backgroundColor: '#007BFF',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 4,
            alignItems: 'center',
            marginBottom: 16,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 16,
        },
        backButton: {
            marginTop: 16,
        },
        backButtonText: {
            color: '#007BFF',
            fontSize: 16,
        },
    });

    return (
        <View style={ styles.container }>
            <View style={ styles.logo }>
                {/* Logo can be added here */}
            </View>
            <View style={ styles.title }>
                <Text style={ styles.titleText }>Mail Verification</Text>
            </View>

            <View style={ styles.verificationMessage }>
                <Text style={ styles.verificationText }>Please check your email for a verification code to complete your subscription.</Text>
                <Text style={ styles.verificationText }>If you don't see it, check your spam folder.</Text>
            </View>

            <TextInput
                style={ styles.input }
                placeholder="Verification Code"
                keyboardType="numeric"
                value={ verificationCode }
                onChangeText={ setVerificationCode }
            />
            { alertMessage ? <Text style={{ color: 'red', marginBottom: 16 }}>{ alertMessage }</Text> : null }
            <Pressable style={ styles.button } onPress={ handleVerification }>
                <Text style={ styles.buttonText }>Verify</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Subscribe')} style={ styles.backButton }>
                <Text style={ styles.backButtonText }>Back to Subscribe</Text>
            </Pressable>
        </View>
    )
}

export default SubscribeMailVerification