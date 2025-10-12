import { TranslationKeys } from '../types';

export const hiTranslations: TranslationKeys = {
    common: {
        save: 'सेव', cancel: 'रद्द', delete: 'डिलीट', edit: 'एडिट', add: 'जोड़ें',
        search: 'खोजें', loading: 'लोड हो रहा है...', error: 'त्रुटि', success: 'सफलता',
        warning: 'चेतावनी', info: 'जानकारी', yes: 'हाँ', no: 'नहीं', ok: 'ठीक', close: 'बंद करें',
        back: 'वापस', next: 'अगला', previous: 'पिछला', done: 'हो गया', continue: 'जारी रखें',
        skip: 'छोड़ें', retry: 'पुनः प्रयास', refresh: 'रिफ्रेश', settings: 'सेटिंग्स', language: 'भाषा',
    },
    home: {
        title: 'होम', welcome: 'वापसी पर स्वागत है!',
        calendar: { title: 'कैलेंडर', description: 'अपना शेड्यूल देखें और प्रबंधित करें' },
        jobs: { title: 'काम', description: 'अपने कार्य असाइनमेंट प्रबंधित करें' },
        profile: { title: 'प्रोफाइल', description: 'अपनी प्रोफाइल देखें और संपादित करें' },
        parameters: { title: 'सेटिंग्स', description: 'ऐप प्राथमिकताएं कॉन्फ़िगर करें' },
        connection: {
            title: 'कनेक्शन', description: 'सर्वर कनेक्टिविटी टेस्ट करें', testConnection: 'कनेक्शन टेस्ट करें',
            status: { connected: 'जुड़ा हुआ', disconnected: 'डिस्कनेक्ट', testing: 'टेस्ट हो रहा है...' },
        },
    },
    navigation: { home: 'होम', calendar: 'कैलेंडर', jobs: 'काम', profile: 'प्रोफाइल', settings: 'सेटिंग्स' },
    jobs: {
        title: 'काम',
        status: { pending: 'पेंडिंग', inProgress: 'प्रगति में', completed: 'पूर्ण', cancelled: 'रद्द' },
        timer: {
            start: 'टाइमर शुरू करें', stop: 'टाइमर रोकें', pause: 'रोकें', resume: 'फिर से शुरू करें',
            break: 'ब्रेक लें', endBreak: 'ब्रेक खत्म करें', totalTime: 'कुल समय',
            billableTime: 'बिलेबल टाइम', breakTime: 'ब्रेक टाइम', currentStep: 'वर्तमान चरण',
        },
        details: { information: 'जानकारी', items: 'आइटम', contacts: 'संपर्क', timeline: 'टाइमलाइन', payment: 'भुगतान', summary: 'सारांश' },
    },
    profile: { title: 'प्रोफाइल', personalInfo: 'व्यक्तिगत जानकारी', preferences: 'प्राथमिकताएं', logout: 'लॉगआउट', version: 'संस्करण' },
    settings: {
        title: 'सेटिंग्स',
        language: { title: 'भाषा', description: 'अपनी पसंदीदा भाषा चुनें', current: 'वर्तमान भाषा', select: 'भाषा चुनें' },
        theme: { title: 'थीम', light: 'हल्का', dark: 'गहरा', auto: 'ऑटो' },
        notifications: { title: 'सूचनाएं', enabled: 'सक्षम', disabled: 'अक्षम' },
    },
    messages: {
        errors: { network: 'नेटवर्क कनेक्शन त्रुटि', generic: 'कुछ गलत हुआ', notFound: 'संसाधन नहीं मिला', unauthorized: 'अनधिकृत पहुंच', serverError: 'सर्वर त्रुटि', validation: 'अमान्य इनपुट' },
        success: { saved: 'सफलतापूर्वक सेव किया गया', deleted: 'सफलतापूर्वक डिलीट किया गया', updated: 'सफलतापूर्वक अपडेट किया गया', created: 'सफलतापूर्वक बनाया गया' },
    },
};