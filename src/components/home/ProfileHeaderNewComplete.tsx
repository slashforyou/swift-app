/**
 * ProfileHeaderComplete - Header avec gamification complet pour la page d'accueil
 * Version avec photo et barre de progression circulaire
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VStack } from '../primitives/Stack';
import { useUserProfile } from '../../hooks/useUserProfile';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import { useTranslation } from '../../localization';
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
    try {
        const { profile, isLoading } = useUserProfile();
        const { t } = useTranslation();
        const [showNotifications, setShowNotifications] = useState(false);
        const [progressAnimation] = useState(new Animated.Value(0));
        const [notificationCount, setNotificationCount] = useState(initialNotifications);
        
        // Données utilisateur sécurisées avec fallbacks
        const safeUser = {
            firstName: profile?.firstName || 'User',
            lastName: profile?.lastName || '',
            level: Math.max((profile?.level || 1), 1),
            experience: Math.max((profile?.experience || 0), 0),
            experienceToNextLevel: Math.max((profile?.experienceToNextLevel || 1000), 1),
            role: profile?.role || t('profile.defaultTitle')
        };

        // Calcul du progrès XP (AVANT les returns conditionnels)
        const currentXP = safeUser.experience;
        const targetXP = safeUser.experienceToNextLevel;
        const progressPercentage = Math.min(currentXP / targetXP, 1);

        // Animation de progression (DOIT être appelé à chaque render)
        React.useEffect(() => {
            if (!isLoading) {
                Animated.timing(progressAnimation, {
                    toValue: progressPercentage,
                    duration: 2000,
                    useNativeDriver: false,
                }).start();
            }
        }, [progressPercentage, isLoading]);

        // Si en chargement
        if (isLoading) {
            return (
                <View style={{
                    backgroundColor: Colors.light.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.lg,
                    marginHorizontal: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    height: 200,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={{
                        color: Colors.light.textSecondary,
                        fontSize: 14,
                        marginTop: 8,
                    }}>
                        Loading profile... ⚡
                    </Text>
                </View>
            );
        }

        // Fonction pour obtenir le rang
        const getRankInfo = (level: number) => {
            if (level >= 19) return { emoji: '👑', title: 'Master Driver', color: '#FFD700' };
            if (level >= 13) return { emoji: '💎', title: 'Expert Driver', color: '#40E0D0' };
            if (level >= 8) return { emoji: '🥇', title: 'Senior Driver', color: '#FFD700' };
            if (level >= 4) return { emoji: '🥈', title: 'Driver', color: '#C0C0C0' };
            return { emoji: '🥉', title: 'Rookie Driver', color: '#CD7F32' };
        };

        const rankInfo = getRankInfo(safeUser.level);

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
            }
        ];

        // Fonction pour gérer les notifications
        const handleOpenNotifications = () => {
            setShowNotifications(true);
            setTimeout(() => {
                setNotificationCount(0);
            }, 3000);
        };

        return (
            <>
                {/* Header avec avatar et barre de progression circulaire */}
                <View style={{
                    paddingVertical: DESIGN_TOKENS.spacing.xl,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative',
                }}>
                    {/* Avatar avec bordure de progression circulaire */}
                    <Pressable
                        onPress={() => {
                            const now = Date.now();
                            
                            if (now - lastTapTime < 500) {
                                // Double tap détecté
                                console.log('🎉 Easter egg bonus detected!');
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
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            justifyContent: 'center',
                            alignItems: 'center',
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                            marginBottom: DESIGN_TOKENS.spacing.md,
                        })}
                    >
                        {/* Barre de progression circulaire de fond */}
                        <View style={{
                            position: 'absolute',
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 6,
                            borderColor: Colors.light.backgroundTertiary,
                        }} />
                        
                        {/* Barre de progression animée */}
                        <Animated.View style={{
                            position: 'absolute',
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 6,
                            borderColor: 'transparent',
                            borderTopColor: Colors.light.primary,
                            transform: [{ 
                                rotate: progressAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', `${360 * progressPercentage}deg`],
                                })
                            }],
                        }} />

                        {/* Avatar/Photo */}
                        <View style={{
                            width: 96,
                            height: 96,
                            borderRadius: 48,
                            backgroundColor: Colors.light.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: Colors.light.background,
                        }}>
                            <Ionicons name="person" size={48} color={Colors.light.primary} />
                        </View>

                        {/* Badge level */}
                        <View style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: Colors.light.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: Colors.light.background,
                        }}>
                            <Text style={{
                                color: 'white',
                                fontSize: 14,
                                fontWeight: '700',
                            }}>
                                {safeUser.level}
                            </Text>
                        </View>
                    </Pressable>
                    
                    {/* Infos utilisateur centrées */}
                    <VStack gap="xs" align="center" style={{ width: '100%' }}>
                        {/* Nom complet */}
                        <Text style={{
                            fontSize: 22,
                            fontWeight: '700',
                            color: Colors.light.text,
                            textAlign: 'center',
                        }}>
                            {safeUser.firstName} {safeUser.lastName}
                        </Text>

                        {/* Level et XP - Proéminents */}
                        <View style={{
                            backgroundColor: Colors.light.primary + '15',
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            borderWidth: 1,
                            borderColor: Colors.light.primary + '30',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: Colors.light.primary,
                                textAlign: 'center',
                            }}>
                                {t('profile.level')} {safeUser.level} • {safeUser.experience.toLocaleString()} XP
                            </Text>
                        </View>

                        {/* Rang */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: rankInfo.color,
                            textAlign: 'center',
                        }}>
                            {rankInfo.emoji} {rankInfo.title}
                        </Text>

                        {/* Progression */}
                        <Text style={{
                            fontSize: 14,
                            color: Colors.light.textMuted,
                            textAlign: 'center',
                        }}>
                            {Math.round(progressPercentage * 100)}% {t('profile.toNextLevel')} {safeUser.level + 1}
                        </Text>
                    </VStack>
                    
                    {/* Bouton notifications en haut à droite */}
                    <Pressable
                        onPress={handleOpenNotifications}
                        style={({ pressed }) => ({
                            position: 'absolute',
                            top: DESIGN_TOKENS.spacing.lg,
                            right: DESIGN_TOKENS.spacing.lg,
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: pressed 
                                ? Colors.light.backgroundSecondary + '80'
                                : Colors.light.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: Colors.light.border,
                        })}
                    >
                        <Ionicons name="notifications" size={20} color={Colors.light.text} />
                        {notificationCount > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: Colors.light.error,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Text style={{
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: '600',
                                }}>
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Modal de notifications */}
                <NotificationsPanel
                    isVisible={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    notifications={mockNotifications}
                />
            </>
        );
        
    } catch (error) {
        console.error('ProfileHeaderComplete Error:', error);
        
        return (
            <View style={{
                backgroundColor: Colors.light.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                height: 200,
                justifyContent: 'center',
            }}>
                <Text style={{
                    color: Colors.light.error || '#FF3B30',
                    textAlign: 'center',
                }}>
                    Error loading profile
                </Text>
            </View>
        );
    }
};

export default ProfileHeaderComplete;