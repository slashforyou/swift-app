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

    calendar: {
        title: 'Calendar',
        // Days of the week (abbreviations)
        days: {
            mon: 'Mon',
            tue: 'Tue',
            wed: 'Wed',
            thu: 'Thu',
            fri: 'Fri',
            sat: 'Sat',
            sun: 'Sun',
        },
        // Full months
        months: {
            january: 'January',
            february: 'February',
            march: 'March',
            april: 'April',
            may: 'May',
            june: 'June',
            july: 'July',
            august: 'August',
            september: 'September',
            october: 'October',
            november: 'November',
            december: 'December',
        },
        // Statistics
        stats: {
            totalJobs: 'Total Jobs',
            urgent: 'Urgent',
            completed: 'Completed',
        },
        // Actions
        refresh: 'Refresh',
        goToDay: 'Go to day',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        // Filters and sorting
        filters: {
            all: 'All',
            pending: 'Pending',
            active: 'Active',
            done: 'Done',
        },
        sorting: {
            time: 'Time',
            priority: 'Priority',
            status: 'Status',
        },
        // Navigation
        previousDay: 'Previous day',
        nextDay: 'Next day',
        // Year view
        currentYear: 'Current Year',
        years: 'Years',
        selectFromRange: 'Select from',
    },

    profile: {
        title: 'Profile',
        personalInfo: 'Personal Information',
        preferences: 'Preferences',
        logout: 'Logout',
        version: 'Version',
        level: 'Level',
        experience: 'Experience',
        toNextLevel: 'to Level',
        defaultTitle: 'Driver',
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