/**
 * Composant de sélection de langue simplifié et moderne
 * Design épuré avec animations subtiles
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization, SupportedLanguage } from '../../localization';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

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

// Composant simple pour un item de langue
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
            borderRadius: DESIGN_TOKENS.radius.lg,
            backgroundColor: pressed 
                ? colors.backgroundSecondary + '80'
                : isSelected 
                ? colors.primary + '10' 
                : colors.backgroundSecondary,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            minHeight: 64,
        })}
    >
        {/* Drapeau */}
        <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: DESIGN_TOKENS.spacing.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        }}>
            <Text style={{ fontSize: 20 }}>
                {language.flag}
            </Text>
        </View>

        {/* Informations langue */}
        <View style={{ flex: 1 }}>
            <Text style={{
                fontSize: 16,
                fontWeight: isSelected ? '700' : '500',
                color: isSelected ? colors.primary : colors.text,
                marginBottom: 2,
            }}>
                {language.nativeName}
            </Text>
            <Text style={{
                fontSize: 13,
                color: colors.textSecondary,
            }}>
                {language.name}
            </Text>
        </View>

        {/* Indicateur de statut */}
        <View style={{ width: 24, alignItems: 'center' }}>
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    const { currentLanguage, setLanguage, getSupportedLanguages } = useLocalization();
    const [isChanging, setIsChanging] = useState<string | null>(null);

    const supportedLanguages = getSupportedLanguages();
    const languageList = Object.values(supportedLanguages);

    const handleLanguageChange = async (languageCode: SupportedLanguage) => {
        if (languageCode === currentLanguage) {
            onClose();
            return;
        }

        setIsChanging(languageCode);
        try {
            await setLanguage(languageCode);
            // Petit délai pour montrer le feedback visuel
            setTimeout(() => {
                onClose();
                setIsChanging(null);
            }, 500);
        } catch (error) {
            console.error('Error changing language:', error);
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
            {/* Background overlay */}
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header spacer pour pouvoir fermer en tapant en haut */}
                    <Pressable 
                        style={{ flex: 0.2, minHeight: 60 }} 
                        onPress={onClose} 
                    />
                    
                    {/* Modal content */}
                    <Pressable onPress={() => {}} style={{ flex: 1 }}>
                        <View style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
                            borderTopRightRadius: DESIGN_TOKENS.radius.xl,
                            flex: 1,
                            width: '100%',
                        }}>
                            {/* Header */}
                            {showHeader && (
                                <View style={{
                                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                    paddingTop: DESIGN_TOKENS.spacing.lg,
                                    paddingBottom: DESIGN_TOKENS.spacing.md,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.border,
                                }}>
                                    {/* Handle bar */}
                                    <View style={{
                                        width: 36,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: colors.textMuted,
                                        alignSelf: 'center',
                                        marginBottom: DESIGN_TOKENS.spacing.md,
                                    }} />
                                    
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <Text style={{
                                            fontSize: 20,
                                            fontWeight: '700',
                                            color: colors.text,
                                        }}>
                                            Select Language
                                        </Text>
                                        
                                        <Pressable
                                            onPress={onClose}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: colors.backgroundSecondary,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="close" size={18} color={colors.text} />
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {/* Liste des langues */}
                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{
                                    paddingTop: DESIGN_TOKENS.spacing.md,
                                    paddingBottom: DESIGN_TOKENS.spacing.xl,
                                    flexGrow: 1,
                                }}
                                showsVerticalScrollIndicator={false}
                            >
                                {languageList.map((language) => (
                                    <LanguageItem
                                        key={language.code}
                                        language={language}
                                        isSelected={language.code === currentLanguage}
                                        isLoading={isChanging === language.code}
                                        onPress={() => handleLanguageChange(language.code)}
                                        colors={colors}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default LanguageSelector;