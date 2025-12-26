/**
 * Hook et contexte de traduction avec persistance
 * Architecture scalable et performante
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, TranslationKeys, TranslationFunction } from './types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config';

// Import des traductions
import { enTranslations } from './translations/en';
import { frTranslations } from './translations/fr';
import { ptTranslations } from './translations/pt';
import { esTranslations } from './translations/es';
import { itTranslations } from './translations/it';
import { zhTranslations } from './translations/zh';
import { hiTranslations } from './translations/hi';

const LANGUAGE_STORAGE_KEY = 'app_language';

// Map des traductions disponibles
const TRANSLATIONS: Record<SupportedLanguage, TranslationKeys> = {
    en: enTranslations,
    fr: frTranslations,
    pt: ptTranslations,
    es: esTranslations,
    it: itTranslations,
    zh: zhTranslations,
    hi: hiTranslations,
};

interface LocalizationContextType {
    currentLanguage: SupportedLanguage;
    setLanguage: (language: SupportedLanguage) => Promise<void>;
    t: TranslationFunction;
    getSupportedLanguages: () => typeof SUPPORTED_LANGUAGES;
    isLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
    children: React.ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
    const [isLoading, setIsLoading] = useState(true);

    // Charger la langue sauvegardée au démarrage
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(savedLanguage)) {
                setCurrentLanguage(savedLanguage as SupportedLanguage);
            }
        } catch (error) {
            console.error('Error loading saved language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setLanguage = useCallback(async (language: SupportedLanguage) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
            setCurrentLanguage(language);
        } catch (error) {
            console.error('Error saving language:', error);
            throw error;
        }
    }, []);

    // Fonction de traduction avec support des clés imbriquées
    const t = useCallback<TranslationFunction>((key: string, params?: Record<string, string | number>) => {
        const translations = TRANSLATIONS[currentLanguage];
        
        // Naviguer dans l'objet avec la clé en notation pointée
        const value = key.split('.').reduce((obj: any, k) => {
            return obj?.[k];
        }, translations);

        if (typeof value !== 'string') {
            console.warn(`Translation key "${key}" not found for language "${currentLanguage}"`);
            // Fallback vers l'anglais si la traduction n'existe pas
            const fallbackValue = key.split('.').reduce((obj: any, k) => {
                return obj?.[k];
            }, TRANSLATIONS.en);
            
            if (typeof fallbackValue === 'string') {
                return interpolateParams(fallbackValue, params);
            }
            
            return key; // Retourner la clé si aucune traduction n'est trouvée
        }

        return interpolateParams(value, params);
    }, [currentLanguage]);

    // Interpolation des paramètres dans les traductions
    const interpolateParams = (text: string, params?: Record<string, string | number>): string => {
        if (!params) return text;
        
        return Object.entries(params).reduce((result, [key, value]) => {
            return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }, text);
    };

    const getSupportedLanguages = useCallback(() => SUPPORTED_LANGUAGES, []);

    const value: LocalizationContextType = {
        currentLanguage,
        setLanguage,
        t,
        getSupportedLanguages,
        isLoading,
    };

    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
};

// Hook pour utiliser la localisation
export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};

// Hook raccourci pour la fonction de traduction
export const useTranslation = () => {
    const { t } = useLocalization();
    return { t };
};