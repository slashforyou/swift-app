import { TranslationKeys } from '../types';

export const frTranslations: TranslationKeys = {
    common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        add: 'Ajouter',
        search: 'Rechercher',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Attention',
        info: 'Info',
        yes: 'Oui',
        no: 'Non',
        ok: 'OK',
        close: 'Fermer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        done: 'Terminé',
        continue: 'Continuer',
        skip: 'Passer',
        retry: 'Réessayer',
        refresh: 'Actualiser',
        settings: 'Paramètres',
        language: 'Langue',
    },

    home: {
        title: 'Accueil',
        welcome: 'Bon retour !',
        calendar: {
            title: 'Calendrier',
            description: 'Consultez et gérez votre planning',
        },
        jobs: {
            title: 'Travaux',
            description: 'Gérez vos missions de travail',
        },
        profile: {
            title: 'Profil',
            description: 'Consultez et modifiez votre profil',
        },
        parameters: {
            title: 'Paramètres',
            description: 'Configurez les préférences de l\'application',
        },
        connection: {
            title: 'Connexion',
            description: 'Testez la connectivité du serveur',
            testConnection: 'Tester la connexion',
            status: {
                connected: 'Connecté',
                disconnected: 'Déconnecté',
                testing: 'Test en cours...',
            },
        },
    },

    navigation: {
        home: 'Accueil',
        calendar: 'Calendrier',
        jobs: 'Travaux',
        profile: 'Profil',
        settings: 'Paramètres',
    },

    jobs: {
        title: 'Travaux',
        status: {
            pending: 'En attente',
            inProgress: 'En cours',
            completed: 'Terminé',
            cancelled: 'Annulé',
        },
        timer: {
            start: 'Démarrer le chrono',
            stop: 'Arrêter le chrono',
            pause: 'Pause',
            resume: 'Reprendre',
            break: 'Prendre une pause',
            endBreak: 'Fin de pause',
            totalTime: 'Temps total',
            billableTime: 'Temps facturable',
            breakTime: 'Temps de pause',
            currentStep: 'Étape actuelle',
        },
        details: {
            information: 'Informations',
            items: 'Éléments',
            contacts: 'Contacts',
            timeline: 'Chronologie',
            payment: 'Paiement',
            summary: 'Résumé',
        },
    },

    calendar: {
        title: 'Calendrier',
        // Jours de la semaine (abréviations)
        days: {
            mon: 'Lun',
            tue: 'Mar',
            wed: 'Mer',
            thu: 'Jeu',
            fri: 'Ven',
            sat: 'Sam',
            sun: 'Dim',
        },
        // Mois complets
        months: {
            january: 'Janvier',
            february: 'Février',
            march: 'Mars',
            april: 'Avril',
            may: 'Mai',
            june: 'Juin',
            july: 'Juillet',
            august: 'Août',
            september: 'Septembre',
            october: 'Octobre',
            november: 'Novembre',
            december: 'Décembre',
        },
        // Statistiques
        stats: {
            totalJobs: 'Total Jobs',
            urgent: 'Urgent',
            completed: 'Terminé',
        },
        // Actions
        refresh: 'Actualiser',
        goToDay: 'Aller au jour',
        previousMonth: 'Mois précédent',
        nextMonth: 'Mois suivant',
    },

    profile: {
        title: 'Profil',
        personalInfo: 'Informations personnelles',
        preferences: 'Préférences',
        logout: 'Déconnexion',
        version: 'Version',
        level: 'Niveau',
        experience: 'Expérience',
        toNextLevel: 'vers le Niveau',
        defaultTitle: 'Chauffeur',
    },

    settings: {
        title: 'Paramètres',
        language: {
            title: 'Langue',
            description: 'Choisissez votre langue préférée',
            current: 'Langue actuelle',
            select: 'Sélectionner la langue',
        },
        theme: {
            title: 'Thème',
            light: 'Clair',
            dark: 'Sombre',
            auto: 'Automatique',
        },
        notifications: {
            title: 'Notifications',
            enabled: 'Activées',
            disabled: 'Désactivées',
        },
    },

    messages: {
        errors: {
            network: 'Erreur de connexion réseau',
            generic: 'Une erreur s\'est produite',
            notFound: 'Ressource introuvable',
            unauthorized: 'Accès non autorisé',
            serverError: 'Erreur du serveur',
            validation: 'Saisie invalide',
        },
        success: {
            saved: 'Enregistré avec succès',
            deleted: 'Supprimé avec succès',
            updated: 'Mis à jour avec succès',
            created: 'Créé avec succès',
        },
    },
};