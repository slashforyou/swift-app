import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    TextInput, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform,
    SafeAreaView 
} from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { login } from '../../utils/auth';
import AlertMessage from '../../components/ui/AlertMessage';

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
            showAlert('warning', 'Veuillez saisir votre adresse email.', 'Email requis');
            return;
        }

        if (!password.trim()) {
            showAlert('warning', 'Veuillez saisir votre mot de passe.', 'Mot de passe requis');
            return;
        }

        // Validation format email basique
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('error', 'Veuillez saisir une adresse email valide.', 'Format invalide');
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
            showAlert('success', 'Connexion réussie ! Redirection en cours...', 'Bienvenue');
            
            // Délai pour voir le message de succès
            setTimeout(() => {
                navigation.navigate('Home');
            }, 1500);
            
        } catch (error: any) {
            console.error('Login error:', error);
            
            // Messages d'erreur personnalisés basés sur les nouveaux codes
            let errorMessage = 'Une erreur inattendue s\'est produite.';
            let errorTitle = 'Erreur de connexion';
            
            if (error.message) {
                switch (error.message) {
                    case 'unauthorized':
                    case 'invalid_credentials':
                        errorMessage = 'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.';
                        errorTitle = 'Identifiants incorrects';
                        break;
                    case 'device_info_unavailable':
                        errorMessage = 'Impossible de récupérer les informations de votre appareil.';
                        errorTitle = 'Erreur technique';
                        break;
                    case 'server_error':
                        errorMessage = 'Le serveur rencontre un problème temporaire. Veuillez réessayer plus tard.';
                        errorTitle = 'Erreur serveur';
                        break;
                    case 'invalid_login_response':
                        errorMessage = 'Réponse du serveur incorrecte. Veuillez contacter le support.';
                        errorTitle = 'Erreur technique';
                        break;
                    default:
                        if (error.message.includes('network') || error.message.includes('Network')) {
                            errorMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
                            errorTitle = 'Problème réseau';
                        } else if (error.message.includes('timeout')) {
                            errorMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
                            errorTitle = 'Timeout';
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
                            Connexion
                        </Text>
                        
                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20
                        }]}>
                            Connectez-vous à votre compte Swift
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
                                Email
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="votre@email.com"
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
                                Mot de passe
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="••••••••"
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
                                {isLoading ? 'Connexion...' : 'Se connecter'}
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
                                Créer un compte
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
                                ← Retour
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;