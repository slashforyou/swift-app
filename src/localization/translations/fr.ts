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
        today: {
            title: "Aujourd'hui",
            loading: 'Chargement...',
            noJobs: 'Aucun travail',
            allCompleted: 'Tout terminé',
            pending: 'en attente',
            totalJobs: 'travaux',
            completed: 'terminés',
        },
        calendar: {
            title: 'Calendrier',
            description: 'Consultez et gérez votre planning',
        },
        business: {
            title: 'Entreprise',
            description: 'Facturation, configuration et gestion',
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
        loading: 'Chargement...',
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
            noteAddError: 'Erreur',
            noteAddErrorMessage: 'Impossible d\'ajouter la note. Veuillez réessayer.',
            photoAdded: 'Photo ajoutée',
            photoAddedSuccess: 'La photo a été uploadée avec succès',
            photoAddError: 'Erreur',
            photoAddErrorMessage: 'Impossible d\'ajouter la photo. Veuillez réessayer.',
            photoDescription: 'Photo du job',
            nextStep: 'Étape suivante',
            advancedToStep: 'Passé à l\'étape',
        },
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

    payment: {
        missingInfo: {
            title: 'Informations manquantes',
            message: 'Veuillez remplir tous les champs de la carte.',
        },
        errors: {
            jobIdNotFound: 'ID du job non trouvé',
            paymentError: 'Erreur de paiement',
            generic: 'Erreur',
            processingFailed: 'Une erreur s\'est produite lors du traitement du paiement.',
            networkError: 'Erreur de connexion',
        },
        buttons: {
            processing: 'Enregistrement...',
            confirm: 'Confirmer le paiement',
            retry: 'Réessayer',
        },
        status: {
            processing: 'Traitement en cours...',
            success: 'Paiement réussi',
            failed: 'Paiement échoué',
        },
    },

    vehicles: {
        actions: {
            edit: 'Modifier le véhicule',
            delete: 'Supprimer le véhicule',
            cancel: 'Annuler',
            remove: 'Supprimer',
        },
        alerts: {
            addSuccess: {
                title: 'Succès',
                message: 'Véhicule ajouté avec succès! 🎉',
            },
            addError: {
                title: 'Erreur',
                message: 'Une erreur est survenue lors de l\'ajout du véhicule',
            },
            deleteConfirm: {
                message: 'Êtes-vous sûr de vouloir supprimer {{vehicleName}} ?',
            },
            deleteSuccess: {
                title: 'Succès',
                message: 'Véhicule supprimé',
            },
            deleteError: {
                title: 'Erreur',
                message: 'Impossible de supprimer le véhicule',
            },
            editConfirm: {
                message: 'Modification de {{vehicleName}}',
            },
        },
        errors: {
            loadingTitle: 'Erreur lors du chargement des véhicules',
            loadingMessage: 'Une erreur est survenue',
        },
    },

    staff: {
        titles: {
            main: 'Gestion du Personnel',
            subtitle: 'Gérez vos employés et prestataires',
            loading: 'Chargement du personnel...',
        },
        stats: {
            active: 'Actifs',
            employees: 'Employés',
            contractors: 'Prestataires',
            averageRate: 'Taux moyen',
        },
        actions: {
            add: 'Ajouter un membre',
            edit: 'Modifier',
            remove: 'Retirer',
            cancel: 'Annuler',
        },
        filters: {
            all: 'Tous',
            employees: 'Employés',
            contractors: 'Prestataires',
        },
        types: {
            employee: 'Employé (TFN)',
            contractor: 'Prestataire (ABN)',
        },
        status: {
            active: 'Actif',
            inactive: 'Inactif',
            pending: 'En attente',
        },
        alerts: {
            removeConfirm: {
                title: 'Retirer du staff',
                message: 'Êtes-vous sûr de vouloir retirer {{memberName}} ?',
            },
        },
        empty: {
            title: 'Aucun membre du personnel',
            subtitle: 'Ajoutez votre premier employé ou prestataire',
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