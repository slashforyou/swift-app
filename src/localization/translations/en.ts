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
        business: {
            title: 'Business',
            description: 'Billing, configuration and management',
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
        // States
        loading: 'Loading...',
        noJobsScheduled: 'No jobs scheduled',
        freeDay: 'You have a free day on',
        enjoyTimeOff: 'Enjoy your time off!',
        somethingWentWrong: 'Something went wrong',
        tryAgain: 'Try Again',
        // Job status and priority
        jobStatus: {
            pending: 'Pending',
            inProgress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
            unknown: 'Unknown',
        },
        priority: {
            urgent: 'URGENT',
            high: 'HIGH',
            medium: 'MED',
            low: 'LOW',
            normal: 'NORM',
        },
        // Client
        unknownClient: 'Unknown client',
        // Navigation
        navigation: {
            monthlyView: 'Monthly View',
            yearlyView: 'Yearly View',
            multiYearView: 'Multi-Year View',
            dailyView: 'Daily View',
            loadingCalendar: 'Loading calendar',
            authenticationError: 'Authentication Error',
            goToLogin: 'Go to Login',
            loading: 'Loading',
        },
        // Day Screen specific
        dayScreen: {
            stats: {
                total: 'Total',
                pending: 'Pending',
                completed: 'Completed',
            },
            filtersTitle: 'Jobs & Filters',
            sortBy: 'Sort by:',
        },
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

    jobDetails: {
        panels: {
            summary: 'Job Summary',
            jobDetails: 'Job Details',
            clientInfo: 'Client Information',
            notes: 'Notes',
            payment: 'Payment',
        },
        errors: {
            invalidJobId: 'Invalid job ID',
            cannotLoadDetails: 'Cannot load job details',
            loadingError: 'Loading Error',
        },
        steps: {
            pickup: 'Pickup',
            intermediate: 'Intermediate',
            dropoff: 'Dropoff',
            pickupDescription: 'Pickup from the client location',
            intermediateDescription: 'Dropoff at the intermediate location',
            dropoffDescription: 'Dropoff at the final location',
        },
        client: {
            firstTimeClient: 'First Time Client',
        },
        defaultNote: 'Note',
        messages: {
            noteAdded: 'Note Added',
            noteAddedSuccess: 'The note has been saved successfully',
            noteAddError: 'Error',
            noteAddErrorMessage: 'Unable to add the note. Please try again.',
            photoAdded: 'Photo Added',
            photoAddedSuccess: 'The photo has been uploaded successfully',
            photoAddError: 'Error',
            photoAddErrorMessage: 'Unable to add the photo. Please try again.',
            photoDescription: 'Job photo',
            nextStep: 'Next Step',
            advancedToStep: 'Advanced to step',
        },
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

    business: {
        navigation: {
            loadingBusiness: 'Loading business section...',
            authenticationError: 'Authentication error',
            goToLogin: 'Go to login',
            businessInfo: 'Business Info',
            staffCrew: 'Staff/Crew',
            trucks: 'Vehicles',
            jobsBilling: 'Jobs/Billing',
        },
        info: {
            title: 'Business Information',
            placeholder: 'This section will contain your business information: contact details, configuration, general settings.',
        },
        staff: {
            title: 'Staff & Team',
            placeholder: 'Manage your team here: add members, assign roles, track skills and availability.',
        },
        trucks: {
            title: 'Vehicles & Equipment',
            placeholder: 'Manage your fleet and equipment: add trucks, track maintenance, schedule repairs.',
        },
        jobs: {
            title: 'Jobs & Billing',
            placeholder: 'Create new jobs, generate invoices and track profitability of your projects.',
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