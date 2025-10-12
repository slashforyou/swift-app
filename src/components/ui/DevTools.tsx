/**
 * Panneau de développement pour les outils de debug
 * À utiliser uniquement en mode développement
 */

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../../localization';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import LanguageSelector from './LanguageSelector';

export const DevTools: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const { currentLanguage, t, getSupportedLanguages } = useLocalization();
    const { colors } = useCommonThemedStyles();

    if (!__DEV__) {
        return null; // Ne s'affiche qu'en mode développement
    }

    const supportedLanguages = getSupportedLanguages();
    const currentLangInfo = supportedLanguages[currentLanguage];

    return (
        <View style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            zIndex: 1000,
        }}>
            {/* Bouton flottant pour ouvrir les dev tools */}
            <Pressable
                onPress={() => setIsVisible(!isVisible)}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Ionicons 
                    name={isVisible ? "close" : "settings"} 
                    size={24} 
                    color="white" 
                />
            </Pressable>

            {/* Panneau des dev tools */}
            {isVisible && (
                <View style={{
                    position: 'absolute',
                    bottom: 70,
                    right: 0,
                    width: 280,
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.1)',
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: 16,
                        textAlign: 'center',
                    }}>
                        🛠️ Dev Tools
                    </Text>

                    {/* Language Selector Button */}
                    <Pressable
                        onPress={() => setShowLanguageSelector(true)}
                        style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            backgroundColor: pressed ? colors.primary + '15' : colors.backgroundSecondary,
                            borderRadius: 12,
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                        })}
                    >
                        <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: 'white',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                        }}>
                            <Text style={{ fontSize: 16 }}>
                                {currentLangInfo.flag}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: colors.text,
                            }}>
                                Language Selector
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                            }}>
                                Current: {currentLangInfo.nativeName}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </Pressable>

                    {/* Debug Info */}
                    <View style={{
                        marginTop: 8,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(0,0,0,0.1)',
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            textAlign: 'center',
                        }}>
                            Test: {t('home.title')}
                        </Text>
                    </View>
                </View>
            )}

            {/* Language Selector Modal */}
            <LanguageSelector
                visible={showLanguageSelector}
                onClose={() => setShowLanguageSelector(false)}
                showHeader={true}
            />
        </View>
    );
};

export default DevTools;