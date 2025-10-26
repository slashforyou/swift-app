import { TranslationKeys } from '../types';import { TranslationKeys } from '../types';



export const itTranslations: TranslationKeys = {export const itTranslations: TranslationKeys = {

    common: {    common: {

        save: 'Salva',        save: 'Salva', cancel: 'Annulla', delete: 'Elimina', edit: 'Modifica', add: 'Aggiungi',

        cancel: 'Annulla',        search: 'Cerca', loading: 'Caricamento...', error: 'Errore', success: 'Successo', 

        delete: 'Elimina',        warning: 'Attenzione', info: 'Info', yes: 'Sì', no: 'No', ok: 'OK', close: 'Chiudi',

        edit: 'Modifica',        back: 'Indietro', next: 'Avanti', previous: 'Precedente', done: 'Fatto', continue: 'Continua',

        add: 'Aggiungi',        skip: 'Salta', retry: 'Riprova', refresh: 'Aggiorna', settings: 'Impostazioni', language: 'Lingua',

        search: 'Cerca',    },

        loading: 'Caricamento...',    home: {

        error: 'Errore',        title: 'Home', welcome: 'Bentornato!',

        success: 'Successo',        calendar: { title: 'Calendario', description: 'Visualizza e gestisci la tua agenda' },

        warning: 'Avviso',        jobs: { title: 'Lavori', description: 'Gestisci i tuoi incarichi di lavoro' },

        info: 'Info',        profile: { title: 'Profilo', description: 'Visualizza e modifica il tuo profilo' },

        yes: 'Sì',        parameters: { title: 'Impostazioni', description: 'Configura le preferenze dell\'app' },

        no: 'No',        connection: {

        ok: 'OK',            title: 'Connessione', description: 'Testa la connettività del server', testConnection: 'Testa Connessione',

        close: 'Chiudi',            status: { connected: 'Connesso', disconnected: 'Disconnesso', testing: 'Test in corso...' },

        back: 'Indietro',        },

        next: 'Avanti',    },

        previous: 'Precedente',    navigation: { home: 'Home', calendar: 'Calendario', jobs: 'Lavori', profile: 'Profilo', settings: 'Impostazioni' },

        done: 'Fatto',    jobs: {

        continue: 'Continua',        title: 'Lavori',

        skip: 'Salta',        status: { pending: 'In attesa', inProgress: 'In corso', completed: 'Completato', cancelled: 'Annullato' },

        retry: 'Riprova',        timer: {

        refresh: 'Aggiorna',            start: 'Avvia Timer', stop: 'Ferma Timer', pause: 'Pausa', resume: 'Riprendi',

        settings: 'Impostazioni',            break: 'Fai una Pausa', endBreak: 'Termina Pausa', totalTime: 'Tempo Totale',

        language: 'Lingua',            billableTime: 'Tempo Fatturabile', breakTime: 'Tempo di Pausa', currentStep: 'Passo Corrente',

    },        },

        details: { information: 'Informazioni', items: 'Elementi', contacts: 'Contatti', timeline: 'Timeline', payment: 'Pagamento', summary: 'Riassunto' },

    home: {    },

        title: 'Home',    profile: { title: 'Profilo', personalInfo: 'Informazioni Personali', preferences: 'Preferenze', logout: 'Esci', version: 'Versione' },

        welcome: 'Bentornato!',    settings: {

        calendar: {        title: 'Impostazioni',

            title: 'Calendario',        language: { title: 'Lingua', description: 'Scegli la tua lingua preferita', current: 'Lingua attuale', select: 'Seleziona lingua' },

            description: 'Visualizza e gestisci il tuo programma',        theme: { title: 'Tema', light: 'Chiaro', dark: 'Scuro', auto: 'Automatico' },

        },        notifications: { title: 'Notifiche', enabled: 'Attivate', disabled: 'Disattivate' },

        business: {    },

            title: 'Business',    messages: {

            description: 'Fatturazione, configurazione e gestione',        errors: { network: 'Errore di connessione di rete', generic: 'Qualcosa è andato storto', notFound: 'Risorsa non trovata', unauthorized: 'Accesso non autorizzato', serverError: 'Errore del server', validation: 'Input non valido' },

        },        success: { saved: 'Salvato con successo', deleted: 'Eliminato con successo', updated: 'Aggiornato con successo', created: 'Creato con successo' },

        jobs: {    },

            title: 'Lavori',};
            description: 'Gestisci le tue assegnazioni di lavoro',
        },
        profile: {
            title: 'Profilo',
            description: 'Visualizza e modifica il tuo profilo',
        },
        parameters: {
            title: 'Impostazioni',
            description: 'Configura le preferenze dell\'app',
        },
        connection: {
            title: 'Connessione',
            description: 'Testa la connettività del server',
            testConnection: 'Testa Connessione',
            status: {
                connected: 'Connesso',
                disconnected: 'Disconnesso',
                testing: 'Test in corso...',
            },
        },
    },

    navigation: {
        home: 'Home',
        calendar: 'Calendario',
        jobs: 'Lavori',
        profile: 'Profilo',
        settings: 'Impostazioni',
    },

    jobs: {
        title: 'Lavori',
        status: {
            pending: 'In attesa',
            inProgress: 'In corso',
            completed: 'Completato',
            cancelled: 'Annullato',
        },
        timer: {
            start: 'Avvia Timer',
            stop: 'Ferma Timer',
            pause: 'Pausa',
            resume: 'Riprendi',
            break: 'Fai una pausa',
            endBreak: 'Termina pausa',
            totalTime: 'Tempo totale',
            billableTime: 'Tempo fatturabile',
            breakTime: 'Tempo di pausa',
            currentStep: 'Passo corrente',
        },
        details: {
            information: 'Informazioni',
            items: 'Elementi',
            contacts: 'Contatti',
            timeline: 'Cronologia',
            payment: 'Pagamento',
            summary: 'Riepilogo',
        },
    },

    calendar: {
        title: 'Calendario',
        days: {
            mon: 'Lun',
            tue: 'Mar',
            wed: 'Mer',
            thu: 'Gio',
            fri: 'Ven',
            sat: 'Sab',
            sun: 'Dom',
        },
        months: {
            january: 'Gennaio',
            february: 'Febbraio',
            march: 'Marzo',
            april: 'Aprile',
            may: 'Maggio',
            june: 'Giugno',
            july: 'Luglio',
            august: 'Agosto',
            september: 'Settembre',
            october: 'Ottobre',
            november: 'Novembre',
            december: 'Dicembre',
        },
        stats: {
            totalJobs: 'Totale lavori',
            urgent: 'Urgente',
            completed: 'Completato',
        },
        refresh: 'Aggiorna',
        goToDay: 'Vai al giorno',
        previousMonth: 'Mese precedente',
        nextMonth: 'Mese successivo',
        filters: {
            all: 'Tutti',
            pending: 'In attesa',
            active: 'Attivo',
            done: 'Fatto',
        },
        sorting: {
            time: 'Ora',
            priority: 'Priorità',
            status: 'Stato',
        },
        previousDay: 'Giorno precedente',
        nextDay: 'Giorno successivo',
        currentYear: 'Anno corrente',
        years: 'Anni',
        selectFromRange: 'Seleziona da',
        loading: 'Caricamento...',
        noJobsScheduled: 'Nessun lavoro programmato',
        freeDay: 'Hai un giorno libero il',
        enjoyTimeOff: 'Goditi il tuo tempo libero!',
        somethingWentWrong: 'Qualcosa è andato storto',
        tryAgain: 'Riprova',
        jobStatus: {
            pending: 'In attesa',
            inProgress: 'In corso',
            completed: 'Completato',
            cancelled: 'Annullato',
            unknown: 'Sconosciuto',
        },
        priority: {
            urgent: 'URGENTE',
            high: 'ALTA',
            medium: 'MEDIA',
            low: 'BASSA',
            normal: 'NORMALE',
        },
        unknownClient: 'Cliente sconosciuto',
        navigation: {
            monthlyView: 'Vista mensile',
            yearlyView: 'Vista annuale',
            multiYearView: 'Vista multi-anno',
            dailyView: 'Vista giornaliera',
            loadingCalendar: 'Caricamento calendario',
            authenticationError: 'Errore di autenticazione',
            goToLogin: 'Vai al login',
            loading: 'Caricamento',
        },
        dayScreen: {
            stats: {
                total: 'Totale',
                pending: 'In attesa',
                completed: 'Completati',
            },
            filtersTitle: 'Lavori e filtri',
            sortBy: 'Ordina per:',
        },
    },

    profile: {
        title: 'Profilo',
        personalInfo: 'Informazioni personali',
        preferences: 'Preferenze',
        logout: 'Esci',
        version: 'Versione',
        level: 'Livello',
        experience: 'Esperienza',
        toNextLevel: 'al Livello',
        defaultTitle: 'Autista',
    },

    jobDetails: {
        panels: {
            summary: 'Riepilogo lavoro',
            jobDetails: 'Dettagli lavoro',
            clientInfo: 'Informazioni cliente',
            notes: 'Note',
            payment: 'Pagamento',
        },
        errors: {
            invalidJobId: 'ID lavoro non valido',
            cannotLoadDetails: 'Impossibile caricare i dettagli del lavoro',
            loadingError: 'Errore di caricamento',
        },
        steps: {
            pickup: 'Ritiro',
            intermediate: 'Intermedio',
            dropoff: 'Consegna',
            pickupDescription: 'Ritiro dalla posizione del cliente',
            intermediateDescription: 'Consegna alla posizione intermedia',
            dropoffDescription: 'Consegna alla posizione finale',
        },
        client: {
            firstTimeClient: 'Cliente nuovo',
        },
        defaultNote: 'Nota',
        messages: {
            noteAdded: 'Nota aggiunta',
            noteAddedSuccess: 'La nota è stata salvata con successo',
            noteAddError: 'Errore',
            noteAddErrorMessage: 'Impossibile aggiungere la nota. Riprova.',
            photoAdded: 'Foto aggiunta',
            photoAddedSuccess: 'La foto è stata caricata con successo',
            photoAddError: 'Errore',
            photoAddErrorMessage: 'Impossibile aggiungere la foto. Riprova.',
            photoDescription: 'Foto del lavoro',
            nextStep: 'Prossimo passo',
            advancedToStep: 'Avanzato al passo',
        },
    },

    settings: {
        title: 'Impostazioni',
        language: {
            title: 'Lingua',
            description: 'Scegli la tua lingua preferita',
            current: 'Lingua corrente',
            select: 'Seleziona lingua',
        },
        theme: {
            title: 'Tema',
            light: 'Chiaro',
            dark: 'Scuro',
            auto: 'Automatico',
        },
        notifications: {
            title: 'Notifiche',
            enabled: 'Attivate',
            disabled: 'Disattivate',
        },
    },

    business: {
        navigation: {
            loadingBusiness: 'Caricamento sezione business...',
            authenticationError: 'Errore di autenticazione',
            goToLogin: 'Vai al login',
            businessInfo: 'Info business',
            staffCrew: 'Personale/Squadra',
            trucks: 'Veicoli',
            jobsBilling: 'Lavori/Fatturazione',
        },
        info: {
            title: 'Informazioni business',
            placeholder: 'Questa sezione conterrà le informazioni della tua attività: dettagli di contatto, configurazione, impostazioni generali.',
        },
        staff: {
            title: 'Personale e squadra',
            placeholder: 'Gestisci qui il tuo team: aggiungi membri, assegna ruoli, traccia competenze e disponibilità.',
        },
        trucks: {
            title: 'Veicoli e attrezzature',
            placeholder: 'Gestisci la tua flotta e attrezzature: aggiungi camion, traccia manutenzione, programma riparazioni.',
        },
        jobs: {
            title: 'Lavori e fatturazione',
            placeholder: 'Crea nuovi lavori, genera fatture e traccia la redditività dei tuoi progetti.',
        },
    },

    messages: {
        errors: {
            network: 'Errore di connessione di rete',
            generic: 'Qualcosa è andato storto',
            notFound: 'Risorsa non trovata',
            unauthorized: 'Accesso non autorizzato',
            serverError: 'Errore del server',
            validation: 'Input non valido',
        },
        success: {
            saved: 'Salvato con successo',
            deleted: 'Eliminato con successo',
            updated: 'Aggiornato con successo',
            created: 'Creato con successo',
        },
    },
};
