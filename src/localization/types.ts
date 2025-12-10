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
        business: {
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
        // Filters and sorting
        filters: {
            all: string;
            pending: string;
            active: string;
            done: string;
        };
        sorting: {
            time: string;
            priority: string;
            status: string;
        };
        // Navigation
        previousDay: string;
        nextDay: string;
        // Year view
        currentYear: string;
        years: string;
        selectFromRange: string;
        // States
        loading: string;
        noJobsScheduled: string;
        freeDay: string;
        enjoyTimeOff: string;
        somethingWentWrong: string;
        tryAgain: string;
        // Job status and priority
        jobStatus: {
            pending: string;
            inProgress: string;
            completed: string;
            cancelled: string;
            unknown: string;
        };
        priority: {
            urgent: string;
            high: string;
            medium: string;
            low: string;
            normal: string;
        };
        // Client
        unknownClient: string;
        // Navigation
        navigation: {
            monthlyView: string;
            yearlyView: string;
            multiYearView: string;
            dailyView: string;
            loadingCalendar: string;
            authenticationError: string;
            goToLogin: string;
            loading: string;
        };
        // Day Screen specific
        dayScreen: {
            stats: {
                total: string;
                pending: string;
                completed: string;
            };
            filtersTitle: string;
            sortBy: string;
        };
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

    // Job Details
    jobDetails: {
        panels: {
            summary: string;
            jobDetails: string;
            clientInfo: string;
            notes: string;
            payment: string;
        };
        errors: {
            invalidJobId: string;
            cannotLoadDetails: string;
            loadingError: string;
        };
        steps: {
            pickup: string;
            intermediate: string;
            dropoff: string;
            pickupDescription: string;
            intermediateDescription: string;
            dropoffDescription: string;
        };
        client: {
            firstTimeClient: string;
        };
        defaultNote: string;
        messages: {
            noteAdded: string;
            noteAddedSuccess: string;
            noteAddError: string;
            noteAddErrorMessage: string;
            photoAdded: string;
            photoAddedSuccess: string;
            photoAddError: string;
            photoAddErrorMessage: string;
            photoDescription: string;
            nextStep: string;
            advancedToStep: string;
        };
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

    // Business Management
    business: {
        navigation: {
            loadingBusiness: string;
            authenticationError: string;
            goToLogin: string;
            businessInfo: string;
            staffCrew: string;
            trucks: string;
            jobsBilling: string;
        };
        info: {
            title: string;
            placeholder: string;
        };
        staff: {
            title: string;
            placeholder: string;
        };
        trucks: {
            title: string;
            placeholder: string;
        };
        jobs: {
            title: string;
            placeholder: string;
        };
    };

    // Payment
    payment: {
        missingInfo: {
            title: string;
            message: string;
        };
        errors: {
            jobIdNotFound: string;
            paymentError: string;
            generic: string;
            processingFailed: string;
            networkError: string;
        };
        buttons: {
            processing: string;
            confirm: string;
            retry: string;
        };
        status: {
            processing: string;
            success: string;
            failed: string;
        };
    };

    // Vehicles
    vehicles: {
        actions: {
            edit: string;
            delete: string;
            cancel: string;
            remove: string;
        };
        alerts: {
            addSuccess: {
                title: string;
                message: string;
            };
            addError: {
                title: string;
                message: string;
            };
            deleteConfirm: {
                message: string;
            };
            deleteSuccess: {
                title: string;
                message: string;
            };
            deleteError: {
                title: string;
                message: string;
            };
            editConfirm: {
                message: string;
            };
        };
        errors: {
            loadingTitle: string;
            loadingMessage: string;
        };
    };

    // Staff Management
    staff: {
        titles: {
            main: string;
            subtitle: string;
            loading: string;
        };
        stats: {
            active: string;
            employees: string;
            contractors: string;
            averageRate: string;
        };
        actions: {
            add: string;
            edit: string;
            remove: string;
            cancel: string;
        };
        filters: {
            all: string;
            employees: string;
            contractors: string;
        };
        types: {
            employee: string;
            contractor: string;
        };
        status: {
            active: string;
            inactive: string;
            pending: string;
        };
        alerts: {
            removeConfirm: {
                title: string;
                message: string;
            };
        };
        empty: {
            title: string;
            subtitle: string;
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