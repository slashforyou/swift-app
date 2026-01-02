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
        confirm: string;
        refresh: string;
        settings: string;
        language: string;
    };

    // Home Screen
    home: {
        title: string;
        welcome: string;
        today: {
            title: string;
            loading: string;
            noJobs: string;
            allCompleted: string;
            pending: string;
            totalJobs: string;
            completed: string;
        };
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
        loading: string;
        ranks: {
            master: string;
            expert: string;
            senior: string;
            driver: string;
            rookie: string;
        };
        fields: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            address: string;
            city: string;
            postalCode: string;
            country: string;
        };
        actions: {
            edit: string;
            save: string;
            cancel: string;
        };
        messages: {
            updateSuccess: string;
            updateError: string;
        };
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
            // Client screen labels
            title: string;
            loading: string;
            firstName: string;
            lastName: string;
            phone: string;
            email: string;
            company: string;
            address: string;
            notes: string;
            notSpecified: string;
            quickActions: string;
            call: string;
            sms: string;
            emailAction: string;
        };
        // Job page labels
        job: {
            jobItems: string;
            noItems: string;
            addItem: string;
            addItemTitle: string;
            itemName: string;
            itemNamePlaceholder: string;
            quantity: string;
            cancel: string;
            adding: string;
            completed: string;
            local: string;
            sync: string;
            jobInformation: string;
            jobType: string;
            numberOfItems: string;
            status: string;
            contractor: string;
            contractee: string;
            companyName: string;
            contactPerson: string;
            error: string;
            errorItemName: string;
            errorQuantity: string;
            success: string;
            itemAdded: string;
            itemAddedLocally: string;
            itemAddedLocallyMessage: string;
        };
        // Notes page labels
        notes: {
            title: string;
            loading: string;
            add: string;
            addFirstNote: string;
            noNotes: string;
            noNotesDescription: string;
            count: string;
            countPlural: string;
            localSyncInfo: string;
            types: {
                general: string;
                important: string;
                client: string;
                internal: string;
            };
            typeDescriptions: {
                general: string;
                important: string;
                client: string;
                internal: string;
            };
            time: {
                justNow: string;
                hoursAgo: string;
                yesterday: string;
                recently: string;
            };
            modal: {
                title: string;
                subtitle: string;
                typeLabel: string;
                titleLabel: string;
                titleOptional: string;
                contentLabel: string;
                titlePlaceholder: string;
                contentPlaceholder: string;
                cancel: string;
                submit: string;
                submitting: string;
                emptyContentError: string;
            };
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
            syncError: string;
            syncErrorMessage: string;
            stepUpdateError: string;
            stepUpdateErrorMessage: string;
            signatureSaved: string;
            signatureSaveError: string;
            signatureSaveErrorMessage: string;
        };
        // Payment page labels
        payment: {
            title: string;
            // Status
            status: {
                pending: string;
                partial: string;
                completed: string;
            };
            // Job status
            jobStatus: {
                completed: string;
                inProgress: string;
            };
            // Alerts
            alerts: {
                jobInProgress: string;
                jobInProgressMessage: string;
                signatureRequired: string;
                signatureRequiredMessage: string;
                cancel: string;
                signNow: string;
                alreadyProcessed: string;
                alreadyProcessedMessage: string;
            };
            // Signature section
            signature: {
                verifying: string;
                signJob: string;
                payNow: string;
                jobSignedByClient: string;
            };
            // Live tracking section
            liveTracking: {
                title: string;
                live: string;
                totalTimeElapsed: string;
                billableTime: string;
                currentCost: string;
            };
            // Financial summary section
            financialSummary: {
                title: string;
                estimatedCost: string;
                finalCost: string;
                currentCost: string;
                additionalCost: string;
                savings: string;
            };
            // Billing breakdown section
            billingBreakdown: {
                title: string;
                actualWorkTime: string;
                pausesNotBillable: string;
                grossBillableTime: string;
                minimumBillable: string;
                minimumPolicy: string;
                callOutFee: string;
                travelFee: string;
                halfHourRounding: string;
                sevenMinuteRule: string;
                auto: string;
                totalBillableHours: string;
                hourlyRate: string;
                finalAmount: string;
                explanatoryNote: string;
            };
            // Job details section
            jobDetailsSection: {
                title: string;
                billingDetails: string;
                billableHours: string;
                hourlyRate: string;
                jobTitle: string;
                client: string;
                estimatedDuration: string;
                untitledJob: string;
                notDefined: string;
                hours: string;
            };
        };
        // JobDetails components
        components: {
            stepValidation: {
                inconsistencyDetected: string;
                suggestion: string;
                stepCorrected: string;
                correctionError: string;
                autoCorrect: string;
            };
            truckDetails: {
                title: string;
                subtitle: string;
                primaryVehicle: string;
            };
            timeWindows: {
                title: string;
                subtitle: string;
                missionStart: string;
            };
            jobProgress: {
                percentComplete: string;
                detailedTracking: string;
            };
            jobTime: {
                chronoWillStart: string;
                inProgress: string;
                finished: string;
                currentStep: string;
                stepDetails: string;
                costCalculation: string;
                timeTracking: string;
                total: string;
                billable: string;
                onBreak: string;
                resumeWork: string;
                takeBreak: string;
                totalTime: string;
                breakTime: string;
                billableTime: string;
            };
            quickActions: {
                startJob: string;
                arrivedAtClient: string;
                jobFinished: string;
                advanceStep: string;
                goToStep: string;
                stepActivated: string;
                jobAlreadyFinished: string;
                noPhoneAvailable: string;
                noteAdded: string;
                error: string;
                success: string;
                information: string;
                quickNote: string;
                addNoteToJob: string;
            };
            signature: {
                verifying: string;
                contractSigned: string;
                clientValidated: string;
                contractMustBeSigned: string;
                // Signing modal
                title: string;
                subtitle: string;
                contractTitle: string;
                digitalSignature: string;
                ready: string;
                initializing: string;
                signingInProgress: string;
                clear: string;
                save: string;
                saving: string;
                cancel: string;
                emptySignature: string;
                emptySignatureMessage: string;
                signatureUpdated: string;
                signatureUpdatedMessage: string;
                signatureSaved: string;
                signatureSavedMessage: string;
                serverError: string;
                serverErrorMessage: string;
                saveError: string;
                saveErrorMessage: string;
                ok: string;
                perfect: string;
            };
            photos: {
                title: string;
                deleteConfirm: string;
                deleteTitle: string;
                cancel: string;
                delete: string;
                added: string;
                addedSuccess: string;
                descriptionUpdated: string;
                updateError: string;
                deleted: string;
                error: string;
                success: string;
                noDescription: string;
                withoutDescription: string;
                nonImageFile: string;
                loadError: string;
                loading: string;
                loadingPhotos: string;
                takePhotoError: string;
                selectPhotoError: string;
                permissionRequired: string;
                permissionRequiredMessage: string;
                stages: {
                    pickup: string;
                    delivery: string;
                    other: string;
                    before: string;
                    after: string;
                };
                time: {
                    minutesAgo: string;
                    hoursAgo: string;
                    daysAgo: string;
                };
            };
            jobClock: {
                jobInProgress: string;
                jobFinished: string;
                stepNumber: string;
                onPause: string;
                totalElapsedTime: string;
                signatureRequired: string;
                signatureRequiredMessage: string;
                signNow: string;
                finishJob: string;
                finishJobConfirm: string;
                finish: string;
                nextStep: string;
                signatureModalUnavailable: string;
                cancel: string;
                error: string;
                confirm: string;
                goToStep: string;
            };
            jobTimeline: {
                noJobData: string;
                stepOf: string;
                currentStep: string;
                hideDetails: string;
                showDetails: string;
                startedAt: string;
                endedAt: string;
                duration: string;
                notStarted: string;
                inProgress: string;
                status: {
                    pending: string;
                    inProgress: string;
                    completed: string;
                    cancelled: string;
                    unknown: string;
                };
                statusDescription: {
                    pending: string;
                    inProgress: string;
                    completed: string;
                    cancelled: string;
                    unknown: string;
                };
            };
            stepAdvanceModal: {
                title: string;
                subtitle: string;
                stepProgress: string;
                stepUpdated: string;
                stepUpdatedMessage: string;
                syncError: string;
                syncErrorMessage: string;
                statusCompleted: string;
                statusCurrent: string;
                statusPending: string;
                noDescription: string;
                advancing: string;
                advance: string;
                close: string;
                updating: string;
            };
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
        // Phase 3.1: Added settings sections, items, alerts
        sections: {
            notifications: string;
            preferences: string;
            privacy: string;
            security: string;
            appearance: string;
            data: string;
        };
        items: {
            pushNotifications: string;
            pushDescription: string;
            emailNotifications: string;
            emailDescription: string;
            smsNotifications: string;
            smsDescription: string;
            taskReminders: string;
            taskRemindersDescription: string;
            soundEnabled: string;
            soundDescription: string;
            biometricEnabled: string;
            biometricDescription: string;
            darkMode: string;
            darkModeDescription: string;
            autoSync: string;
            autoSyncDescription: string;
            offlineMode: string;
            offlineModeDescription: string;
            shareLocation: string;
            shareLocationDescription: string;
            analytics: string;
            analyticsDescription: string;
        };
        alerts: {
            biometricEnabled: {
                title: string;
                message: string;
            };
            resetSettings: {
                title: string;
                message: string;
                cancel: string;
                confirm: string;
            };
            resetSuccess: {
                title: string;
                message: string;
            };
        };
        actions: {
            resetSettings: string;
            logout: string;
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
            noDataAvailable: string;
            // Sections
            statisticsOverview: string;
            companyInformation: string;
            contactDetails: string;
            businessAddress: string;
            // Stats
            totalVehicles: string;
            activeJobs: string;
            completedJobs: string;
            // Company fields
            companyName: string;
            abn: string;
            establishedDate: string;
            businessType: string;
            notSpecified: string;
            movingServices: string;
            // Contact fields
            phone: string;
            email: string;
            website: string;
            // Address fields
            streetAddress: string;
            city: string;
            state: string;
            postcode: string;
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
            continue: string;
            download: string;
            email: string;
            backToDashboard: string;
        };
        status: {
            processing: string;
            success: string;
            failed: string;
        };
        success: {
            title: string;
            subtitle: string;
            amount: string;
            paymentId: string;
            description: string;
            jobId: string;
            dateTime: string;
        };
        // PaymentWindow specific keys
        window: {
            chooseMethod: string;
            amountToPay: string;
            paymentError: string;
            paymentIntentCreated: string;
            securePayment: string;
            secureCardPayment: string;
            cashPayment: string;
            cashPaymentTitle: string;
            processingPayment: string;
            paymentSuccess: string;
            paymentSuccessMessage: string;
            cashCollected: string;
            changeToReturn: string;
            amountReceived: string;
            enterAmountReceived: string;
            minimumAmount: string;
            toPay: string;
            returnToPaymentMethod: string;
            close: string;
            cardManualTitle: string;
            cardInfo: string;
            incorrectAmount: string;
            incorrectAmountMessage: string;
            paymentSheetUnavailable: string;
            paymentSheetFallbackMessage: string;
            cardNamePlaceholder: string;
        };
        stripeConnect: {
            title: string;
            loading: string;
            connectionError: string;
            loadError: string;
            canceledOrError: string;
            retry: string;
        };
        stripeOnboarding: {
            onboardingInterrupted: string;
            loadError: string;
            loading: string;
            retry: string;
            close: string;
        };
    };

    // Vehicles
    vehicles: {
        fleet: string;
        addVehicle: string;
        adding: string;
        totalVehicles: string;
        available: string;
        inUse: string;
        maintenance: string;
        outOfService: string;
        all: string;
        loading: string;
        year: string;
        capacity: string;
        nextService: string;
        noVehicles: string;
        noFilteredVehicles: string;
        details: string;
        registration: string;
        make: string;
        model: string;
        location: string;
        assignedTo: string;
        notFound: string;
        loadingDetails: string;
        quickActions: string;
        changeStatus: string;
        scheduleService: string;
        assignStaff: string;
        selectNewStatus: string;
        featureComingSoon: string;
        maintenanceHistory: string;
        deleteTitle: string;
        updateSuccess: string;
        updateError: string;
        types: {
            movingTruck: string;
            van: string;
            trailer: string;
            ute: string;
            dolly: string;
            tools: string;
            vehicle: string;
        };
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
        validation: {
            error: string;
            selectMake: string;
            enterModel: string;
            yearRange: string;
            enterRegistration: string;
            invalidRegistration: string;
            selectLocation: string;
            enterNextService: string;
            serviceDatePast: string;
        };
        addModal: {
            vehicleType: string;
            selectTypeSubtitle: string;
            vehicleAdded: string;
            vehicleAddedMessage: string;
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
            removeSuccess: {
                title: string;
                message: string;
            };
            removeError: {
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

    // Authentication
    auth: {
        login: {
            title: string;
            subtitle: string;
            email: string;
            emailPlaceholder: string;
            password: string;
            passwordPlaceholder: string;
            submit: string;
            submitting: string;
            createAccount: string;
            back: string;
            forgotPassword: string;
        };
        register: {
            title: string;
            subtitle: string;
            firstName: string;
            firstNamePlaceholder: string;
            lastName: string;
            lastNamePlaceholder: string;
            email: string;
            emailPlaceholder: string;
            password: string;
            passwordPlaceholder: string;
            confirmPassword: string;
            confirmPasswordPlaceholder: string;
            phone: string;
            phonePlaceholder: string;
            submit: string;
            submitting: string;
            alreadyHaveAccount: string;
            termsAgree: string;
            termsLink: string;
        };
        validation: {
            emailRequired: string;
            emailInvalid: string;
            passwordRequired: string;
            passwordTooShort: string;
            passwordMismatch: string;
            firstNameRequired: string;
            lastNameRequired: string;
        };
        errors: {
            invalidCredentials: string;
            deviceInfoUnavailable: string;
            serverError: string;
            invalidResponse: string;
            networkError: string;
            timeout: string;
            generic: string;
        };
        success: {
            loginSuccess: string;
            registerSuccess: string;
            welcome: string;
        };
        emailVerification: {
            title: string;
            subtitle: string;
            codePlaceholder: string;
            verify: string;
            verifying: string;
            resendCode: string;
            codeRequired: string;
            codeInvalidFormat: string;
            emailMissing: string;
            emailInvalid: string;
            verificationSuccess: string;
            verificationFailed: string;
            codeIncorrect: string;
            codeExpired: string;
            codeInvalid: string;
            serverError: string;
            networkError: string;
            timeoutError: string;
            backToRegister: string;
            checkEmail: string;
            sentCodeTo: string;
            enterCode: string;
            didNotReceive: string;
            checkSpam: string;
            restartRegistration: string;
        };
        connection: {
            title: string;
            subtitle: string;
            loginButton: string;
            registerButton: string;
            or: string;
            features: {
                planning: string;
                realtime: string;
                management: string;
            };
        };
    };

    // Stripe & Payments
    stripe: {
        hub: {
            title: string;
            subtitle: string;
            balance: string;
            availableBalance: string;
            pendingBalance: string;
            recentPayments: string;
            viewAll: string;
            noPayments: string;
            accountStatus: string;
            onboarding: string;
            completeSetup: string;
        };
        settings: {
            title: string;
            subtitle: string;
            accountInfo: string;
            payoutSchedule: string;
            bankAccount: string;
            updateAccount: string;
            // Sections
            sections: {
                accountSetup: string;
                paymentSettings: string;
                developerSettings: string;
                dangerZone: string;
            };
            // Account labels
            country: string;
            currency: string;
            liveMode: string;
            testMode: string;
            loading: string;
            noAccountData: string;
            // Account Setup items
            completeSetup: string;
            completeSetupDesc: string;
            testIntegration: string;
            testIntegrationDesc: string;
            // Payment Settings items
            instantPayouts: string;
            instantPayoutsDesc: string;
            emailReceipts: string;
            emailReceiptsDesc: string;
            smsNotifications: string;
            smsNotificationsDesc: string;
            // Developer Settings items
            webhooks: string;
            webhooksDesc: string;
            webhookConfig: string;
            webhookConfigDesc: string;
            // Danger Zone items
            disconnectAccount: string;
            disconnectAccountDesc: string;
            // Alerts
            alerts: {
                setupTitle: string;
                setupMessage: string;
                webhookTitle: string;
                webhookMessage: string;
                testPaymentTitle: string;
                testPaymentMessage: string;
                disconnectTitle: string;
                disconnectMessage: string;
                errorUpdate: string;
                createTestPayment: string;
            };
        };
        payments: {
            title: string;
            filterAll: string;
            filterPending: string;
            filterCompleted: string;
            filterFailed: string;
            filterSucceeded: string;
            filterProcessing: string;
            noPayments: string;
            noPaymentsYet: string;
            noPaymentsFound: string;
            amount: string;
            date: string;
            status: string;
            searchPlaceholder: string;
            anonymous: string;
            creditCard: string;
            bankTransfer: string;
        };
        payouts: {
            title: string;
            subtitle: string;
            requestPayout: string;
            noPayouts: string;
            noPayoutsFound: string;
            processing: string;
            completed: string;
            failed: string;
            pending: string;
            inTransit: string;
            filterAll: string;
            filterPending: string;
            filterCompleted: string;
            bankAccount: string;
            created: string;
            arrival: string;
            feesIncluded: string;
            instantModal: {
                error: string;
                invalidAmount: string;
                amountExceedsMax: string;
                processingError: string;
                title: string;
                maxAvailable: string;
                amountLabel: string;
                amountPlaceholder: string;
                descriptionLabel: string;
                descriptionPlaceholder: string;
                feesWarning: string;
                feesDetails: string;
                cancel: string;
                confirm: string;
                processing: string;
            };
        };
        status: {
            connected: string;
            pending: string;
            restricted: string;
            notConnected: string;
        };
    };

    // Reports
    reports: {
        title: string;
        subtitle: string;
        dateRange: string;
        generate: string;
        download: string;
        noData: string;
        revenue: string;
        expenses: string;
        profit: string;
        jobsCompleted: string;
        // Additional keys
        loadingError: string;
        unableToLoad: string;
        checkConnection: string;
        retry: string;
        exportInProgress: string;
        exportSuccess: string;
        exportError: string;
        detailedMetrics: string;
        totalRevenue: string;
        transactions: string;
        successRate: string;
        averageAmount: string;
        thisMonth: string;
        total: string;
        performance: string;
        perTransaction: string;
    };

    // Staff Modals
    staffModals: {
        addStaff: {
            title: string;
            close: string;
            back: string;
            // Validation errors
            validation: {
                error: string;
                nameRequired: string;
                firstNameRequired: string;
                lastNameRequired: string;
                emailRequired: string;
                emailInvalid: string;
                phoneRequired: string;
                positionRequired: string;
                roleRequired: string;
                teamRequired: string;
                hourlyRateRequired: string;
                hourlyRateInvalid: string;
                contractorNameRequired: string;
                contractorEmailRequired: string;
                contractorPhoneRequired: string;
                inviteError: string;
            };
            // Success messages
            success: {
                invitationSent: string;
                invitationSentMessage: string;
                contractorAdded: string;
                contractorAddedMessage: string;
            };
            // Confirm dialogs
            confirm: {
                addContractor: string;
                addContractorMessage: string;
                cancel: string;
                add: string;
            };
            // Step: Member type selection
            typeStep: {
                title: string;
                subtitle: string;
                employee: {
                    title: string;
                    description: string;
                    feature1: string;
                    feature2: string;
                    feature3: string;
                };
                contractor: {
                    title: string;
                    description: string;
                    feature1: string;
                    feature2: string;
                    feature3: string;
                };
            };
            // Step: Employee form
            employeeForm: {
                title: string;
                description: string;
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                position: string;
                team: string;
                hourlyRate: string;
                selectPosition: string;
                selectTeam: string;
                submit: string;
                submitting: string;
            };
            // Step: Contractor search
            contractorSearch: {
                title: string;
                placeholder: string;
                search: string;
                or: string;
                inviteNew: string;
            };
            // Step: Contractor results
            contractorResults: {
                title: string;
                noResults: string;
                noResultsSubtext: string;
                add: string;
                abn: string;
                email: string;
                phone: string;
            };
            // Step: Contractor invite
            contractorInvite: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                abn: string;
                abnPlaceholder: string;
                infoText: string;
                submit: string;
                submitting: string;
            };
        };
        editStaff: {
            validation: {
                error: string;
                nameRequired: string;
                emailRequired: string;
                positionRequired: string;
            };
            success: {
                title: string;
                message: string;
            };
            error: {
                title: string;
                message: string;
            };
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