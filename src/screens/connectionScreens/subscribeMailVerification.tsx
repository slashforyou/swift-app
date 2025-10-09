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
import { useNavigation } from '@react-navigation/native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { ServerData } from '@/src/constants/ServerData';
import AlertMessage from '../../components/ui/AlertMessage';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

type RootStackParamList = {
    Subscribe: undefined;
    Login: undefined;
    // add other routes here if needed
};

const SubscribeMailVerification = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { colors, styles } = useCommonThemedStyles();
    const { id, mail, firstName, lastName } = route.params;

    const [verificationCode, setVerificationCode] = useState('');
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

    const handleVerification = async () => {
        console.log('Verification function called with code:', verificationCode, 'and email:', mail);

        // Validation des champs
        if (!verificationCode.trim()) {
            showAlert('warning', 'Veuillez saisir le code de vérification.', 'Code requis');
            return;
        }

        if (!verificationCode.match(/^\d{6}$/)) {
            showAlert('error', 'Le code de vérification doit être composé de 6 chiffres.', 'Format invalide');
            return;
        }

        if (!mail) {
            showAlert('error', 'L\'email est manquant. Veuillez recommencer l\'inscription.', 'Email manquant');
            return;
        }

        if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            showAlert('error', 'Le format de l\'email est invalide.', 'Email invalide');
            return;
        }

        setIsLoading(true);

        try {
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
                    showAlert('success', 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.', 'Vérification réussie');
                    
                    setTimeout(() => {
                        navigation.navigate('Login');
                    }, 1500);
                } else {
                    let errorMessage = 'La vérification a échoué. Veuillez vérifier le code.';
                    let errorTitle = 'Code incorrect';
                    
                    if (data.message) {
                        if (data.message.includes('expired')) {
                            errorMessage = 'Le code a expiré. Veuillez recommencer l\'inscription.';
                            errorTitle = 'Code expiré';
                        } else if (data.message.includes('invalid')) {
                            errorMessage = 'Le code saisi est incorrect. Vérifiez votre email.';
                            errorTitle = 'Code invalide';
                        } else {
                            errorMessage = data.message;
                        }
                    }
                    
                    showAlert('error', errorMessage, errorTitle);
                }
            } else {
                showAlert('error', 'Une erreur serveur s\'est produite. Veuillez réessayer.', 'Erreur serveur');
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            
            let errorMessage = 'Problème de connexion. Veuillez vérifier votre connexion internet.';
            if (error.message?.includes('timeout')) {
                errorMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
            }
            
            showAlert('error', errorMessage, 'Erreur réseau');
        } finally {
            setIsLoading(false);
        }
    }

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
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
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
                            onPress={() => navigation.navigate('Subscribe')}
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
                                ← Retour à l'inscription
                            </Text>
                        </Pressable>
                    </View>

                    {/* Header Section */}
                    <View style={{ alignItems: 'center', marginBottom: 40, paddingTop: 40 }}>
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
                            <Text style={[styles.title, { color: colors.background, fontSize: 20 }]}>
                                📧
                            </Text>
                        </View>
                        
                        <Text style={[styles.title, { marginBottom: 8 }]}>
                            Vérifiez votre email
                        </Text>
                        
                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20,
                            marginBottom: 8
                        }]}>
                            Nous avons envoyé un code de vérification à :
                        </Text>

                        <Text style={[styles.subtitle, { 
                            color: colors.primary, 
                            textAlign: 'center' 
                        }]}>
                            {mail}
                        </Text>

                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            paddingHorizontal: 20,
                            marginTop: 8,
                            fontSize: 14
                        }]}>
                            Vérifiez aussi votre dossier spam si vous ne le trouvez pas.
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
                        <View style={{ marginBottom: 30 }}>
                            <Text style={[styles.subtitle, { marginBottom: 8, textAlign: 'center' }]}>
                                Code de vérification
                            </Text>
                            <TextInput
                                style={[styles.inputBase, { 
                                    textAlign: 'center',
                                    fontSize: 20,
                                    fontWeight: '600',
                                    letterSpacing: 4
                                }]}
                                placeholder="000000"
                                placeholderTextColor={colors.textSecondary}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="numeric"
                                maxLength={6}
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <Pressable
                            style={[styles.buttonPrimary, { 
                                backgroundColor: isLoading ? colors.textSecondary : colors.primary,
                                opacity: isLoading ? 0.6 : 1
                            }]}
                            onPress={handleVerification}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonPrimaryText}>
                                {isLoading ? 'Vérification...' : 'Vérifier mon compte'}
                            </Text>
                        </Pressable>

                        <Text style={[styles.body, { 
                            color: colors.textSecondary, 
                            textAlign: 'center',
                            marginTop: 20,
                            fontSize: 14
                        }]}>
                            Vous n'avez pas reçu le code ? Vérifiez votre dossier spam ou{' '}
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>
                                recommencez l'inscription
                            </Text>.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default SubscribeMailVerification