/**
 * LanguageButton - Bouton compact de changement de langue pour les calendriers
 * Composant réutilisable pour toutes les pages calendar
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization, useTranslation } from '../../localization';
import { Colors } from '../../constants/Colors';
import { DESIGN_TOKENS } from '../../constants/Styles';

interface LanguageButtonProps {
    style?: any;
}

const LanguageButton: React.FC<LanguageButtonProps> = ({ style }) => {
    const { currentLanguage, setLanguage, getSupportedLanguages } = useLocalization();
    const supportedLanguages = getSupportedLanguages();
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const getCurrentLanguageDisplay = () => {
        const lang = supportedLanguages[currentLanguage];
        return lang?.flag + ' ' + lang?.code.toUpperCase() || 'EN';
    };

    return (
        <>
            {/* Bouton compact */}
            <Pressable
                onPress={() => setShowModal(true)}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed 
                        ? Colors.light.backgroundSecondary + '80'
                        : Colors.light.backgroundSecondary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: Colors.light.border,
                    minWidth: 60,
                    ...style,
                })}
            >
                <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: Colors.light.text,
                    marginRight: 4,
                }}>
                    {getCurrentLanguageDisplay()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.light.textSecondary} />
            </Pressable>

            {/* Modal de sélection */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable 
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={() => setShowModal(false)}
                >
                    <View style={{
                        backgroundColor: Colors.light.background,
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        padding: DESIGN_TOKENS.spacing.lg,
                        minWidth: 200,
                        maxWidth: 280,
                        borderWidth: 1,
                        borderColor: Colors.light.border,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: Colors.light.text,
                            textAlign: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.md,
                        }}>
                            {t('common.language')}
                        </Text>

                        {Object.entries(supportedLanguages).map(([code, lang]: [string, any]) => (
                            <Pressable
                                key={code}
                                onPress={() => {
                                    setLanguage(code as any);
                                    setShowModal(false);
                                }}
                                style={({ pressed }) => ({
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                    borderRadius: DESIGN_TOKENS.radius.md,
                                    backgroundColor: pressed 
                                        ? Colors.light.backgroundSecondary
                                        : currentLanguage === code 
                                            ? Colors.light.primary + '15'
                                            : 'transparent',
                                    marginBottom: DESIGN_TOKENS.spacing.xs,
                                })}
                            >
                                <Text style={{
                                    fontSize: 24,
                                    marginRight: DESIGN_TOKENS.spacing.sm,
                                }}>
                                    {lang.flag}
                                </Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: currentLanguage === code ? '600' : '400',
                                        color: currentLanguage === code 
                                            ? Colors.light.primary 
                                            : Colors.light.text,
                                    }}>
                                        {lang.name}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: Colors.light.textSecondary,
                                    }}>
                                        {lang.nativeName}
                                    </Text>
                                </View>
                                {currentLanguage === code && (
                                    <Ionicons 
                                        name="checkmark-circle" 
                                        size={20} 
                                        color={Colors.light.primary} 
                                    />
                                )}
                            </Pressable>
                        ))}

                        <Pressable
                            onPress={() => setShowModal(false)}
                            style={{
                                marginTop: DESIGN_TOKENS.spacing.sm,
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                color: Colors.light.textSecondary,
                                fontSize: 14,
                            }}>
                                {t('common.cancel')}
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

export default LanguageButton;