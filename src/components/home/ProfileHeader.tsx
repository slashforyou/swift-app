/**
 * ProfileHeader - Header avec gamification pour la page d'accueil
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HStack, VStack } from '../primitives/Stack';
import { useGamification } from '../../hooks/useGamification';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import NotificationsPanel from './NotificationsPanel';

interface ProfileHeaderProps {
    navigation: any;
    user?: {
        firstName?: string;
        lastName?: string;
        role?: string;
        level?: number;
        xp?: number;
        xpProgress?: number;
        xpToNextLevel?: number;
        totalXpForNextLevel?: number;
        rank?: {
            name: string;
            emoji: string;
            color: string;
        };
    };
    notifications?: number;
}

// Variable pour le double tap
let lastTapTime = 0;

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
    navigation, 
    notifications = 3 
}) => {
    const { data: gamificationData, isLoading, addXP } = useGamification();
    const [showNotifications, setShowNotifications] = useState(false);
    const [progressAnimation] = useState(new Animated.Value(0));
    
    // Utiliser les données de gamification ou des valeurs par défaut
    const user = gamificationData || {
        firstName: 'User',
        role: 'Newcomer',
        level: 1,
        xp: 0,
        xpProgress: 0,
        xpToNextLevel: 100,
        totalXpForNextLevel: 100,
        rank: { name: 'Starter', emoji: '⭐', color: '#808080' }
    };

    // Si en cours de chargement, afficher un placeholder
    if (isLoading) {
        return (
            <View style={{
                backgroundColor: Colors.light.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                height: 90,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Text style={{
                    color: Colors.light.textSecondary,
                    fontSize: 14,
                }}>
                    Loading profile... ⚡
                </Text>
            </View>
        );
    }

    // Animation de la barre de progression
    React.useEffect(() => {
        // Utiliser xpProgress de l'API si disponible, sinon calculer
        const progressPercentage = user.xpProgress !== undefined 
            ? user.xpProgress / 100 
            : user.xpToNextLevel 
                ? ((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) 
                : 0;
        
        Animated.timing(progressAnimation, {
            toValue: progressPercentage,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, [user.xp, user.xpProgress]);

    // Utiliser le rang de l'API s'il existe, sinon fallback local
    const rankInfo = user.rank || {
        emoji: '⭐',
        name: user.role || 'Starter',
        color: '#808080'
    };

    // Notifications mockées
    const mockNotifications = [
        {
            id: '1',
            title: 'Nouveau job assigné',
            message: 'Job #JOB-NERD-007 vous a été assigné pour demain matin',
            time: 'Il y a 5 min',
            type: 'job' as const,
            isRead: false,
        },
        {
            id: '2',
            title: 'Bonus XP gagné !',
            message: '+50 XP pour livraison parfaite et ponctuelle',
            time: 'Il y a 1h',
            type: 'bonus' as const,
            isRead: false,
        },
        {
            id: '3',
            title: 'Client a appelé',
            message: 'Marie Martin - +33 1 23 45 67 89',
            time: 'Il y a 2h',
            type: 'call' as const,
            isRead: false,
        },
        {
            id: '4',
            title: 'Rappel',
            message: 'Pensez à valider votre timesheet',
            time: 'Il y a 3h',
            type: 'system' as const,
            isRead: true,
        },
    ];

    return (
        <>
            {/* Header pleine largeur sans box */}
            <View style={{
                paddingVertical: DESIGN_TOKENS.spacing.xl,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                backgroundColor: 'transparent',
            }}>
                {/* Avatar avec bordure de progression circulaire */}
                <Pressable
                    onPress={() => {
                        const now = Date.now();
                        
                        if (now - lastTapTime < 500) {
                            // Double tap détecté - bonus XP !
                            addXP(5, '🎯 Easter egg bonus!');
                            // TEMP_DISABLED: console.log('🎉 +5 XP Easter egg!');
                        } else {
        setTimeout(() => {
                                if (Date.now() - now > 400) {
                                    navigation.navigate('Profile');
                                }
                            }, 450);
                        }
                        
                        lastTapTime = now;
                    }}
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        alignItems: 'center',
                    })}
                >
                    {/* Container pour l'avatar avec bordure circulaire */}
                    <View style={{
                        width: 90,
                        height: 90,
                        position: 'relative',
                        marginBottom: DESIGN_TOKENS.spacing.md,
                    }}>
                        {/* Bordure grise (background) */}
                        <View style={{
                            position: 'absolute',
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            borderWidth: 4,
                            borderColor: Colors.light.border,
                        }} />
                        
                        {/* Bordure de progression orange/jaune */}
                        <Animated.View style={{
                            position: 'absolute',
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            borderWidth: 4,
                            borderColor: 'transparent',
                            borderTopColor: '#FF8C00', // Orange
                            transform: [{
                                rotate: progressAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['-90deg', '270deg'], // Commence en haut et va dans le sens des aiguilles
                                })
                            }]
                        }} />
                        
                        {/* Deuxième partie du dégradé pour l'effet jaune */}
                        <Animated.View style={{
                            position: 'absolute',
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            borderWidth: 4,
                            borderColor: 'transparent',
                            borderTopColor: '#FFD700', // Jaune
                            opacity: progressAnimation.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 1],
                            }),
                            transform: [{
                                rotate: progressAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['-90deg', '270deg'],
                                })
                            }]
                        }} />
                        
                        {/* Avatar */}
                        <View style={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            width: 82,
                            height: 82,
                            borderRadius: 41,
                            backgroundColor: Colors.light.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Ionicons 
                                name="person" 
                                size={40} 
                                color={Colors.light.textSecondary} 
                            />
                        </View>
                    </View>
                    
                    {/* Infos utilisateur centrées */}
                    <VStack gap="xs" align="center">
                        {/* Salutation */}
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: Colors.light.text,
                            textAlign: 'center',
                        }}>
                            Bonjour, {user.firstName} 👋
                        </Text>

                        {/* Rang */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: rankInfo.color,
                            textAlign: 'center',
                        }}>
                            {rankInfo.emoji} {rankInfo.name}
                        </Text>

                        {/* XP et Level - Tap pour voir l'historique */}
                        <Pressable
                            onPress={() => navigation.navigate('XpHistory')}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                backgroundColor: pressed ? Colors.light.backgroundSecondary : 'transparent',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: DESIGN_TOKENS.radius.md,
                            })}
                        >
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: Colors.light.textSecondary,
                                textAlign: 'center',
                            }}>
                                ⚡ {user.xp?.toLocaleString()} XP • Level {user.level}
                            </Text>
                        </Pressable>

                        {/* Progression vers le prochain niveau */}
                        <Text style={{
                            fontSize: 13,
                            color: Colors.light.textMuted,
                            textAlign: 'center',
                            marginTop: 4,
                        }}>
                            {Math.round(((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) * 100)}% vers Level {(user.level || 1) + 1}
                        </Text>
                    </VStack>
                </Pressable>
                
                {/* Bouton Leaderboard en haut à gauche */}
                <Pressable
                    onPress={() => navigation.navigate('Leaderboard')}
                    accessibilityLabel="View leaderboard"
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                        position: 'absolute',
                        top: DESIGN_TOKENS.spacing.lg,
                        left: DESIGN_TOKENS.spacing.lg,
                        padding: 8,
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: Colors.light.backgroundSecondary,
                        borderRadius: 20,
                        shadowColor: Colors.light.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    })}
                >
                    <Ionicons 
                        name="trophy" 
                        size={24} 
                        color="#FFD700"
                    />
                </Pressable>

                {/* Bouton Badges à côté du leaderboard */}
                <Pressable
                    onPress={() => navigation.navigate('Badges')}
                    accessibilityLabel="View badges"
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                        position: 'absolute',
                        top: DESIGN_TOKENS.spacing.lg,
                        left: DESIGN_TOKENS.spacing.lg + 48,
                        padding: 8,
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: Colors.light.backgroundSecondary,
                        borderRadius: 20,
                        shadowColor: Colors.light.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    })}
                >
                    <Ionicons 
                        name="ribbon" 
                        size={24} 
                        color="#9B59B6"
                    />
                </Pressable>
                
                {/* Bouton notifications en haut à droite */}
                <Pressable
                    onPress={() => setShowNotifications(true)}
                    style={({ pressed }) => ({
                        position: 'absolute',
                        top: DESIGN_TOKENS.spacing.lg,
                        right: DESIGN_TOKENS.spacing.lg,
                        padding: 8,
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: Colors.light.backgroundSecondary,
                        borderRadius: 20,
                        shadowColor: Colors.light.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    })}
                >
                    <Ionicons 
                        name="notifications" 
                        size={24} 
                        color={Colors.light.textSecondary} 
                    />
                    {notifications > 0 && (
                        <View style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            backgroundColor: Colors.light.error,
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: Colors.light.background,
                        }}>
                            <Text style={{
                                color: 'white',
                                fontSize: 11,
                                fontWeight: '700',
                            }}>
                                {notifications > 99 ? '99+' : notifications}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Panel des notifications */}
            <NotificationsPanel
                isVisible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={mockNotifications}
            />
        </>
    );
};

export default ProfileHeader;