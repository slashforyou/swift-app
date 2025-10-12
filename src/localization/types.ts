/**
 * Types pour le système de traduction
 * Architecture scalable et type-safe
 */

export type SupportedLanguage = 
    | 'en'    // English (default)
    | 'fr'    // Français  
    | 'pt'    // Português
    | 'es'    // Español
    | 'it'    // Italiano
    | 'zh'    // 中文 (Chinese)
    | 'hi';   // हिन्दी (Hindi)

export interface LanguageInfo {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
    rtl?: boolean; // Pour les langues Right-to-Left futures
}

export interface TranslationKeys {
    // Common
    common: {
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        add: string;
        search: string;
        loading: string;
        error: string;
        success: string;
        warning: string;
        info: string;
        yes: string;
        no: string;
        ok: string;
        close: string;
        back: string;
        next: string;
        previous: string;
        done: string;
        continue: string;
        skip: string;
        retry: string;
        refresh: string;
        settings: string;
        language: string;
    };

    // Home Screen
    home: {
        title: string;
        welcome: string;
        calendar: {
            title: string;
            description: string;
        };
        jobs: {
            title: string;
            description: string;
        };
        profile: {
            title: string;
            description: string;
        };
        parameters: {
            title: string;
            description: string;
        };
        connection: {
            title: string;
            description: string;
            testConnection: string;
            status: {
                connected: string;
                disconnected: string;
                testing: string;
            };
        };
    };

    // Navigation
    navigation: {
        home: string;
        calendar: string;
        jobs: string;
        profile: string;
        settings: string;
    };

    // Job Management
    jobs: {
        title: string;
        status: {
            pending: string;
            inProgress: string;
            completed: string;
            cancelled: string;
        };
        timer: {
            start: string;
            stop: string;
            pause: string;
            resume: string;
            break: string;
            endBreak: string;
            totalTime: string;
            billableTime: string;
            breakTime: string;
            currentStep: string;
        };
        details: {
            information: string;
            items: string;
            contacts: string;
            timeline: string;
            payment: string;
            summary: string;
        };
    };

    // Calendar
    calendar: {
        title: string;
        // Days of the week
        days: {
            mon: string;
            tue: string;
            wed: string;
            thu: string;
            fri: string;
            sat: string;
            sun: string;
        };
        // Months
        months: {
            january: string;
            february: string;
            march: string;
            april: string;
            may: string;
            june: string;
            july: string;
            august: string;
            september: string;
            october: string;
            november: string;
            december: string;
        };
        // Stats
        stats: {
            totalJobs: string;
            urgent: string;
            completed: string;
        };
        // Actions
        refresh: string;
        goToDay: string;
        previousMonth: string;
        nextMonth: string;
    };

    // Profile
    profile: {
        title: string;
        personalInfo: string;
        preferences: string;
        logout: string;
        version: string;
        level: string;
        experience: string;
        toNextLevel: string;
        defaultTitle: string;
    };

    // Settings
    settings: {
        title: string;
        language: {
            title: string;
            description: string;
            current: string;
            select: string;
        };
        theme: {
            title: string;
            light: string;
            dark: string;
            auto: string;
        };
        notifications: {
            title: string;
            enabled: string;
            disabled: string;
        };
    };

    // Errors and Messages
    messages: {
        errors: {
            network: string;
            generic: string;
            notFound: string;
            unauthorized: string;
            serverError: string;
            validation: string;
        };
        success: {
            saved: string;
            deleted: string;
            updated: string;
            created: string;
        };
    };
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;
export type NestedKeyOf<T> = T extends object 
    ? { [K in keyof T]: K extends string 
        ? T[K] extends object 
            ? `${K}.${NestedKeyOf<T[K]>}`
            : K
        : never 
      }[keyof T]
    : never;
    
export type TranslationKey = NestedKeyOf<TranslationKeys>;