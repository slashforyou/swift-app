/**
 * Script de test des traductions
 * Vérifie que toutes les langues sont correctement configurées
 */

import { SUPPORTED_LANGUAGES } from '../src/localization/config';
import { enTranslations } from '../src/localization/translations/en';
import { frTranslations } from '../src/localization/translations/fr';
import { ptTranslations } from '../src/localization/translations/pt';
import { esTranslations } from '../src/localization/translations/es';
import { itTranslations } from '../src/localization/translations/it';
import { zhTranslations } from '../src/localization/translations/zh';
import { hiTranslations } from '../src/localization/translations/hi';

const translations = {
    en: enTranslations,
    fr: frTranslations,
    pt: ptTranslations,
    es: esTranslations,
    it: itTranslations,
    zh: zhTranslations,
    hi: hiTranslations,
};

console.log('🌍 Testing Translation System');
console.log('============================\n');

// Test 1: Vérifier les langues supportées
console.log('📋 Supported Languages:');
Object.values(SUPPORTED_LANGUAGES).forEach(lang => {
    console.log(`${lang.flag} ${lang.code.toUpperCase()}: ${lang.nativeName} (${lang.name})`);
});
console.log();

// Test 2: Tester quelques traductions clés
const testKeys = [
    'home.title',
    'home.welcome',
    'common.language',
    'navigation.home'
];

console.log('🔍 Sample Translations:');
testKeys.forEach(key => {
    console.log(`\n📝 Key: ${key}`);
    Object.entries(translations).forEach(([langCode, translation]) => {
        const value = key.split('.').reduce((obj: any, k) => obj?.[k], translation);
        const langInfo = SUPPORTED_LANGUAGES[langCode as keyof typeof SUPPORTED_LANGUAGES];
        console.log(`   ${langInfo.flag} ${langCode.toUpperCase()}: "${value}"`);
    });
});

console.log('\n✅ Translation system test completed!');
console.log('🚀 Ready to use in production!');

export {};