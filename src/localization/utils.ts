/**
 * Utilitaire pour générer des templates de traduction
 * Facilite l'ajout de nouvelles clés de traduction
 */

import { SupportedLanguage, TranslationKeys } from '../localization/types';
import { SUPPORTED_LANGUAGES } from '../localization/config';

interface NewTranslationTemplate {
    key: string;
    englishText: string;
    description?: string;
    category?: 'common' | 'home' | 'navigation' | 'jobs' | 'profile' | 'settings' | 'messages';
}

/**
 * Génère un template pour ajouter une nouvelle traduction
 */
export const generateTranslationTemplate = (template: NewTranslationTemplate): string => {
    const { key, englishText, description, category = 'common' } = template;
    
    let output = `// New Translation Key: ${key}\n`;
    if (description) {
        output += `// Description: ${description}\n`;
    }
    output += `// Category: ${category}\n\n`;
    
    output += `// Add to each translation file:\n\n`;
    
    // Générer pour chaque langue
    Object.entries(SUPPORTED_LANGUAGES).forEach(([langCode, langInfo]) => {
        output += `// ${langInfo.name} (${langInfo.nativeName})\n`;
        output += `// File: src/localization/translations/${langCode}.ts\n`;
        output += `${key}: '${langCode === 'en' ? englishText : `TODO: Translate "${englishText}" to ${langInfo.name}`}',\n\n`;
    });
    
    return output;
};

/**
 * Valide qu'une clé de traduction suit la convention de nommage
 */
export const validateTranslationKey = (key: string): boolean => {
    // Convention: category.subcategory.item (ex: home.calendar.title)
    const keyPattern = /^[a-z]+(\.[a-z]+)*$/;
    return keyPattern.test(key);
};

/**
 * Extrait toutes les clés de traduction d'un objet de traduction
 */
export const extractTranslationKeys = (translations: TranslationKeys, prefix = ''): string[] => {
    let keys: string[] = [];
    
    const traverse = (obj: any, currentPrefix: string) => {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null) {
                traverse(value, fullKey);
            } else if (typeof value === 'string') {
                keys.push(fullKey);
            }
        }
    };
    
    traverse(translations, prefix);
    return keys.sort();
};

/**
 * Compare deux sets de traductions et trouve les différences
 */
export const compareTranslations = (baseTranslations: TranslationKeys, targetTranslations: TranslationKeys) => {
    const baseKeys = extractTranslationKeys(baseTranslations);
    const targetKeys = extractTranslationKeys(targetTranslations);
    
    const missingKeys = baseKeys.filter(key => !targetKeys.includes(key));
    const extraKeys = targetKeys.filter(key => !baseKeys.includes(key));
    
    return {
        missingKeys,
        extraKeys,
        isComplete: missingKeys.length === 0 && extraKeys.length === 0,
        completionRate: ((targetKeys.length - extraKeys.length) / baseKeys.length) * 100
    };
};

/**
 * Génère un rapport de completeness pour toutes les langues
 */
export const generateCompletenessReport = (allTranslations: Record<SupportedLanguage, TranslationKeys>): string => {
    let report = '# Translation Completeness Report\n\n';
    
    const baseTranslations = allTranslations.en;
    const baseKeys = extractTranslationKeys(baseTranslations);
    
    report += `Total translation keys: ${baseKeys.length}\n\n`;
    
    Object.entries(allTranslations).forEach(([langCode, translations]) => {
        const langInfo = SUPPORTED_LANGUAGES[langCode as SupportedLanguage];
        const comparison = compareTranslations(baseTranslations, translations);
        
        report += `## ${langInfo.nativeName} (${langInfo.name}) - ${langCode}\n`;
        report += `- Completion: ${comparison.completionRate.toFixed(1)}%\n`;
        report += `- Missing keys: ${comparison.missingKeys.length}\n`;
        report += `- Extra keys: ${comparison.extraKeys.length}\n`;
        
        if (comparison.missingKeys.length > 0) {
            report += `- Missing: ${comparison.missingKeys.slice(0, 5).join(', ')}`;
            if (comparison.missingKeys.length > 5) {
                report += ` and ${comparison.missingKeys.length - 5} more...`;
            }
            report += '\n';
        }
        
        report += '\n';
    });
    
    return report;
};

/**
 * Exemple d'utilisation pour ajouter une nouvelle traduction
 */
export const exampleUsage = () => {
    // Exemple 1: Ajouter un nouveau texte
    const newTranslation = generateTranslationTemplate({
        key: 'jobs.status.archived',
        englishText: 'Archived',
        description: 'Status for jobs that have been archived',
        category: 'jobs'
    });
    
    console.log('Example new translation template:');
    console.log(newTranslation);
    
    // Exemple 2: Valider des clés
    const keys = ['home.title', 'invalid-key', 'settings.theme.dark'];
    keys.forEach(key => {
        console.log(`Key "${key}" is valid: ${validateTranslationKey(key)}`);
    });
};

// Types helper pour l'autocomplétion
export type TranslationKeyPath = 
    | 'common.save'
    | 'common.cancel'
    | 'home.title'
    | 'home.calendar.title'
    | 'navigation.home'
    | 'jobs.timer.start'
    | 'settings.language.title'
    // ... ajouter d'autres clés courantes
    | string; // fallback pour toutes les autres clés