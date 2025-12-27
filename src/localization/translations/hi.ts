import { TranslationKeys } from '../types';

// Note: Hindi translations are partial - using type assertion
export const hiTranslations = {
    common: {
        save: 'सहेजें',
        cancel: 'रद्द करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        add: 'जोड़ें',
        search: 'खोजें',
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        warning: 'चेतावनी',
        info: 'जानकारी',
        yes: 'हां',
        no: 'नहीं',
        ok: 'ठीक है',
        close: 'बंद करें',
        back: 'वापस',
        next: 'अगला',
        previous: 'पिछला',
        done: 'पूर्ण',
        continue: 'जारी रखें',
        skip: 'छोड़ें',
        retry: 'पुनः प्रयास करें',
        refresh: 'ताज़ा करें',
        settings: 'सेटिंग्स',
        language: 'भाषा',
    },

    home: {
        title: 'होम',
        welcome: 'आपका स्वागत है!',
        calendar: {
            title: 'कैलेंडर',
            description: 'अपना शेड्यूल देखें और प्रबंधित करें',
        },
        business: {
            title: 'व्यवसाय',
            description: 'बिलिंग, कॉन्फ़िगरेशन और प्रबंधन',
        },
        jobs: {
            title: 'नौकरियां',
            description: 'अपनी कार्य नियुक्तियों को प्रबंधित करें',
        },
        profile: {
            title: 'प्रोफ़ाइल',
            description: 'अपनी प्रोफ़ाइल देखें और संपादित करें',
        },
        parameters: {
            title: 'पैरामीटर',
            description: 'ऐप प्राथमिकताएं कॉन्फ़िगर करें',
        },
        connection: {
            title: 'कनेक्शन',
            description: 'सर्वर कनेक्टिविटी टेस्ट करें',
            testConnection: 'कनेक्शन टेस्ट करें',
            status: {
                connected: 'कनेक्ट किया गया',
                disconnected: 'डिस्कनेक्ट किया गया',
                testing: 'टेस्ट हो रहा है...',
            },
        },
    },

    navigation: {
        home: 'होम',
        calendar: 'कैलेंडर',
        jobs: 'नौकरियां',
        profile: 'प्रोफ़ाइल',
        settings: 'सेटिंग्स',
    },

    jobs: {
        title: 'नौकरियां',
        status: {
            pending: 'लंबित',
            inProgress: 'प्रगति में',
            completed: 'पूर्ण',
            cancelled: 'रद्द',
        },
        timer: {
            start: 'टाइमर शुरू करें',
            stop: 'टाइमर रोकें',
            pause: 'रोकें',
            resume: 'फिर से शुरू करें',
            break: 'ब्रेक लें',
            endBreak: 'ब्रेक समाप्त करें',
            totalTime: 'कुल समय',
            billableTime: 'बिल योग्य समय',
            breakTime: 'ब्रेक समय',
            currentStep: 'वर्तमान चरण',
        },
        details: {
            information: 'जानकारी',
            items: 'आइटम',
            contacts: 'संपर्क',
            timeline: 'समयरेखा',
            payment: 'भुगतान',
            summary: 'सारांश',
        },
    },

    calendar: {
        title: 'कैलेंडर',
        // Jours de la semaine (abréviations)
        days: {
            mon: 'सोम',
            tue: 'मंगल',
            wed: 'बुध',
            thu: 'गुरु',
            fri: 'शुक्र',
            sat: 'शनि',
            sun: 'रवि',
        },
        // Mois complets
        months: {
            january: 'जनवरी',
            february: 'फरवरी',
            march: 'मार्च',
            april: 'अप्रैल',
            may: 'मई',
            june: 'जून',
            july: 'जुलाई',
            august: 'अगस्त',
            september: 'सितंबर',
            october: 'अक्टूबर',
            november: 'नवंबर',
            december: 'दिसंबर',
        },
        // Statistiques
        stats: {
            totalJobs: 'कुल नौकरियां',
            urgent: 'तत्काल',
            completed: 'पूर्ण',
        },
        // Actions
        refresh: 'ताज़ा करें',
        goToDay: 'दिन पर जाएं',
        previousMonth: 'पिछला महीना',
        nextMonth: 'अगला महीना',
        // Filtres et tri
        filters: {
            all: 'सभी',
            pending: 'लंबित',
            active: 'सक्रिय',
            done: 'पूर्ण',
        },
        sorting: {
            time: 'समय',
            priority: 'प्राथमिकता',
            status: 'स्थिति',
        },
        // Navigation
        previousDay: 'पिछला दिन',
        nextDay: 'अगला दिन',
        // Vue annuelle
        currentYear: 'वर्तमान वर्ष',
        years: 'वर्ष',
        selectFromRange: 'के बीच चुनें',
        // États
        loading: 'लोड हो रहा है...',
        noJobsScheduled: 'कोई नौकरी निर्धारित नहीं',
        freeDay: 'आपका एक खाली दिन है',
        enjoyTimeOff: 'अपने खाली समय का आनंद लें!',
        somethingWentWrong: 'कुछ गलत हो गया',
        tryAgain: 'पुनः प्रयास करें',
        // Statut et priorité des jobs
        jobStatus: {
            pending: 'लंबित',
            inProgress: 'प्रगति में',
            completed: 'पूर्ण',
            cancelled: 'रद्द',
            unknown: 'अज्ञात',
        },
        priority: {
            urgent: 'तत्काल',
            high: 'उच्च',
            medium: 'मध्यम',
            low: 'निम्न',
            normal: 'सामान्य',
        },
        // Client
        unknownClient: 'अज्ञात ग्राहक',
        // Navigation
        navigation: {
            monthlyView: 'मासिक दृश्य',
            yearlyView: 'वार्षिक दृश्य',
            multiYearView: 'बहु-वर्ष दृश्य',
            dailyView: 'दैनिक दृश्य',
            loadingCalendar: 'कैलेंडर लोड हो रहा है',
            authenticationError: 'प्रमाणीकरण त्रुटि',
            goToLogin: 'लॉगिन पर जाएं',
            loading: 'लोड हो रहा है',
        },
        // Day Screen specific
        dayScreen: {
            stats: {
                total: 'कुल',
                pending: 'लंबित',
                completed: 'पूर्ण',
            },
            filtersTitle: 'नौकरियां और फ़िल्टर',
            sortBy: 'इसके द्वारा क्रमबद्ध करें:',
        },
    },

    profile: {
        title: 'प्रोफ़ाइल',
        personalInfo: 'व्यक्तिगत जानकारी',
        preferences: 'प्राथमिकताएं',
        logout: 'लॉग आउट',
        version: 'संस्करण',
        level: 'स्तर',
        experience: 'अनुभव',
        toNextLevel: 'अगले स्तर तक',
        defaultTitle: 'ड्राइवर',
    },

    jobDetails: {
        panels: {
            summary: 'कार्य सारांश',
            jobDetails: 'कार्य विवरण',
            clientInfo: 'ग्राहक जानकारी',
            notes: 'नोट्स',
            payment: 'भुगतान',
        },
        errors: {
            invalidJobId: 'अमान्य नौकरी ID',
            cannotLoadDetails: 'नौकरी का विवरण लोड नहीं किया जा सकता',
            loadingError: 'लोडिंग त्रुटि',
        },
        steps: {
            pickup: 'पिकअप',
            intermediate: 'मध्यवर्ती',
            dropoff: 'ड्रॉपऑफ',
            pickupDescription: 'ग्राहक से पिकअप',
            intermediateDescription: 'मध्यवर्ती स्थान पर जमा',
            dropoffDescription: 'अंतिम स्थान पर जमा',
        },
        client: {
            firstTimeClient: 'पहली बार का ग्राहक',
        },
        defaultNote: 'नोट',
        messages: {
            noteAdded: 'नोट जोड़ा गया',
            noteAddedSuccess: 'नोट सफलतापूर्वक सहेजा गया',
            noteAddError: 'त्रुटि',
            noteAddErrorMessage: 'नोट नहीं जोड़ा जा सकता। कृपया पुनः प्रयास करें।',
            photoAdded: 'फ़ोटो जोड़ा गया',
            photoAddedSuccess: 'फ़ोटो सफलतापूर्वक अपलोड किया गया',
            photoAddError: 'त्रुटि',
            photoAddErrorMessage: 'फ़ोटो नहीं जोड़ा जा सकता। कृपया पुनः प्रयास करें।',
            photoDescription: 'नौकरी की फ़ोटो',
            nextStep: 'अगला चरण',
            advancedToStep: 'चरण पर आगे बढ़ा',
        },
    },

    settings: {
        title: 'सेटिंग्स',
        language: {
            title: 'भाषा',
            description: 'अपनी पसंदीदा भाषा चुनें',
            current: 'वर्तमान भाषा',
            select: 'भाषा चुनें',
        },
        theme: {
            title: 'थीम',
            light: 'हल्का',
            dark: 'गहरा',
            auto: 'स्वचालित',
        },
        notifications: {
            title: 'सूचनाएं',
            enabled: 'सक्षम',
            disabled: 'अक्षम',
        },
    },

    business: {
        navigation: {
            loadingBusiness: 'व्यवसाय अनुभाग लोड हो रहा है...',
            authenticationError: 'प्रमाणीकरण त्रुटि',
            goToLogin: 'लॉगिन पर जाएं',
            businessInfo: 'व्यवसाय जानकारी',
            staffCrew: 'कर्मचारी/टीम',
            trucks: 'वाहन',
            jobsBilling: 'नौकरियां/बिलिंग',
        },
        info: {
            title: 'व्यवसाय जानकारी',
            placeholder: 'इस अनुभाग में आपकी कंपनी की जानकारी होगी: संपर्क विवरण, कॉन्फ़िगरेशन, सामान्य सेटिंग्स।',
        },
        staff: {
            title: 'कर्मचारी और टीम',
            placeholder: 'यहां अपनी टीम प्रबंधित करें: सदस्य जोड़ें, भूमिकाएं असाइन करें, कौशल और उपलब्धता ट्रैक करें।',
        },
        trucks: {
            title: 'वाहन और उपकरण',
            placeholder: 'अपने वाहन बेड़े और उपकरण प्रबंधित करें: ट्रक जोड़ें, रखरखाव ट्रैक करें, मरम्मत शेड्यूल करें।',
        },
        jobs: {
            title: 'नौकरियां और बिलिंग',
            placeholder: 'नई नौकरियां बनाएं, चालान जेनरेट करें और अपनी परियोजनाओं की लाभप्रदता ट्रैक करें।',
        },
    },

    messages: {
        errors: {
            network: 'नेटवर्क कनेक्शन त्रुटि',
            generic: 'एक त्रुटि हुई',
            notFound: 'संसाधन नहीं मिला',
            unauthorized: 'अनधिकृत पहुंच',
            serverError: 'सर्वर त्रुटि',
            validation: 'अमान्य इनपुट',
        },
        success: {
            saved: 'सफलतापूर्वक सहेजा गया',
            deleted: 'सफलतापूर्वक हटाया गया',
            updated: 'सफलतापूर्वक अपडेट किया गया',
            created: 'सफलतापूर्वक बनाया गया',
        },
    },
} as unknown as TranslationKeys;