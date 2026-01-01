
import { ServerData } from '@/src/constants/ServerData';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import AlertMessage from '../../components/ui/AlertMessage';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { useTranslation } from '../../localization';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Subscribe: undefined;
    Connection: undefined;
    SubscribeMailVerification: {
        id: string;
        mail: string;
        firstName: string;
        lastName: string;
    };
};

interface SubscribeScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList>;
}

const SubscribeScreen: React.FC<SubscribeScreenProps> = ({ navigation }) => {
    const { colors, styles } = useCommonThemedStyles();
    const { t } = useTranslation();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
    }>({
        visible: false,
        type: 'info',
        message: '',
    });

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
        setAlert({
            visible: true,
            type,
            title,
            message,
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({ ...prev, visible: false }));
    };

    const subscribe = async () => {
        // TEMP_DISABLED: console.log('Subscribe function called');
        
        // Validation des champs
        if (!firstName.trim()) {
            showAlert('warning', t('auth.validation.firstNameRequired'), t('auth.register.firstName'));
            return;
        }

        if (!lastName.trim()) {
            showAlert('warning', t('auth.validation.lastNameRequired'), t('auth.register.lastName'));
            return;
        }

        if (!email.trim()) {
            showAlert('warning', t('auth.validation.emailRequired'), t('auth.register.email'));
            return;
        }

        if (!password.trim()) {
            showAlert('warning', t('auth.validation.passwordRequired'), t('auth.register.password'));
            return;
        }

        if (!confirmPassword.trim()) {
            showAlert('warning', t('auth.validation.passwordRequired'), t('auth.register.confirmPassword'));
            return;
        }

        // Validation format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('error', t('auth.validation.emailInvalid'), t('common.error'));
            return;
        }

        // Validation mot de passe
        if (password.length < 6) {
            showAlert('error', t('auth.validation.passwordTooShort'), t('common.error'));
            return;
        }

        if (password !== confirmPassword) {
            showAlert('error', t('auth.validation.passwordMismatch'), t('common.error'));
            return;
        }

        setIsLoading(true);

        try {
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

            // TEMP_DISABLED: console.log('Response status:', response.status);

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    showAlert('success', t('auth.success.registerSuccess'), t('common.success'));
                    
                    setTimeout(() => {
                        navigation.navigate('SubscribeMailVerification', {
                            id: data.user.id,
                            mail: email,
                            firstName: firstName,
                            lastName: lastName,
                        });
                    }, 1500);
                    
                } else {
                    let errorMessage = t('auth.errors.generic');
                    let errorTitle = t('common.error');
                    
                    if (data.message) {
                        if (data.message.includes('email') || data.message.includes('mail')) {
                            errorMessage = t('auth.errors.invalidCredentials');
                            errorTitle = t('common.error');
                        } else {
                            errorMessage = data.message;
                        }
                    }
                    
                    showAlert('error', errorMessage, errorTitle);
                }
            } else {
                await response.json();
                showAlert('error', t('auth.errors.serverError'), t('common.error'));
            }
        } catch (error: any) {

            console.error('Subscription error:', error);
            
            let errorMessage = t('auth.errors.networkError');
            if (error.message?.includes('timeout')) {
                errorMessage = t('auth.errors.timeout');
            }
            
            showAlert('error', errorMessage, t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Fond animé avec emojis camions et cartons */}
            <AnimatedBackground opacity={0.15} />
            
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header avec bouton retour visible */}
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        paddingTop: 20,
                        marginBottom: 20 
                    }}>
                        <Pressable
                            onPress={() => navigation.navigate('Connection')}
                            disabled={isLoading}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.backgroundSecondary,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                        >
                            <Text style={[styles.body, { 
                                color: colors.primary, 
                                fontWeight: '600' 
                            }]}>
                                ← {t('auth.login.back')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Header Section */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: 40, 
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 6,
                        }}>
                            <Text style={[styles.title, { color: colors.background, fontSize: 24 }]}>
                                S
                            </Text>
                        </View>
                        
                        <Text style={[styles.title, { marginBottom: 8 }]}>
                            {t('auth.register.title')}
                        </Text>
                        
                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20
                        }]}>
                            {t('auth.register.subtitle')}
                        </Text>
                    </View>

                    {/* Alert Section */}
                    <AlertMessage
                        type={alert.type}
                        title={alert.title}
                        message={alert.message}
                        visible={alert.visible}
                        onDismiss={hideAlert}
                    />

                    {/* Form Section */}
                    <View style={{ flex: 1, paddingVertical: 20 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.register.firstName')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.register.firstNamePlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.register.lastName')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.register.lastNamePlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.register.email')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.register.emailPlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.register.password')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.register.passwordPlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 30 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.register.confirmPassword')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <Pressable
                            style={[styles.buttonPrimary, { 
                                backgroundColor: isLoading ? colors.textSecondary : colors.primary,
                                opacity: isLoading ? 0.6 : 1
                            }]}
                            onPress={subscribe}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonPrimaryText}>
                                {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Footer Section */}
                    <View style={{ alignItems: 'center', paddingBottom: 40 }}>
                        <Pressable
                            style={[styles.buttonSecondary, { width: '100%' }]}
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonSecondaryText}>
                                {t('auth.register.alreadyHaveAccount')}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
export default SubscribeScreen;