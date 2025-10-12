/**
 * Tests unitaires pour le système de traduction
 * Vérifier la cohérence et la fonctionnalité des traductions
 */

import { enTranslations } from '../localization/translations/en';
import { frTranslations } from '../localization/translations/fr';
import { ptTranslations } from '../localization/translations/pt';
import { esTranslations } from '../localization/translations/es';
import { itTranslations } from '../localization/translations/it';
import { SUPPORTED_LANGUAGES } from '../localization/config';
import { TranslationKeys } from '../localization/types';

describe('Translation System', () => {
    const translations = {
        en: enTranslations,
        fr: frTranslations,
        pt: ptTranslations,
        es: esTranslations,
        it: itTranslations,
    };

    describe('Translation Completeness', () => {
        const getTranslationKeys = (obj: any, prefix = ''): string[] => {
            let keys: string[] = [];
            for (const key in obj) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    keys = keys.concat(getTranslationKeys(obj[key], fullKey));
                } else {
                    keys.push(fullKey);
                }
            }
            return keys;
        };

        const englishKeys = getTranslationKeys(enTranslations);

        test('All translations should have the same structure as English', () => {
            Object.entries(translations).forEach(([langCode, translation]) => {
                if (langCode === 'en') return;
                
                const translationKeys = getTranslationKeys(translation);
                
                // Vérifier que toutes les clés anglaises existent
                englishKeys.forEach(key => {
                    expect(translationKeys).toContain(key);
                });
                
                // Vérifier qu'il n'y a pas de clés supplémentaires
                expect(translationKeys.length).toBe(englishKeys.length);
            });
        });

        test('No translation should be empty or missing', () => {
            Object.entries(translations).forEach(([langCode, translation]) => {
                englishKeys.forEach(key => {
                    const value = key.split('.').reduce((obj: any, k) => obj?.[k], translation);
                    expect(value).toBeDefined();
                    expect(typeof value).toBe('string');
                    expect(value.length).toBeGreaterThan(0);
                });
            });
        });
    });

    describe('Language Configuration', () => {
        test('All supported languages should be properly configured', () => {
            const supportedLanguageCodes = Object.keys(SUPPORTED_LANGUAGES);
            
            supportedLanguageCodes.forEach(langCode => {
                const langInfo = SUPPORTED_LANGUAGES[langCode as keyof typeof SUPPORTED_LANGUAGES];
                
                expect(langInfo.code).toBe(langCode);
                expect(langInfo.name).toBeDefined();
                expect(langInfo.nativeName).toBeDefined();
                expect(langInfo.flag).toBeDefined();
                
                // Vérifier que le nom et le nom natif ne sont pas vides
                expect(langInfo.name.length).toBeGreaterThan(0);
                expect(langInfo.nativeName.length).toBeGreaterThan(0);
                expect(langInfo.flag.length).toBeGreaterThan(0);
            });
        });

        test('Each language should have unique properties', () => {
            const languages = Object.values(SUPPORTED_LANGUAGES);
            const names = languages.map(l => l.name);
            const nativeNames = languages.map(l => l.nativeName);
            const flags = languages.map(l => l.flag);
            
            expect(new Set(names).size).toBe(names.length);
            expect(new Set(nativeNames).size).toBe(nativeNames.length);
            expect(new Set(flags).size).toBe(flags.length);
        });
    });

    describe('Translation Quality', () => {
        test('Home screen translations should be appropriate', () => {
            Object.entries(translations).forEach(([langCode, translation]) => {
                expect(translation.home.title).toBeDefined();
                expect(translation.home.welcome).toBeDefined();
                expect(translation.home.calendar.title).toBeDefined();
                expect(translation.home.calendar.description).toBeDefined();
                
                // Vérifier que les traductions ne sont pas identiques (sauf pour l'anglais de base)
                if (langCode !== 'en') {
                    expect(translation.home.title).not.toBe('Home');
                }
            });
        });

        test('Common translations should be consistent', () => {
            Object.entries(translations).forEach(([langCode, translation]) => {
                // Vérifier la cohérence des termes courants
                expect(translation.common.save).toBeDefined();
                expect(translation.common.cancel).toBeDefined();
                expect(translation.common.language).toBeDefined();
                
                // Les boutons de base doivent être courts
                expect(translation.common.save.length).toBeLessThan(20);
                expect(translation.common.cancel.length).toBeLessThan(20);
            });
        });
    });

    describe('Key Navigation', () => {
        test('Nested key access should work correctly', () => {
            const testGetNestedValue = (obj: any, key: string) => {
                return key.split('.').reduce((current, k) => current?.[k], obj);
            };

            Object.entries(translations).forEach(([langCode, translation]) => {
                // Tester quelques clés imbriquées
                expect(testGetNestedValue(translation, 'home.calendar.title')).toBeDefined();
                expect(testGetNestedValue(translation, 'settings.language.title')).toBeDefined();
                expect(testGetNestedValue(translation, 'jobs.timer.start')).toBeDefined();
                
                // Tester une clé qui n'existe pas
                expect(testGetNestedValue(translation, 'nonexistent.key')).toBeUndefined();
            });
        });
    });

    describe('Parameter Interpolation', () => {
        test('Should handle parameter placeholders correctly', () => {
            // Simuler la fonction d'interpolation
            const interpolateParams = (text: string, params?: Record<string, string | number>): string => {
                if (!params) return text;
                
                return Object.entries(params).reduce((result, [key, value]) => {
                    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                }, text);
            };

            // Tester avec des paramètres
            expect(interpolateParams('Hello {{name}}!', { name: 'John' })).toBe('Hello John!');
            expect(interpolateParams('Count: {{count}}', { count: 42 })).toBe('Count: 42');
            expect(interpolateParams('No params')).toBe('No params');
            
            // Tester avec plusieurs paramètres
            expect(interpolateParams('{{greeting}} {{name}}, today is {{day}}', {
                greeting: 'Hello',
                name: 'Alice',
                day: 'Monday'
            })).toBe('Hello Alice, today is Monday');
        });
    });
});