/**
 * ProfileHeader - Header avec gamification pour la page d'accueil
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useGamification } from '../../hooks/useGamification';
import { VStack } from '../primitives/Stack';

interface ProfileHeaderProps {
    navigation: any;
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
        firstName: 'Marie',
        role: 'Senior Driver',
        level: 8,
        xp: 1247,
        xpToNextLevel: 353,
        totalXpForNextLevel: 500
    };

    // Animation de la barre de progression
    React.useEffect(() => {
        if (isLoading) return;
        const progressPercentage = user.xpToNextLevel ? 
            ((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) : 0;
        
        Animated.timing(progressAnimation, {
            toValue: progressPercentage,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, [user.xp, isLoading]);

    // Si en cours de chargement, afficher un placeholder
    if (isLoading) {
        return (
            <View style={{
                paddingVertical: DESIGN_TOKENS.spacing.xl,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                backgroundColor: 'transparent',
                height: 200,
                justifyContent: 'center',
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

    // Fonction pour obtenir le rang basé sur le niveau
    const getRankInfo = (level: number = 1) => {
        if (level >= 19) return { emoji: '👑', title: 'Master Driver', color: '#FFD700' };
        if (level >= 13) return { emoji: '💎', title: 'Expert Driver', color: '#40E0D0' };
        if (level >= 8) return { emoji: '🥇', title: 'Senior Driver', color: '#FFD700' };
        if (level >= 4) return { emoji: '🥈', title: 'Driver', color: '#C0C0C0' };
        return { emoji: '🥉', title: 'Rookie Driver', color: '#CD7F32' };
    };

    const rankInfo = getRankInfo(user.level);

    return (
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
                onPress={() => {
                }}
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
    );
};

export default ProfileHeader;
