/**
 * Home - Écran d'accueil moderne avec gamification et traductions
 * Architecture moderne avec Safe Areas, ProfileHeader et navigation cohérente
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VStack, HStack } from '../components/primitives/Stack';
import { Screen } from '../components/primitives/Screen';
import ProfileHeaderComplete from '../components/home/ProfileHeaderNewComplete';
import ServerConnectionTest from '@/tests/server/connectionTest';
import { useAuthCheck } from '../utils/checkAuth';
import { DESIGN_TOKENS } from '../constants/Styles';
import { Colors } from '../constants/Colors';
import { useTranslation, useLocalization } from '../localization';
import LanguageSelector from '../components/ui/LanguageSelector';

// Types et interfaces
interface HomeScreenProps {
    navigation: any;
}

interface MenuItemProps {
    title: string;
    icon: string;
    description: string;
    onPress: () => void;
    color?: string;
}

// Composant MenuItem moderne
const MenuItem: React.FC<MenuItemProps> = ({ title, icon, description, onPress, color = Colors.light.primary }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.light.backgroundTertiary : Colors.light.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.xs,
            shadowColor: Colors.light.shadow,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: Colors.light.border,
            minHeight: DESIGN_TOKENS.touch.minSize + 20, // Touch target + extra space
        })}
    >
        <HStack gap="md" align="center">
            {/* Icône avec fond coloré */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    backgroundColor: color,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons name={icon as any} size={24} color="white" />
            </View>
            
            {/* Textes */}
            <VStack gap="xs" style={{ flex: 1 }}>
                <Text
                    style={{
                        color: Colors.light.text,
                        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                    }}
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: Colors.light.textSecondary,
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                        fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                    }}
                >
                    {description}
                </Text>
            </VStack>
            
            {/* Chevron */}
            <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors.light.textMuted} 
            />
        </HStack>
    </Pressable>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const { t } = useTranslation();
    const { currentLanguage, getSupportedLanguages } = useLocalization();
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    
    const supportedLanguages = getSupportedLanguages();
    const currentLangInfo = supportedLanguages[currentLanguage];

    if (isLoading) return LoadingComponent;

    return (
        <Screen>
            {/* Main Content */}
            <VStack 
                gap="lg" 
                style={{
                    flex: 1,
                    paddingTop: insets.top + DESIGN_TOKENS.spacing.xl,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                }}
            >
                {/* Profile Header avec gamification - pleine largeur */}
                <View style={{ marginHorizontal: -DESIGN_TOKENS.spacing.lg }}>
                    <ProfileHeaderComplete navigation={navigation} />
                </View>

                {/* Header avec titre et bouton langue */}
                <HStack gap="md" justify="space-between" align="center" style={{
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    marginTop: DESIGN_TOKENS.spacing.lg,
                }}>
                    <Text style={{
                        fontSize: 22,
                        fontWeight: '700',
                        color: Colors.light.text,
                    }}>
                        {t('home.title')}
                    </Text>
                    
                    {/* Bouton langue simplifié */}
                    <Pressable
                        onPress={() => setShowLanguageSelector(true)}
                        style={({ pressed }) => ({
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: Colors.light.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: Colors.light.border,
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                        hitSlop={DESIGN_TOKENS.touch.hitSlop}
                    >
                        <Text style={{ fontSize: 18 }}>
                            {currentLangInfo.flag}
                        </Text>
                    </Pressable>
                </HStack>

                {/* Navigation menu */}
                <View style={{ 
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    flex: 1,
                }}>
                    <VStack gap="xs">
                        <MenuItem
                            title={t('home.calendar.title')}
                            icon="calendar"
                            description={t('home.calendar.description')}
                            onPress={() => navigation.navigate('Calendar')}
                            color={Colors.light.primary}
                        />
                        
                        <MenuItem
                            title={t('home.business.title')}
                            icon="business"
                            description={t('home.business.description')}
                            onPress={() => navigation.navigate('Business')}
                            color={Colors.light.success}
                        />
                        
                        <MenuItem
                            title={t('home.parameters.title')}
                            icon="settings"
                            description={t('home.parameters.description')}
                            onPress={() => navigation.navigate('Parameters')}
                            color={Colors.light.warning}
                        />
                    </VStack>
                </View>

            </VStack>
            
            {/* Bouton DevTools flottant en bas à droite */}
            {__DEV__ && (
                <Pressable
                    onPress={() => {/* TODO: Ouvrir modal DevTools */}}
                    style={({ pressed }) => ({
                        position: 'absolute',
                        bottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                        right: DESIGN_TOKENS.spacing.lg,
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: Colors.light.backgroundSecondary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: Colors.light.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 8,
                        borderWidth: 1,
                        borderColor: Colors.light.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                >
                    <Ionicons 
                        name="terminal" 
                        size={24} 
                        color={Colors.light.textSecondary} 
                    />
                </Pressable>
            )}
            
            {/* Modal de sélection de langue */}
            <LanguageSelector
                visible={showLanguageSelector}
                onClose={() => setShowLanguageSelector(false)}
            />
        </Screen>
    );
};

export default HomeScreen;