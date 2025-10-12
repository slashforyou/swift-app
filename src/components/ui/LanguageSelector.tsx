/**
 * Composant de sélection de langue avec modal moderne
 * Design cohérent avec l'app Swift
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization, SupportedLanguage } from '../../localization';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

interface LanguageSelectorProps {
    visible: boolean;
    onClose: () => void;
    showHeader?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    visible,
    onClose,
    showHeader = true,
}) => {
    const { colors } = useCommonThemedStyles();
    const { currentLanguage, setLanguage, t, getSupportedLanguages } = useLocalization();
    const [isChanging, setIsChanging] = useState<string | null>(null);

    const supportedLanguages = getSupportedLanguages();

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
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: colors.background,
                        borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
                        borderTopRightRadius: DESIGN_TOKENS.radius.xl,
                        maxHeight: '80%',
                        paddingTop: DESIGN_TOKENS.spacing.md,
                    }}>
                        {/* Header */}
                        {showHeader && (
                            <View style={{
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                paddingBottom: DESIGN_TOKENS.spacing.lg,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            fontSize: 20,
                                            fontWeight: '700',
                                            color: colors.text,
                                            marginBottom: 4,
                                        }}>
                                            {t('settings.language.title')}
                                        </Text>
                                        <Text style={{
                                            fontSize: 14,
                                            color: colors.textSecondary,
                                        }}>
                                            {t('settings.language.description')}
                                        </Text>
                                    </View>
                                    
                                    <Pressable
                                        onPress={onClose}
                                        style={({ pressed }) => ({
                                            padding: DESIGN_TOKENS.spacing.sm,
                                            borderRadius: DESIGN_TOKENS.radius.md,
                                            backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                                        })}
                                        hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                    >
                                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {/* Liste des langues */}
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
                            showsVerticalScrollIndicator={false}
                        >
                            {Object.values(supportedLanguages).map((language) => {
                                const isSelected = language.code === currentLanguage;
                                const isLoading = isChanging === language.code;

                                return (
                                    <Pressable
                                        key={language.code}
                                        onPress={() => handleLanguageChange(language.code)}
                                        disabled={isLoading}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: DESIGN_TOKENS.spacing.lg,
                                            marginBottom: DESIGN_TOKENS.spacing.sm,
                                            borderRadius: DESIGN_TOKENS.radius.lg,
                                            backgroundColor: pressed 
                                                ? colors.backgroundSecondary
                                                : isSelected 
                                                ? colors.primary + '15' 
                                                : colors.backgroundSecondary,
                                            borderWidth: isSelected ? 2 : 1,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            minHeight: 72,
                                        })}
                                    >
                                        {/* Flag */}
                                        <View style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            backgroundColor: colors.background,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: DESIGN_TOKENS.spacing.md,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        }}>
                                            <Text style={{ fontSize: 20 }}>
                                                {language.flag}
                                            </Text>
                                        </View>

                                        {/* Language info */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: colors.text,
                                                marginBottom: 2,
                                            }}>
                                                {language.nativeName}
                                            </Text>
                                            <Text style={{
                                                fontSize: 14,
                                                color: colors.textSecondary,
                                            }}>
                                                {language.name}
                                            </Text>
                                        </View>

                                        {/* Status indicator */}
                                        <View style={{ 
                                            width: 24, 
                                            height: 24,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            {isLoading ? (
                                                <View style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    borderWidth: 2,
                                                    borderColor: colors.primary + '30',
                                                    borderTopColor: colors.primary,
                                                }} />
                                            ) : isSelected ? (
                                                <Ionicons 
                                                    name="checkmark-circle" 
                                                    size={24} 
                                                    color={colors.primary} 
                                                />
                                            ) : null}
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {/* Current language indicator */}
                        <View style={{
                            padding: DESIGN_TOKENS.spacing.lg,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                            backgroundColor: colors.backgroundSecondary,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                                textAlign: 'center',
                            }}>
                                {t('settings.language.current')}: {supportedLanguages[currentLanguage].nativeName}
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default LanguageSelector;