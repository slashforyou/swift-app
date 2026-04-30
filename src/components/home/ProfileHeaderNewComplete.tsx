/**
 * ProfileHeaderComplete - Header avec gamification �pur� pour la page d'accueil
 * Version simplifi�e : Avatar, nom, titre, barre de progression
 *
 * Onboarding progressif :
 *   - La barre XP, le badge niveau et le texte XP sont CACHÉS au départ
 *   - Ils s'unlock après le milestone `first_job_created`
 *   - Un reveal animé + bulle explicative est joué une seule fois
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useOnboardingMilestones } from '../../hooks/useOnboardingMilestones';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from '../../localization';
import { HStack, VStack } from '../primitives/Stack';

interface ProfileHeaderProps {
    navigation: any;
}

const ProfileHeaderComplete: React.FC<ProfileHeaderProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const { profile, isLoading } = useUserProfile();
    const { t } = useTranslation();
    const { isReady, isUnlocked, isShown, markShown } = useOnboardingMilestones();

    // ── Onboarding : XP visible uniquement après first_job_created ────────────
    const xpUnlocked = isReady && isUnlocked('first_job_created');
    const xpAlreadyShown = isShown('first_job_created');

    // Animated values pour le reveal
    const revealOpacity = useRef(new Animated.Value(xpUnlocked ? 1 : 0)).current;
    const revealScale = useRef(new Animated.Value(xpUnlocked ? 1 : 0.7)).current;
    const [showRevealBubble, setShowRevealBubble] = useState(false);
    const hasPlayedReveal = useRef(xpAlreadyShown);

    useEffect(() => {
        if (!xpUnlocked || hasPlayedReveal.current) return;
        hasPlayedReveal.current = true;

        // Délai court pour laisser le layout se stabiliser
        const timer = setTimeout(() => {
            setShowRevealBubble(true);
            Animated.parallel([
                Animated.spring(revealOpacity, { toValue: 1, useNativeDriver: true }),
                Animated.spring(revealScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
            ]).start(() => {
                // Masquer la bulle après 5 secondes et marquer comme montrée
                setTimeout(() => {
                    setShowRevealBubble(false);
                    markShown('first_job_created');
                }, 5000);
            });
        }, 600);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xpUnlocked]);
    
    // Donn�es utilisateur s�curis�es avec fallbacks
    const safeUser = {
        firstName: profile?.firstName || 'User',
        lastName: profile?.lastName || '',
        level: Math.max((profile?.level || 1), 1),
        experience: Math.max((profile?.experience || 0), 0),
        experienceToNextLevel: Math.max((profile?.experienceToNextLevel || 1000), 1),
        role: profile?.role || t('profile.defaultTitle')
    };

    // Calcul du progr�s XP
    const currentXP = safeUser.experience;
    const targetXP = safeUser.experienceToNextLevel;
    const progressPercentage = Math.min((currentXP / targetXP) * 100, 100);

    // Fonction pour obtenir l'emoji du rang
    const getRankEmoji = (level: number) => {
        if (level >= 19) return '??';
        if (level >= 13) return '??';
        if (level >= 8) return '??';
        if (level >= 4) return '?';
        return '??';
    };

    // Si en chargement
    if (isLoading) {
        return (
            <View style={{
                paddingVertical: DESIGN_TOKENS.spacing.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
            }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 8,
                }}>
                    {t('common.loading')}
                </Text>
            </View>
        );
    }

    return (
        <View>
        <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => ({
                paddingVertical: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                backgroundColor: 'transparent',
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <HStack gap="md" align="center" style={{ width: '100%' }}>
                {/* Avatar avec badge niveau */}
                <View style={{ position: 'relative' }}>
                    {/* Avatar */}
                    <View style={{
                        width: 90,
                        height: 90,
                        borderRadius: 45,
                        backgroundColor: colors.backgroundSecondary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: colors.primary + '30',
                    }}>
                        <Ionicons name="person" size={40} color={colors.primary} />
                    </View>

                    {/* Badge niveau en overlay — visible uniquement si XP débloqué */}
                    {xpUnlocked && (
                        <Animated.View style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            backgroundColor: colors.primary,
                            borderRadius: 14,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderWidth: 3,
                            borderColor: colors.background,
                            shadowColor: colors.shadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 4,
                            opacity: revealOpacity,
                            transform: [{ scale: revealScale }],
                        }}>
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: 'white',
                            }}>
                                Lvl {safeUser.level}
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* Infos utilisateur */}
                <VStack gap="xs" style={{ flex: 1 }}>
                    {/* Nom */}
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: colors.text,
                        }}
                        numberOfLines={1}
                    >
                        {safeUser.firstName} {safeUser.lastName}
                    </Text>

                    {/* Titre/Rang avec emoji */}
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.textSecondary,
                        }}
                        numberOfLines={1}
                    >
                        {getRankEmoji(safeUser.level)} {safeUser.role}
                    </Text>

                    {/* Barre de progression — visible uniquement si XP débloqué */}
                    {xpUnlocked && (
                        <Animated.View style={{ opacity: revealOpacity, transform: [{ scale: revealScale }] }}>
                            <HStack gap="sm" align="center" style={{ marginTop: 4 }}>
                                <View style={{
                                    flex: 1,
                                    height: 8,
                                    backgroundColor: colors.backgroundTertiary,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <View style={{
                                        width: `${progressPercentage}%`,
                                        height: '100%',
                                        backgroundColor: colors.primary,
                                        borderRadius: 4,
                                    }} />
                                </View>
                                <Text style={{
                                    fontSize: 11,
                                    fontWeight: '700',
                                    color: colors.primary,
                                    minWidth: 38,
                                }}>
                                    {Math.round(progressPercentage)}%
                                </Text>
                            </HStack>

                            {/* Texte progression (optionnel, petit) */}
                            <Text style={{
                                fontSize: 9,
                                color: colors.textMuted,
                                marginTop: 2,
                            }}>
                                {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
                            </Text>
                        </Animated.View>
                    )}
                </VStack>
            </HStack>
        </Pressable>

        {/* Bulle de reveal XP — apparaît une seule fois après first_job_created */}
        {showRevealBubble && (
            <Pressable
                onPress={() => {
                    setShowRevealBubble(false);
                    markShown('first_job_created');
                }}
                style={{
                    marginHorizontal: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 6,
                }}
            >
                <Text style={{ fontSize: 22 }}>🏆</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>
                        XP & Achievements unlocked!
                    </Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                        You completed your first job. Your progress is now tracked here.
                    </Text>
                </View>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
        )}
        </View>
    );
};

export default ProfileHeaderComplete;
