/**
 * ⚠️ ATTENTION - FICHIER PROTÉGÉ ⚠️
 * =================================
 * Ce composant a été soigneusement calibré pour l'UX de l'application.
 * Avant toute modification, veuillez demander confirmation :
 * "Souhaitez-vous vraiment modifier ce fichier ?"
 * 
 * ProfileHeader - Header compact avec gamification pour la page d'accueil
 * Affiche le level + barre de progression avec animation d'apparition
 * Supporte les modes Light et Dark
 * 
 * @author Romain Giovanni - Slashforyou
 * @lastModified 16/01/2026
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useNotifications } from '../../context/NotificationsProvider';
import { useTheme } from '../../context/ThemeProvider';
import { useGamification } from '../../hooks/useGamification';
import { useLocalization } from '../../localization';
import { getDemoNotifications } from '../../services/notificationsService';
import { HStack } from '../primitives/Stack';
import NotificationsPanel from './NotificationsPanel';

interface ProfileHeaderProps {
    navigation: any;
    onLanguagePress?: () => void;
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
}

// Variable pour le double tap
let lastTapTime = 0;

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
    navigation, 
    onLanguagePress,
}) => {
    const { data: gamificationData, isLoading, addXP } = useGamification();
    const { colors } = useTheme();
    const { currentLanguage, getSupportedLanguages } = useLocalization();
    const { unreadCount, addNotification } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const entranceAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(0.8)).current;
    
    // Générer des notifications de démo au premier lancement (DEV uniquement)
    const [hasGeneratedDemo, setHasGeneratedDemo] = useState(false);
    useEffect(() => {
        if (__DEV__ && !hasGeneratedDemo && unreadCount === 0) {
            // Ajouter les notifications de démo avec un délai
            const demoNotifs = getDemoNotifications();
            demoNotifs.forEach((notif, index) => {
                setTimeout(() => {
                    addNotification(notif);
                }, index * 500); // Décaler chaque notification de 500ms
            });
            setHasGeneratedDemo(true);
        }
    }, [hasGeneratedDemo, unreadCount, addNotification]);
    
    // Utiliser les données de gamification ou des valeurs par défaut
    const user = gamificationData || {
        firstName: 'User',
        level: 1,
        xp: 0,
        xpProgress: 0,
        xpToNextLevel: 100,
        totalXpForNextLevel: 100,
    };

    // Animation d'entrée au montage
    useEffect(() => {
        if (isLoading) return;
        
        // Animation d'apparition (fade + scale)
        Animated.parallel([
            Animated.timing(entranceAnimation, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
        
        // Animation de la barre de progression (démarée après l'entrée)
        setTimeout(() => {
            const progressPercentage = user.xpProgress !== undefined 
                ? user.xpProgress / 100 
                : user.xpToNextLevel 
                    ? ((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) 
                    : 0;
            
            Animated.timing(progressAnimation, {
                toValue: progressPercentage,
                duration: 1500,
                useNativeDriver: false,
            }).start();
        }, 400);
    }, [isLoading, user.xp, user.xpProgress]);

    // Si en cours de chargement, afficher un placeholder compact
    if (isLoading) {
        return (
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.xl,
                padding: DESIGN_TOKENS.spacing.md,
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.md,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Text style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                }}>
                    ⚡ Loading...
                </Text>
            </View>
        );
    }

    // Calculer le pourcentage de progression
    const progressPercent = Math.round(
        ((user.totalXpForNextLevel || 500) - (user.xpToNextLevel || 0)) / (user.totalXpForNextLevel || 500) * 100
    );

    return (
        <>
            {/* Container avec animation d'entrée */}
            <Animated.View style={{
                opacity: entranceAnimation,
                transform: [{ scale: scaleAnimation }],
            }}>
                {/* Barre du haut - Notifications + Langue */}
                <HStack 
                    gap="sm" 
                    align="center" 
                    justify="flex-end"
                    style={{
                        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                        marginBottom: DESIGN_TOKENS.spacing.sm,
                    }}
                >
                    <Pressable
                        onPress={() => setShowNotifications(true)}
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        })}
                    >
                        <Ionicons name="notifications" size={20} color={colors.textSecondary} />
                        {unreadCount > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                backgroundColor: colors.error,
                                borderRadius: 9,
                                minWidth: 18,
                                height: 18,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Text style={{
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: '700',
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                    
                    {/* Bouton Langue - utilise le modal du parent */}
                    <Pressable
                        onPress={onLanguagePress}
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        })}
                    >
                        <Text style={{ fontSize: 18 }}>
                            {getSupportedLanguages()[currentLanguage]?.flag || '🌐'}
                        </Text>
                    </Pressable>
                </HStack>

                {/* Card compacte - Avatar + Level + Progression */}
                <Pressable
                    onPress={() => {
                        const now = Date.now();
                        if (now - lastTapTime < 500) {
                            // Double tap - Easter egg
                            addXP(5, '🎯 Easter egg bonus!');
                        }
                        lastTapTime = now;
                    }}
                    onLongPress={() => navigation.navigate('XpHistory')}
                    style={({ pressed }) => ({
                        marginHorizontal: DESIGN_TOKENS.spacing.lg,
                        marginBottom: DESIGN_TOKENS.spacing.md,
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.xl,
                        padding: DESIGN_TOKENS.spacing.md,
                        opacity: pressed ? 0.95 : 1,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 4,
                    })}
                >
                    <HStack gap="md" align="center">
                        {/* Avatar avec badge Level */}
                        <Pressable
                            onPress={() => navigation.navigate('Profile')}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.8 : 1,
                            })}
                        >
                            <View style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: colors.background,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#FF8C00',
                            }}>
                                <Ionicons 
                                    name="person" 
                                    size={28} 
                                    color={colors.textSecondary} 
                                />
                            </View>
                            {/* Badge Level en overlay */}
                            <View style={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                backgroundColor: '#FF8C00',
                                borderRadius: 10,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderWidth: 2,
                                borderColor: colors.backgroundSecondary,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '800',
                                    color: 'white',
                                }}>
                                    Lv.{user.level || 1}
                                </Text>
                            </View>
                        </Pressable>

                        {/* Progression vers le prochain niveau */}
                        <View style={{ flex: 1 }}>
                            <HStack gap="sm" align="center" style={{ marginBottom: 6 }}>
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '700',
                                    color: colors.text,
                                }}>
                                    {user.xp?.toLocaleString() || 0} XP
                                </Text>
                                <View style={{
                                    backgroundColor: colors.backgroundTertiary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 10,
                                }}>
                                    <Text style={{
                                        fontSize: 11,
                                        fontWeight: '600',
                                        color: colors.textSecondary,
                                    }}>
                                        Lv. {(user.level || 1) + 1} dans {user.xpToNextLevel || 0} XP
                                    </Text>
                                </View>
                            </HStack>
                            
                            {/* Barre de progression */}
                            <View style={{
                                height: 10,
                                backgroundColor: colors.border,
                                borderRadius: 5,
                                overflow: 'hidden',
                            }}>
                                <Animated.View style={{
                                    height: '100%',
                                    borderRadius: 5,
                                    backgroundColor: '#FF8C00',
                                    width: progressAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                }} />
                            </View>
                        </View>

                        {/* Boutons d'action - Leaderboard et Badges */}
                        <HStack gap="sm">
                            <Pressable
                                onPress={() => {
                                    console.log('🏆 [NAV] Button pressed → Leaderboard');
                                    navigation.navigate('Leaderboard');
                                }}
                                style={({ pressed }) => ({
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: pressed ? colors.backgroundTertiary : colors.background,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                })}
                            >
                                <Ionicons name="trophy" size={22} color="#FFD700" />
                            </Pressable>
                            
                            <Pressable
                                onPress={() => {
                                    console.log('🎖️ [NAV] Button pressed → Badges');
                                    navigation.navigate('Badges');
                                }}
                                style={({ pressed }) => ({
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: pressed ? colors.backgroundTertiary : colors.background,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                })}
                            >
                                <Ionicons name="ribbon" size={22} color="#00CEC9" />
                            </Pressable>
                        </HStack>
                    </HStack>
                </Pressable>
            </Animated.View>

            {/* Panel des notifications */}
            <NotificationsPanel
                isVisible={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </>
    );
};

export default ProfileHeader;