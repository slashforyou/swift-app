/**
 * ProfileHeaderComplete - Header avec gamification �pur� pour la page d'accueil
 * Version simplifi�e : Avatar, nom, titre, barre de progression
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
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

                    {/* Badge niveau en overlay */}
                    <View style={{
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
                    }}>
                        <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: 'white',
                        }}>
                            Lvl {safeUser.level}
                        </Text>
                    </View>
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

                    {/* Barre de progression */}
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
                </VStack>
            </HStack>
        </Pressable>
    );
};

export default ProfileHeaderComplete;
