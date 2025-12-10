/**
 * LanguageButton - Bouton circulaire de changement de langue pour les calendriers
 * Style unifié avec BusinessHeader (rond avec juste le drapeau)
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization, useTranslation } from '../../localization';

interface LanguageButtonProps {
    style?: any;
    size?: number;
}

const LanguageButton: React.FC<LanguageButtonProps> = ({ style, size = 44 }) => {
    const { currentLanguage, setLanguage, getSupportedLanguages } = useLocalization();
    const supportedLanguages = getSupportedLanguages();
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const { colors } = useTheme();
    
    const currentLangInfo = supportedLanguages[currentLanguage];

    return (
        <>
            {/* Bouton circulaire avec juste le drapeau (style Business) */}
            <Pressable
                onPress={() => setShowModal(true)}
                style={({ pressed }) => ({
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.backgroundSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    ...style,
                })}
                hitSlop={DESIGN_TOKENS.touch.hitSlop}
            >
                <Text style={{ fontSize: Math.round(size * 0.4) }}>
                    {currentLangInfo.flag}
                </Text>
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