import { TranslationKeys } from '../types';

export const enTranslations: TranslationKeys = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        done: 'Done',
        continue: 'Continue',
        skip: 'Skip',
        retry: 'Retry',
        refresh: 'Refresh',
        settings: 'Settings',
        language: 'Language',
    },

    home: {
        title: 'Home',
        welcome: 'Welcome back!',
        calendar: {
            title: 'Calendar',
            description: 'View and manage your schedule',
        },
        jobs: {
            title: 'Jobs',
            description: 'Manage your work assignments',
        },
        profile: {
            title: 'Profile',
            description: 'View and edit your profile',
        },
        parameters: {
            title: 'Settings',
            description: 'Configure app preferences',
        },
        connection: {
            title: 'Connection',
            description: 'Test server connectivity',
            testConnection: 'Test Connection',
            status: {
                connected: 'Connected',
                disconnected: 'Disconnected',
                testing: 'Testing...',
            },
        },
    },

    navigation: {
        home: 'Home',
        calendar: 'Calendar',
        jobs: 'Jobs',
        profile: 'Profile',
        settings: 'Settings',
    },

    jobs: {
        title: 'Jobs',
        status: {
            pending: 'Pending',
            inProgress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
        },
        timer: {
            start: 'Start Timer',
            stop: 'Stop Timer',
            pause: 'Pause',
            resume: 'Resume',
            break: 'Take Break',
            endBreak: 'End Break',
            totalTime: 'Total Time',
            billableTime: 'Billable Time',
            breakTime: 'Break Time',
            currentStep: 'Current Step',
        },
        details: {
            information: 'Information',
            items: 'Items',
            contacts: 'Contacts',
            timeline: 'Timeline',
            payment: 'Payment',
            summary: 'Summary',
        },
    },

    profile: {
        title: 'Profile',
        personalInfo: 'Personal Information',
        preferences: 'Preferences',
        logout: 'Logout',
        version: 'Version',
    },

    settings: {
        title: 'Settings',
        language: {
            title: 'Language',
            description: 'Choose your preferred language',
            current: 'Current language',
            select: 'Select language',
        },
        theme: {
            title: 'Theme',
            light: 'Light',
            dark: 'Dark',
            auto: 'Auto',
        },
        notifications: {
            title: 'Notifications',
            enabled: 'Enabled',
            disabled: 'Disabled',
        },
    },

    messages: {
        errors: {
            network: 'Network connection error',
            generic: 'Something went wrong',
            notFound: 'Resource not found',
            unauthorized: 'Unauthorized access',
            serverError: 'Server error',
            validation: 'Invalid input',
        },
        success: {
            saved: 'Successfully saved',
            deleted: 'Successfully deleted',
            updated: 'Successfully updated',
            created: 'Successfully created',
        },
    },
};