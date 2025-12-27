/**
 * Home - Écran d'accueil moderne avec gamification et traductions
 * Architecture moderne avec Safe Areas, ProfileHeader et navigation cohérente
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileHeaderComplete from '../components/home/ProfileHeaderNewComplete';
import TodaySection from '../components/home/TodaySection';
import { Screen } from '../components/primitives/Screen';
import { HStack, VStack } from '../components/primitives/Stack';
import LanguageSelector from '../components/ui/LanguageSelector';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useLocalization, useTranslation } from '../localization';
import { useAuthCheck } from '../utils/checkAuth';

// Types et interfaces
interface HomeScreenProps {
    navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const { t } = useTranslation();
    const { currentLanguage, getSupportedLanguages } = useLocalization();
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    
    const supportedLanguages = getSupportedLanguages();
    const currentLangInfo = supportedLanguages[currentLanguage];

    // Composant MenuItem interne avec accès aux couleurs du thème
    const MenuItem = ({ 
        title, 
        icon, 
        description, 
        onPress, 
        color = colors.primary 
    }: {
        title: string;
        icon: string;
        description: string;
        onPress: () => void;
        color?: string;
    }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.xs,
                shadowColor: colors.shadow,
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: DESIGN_TOKENS.touch.minSize + 20,
            })}
        >
            <HStack gap="md" align="center">
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
                    <Ionicons name={icon as any} size={24} color={colors.buttonPrimaryText} />
                </View>
                
                <VStack gap="xs" style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                            lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                            fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                        }}
                    >
                        {title}
                    </Text>
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                            fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                        }}
                    >
                        {description}
                    </Text>
                </VStack>
                
                <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textMuted} 
                />
            </HStack>
        </Pressable>
    );

    if (isLoading) return LoadingComponent;

    return (
        <Screen>
            <VStack 
                gap="lg" 
                style={{
                    flex: 1,
                    paddingTop: insets.top + DESIGN_TOKENS.spacing.xl,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                }}
            >
                <View style={{ 
                    marginHorizontal: -DESIGN_TOKENS.spacing.lg,
                }}>
                    <ProfileHeaderComplete navigation={navigation} />
                </View>

                <HStack gap="md" justify="space-between" align="center" style={{
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                }}>
                    <Text style={{
                        fontSize: 22,
                        fontWeight: '700',
                        color: colors.text,
                    }}>
                        {t('home.title')}
                    </Text>
                    
                    <Pressable
                        onPress={() => setShowLanguageSelector(true)}
                        style={({ pressed }) => ({
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: colors.border,
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                        hitSlop={DESIGN_TOKENS.touch.hitSlop}
                    >
                        <Text style={{ fontSize: 18 }}>
                            {currentLangInfo.flag}
                        </Text>
                    </Pressable>
                </HStack>

                <View style={{ 
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                }}>
                    <TodaySection 
                        onPress={() => {
                            const today = new Date();
                            navigation.navigate('Calendar', { 
                                screen: 'Day',
                                params: { 
                                    day: today.getDate(),
                                    month: today.getMonth() + 1,
                                    year: today.getFullYear()
                                }
                            });
                        }}
                    />
                </View>

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
                            color={colors.primary}
                        />
                        
                        <MenuItem
                            title={t('home.business.title')}
                            icon="business"
                            description={t('home.business.description')}
                            onPress={() => navigation.navigate('Business')}
                            color={colors.success}
                        />
                        
                        <MenuItem
                            title={t('home.parameters.title')}
                            icon="settings"
                            description={t('home.parameters.description')}
                            onPress={() => navigation.navigate('Parameters')}
                            color={colors.warning}
                        />
                    </VStack>
                </View>

            </VStack>
            
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
                        backgroundColor: colors.backgroundSecondary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                >
                    <Ionicons 
                        name="terminal" 
                        size={24} 
                        color={colors.textSecondary} 
                    />
                </Pressable>
            )}
            
            <LanguageSelector
                visible={showLanguageSelector}
                onClose={() => setShowLanguageSelector(false)}
            />
        </Screen>
    );
};

export default HomeScreen;