/**
 * ProfileHeaderComplete - Header avec gamification pour la page d'accueil (version complète)
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HStack, VStack } from '../primitives/Stack';
import { useGamificationFixed } from '../../hooks/useGamificationFixed';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import NotificationsPanel from './NotificationsPanel';

interface ProfileHeaderProps {
    navigation: any;
    notifications?: number;
}

// Variable pour le double tap
let lastTapTime = 0;

const ProfileHeaderComplete: React.FC<ProfileHeaderProps> = ({ 
    navigation, 
    notifications: initialNotifications = 10 
}) => {
    const { data: gamificationData, isLoading, addXP } = useGamificationFixed();
    const [showNotifications, setShowNotifications] = useState(false);
    const [progressAnimation] = useState(new Animated.Value(0));
    const [notificationCount, setNotificationCount] = useState(initialNotifications);
    
    // Utiliser les données de gamification ou des valeurs par défaut
    const user = gamificationData || {
        firstName: 'Marie',
        role: 'Senior Driver',
        level: 8,
        xp: 1247,
        xpToNextLevel: 353,
        totalXpForNextLevel: 500
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
        const progressPercentage = user.xpToNextLevel ? 
            ((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) : 0;
        
        Animated.timing(progressAnimation, {
            toValue: progressPercentage,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, [user.xp]);

    // Fonction pour obtenir le rang basé sur le niveau
    const getRankInfo = (level: number = 1) => {
        if (level >= 19) return { emoji: '👑', title: 'Master Driver', color: '#FFD700' };
        if (level >= 13) return { emoji: '💎', title: 'Expert Driver', color: '#40E0D0' };
        if (level >= 8) return { emoji: '🥇', title: 'Senior Driver', color: '#FFD700' };
        if (level >= 4) return { emoji: '🥈', title: 'Driver', color: '#C0C0C0' };
        return { emoji: '🥉', title: 'Rookie Driver', color: '#CD7F32' };
    };

    const rankInfo = getRankInfo(user.level);

    // 10 Notifications mockées pour tester le défilement
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
            title: 'Rappel timesheet',
            message: 'Pensez à valider votre timesheet avant 17h',
            time: 'Il y a 3h',
            type: 'system' as const,
            isRead: true,
        },
        {
            id: '5',
            title: 'Nouvelle mission disponible',
            message: 'Mission express disponible dans votre secteur',
            time: 'Il y a 4h',
            type: 'job' as const,
            isRead: false,
        },
        {
            id: '6',
            title: 'Mise à jour app',
            message: 'Une nouvelle version de l\'app est disponible',
            time: 'Il y a 6h',
            type: 'system' as const,
            isRead: false,
        },
        {
            id: '7',
            title: 'Achievement débloqué !',
            message: '🏆 100 livraisons réussites - +200 XP bonus !',
            time: 'Hier',
            type: 'bonus' as const,
            isRead: false,
        },
        {
            id: '8',
            title: 'Appel manqué',
            message: 'Jean Dupont - +33 6 12 34 56 78',
            time: 'Hier',
            type: 'call' as const,
            isRead: true,
        },
        {
            id: '9',
            title: 'Planning modifié',
            message: 'Votre planning de demain a été mis à jour',
            time: 'Hier',
            type: 'job' as const,
            isRead: false,
        },
        {
            id: '10',
            title: 'Feedback client',
            message: 'Nouvelle évaluation 5⭐ reçue de Sophie L.',
            time: 'Il y a 2 jours',
            type: 'bonus' as const,
            isRead: false,
        },
    ];

    // Fonction pour gérer l'ouverture du modal et mettre à jour le badge
    const handleOpenNotifications = () => {
        setShowNotifications(true);
        
        // Après 3 secondes, réduire le nombre de notifications non lues
        setTimeout(() => {
            const unreadCount = mockNotifications.filter(n => !n.isRead).length;
            setNotificationCount(0); // Marquer toutes comme lues visuellement
        }, 3000);
    };

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
                            console.log('🎉 +5 XP Easter egg!');
                        } else {
                            // Simple tap - aller au profil
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
                            {rankInfo.emoji} {rankInfo.title}
                        </Text>

                        {/* XP et Level */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: Colors.light.textSecondary,
                            textAlign: 'center',
                        }}>
                            {user.xp?.toLocaleString()} XP • Level {user.level}
                        </Text>

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
                
                {/* Bouton notifications en haut à droite */}
                <Pressable
                    onPress={handleOpenNotifications}
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
                    {notificationCount > 0 && (
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
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Panel des notifications - NOUVEAU COMPOSANT PLEIN ÉCRAN */}
            <NotificationsPanel
                isVisible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={mockNotifications}
            />
        </>
    );
};

export default ProfileHeaderComplete;