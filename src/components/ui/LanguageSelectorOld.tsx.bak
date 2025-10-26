/**
 * Composant de sélection de langue simplifié et moderne
 * Design épuré avec animations subtiles
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization, SupportedLanguage } from '../../localization';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const { width: screenWidth } = Dimensions.get('window');

interface LanguageSelectorProps {
    visible: boolean;
    onClose: () => void;
    showHeader?: boolean;
}

interface LanguageItemProps {
    language: any;
    isSelected: boolean;
    isLoading: boolean;
    onPress: () => void;
    colors: any;
}

// Composant pour afficher un drapeau stylisé avec fond blanc rond
const FlagIcon: React.FC<{ flag: string; size?: number }> = ({ flag, size = 32 }) => (
    <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    }}>
        <Text style={{ 
            fontSize: size * 0.6,
            lineHeight: size * 0.7,
        }}>
            {flag}
        </Text>
    </View>
);

// Composant pour un item de langue
const LanguageItem: React.FC<LanguageItemProps> = ({ 
    language, 
    isSelected, 
    isLoading, 
    onPress, 
    colors 
}) => (
    <Pressable
        onPress={onPress}
        disabled={isLoading}
        style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
            marginHorizontal: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.sm,
            borderRadius: DESIGN_TOKENS.radius.xl,
            backgroundColor: pressed 
                ? colors.backgroundSecondary + '80'
                : isSelected 
                ? colors.primary + '15' 
                : colors.backgroundSecondary,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border + '30',
            minHeight: 80,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: isSelected ? colors.primary : colors.shadow,
            shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: isSelected ? 8 : 4,
            elevation: isSelected ? 8 : 3,
        })}
    >
        {/* Flag avec effet de brillance */}
        <View style={{ marginRight: DESIGN_TOKENS.spacing.lg }}>
            <FlagIcon flag={language.flag} size={48} />
            {isSelected && (
                <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Ionicons name="checkmark" size={12} color="white" />
                </View>
            )}
        </View>

        {/* Language info */}
        <View style={{ flex: 1 }}>
            <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: isSelected ? colors.primary : colors.text,
                marginBottom: 4,
            }}>
                {language.nativeName}
            </Text>
            <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontWeight: '500',
            }}>
                {language.name}
            </Text>
            {isSelected && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                }}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                        marginRight: 6,
                    }} />
                    <Text style={{
                        fontSize: 12,
                        color: colors.primary,
                        fontWeight: '600',
                    }}>
                        Actuelle
                    </Text>
                </View>
            )}
        </View>

        {/* Status indicator */}
        <View style={{ 
            width: 24, 
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {isLoading ? (
                <Animated.View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: colors.primary + '30',
                    borderTopColor: colors.primary,
                }} />
            ) : (
                <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                />
            )}
        </View>
    </Pressable>
);

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    visible,
    onClose,
    showHeader = true,
}) => {
    const { colors } = useCommonThemedStyles();
    const { currentLanguage, setLanguage, t, getSupportedLanguages } = useLocalization();
    const [isChanging, setIsChanging] = useState<string | null>(null);
    const [slideAnim] = useState(new Animated.Value(300));

    const supportedLanguages = getSupportedLanguages();

    // Animation d'entrée/sortie
    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleLanguageChange = async (languageCode: SupportedLanguage) => {
        if (languageCode === currentLanguage) {
            onClose();
            return;
        }

        setIsChanging(languageCode);
        try {
            await setLanguage(languageCode);
            onClose();
        } catch (error) {
            console.error('Error changing language:', error);
        } finally {
            setIsChanging(null);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            {/* Background overlay avec blur effect */}
            <Pressable 
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
                onPress={onClose}
            >
                <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable onPress={() => {}} style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <Animated.View style={{
                            transform: [{ translateY: slideAnim }],
                            backgroundColor: colors.background,
                            borderTopLeftRadius: DESIGN_TOKENS.radius.xl * 1.5,
                            borderTopRightRadius: DESIGN_TOKENS.radius.xl * 1.5,
                            maxHeight: '85%',
                            minHeight: '60%',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            elevation: 20,
                        }}>
                            {/* Header moderne avec dégradé */}
                            {showHeader && (
                                <View style={{
                                    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                                    paddingTop: DESIGN_TOKENS.spacing.lg,
                                    paddingBottom: DESIGN_TOKENS.spacing.xl,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.border + '40',
                                }}>
                                    {/* Handle bar */}
                                    <View style={{
                                        width: 40,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: colors.textSecondary + '40',
                                        alignSelf: 'center',
                                        marginBottom: DESIGN_TOKENS.spacing.lg,
                                    }} />
                                    
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }}>
                                                <View style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: colors.primary + '20',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: DESIGN_TOKENS.spacing.md,
                                                }}>
                                                    <Ionicons name="language" size={18} color={colors.primary} />
                                                </View>
                                                <Text style={{
                                                    fontSize: 24,
                                                    fontWeight: '800',
                                                    color: colors.text,
                                                }}>
                                                    {t('settings.language.title')}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontSize: 16,
                                                color: colors.textSecondary,
                                                lineHeight: 22,
                                            }}>
                                                {t('settings.language.description')}
                                            </Text>
                                        </View>
                                        
                                        <Pressable
                                            onPress={onClose}
                                            style={({ pressed }) => ({
                                                width: 44,
                                                height: 44,
                                                borderRadius: 22,
                                                backgroundColor: pressed ? colors.backgroundSecondary : colors.backgroundTertiary,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginLeft: DESIGN_TOKENS.spacing.md,
                                            })}
                                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                        >
                                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {/* Liste des langues avec scroll */}
                            <ScrollView 
                                style={{ flex: 1 }}
                                contentContainerStyle={{ 
                                    paddingVertical: DESIGN_TOKENS.spacing.lg,
                                    paddingBottom: DESIGN_TOKENS.spacing.xl * 2,
                                }}
                                showsVerticalScrollIndicator={false}
                                bounces={true}
                            >
                                {Object.values(supportedLanguages).map((language: any) => {
                                    const isSelected = language.code === currentLanguage;
                                    const isLoading = isChanging === language.code;

                                    return (
                                        <LanguageItem
                                            key={language.code}
                                            language={language}
                                            isSelected={isSelected}
                                            isLoading={isLoading}
                                            onPress={() => handleLanguageChange(language.code)}
                                            colors={colors}
                                        />
                                    );
                                })}
                            </ScrollView>

                            {/* Footer avec info langue actuelle */}
                            <View style={{
                                paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                                paddingVertical: DESIGN_TOKENS.spacing.lg,
                                borderTopWidth: 1,
                                borderTopColor: colors.border + '40',
                                backgroundColor: colors.backgroundSecondary + '50',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FlagIcon flag={supportedLanguages[currentLanguage].flag} size={24} />
                                <Text style={{
                                    fontSize: 14,
                                    color: colors.textSecondary,
                                    marginLeft: DESIGN_TOKENS.spacing.sm,
                                    fontWeight: '600',
                                }}>
                                    {t('settings.language.current')}: {supportedLanguages[currentLanguage].nativeName}
                                </Text>
                            </View>
                        </Animated.View>
                    </Pressable>
                </SafeAreaView>
            </Pressable>
        </Modal>
    );
};

export default LanguageSelector;