
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    TextInput, 
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { ServerData } from '@/src/constants/ServerData';
import AlertMessage from '../../components/ui/AlertMessage';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

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
        console.log('Subscribe function called');
        
        // Validation des champs
        if (!firstName.trim()) {
            showAlert('warning', 'Veuillez saisir votre prénom.', 'Prénom requis');
            return;
        }

        if (!lastName.trim()) {
            showAlert('warning', 'Veuillez saisir votre nom.', 'Nom requis');
            return;
        }

        if (!email.trim()) {
            showAlert('warning', 'Veuillez saisir votre adresse email.', 'Email requis');
            return;
        }

        if (!password.trim()) {
            showAlert('warning', 'Veuillez saisir un mot de passe.', 'Mot de passe requis');
            return;
        }

        if (!confirmPassword.trim()) {
            showAlert('warning', 'Veuillez confirmer votre mot de passe.', 'Confirmation requise');
            return;
        }

        // Validation format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('error', 'Veuillez saisir une adresse email valide.', 'Format invalide');
            return;
        }

        // Validation mot de passe
        if (password.length < 6) {
            showAlert('error', 'Le mot de passe doit contenir au moins 6 caractères.', 'Mot de passe trop court');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('error', 'Les mots de passe ne correspondent pas.', 'Erreur de confirmation');
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

            console.log('Response status:', response.status);

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    showAlert('success', 'Compte créé ! Vérifiez votre email pour la confirmation.', 'Inscription réussie');
                    
                    setTimeout(() => {
                        navigation.navigate('SubscribeMailVerification', {
                            id: data.user.id,
                            mail: email,
                            firstName: firstName,
                            lastName: lastName,
                        });
                    }, 1500);
                    
                } else {
                    let errorMessage = 'Une erreur s\'est produite lors de l\'inscription.';
                    let errorTitle = 'Erreur d\'inscription';
                    
                    if (data.message) {
                        if (data.message.includes('email') || data.message.includes('mail')) {
                            errorMessage = 'Cette adresse email est déjà utilisée.';
                            errorTitle = 'Email déjà pris';
                        } else {
                            errorMessage = data.message;
                        }
                    }
                    
                    showAlert('error', errorMessage, errorTitle);
                }
            } else {
                const data = await response.json();
                showAlert('error', 'Une erreur s\'est produite lors de l\'inscription.', 'Erreur serveur');
            }
        } catch (error: any) {
            console.error('Subscription error:', error);
            
            let errorMessage = 'Problème de connexion. Veuillez vérifier votre connexion internet.';
            if (error.message?.includes('timeout')) {
                errorMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
            }
            
            showAlert('error', errorMessage, 'Erreur réseau');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Fond animé avec emojis camions et cartons */}
            <AnimatedBackground opacity={0.08} />
            
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
                                ← Retour
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
                            Créer un compte
                        </Text>
                        
                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20
                        }]}>
                            Rejoignez Swift pour gérer vos déménagements
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
                                Prénom
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="Votre prénom"
                                placeholderTextColor={colors.textSecondary}
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                Nom
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="Votre nom"
                                placeholderTextColor={colors.textSecondary}
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

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

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                Mot de passe
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="Au moins 6 caractères"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <View style={{ marginBottom: 30 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                                Confirmer le mot de passe
                            </Text>
                            <TextInput
                                style={styles.inputBase}
                                placeholder="Confirmer votre mot de passe"
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
                                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
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
                                J'ai déjà un compte
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
export default SubscribeScreen;