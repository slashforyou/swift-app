import { TranslationKeys } from '../types';

export const itTranslations: TranslationKeys = {
    common: {
        save: 'Salva',
        cancel: 'Annulla',
        delete: 'Elimina',
        edit: 'Modifica',
        add: 'Aggiungi',
        search: 'Cerca',
        loading: 'Caricamento...',
        error: 'Errore',
        success: 'Succès',
        warning: 'Attenzione',
        info: 'Info',
        yes: 'S�',
        no: 'No',
        ok: 'OK',
        close: 'Chiudi',
        back: 'Indietro',
        next: 'Avanti',
        previous: 'Précédent',
        done: 'Terminé',
        continue: 'Continua',
        skip: 'Salta',
        retry: 'Réessayer',
        refresh: 'Aggiorna',
        settings: 'Paramètres',
        language: 'Lingua',
    },

    home: {
        title: 'Pagina Iniziale',
        welcome: 'Bentornato!',
        calendar: {
            title: 'Calendario',
            description: 'Consultez et gérez votre planning',
        },
        business: {
            title: 'Business',
            description: 'Facturation, configuration et gestion',
        },
        jobs: {
            title: 'Lavori',
            description: 'Gérez vos missions de travail',
        },
        profile: {
            title: 'Profilo',
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
        home: 'Home',
        calendar: 'Calendario',
        jobs: 'Lavori',
        profile: 'Profilo',
        settings: 'Paramètres',
    },

    jobs: {
        title: 'Lavori',
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
        title: 'Calendario',
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
            january: 'Gennaio',
            february: 'Février',
            march: 'Marzo',
            april: 'Aprile',
            may: 'Maggio',
            june: 'Giugno',
            july: 'Luglio',
            august: 'Août',
            september: 'Settembre',
            october: 'Ottobre',
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
        refresh: 'Aggiorna',
        goToDay: 'Aller au jour',
        previousMonth: 'Mois précédent',
        nextMonth: 'Mois suivant',
        // Filtres et tri
        filters: {
            all: 'Tous',
            pending: 'En attente',
            active: 'En cours',
            done: 'Terminé',
        },
        sorting: {
            time: 'Heure',
            priority: 'Priorité',
            status: 'État',
        },
        // Navigation
        previousDay: 'Jour précédent',
        nextDay: 'Jour suivant',
        // Vue annuelle
        currentYear: 'Année actuelle',
        years: 'Années',
        selectFromRange: 'Sélectionner entre',
        // États
        loading: 'Caricamento...',
        noJobsScheduled: 'Aucun travail programmé',
        freeDay: 'Vous avez une journée libre le',
        enjoyTimeOff: 'Profitez de votre temps libre !',
        somethingWentWrong: 'Une erreur s\'est produite',
        tryAgain: 'Réessayer',
        // Statut et priorité des jobs
        jobStatus: {
            pending: 'En attente',
            inProgress: 'En cours',
            completed: 'Terminé',
            cancelled: 'Annulé',
            unknown: 'Inconnu',
        },
        priority: {
            urgent: 'URGENT',
            high: 'HAUTE',
            medium: 'MOY',
            low: 'FAIBLE',
            normal: 'NORM',
        },
        // Client
        unknownClient: 'Client inconnu',
        // Navigation
        navigation: {
            monthlyView: 'Vue Mensuelle',
            yearlyView: 'Vue Annuelle',
            multiYearView: 'Vue Multi-Années',
            dailyView: 'Vue Quotidienne',
            loadingCalendar: 'Chargement du calendrier',
            authenticationError: 'Erreur d\'authentification',
            goToLogin: 'Aller à la connexion',
            loading: 'Chargement',
        },
        // Day Screen specific
        dayScreen: {
            stats: {
                total: 'Total',
                pending: 'En attente',
                completed: 'Terminés',
            },
            filtersTitle: 'Jobs et Filtres',
            sortBy: 'Trier par :',
        },
    },

    profile: {
        title: 'Profilo',
        personalInfo: 'Informations personnelles',
        preferences: 'Préférences',
        logout: 'Déconnexion',
        version: 'Version',
        level: 'Niveau',
        experience: 'Expérience',
        toNextLevel: 'vers le Niveau',
        defaultTitle: 'Chauffeur',
    },

    jobDetails: {
        panels: {
            summary: 'Résumé du travail',
            jobDetails: 'Détails du travail',
            clientInfo: 'Informations client',
            notes: 'Notes',
            payment: 'Paiement',
        },
        errors: {
            invalidJobId: 'ID de job invalide',
            cannotLoadDetails: 'Impossible de charger les détails du job',
            loadingError: 'Erreur de chargement',
        },
        steps: {
            pickup: 'Enlèvement',
            intermediate: 'Intermédiaire',
            dropoff: 'Livraison',
            pickupDescription: 'Enlèvement chez le client',
            intermediateDescription: 'Dépôt à l\'emplacement intermédiaire',
            dropoffDescription: 'Dépôt à l\'emplacement final',
        },
        client: {
            firstTimeClient: 'Nouveau client',
        },
        defaultNote: 'Note',
        messages: {
            noteAdded: 'Note ajoutée',
            noteAddedSuccess: 'La note a été enregistrée avec succès',
            noteAddError: 'Errore',
            noteAddErrorMessage: 'Impossible d\'ajouter la note. Veuillez réessayer.',
            photoAdded: 'Photo ajoutée',
            photoAddedSuccess: 'La photo a été uploadée avec succès',
            photoAddError: 'Errore',
            photoAddErrorMessage: 'Impossible d\'ajouter la photo. Veuillez réessayer.',
            photoDescription: 'Photo du job',
            nextStep: 'Étape suivante',
            advancedToStep: 'Passé à l\'étape',
        },
    },

    settings: {
        title: 'Paramètres',
        language: {
            title: 'Lingua',
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

    business: {
        navigation: {
            loadingBusiness: 'Chargement de la section entreprise...',
            authenticationError: 'Erreur d\'authentification',
            goToLogin: 'Aller à la connexion',
            businessInfo: 'Infos Entreprise',
            staffCrew: 'Personnel/Équipe',
            trucks: 'Véhicules',
            jobsBilling: 'Travaux/Facturation',
        },
        info: {
            title: 'Informations Entreprise',
            placeholder: 'Cette section contiendra les informations de votre entreprise : coordonnées, configuration, paramètres généraux.',
        },
        staff: {
            title: 'Personnel & Équipe',
            placeholder: 'Gérez ici votre équipe : ajoutez des membres, assignez des rôles, suivez les compétences et disponibilités.',
        },
        trucks: {
            title: 'Véhicules & Matériel',
            placeholder: 'Gérez votre flotte de véhicules et matériel : ajoutez des camions, suivez l\'entretien, planifiez les réparations.',
        },
        jobs: {
            title: 'Travaux & Facturation',
            placeholder: 'Créez de nouveaux travaux, générez des factures et suivez la rentabilité de vos projets.',
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