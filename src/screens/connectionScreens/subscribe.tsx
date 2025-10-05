
import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { StyleSheet } from 'react-native';
import { ServerData } from '@/src/constants/ServerData';

const SubscribeScreen = ({ navigation }: any) => {
    const style = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
        },
        logo: {
            width: 100,
            height: 100,
            backgroundColor: 'rgb(215, 36, 36)',
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
        },
        button: {
            padding: 10,
            backgroundColor: 'rgb(215, 36, 36)',
            borderRadius: 5,
            marginTop: 20,
            alignItems: 'center',
            width: '80%',
        },
        buttonText: {
            color: 'white',
            fontSize: 16,
        },
        subscribeForm: {
            width: '80%',
            marginBottom: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        input: {
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 10,
            paddingHorizontal: 10,
            borderRadius: 5,
            width: '100%',
        },
        backButton: {
            padding: 10,
            backgroundColor: 'rgb(100, 100, 100)',
            borderRadius: 5,
            marginTop: 20,
        },
        backButtonText: {
            color: 'white',
            fontSize: 16,
        },
        linkButton: {
            padding: 10,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: 'rgb(100, 100, 100)',
            marginTop: 20,
            alignItems: 'center',
            width: '60%',
        },
        linkButtonText: {
            color: 'rgb(100, 100, 100)',
            fontSize: 16,
        },
    });

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [alertText, setAlertText] = React.useState('');

    const subscribe = async () => {
        console.log('Subscribe function called');
        // Handle subscription logic here
        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            setAlertText('Please fill in all fields.');
            return;
        } else if (password !== confirmPassword) {
            setAlertText('Passwords do not match.');
            return;
        }

        const response = await fetch(`${ServerData.serverUrl}subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mail: email,
                password,
                firstName,
                lastName,
            }),
        });

        console.log('Response status:', response.status);

        if (response.status === 200) {
            const data = await response.json();
            if (data.success) {
                console.log('Subscription successful ! Navigating to mail verification screen. User ID:', data.user.id);
                navigation.navigate('SubscribeMailVerification', {
                    id : data.user.id,
                    mail: email,
                    firstName: firstName,
                    lastName: lastName,
                    password: password,
                });
            } else {
                setAlertText(data.message || 'Subscription failed. Please try again.');
            }
        } else {
            const data = await response.json();
            setAlertText('Subscription failed. Please try again.');
            console.error('Error response:', data);
            if (data.error) {
                console.error('Error:', data.error);
            }
        }   

    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={style.logo}>
                {/* Logo can be added here */}
            </View>
            <View style={ style.title }>
                <Text style={style.titleText}>Subscribe</Text>
            </View>

            <View style={ style.subscribeForm }>
                <TextInput
                    style={style.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={style.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={style.input}
                    placeholder="Confirm Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <TextInput
                    style={style.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    style={style.input}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />
                <Pressable style={style.button} onPress={() => subscribe()}>
                    <Text style={style.buttonText}>Subscribe</Text>
                </Pressable>
                {alertText ? <Text style={{ color: 'red', marginTop: 10 }}>{alertText}</Text> : null}
            </View>
            <Pressable onPress={() => navigation.navigate('Login')} style={style.linkButton}>
                <Text style={style.linkButtonText}>I already have an account</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Connection')} style={style.backButton}>
                <Text style={style.backButtonText}>Back</Text>
            </Pressable>
        </View>
    );
}
export default SubscribeScreen;