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
    const { colors, styles } = useCommonThemedStyles();
    const { t } = useTranslation();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const handleLogin = async () => {
        // Validation des champs
        if (!email.trim()) {
            showAlert('warning', t('auth.validation.emailRequired'), t('auth.login.email'));
            return;
        }

        if (!password.trim()) {
            showAlert('warning', t('auth.validation.passwordRequired'), t('auth.login.password'));
            return;
        }

        // Validation format email basique
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('error', t('auth.validation.emailInvalid'), t('common.error'));
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
            showAlert('success', t('auth.success.loginSuccess'), t('auth.success.welcome'));
            
            // Délai pour voir le message de succès
            setTimeout(() => {
                navigation.navigate('Home');
            }, 1500);
            
        } catch (error: any) {
            // Silencieux - l'erreur est affichée via showAlert à l'utilisateur
            
            // Messages d'erreur personnalisés basés sur les nouveaux codes
            let errorMessage = t('auth.errors.generic');
            let errorTitle = t('common.error');
            
            if (error.message) {
                switch (error.message) {
                    case 'unauthorized':
                    case 'invalid_credentials':
                        errorMessage = t('auth.errors.invalidCredentials');
                        errorTitle = t('common.error');
                        break;
                    case 'device_info_unavailable':
                        errorMessage = t('auth.errors.deviceInfoUnavailable');
                        errorTitle = t('common.error');
                        break;
                    case 'server_error':
                        errorMessage = t('auth.errors.serverError');
                        errorTitle = t('common.error');
                        break;
                    case 'invalid_login_response':
                        errorMessage = t('auth.errors.invalidResponse');
                        errorTitle = t('common.error');
                        break;
                    default:
                        if (error.message.includes('network') || error.message.includes('Network')) {
                            errorMessage = t('auth.errors.networkError');
                            errorTitle = t('common.error');
                        } else if (error.message.includes('timeout')) {
                            errorMessage = t('auth.errors.timeout');
                            errorTitle = t('common.error');
                        } else {
                            errorMessage = error.message;
                        }
                        break;
                }
            }
            
            showAlert('error', errorMessage, errorTitle);
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
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={{ alignItems: 'center', paddingTop: 60, marginBottom: 40 }}>
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
                            {t('auth.login.title')}
                        </Text>
                        
                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20
                        }]}>
                            {t('auth.login.subtitle')}
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
                    <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 20 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.login.email')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.login.emailPlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 30 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                {t('auth.login.password')}
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder={t('auth.login.passwordPlaceholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <Pressable
                            style={[styles.buttonPrimary, { 
                                backgroundColor: isLoading ? colors.textSecondary : colors.primary,
                                opacity: isLoading ? 0.6 : 1
                            }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonPrimaryText}>
                                {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Footer Section */}
                    <View style={{ alignItems: 'center', paddingBottom: 40, gap: 16 }}>
                        <Pressable
                            style={[styles.buttonSecondary, { width: '100%' }]}
                            onPress={() => navigation.navigate('Subscribe')}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonSecondaryText}>
                                {t('auth.login.createAccount')}
                            </Text>
                        </Pressable>

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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;