import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    SafeAreaView, 
    ActivityIndicator, 
    StyleSheet,
    Dimensions 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { DESIGN_TOKENS } from '../constants/Styles';
import { ensureSession } from '../utils/session';
import AnimatedBackground from '../components/ui/AnimatedBackground';

const { width, height } = Dimensions.get('window');

const ConnectionScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Vérification de la connexion...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Fond animé avec emojis camions et cartons */}
            <AnimatedBackground opacity={0.25} />
            
            <View style={[styles.content, { paddingTop: insets.top + DESIGN_TOKENS.spacing.xl }]}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoText}>Swift</Text>
                    </View>
                    
                    <Text style={[styles.title, { color: colors.text }]}>
                        Bienvenue
                    </Text>
                    
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Gérez vos déménagements en toute simplicité avec Swift
                    </Text>
                </View>

                {/* Action Section */}
                <View style={styles.actions}>
                    <Pressable
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryButtonText}>Se connecter</Text>
                    </Pressable>
                    
                    <Pressable
                        style={[styles.secondaryButton, { 
                            borderColor: colors.border,
                            backgroundColor: colors.backgroundSecondary 
                        }]}
                        onPress={() => navigation.navigate('Subscribe')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                            Créer un compte
                        </Text>
                    </Pressable>
                </View>

                {/* Features Section */}
                <View style={styles.features}>
                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.success + '20' }]}>
                            <Text style={{ color: colors.success, fontSize: 20 }}>✓</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Planification simplifiée
                        </Text>
                    </View>
                    
                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.info + '20' }]}>
                            <Text style={{ color: colors.info, fontSize: 20 }}>📱</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Suivi en temps réel
                        </Text>
                    </View>
                    
                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={{ color: colors.warning, fontSize: 20 }}>🚛</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Gestion complète
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    },
    loadingText: {
        marginTop: DESIGN_TOKENS.spacing.lg,
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: DESIGN_TOKENS.spacing.xl,
        paddingBottom: DESIGN_TOKENS.spacing.xl,
    },
    header: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xl,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: DESIGN_TOKENS.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
        textAlign: 'center',
        maxWidth: width * 0.8,
    },
    actions: {
        flex: 1,
        justifyContent: 'center',
        gap: DESIGN_TOKENS.spacing.lg,
    },
    primaryButton: {
        height: DESIGN_TOKENS.touch.minSize + 8,
        borderRadius: DESIGN_TOKENS.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
        color: '#FFFFFF',
    },
    secondaryButton: {
        height: DESIGN_TOKENS.touch.minSize,
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
    },
    features: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.md,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.md,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
});

export default ConnectionScreen;
