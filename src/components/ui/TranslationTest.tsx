/**
 * Composant de test pour le système de traduction
 * Affiche toutes les langues disponibles et permet de basculer facilement
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalization, useTranslation } from '../../localization';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';

const TranslationTest: React.FC = () => {
    const { currentLanguage, setLanguage, getSupportedLanguages } = useLocalization();
    const { t } = useTranslation();
    const supportedLanguages = getSupportedLanguages();

    return (
        <View style={{
            backgroundColor: Colors.light.background,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            margin: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: Colors.light.border,
        }}>
            <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: Colors.light.text,
                marginBottom: DESIGN_TOKENS.spacing.md,
                textAlign: 'center',
            }}>
                🧪 Translation Test
            </Text>

            {/* Test des traductions courantes */}
            <View style={{
                backgroundColor: Colors.light.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: Colors.light.text }}>
                    Current Translations ({currentLanguage.toUpperCase()}):
                </Text>
                
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary }}>
                        • Home: <Text style={{ fontWeight: '600', color: Colors.light.text }}>{t('home.title')}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary }}>
                        • Welcome: <Text style={{ fontWeight: '600', color: Colors.light.text }}>{t('home.welcome')}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary }}>
                        • Calendar: <Text style={{ fontWeight: '600', color: Colors.light.text }}>{t('home.calendar.title')}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary }}>
                        • Language: <Text style={{ fontWeight: '600', color: Colors.light.text }}>{t('common.language')}</Text>
                    </Text>
                </View>
            </View>

            {/* Quick language switcher */}
            <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: Colors.light.text,
                marginBottom: DESIGN_TOKENS.spacing.sm,
            }}>
                Quick Switch:
            </Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
            >
                <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.xs }}>
                    {Object.values(supportedLanguages).map((lang: any) => (
                        <Pressable
                            key={lang.code}
                            onPress={() => setLanguage(lang.code)}
                            style={({ pressed }) => ({
                                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                paddingVertical: DESIGN_TOKENS.spacing.xs,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                backgroundColor: lang.code === currentLanguage 
                                    ? Colors.light.primary 
                                    : pressed 
                                    ? Colors.light.backgroundSecondary 
                                    : Colors.light.backgroundTertiary,
                                borderWidth: 1,
                                borderColor: lang.code === currentLanguage 
                                    ? Colors.light.primary 
                                    : Colors.light.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            })}
                        >
                            <Text style={{ fontSize: 14 }}>{lang.flag}</Text>
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: lang.code === currentLanguage 
                                    ? Colors.light.background 
                                    : Colors.light.text,
                            }}>
                                {lang.code.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            {/* Current language info */}
            <View style={{
                backgroundColor: Colors.light.primary + '10',
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                borderWidth: 1,
                borderColor: Colors.light.primary + '30',
            }}>
                <Text style={{
                    fontSize: 12,
                    color: Colors.light.primary,
                    textAlign: 'center',
                    fontWeight: '600',
                }}>
                    {supportedLanguages[currentLanguage].flag} {supportedLanguages[currentLanguage].nativeName} ({supportedLanguages[currentLanguage].name})
                </Text>
            </View>
        </View>
    );
};

export default TranslationTest;