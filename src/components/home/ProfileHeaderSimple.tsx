/**
 * ProfileHeaderComplete - Version simplifiée temporaire pour debug
 */
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import { useTranslation } from '../../localization';

interface ProfileHeaderProps {
    navigation: any;
    notifications?: number;
}

const ProfileHeaderComplete: React.FC<ProfileHeaderProps> = ({ navigation }) => {
    try {
        const { profile, isLoading } = useUserProfile();
        const { t } = useTranslation();
        
        // Si en chargement
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
                    <ActivityIndicator size="small" color={Colors.light.primary} />
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

        // Version simple qui fonctionne
        return (
            <View style={{
                backgroundColor: Colors.light.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                minHeight: 90,
            }}>
                {/* Nom */}
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: Colors.light.text,
                    textAlign: 'center',
                }}>
                    {profile?.firstName || 'User'} {profile?.lastName || ''}
                </Text>
                
                {/* Level statique temporaire */}
                <View style={{
                    backgroundColor: Colors.light.primary + '15',
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: Colors.light.primary + '30',
                    marginTop: 8,
                }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: Colors.light.primary,
                        textAlign: 'center',
                    }}>
                        Level 1 • 0 XP
                    </Text>
                </View>
                
                {/* Rang temporaire */}
                <Text style={{
                    fontSize: 12,
                    color: Colors.light.textSecondary,
                    textAlign: 'center',
                    marginTop: 4,
                }}>
                    🥉 {t('profile.defaultTitle')}
                </Text>
            </View>
        );
        
    } catch (error) {
        console.error('ProfileHeaderComplete Error:', error);
        
        // Fallback en cas d'erreur
        return (
            <View style={{
                backgroundColor: Colors.light.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                height: 90,
                justifyContent: 'center',
            }}>
                <Text style={{
                    color: Colors.light.error || '#FF3B30',
                    textAlign: 'center',
                    fontSize: 14,
                }}>
                    Error loading profile
                </Text>
            </View>
        );
    }
};

export default ProfileHeaderComplete;