import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    Text,
    View
} from 'react-native';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import { ensureSession } from '../utils/session';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Subscribe: undefined;
    Connection: undefined;
};

interface ConnectionScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ navigation }) => {
    const { colors, styles } = useCommonThemedStyles();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("ConnectionScreen mounted, checking session...");

        const checkSession = async () => {
            try {
                setIsLoading(true);
                console.log("Checking user session...");
                const userLoggedIn = await ensureSession();
                if (userLoggedIn && userLoggedIn.authenticated === true) {
                    navigation.navigate('Home');
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, [navigation]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.containerCentered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.body, { color: colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                    Vérification de la connexion...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.containerCentered}>
                
                {/* Logo Section */}
                <View style={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: 60, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 30,
                    backgroundColor: colors.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 8,
                }}>
                    <Text style={[styles.title, { color: colors.background, fontSize: 28 }]}>
                        Swift
                    </Text>
                </View>
                
                {/* Welcome Text */}
                <Text style={[styles.title, { marginBottom: 8, textAlign: 'center' }]}>
                    Bienvenue
                </Text>
                
                <Text style={[styles.body, { 
                    color: colors.textSecondary, 
                    textAlign: 'center', 
                    marginBottom: 40,
                    paddingHorizontal: 20 
                }]}>
                    Gérez vos déménagements en toute simplicité
                </Text>

                {/* Action Buttons */}
                <View style={{ width: '100%', paddingHorizontal: 20, gap: 16 }}>
                    <Pressable
                        style={[styles.buttonPrimary, { width: '100%' }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.buttonPrimaryText}>Se connecter</Text>
                    </Pressable>
                    
                    <Pressable
                        style={[styles.buttonSecondary, { width: '100%' }]}
                        onPress={() => navigation.navigate('Subscribe')}
                    >
                        <Text style={styles.buttonSecondaryText}>Créer un compte</Text>
                    </Pressable>
                </View>

                {/* Features List */}
                <View style={{ marginTop: 40, width: '100%', paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ 
                            backgroundColor: colors.success + '20', 
                            marginRight: 12,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: colors.success, fontSize: 16 }}>✓</Text>
                        </View>
                        <Text style={[styles.body, { color: colors.textSecondary }]}>
                            Planification simplifiée
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ 
                            backgroundColor: colors.info + '20', 
                            marginRight: 12,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: colors.info, fontSize: 16 }}>📱</Text>
                        </View>
                        <Text style={[styles.body, { color: colors.textSecondary }]}>
                            Suivi en temps réel
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                            backgroundColor: colors.warning + '20', 
                            marginRight: 12,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: colors.warning, fontSize: 16 }}>🚛</Text>
                        </View>
                        <Text style={[styles.body, { color: colors.textSecondary }]}>
                            Gestion complète
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ConnectionScreen;
