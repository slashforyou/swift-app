import { TranslationKeys } from '../types';

export const itTranslations: TranslationKeys = {
    common: {
        save: 'Salva', cancel: 'Annulla', delete: 'Elimina', edit: 'Modifica', add: 'Aggiungi',
        search: 'Cerca', loading: 'Caricamento...', error: 'Errore', success: 'Successo', 
        warning: 'Attenzione', info: 'Info', yes: 'Sì', no: 'No', ok: 'OK', close: 'Chiudi',
        back: 'Indietro', next: 'Avanti', previous: 'Precedente', done: 'Fatto', continue: 'Continua',
        skip: 'Salta', retry: 'Riprova', refresh: 'Aggiorna', settings: 'Impostazioni', language: 'Lingua',
    },
    home: {
        title: 'Home', welcome: 'Bentornato!',
        calendar: { title: 'Calendario', description: 'Visualizza e gestisci la tua agenda' },
        jobs: { title: 'Lavori', description: 'Gestisci i tuoi incarichi di lavoro' },
        profile: { title: 'Profilo', description: 'Visualizza e modifica il tuo profilo' },
        parameters: { title: 'Impostazioni', description: 'Configura le preferenze dell\'app' },
        connection: {
            title: 'Connessione', description: 'Testa la connettività del server', testConnection: 'Testa Connessione',
            status: { connected: 'Connesso', disconnected: 'Disconnesso', testing: 'Test in corso...' },
        },
    },
    navigation: { home: 'Home', calendar: 'Calendario', jobs: 'Lavori', profile: 'Profilo', settings: 'Impostazioni' },
    jobs: {
        title: 'Lavori',
        status: { pending: 'In attesa', inProgress: 'In corso', completed: 'Completato', cancelled: 'Annullato' },
        timer: {
            start: 'Avvia Timer', stop: 'Ferma Timer', pause: 'Pausa', resume: 'Riprendi',
            break: 'Fai una Pausa', endBreak: 'Termina Pausa', totalTime: 'Tempo Totale',
            billableTime: 'Tempo Fatturabile', breakTime: 'Tempo di Pausa', currentStep: 'Passo Corrente',
        },
        details: { information: 'Informazioni', items: 'Elementi', contacts: 'Contatti', timeline: 'Timeline', payment: 'Pagamento', summary: 'Riassunto' },
    },
    profile: { title: 'Profilo', personalInfo: 'Informazioni Personali', preferences: 'Preferenze', logout: 'Esci', version: 'Versione' },
    settings: {
        title: 'Impostazioni',
        language: { title: 'Lingua', description: 'Scegli la tua lingua preferita', current: 'Lingua attuale', select: 'Seleziona lingua' },
        theme: { title: 'Tema', light: 'Chiaro', dark: 'Scuro', auto: 'Automatico' },
        notifications: { title: 'Notifiche', enabled: 'Attivate', disabled: 'Disattivate' },
    },
    messages: {
        errors: { network: 'Errore di connessione di rete', generic: 'Qualcosa è andato storto', notFound: 'Risorsa non trovata', unauthorized: 'Accesso non autorizzato', serverError: 'Errore del server', validation: 'Input non valido' },
        success: { saved: 'Salvato con successo', deleted: 'Eliminato con successo', updated: 'Aggiornato con successo', created: 'Creato con successo' },
    },
};