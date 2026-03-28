# LARGE TODO — Cobbr Roadmap Post-MVP

> **Dernière mise à jour :** 28 mars 2026
> **Version actuelle :** 1.1.0 (MVP live sur iOS + Android)
> **Statut :** MVP fonctionnel — Planification des prochaines versions

---

## Légende

| Priorité  | Description                                  |
| --------- | -------------------------------------------- |
| 🔴 **P0** | Sécurité, stabilité, bloquant                |
| 🟠 **P1** | Nécessaire avant monétisation (juin 2026)    |
| 🟡 **P2** | Améliorations significatives de l'expérience |
| 🟢 **P3** | Nice-to-have, améliorations futures          |
| ⚪ **P4** | Idées / features longue terme                |

> **[+ Server]** ou **[+ Client]** = nécessite aussi du travail de l'autre côté

---

## ✅ Déjà réalisé

- [x] Copier la référence du job en 1 clic
- [x] Wizard d'envoi de message — recalibré quand le clavier s'ouvre
- [x] Calendrier ne descend plus trop bas sur l'écran
- [x] Traitement des jobs passés (restés inactifs) — revu
- [x] Logo entreprise sur les factures (forfait Pro)
- [x] Personnalisation minime des factures (forfait Pro)
- [x] Bouton de statut pour chaque étape du job (step system)
- [x] Note "contexte" sur le déménagement (système de notes avec types)
- [x] Signature client avant le job
- [x] Bouton pour passer au jour suivant/précédent rapidement
- [x] Section matériel nécessaire (dans les templates de job)
- [x] Accept / refuse un job (+ contre-proposition B2B)
- [x] Pause qui reprend après X minutes (auto-resume)
- [x] Différents personnages pour le profil (8 avatars)
- [x] Système de récompenses (XP, niveaux, badges)
- [x] Affichage de la réponse au job en attente
- [x] Upload de logo personnalisé visible dans l'app
- [x] Nettoyage console.log + TEMP_DISABLED (2289 lignes supprimées)
- [x] Guard `__DEV__` sur testData / stripeTestData
- [x] Handler global ErrorUtils + unhandledrejection
- [x] Audit des catch blocks vides (23 commentés dans 12 fichiers)
- [x] Bug upload logo corrigé (GCS → stockage local)

---

## 📱 Client (App React Native)

### 🔴 P0

- [ ] **Système de messages (aide, soutiens)** — implémenter l'écran de messagerie/support **[+ Server]**

### 🟠 P1

- [ ] Écran de gestion d'abonnement (vue du plan actuel, comparaison des plans) **[+ Server]**
- [ ] Connecter le paiement des abonnements via Stripe (billing portal ou web) **[+ Server]**
- [ ] Personnaliser le thème/couleurs de l'app par entreprise
- [ ] Branding sur les factures et liens de paiement **[+ Server]**
- [ ] Migrer du fallback card entry manuel vers Stripe PaymentSheet natif
- [ ] Écran et flow "mot de passe oublié" (labels i18n déjà prêts) **[+ Server]**
- [ ] Bouton "signaler un problème de paiement" au bureau (visible par le staff terrain)
- [ ] Section contrats : consulter le contrat signé à tout moment **[+ Server]**
- [ ] Intégrer une décharge de responsabilité (fine/damage waiver) **[+ Server]**
- [ ] Suivi de la facturation inter-prestataires (statut : envoyée, payée, en retard) **[+ Server]**

### 🟡 P2

#### Notifications

- [ ] Améliorer le wizard de demande de notifications (plus agréable à lire, meilleur design)
- [ ] Popup/notification avant chaque étape du job (rappel proactif au staff)

#### Calendrier

- [ ] Vue semaine en plus de la vue jour/mois/année
- [ ] Drag & drop pour réassigner un job à une autre date
- [ ] Filtres par statut, par équipe, par véhicule
- [ ] Code couleur par type de job ou par équipe

#### Profil & compte

- [ ] Permettre le changement de photo de profil depuis la galerie et la caméra
- [ ] Historique des jobs réalisés par un employé **[+ Server]**
- [ ] Statistiques personnelles (nombre de jobs, heures travaillées, XP gagné) **[+ Server]**
- [ ] **Écran employé** — dashboard dédié avec heures travaillées dans la semaine (plage de dates modifiable), heures par jour, stats de travail. Accessible depuis le profil **[+ Server]**

#### Job Details

- [ ] Carousel/slide pour les photos en mode plein écran (swipe gauche/droite)
- [ ] Système de notes/commentaires sur un job (communication interne) **[+ Server]**
- [ ] Historique des modifications d'un job (audit trail) **[+ Server]**
- [ ] Pièces jointes (documents, devis, contrats) **[+ Server]**
- [ ] Signature client digitale améliorée (capture plus fluide)
- [ ] Classifier les jobs par niveau de difficulté **[+ Server]**
- [ ] Lier 2 jobs entre eux (interstate) **[+ Server]**
- [ ] Support multi-camions par job (code `trucksCount` existant mais désactivé) **[+ Server]**
- [ ] Page "Logs" : historique des actions sur un job (pour les contractors) **[+ Server]**

#### Gestion du personnel

- [ ] Vue planning par employé (tous ses jobs sur une timeline) **[+ Server]**
- [ ] Gestion des disponibilités/indisponibilités **[+ Server]**
- [ ] Système de compétences/qualifications par employé **[+ Server]**
- [ ] Affectation automatique suggérée (disponibilité + proximité) **[+ Server]**
- [ ] Quota d'heures par travailleur (max heures/semaine, tracking cumulé) **[+ Server]**
- [ ] **Page clients** — liste des clients de la société, accès patron uniquement **[+ Server]**
- [ ] **Parrainage récompensé** — ajout prestataire via code invite / lien de parrainage **[+ Server]**

#### Véhicules

- [ ] Suivi kilométrique par véhicule **[+ Server]**
- [ ] Alertes de maintenance (vidange, contrôle technique) **[+ Server]**
- [ ] Disponibilité du véhicule sur le calendrier **[+ Server]**

#### Messagerie

- [ ] Implémenter un vrai système de messagerie (aide, soutiens, support) **[+ Server]**
- [ ] Appel d'urgence pour contractors et contractee (bouton rapide)

#### Carte

- [ ] MapView intégrée pour le contractee (trajet + temps estimé)

#### Qualité & onboarding

- [ ] **Mini tutoriel** première utilisation — tooltips/coach marks par page au 1er lancement
- [ ] **Audit i18n** — vérifier que tous les éléments sont traduits dans toutes les langues

#### Satisfaction

- [ ] Générer une demande d'avis automatique (happy customer → review) **[+ Server]**
- [ ] Bouton avis Google (en suspens — pas de page Google Business)

### 🟢 P3

- [ ] Générateur de devis (sélection de prestations, calcul auto) **[+ Server]**
- [ ] Conversion devis → job en un clic **[+ Server]**
- [ ] Factures PDF avec branding **[+ Server]**
- [ ] Chat interne entre membres de l'équipe **[+ Server]**
- [ ] Chat avec le client final (lié au job) **[+ Server]**
- [ ] Partage de position en temps réel ("le déménageur arrive dans X min") **[+ Server]**
- [ ] Notation du job par le client final (étoiles + commentaire) **[+ Server]**
- [ ] Notation interne de l'employé par le patron **[+ Server]**
- [ ] Calcul d'itinéraire optimisé entre les jobs de la journée
- [ ] Tracking GPS de la flotte en temps réel (opt-in) **[+ Server]**
- [ ] Système de numérotation des cartons (packing) **[+ Server]**
- [ ] Page de stockage (inventaire items, logs entrée/sortie) **[+ Server]**
- [ ] Développer le système de récompenses (plus de badges, challenges, classements) **[+ Server]**
- [ ] Système de points par job (succès, missions accomplies) **[+ Server]**
- [ ] Développer les niveaux (levels) et badges/succès déblocables **[+ Server]**

### ⚪ P4

- [ ] Annuaire entreprises partenaires par zone géographique **[+ Server]**
- [ ] Système d'appels d'offres entre entreprises **[+ Server]**
- [ ] Synchronisation calendrier Google/iCal
- [ ] Recommandation au client (guide/tips déménagement)

---

## 🖥️ Server (Backend Node.js)

### 🔴 P0

- [ ] Vérifier que la clé Stripe live est bien configurée (secret key + webhook signing secret)

### 🟠 P1

- [ ] Implémenter la gestion des plans côté backend (endpoint upgrade/downgrade)
- [ ] Implémenter les limites par plan (nombre de jobs, staff, véhicules)
- [ ] Domaine personnalisé pour les liens de paiement
- [ ] Dashboard admin pour visualiser les commissions collectées
- [ ] Ajuster les taux de commission selon le plan de l'entreprise
- [ ] Endpoint "mot de passe oublié" (envoi email + reset token)
- [ ] Facture mensuelle automatique pour le contractor (récapitulatif des jobs réalisés)
- [ ] Revoir les mails de facturation (contenu, format, envoi)
- [ ] Facturation et calcul d'heures entre prestataires (contractor ↔ contractee)
- [ ] Section contrats : gestion des clauses (contractee, contractor, client)
- [ ] Module de documentation / formation pour les employés (feature payante)

### 🟡 P2

- [ ] Notification à l'employé quand un job lui est assigné
- [ ] Notification au patron quand un job est accepté/refusé
- [ ] Notification pour les contre-propositions B2B
- [ ] Récapitulatif quotidien des jobs du jour (notification matinale optionnelle)
- [ ] Proposer une réponse par mail aux messages d'aide/soutiens

### 🟢 P3

- [ ] Suivi des paiements (payé / en attente / en retard) + relance auto des impayés
- [ ] Dashboard revenus (journalier, hebdomadaire, mensuel)
- [ ] Rapport de productivité par employé
- [ ] Rapport d'utilisation des véhicules
- [ ] Export CSV/PDF des rapports
- [ ] KPI : taux de complétion, temps moyen par job, revenu par job
- [ ] Envoi de SMS/email automatique au client (confirmation RDV, rappel)
- [ ] Agrégation des notes sur le profil public de l'entreprise
- [ ] Estimation du temps de trajet

### ⚪ P4

- [ ] Matching automatique contractee/contractor par distance et disponibilité
- [ ] Évaluation et notation des partenaires B2B
- [ ] Prédiction de la durée d'un job basée sur l'historique (IA)
- [ ] Optimisation automatique du planning (IA)
- [ ] Détection d'anomalies (job anormalement long, facturation inhabituelle)
- [ ] Assistant IA pour la création de devis
- [ ] IA conversationnelle pour les messages entrants (Holloway-style)
- [ ] Intégration comptabilité (QuickBooks, Sage, etc.)
- [ ] API publique pour intégrations tierces
- [ ] Webhook pour événements (job créé, complété, payé)
- [ ] Adapter la facturation aux réglementations locales (TVA, numéros de facture)
- [ ] Support de devises multiples
- [ ] Conformité RGPD complète (export/suppression des données utilisateur)

---

## 👤 Tâches manuelles (Romain)

### 🔴 P0

- [ ] Effectuer un paiement réel de test en production pour valider le flow complet

### 🟠 P1

- [ ] Définir les plans tarifaires finaux (Free / Pro / Enterprise) avec leurs limites
- [ ] Valider le système de commission (application_fee_amount) en production
- [ ] Tester Apple Pay / Google Pay via PaymentSheet
- [ ] Valider le flow complet PaymentSheet sur iOS et Android

### 🟡 P2

- [ ] Tester l'enregistrement du device token sur iOS physique
- [ ] Tester l'enregistrement du device token sur Android physique
- [ ] Valider le routing des notifications (foreground / background / app fermée)

---

## 🔧 Dette technique

| Élément                                           | Fichier(s)                     | Priorité |
| ------------------------------------------------- | ------------------------------ | -------- |
| DelegateJobWizard trop gros (~1800 lignes)        | `DelegateJobWizard/index.tsx`  | 🟡       |
| ContractorJobWizardModal trop gros (~2000 lignes) | `ContractorJobWizardModal.tsx` | 🟡       |
| Timer sync désactivé côté backend                 | `jobValidation.ts`             | 🟠       |
| Mock data fallback dans useBusinessStats          | `useBusinessStats.ts`          | 🟡       |
| Manque de React.memo sur les composants de liste  | Multiples                      | 🟢       |
| connection.jsx encore en .jsx (pas .tsx)          | `connection.jsx`               | 🟢       |

---

## 📅 Planning prévisionnel

| Version    | Période      | Focus                                                      |
| ---------- | ------------ | ---------------------------------------------------------- |
| **v1.1.x** | Avril 2026   | P0 — Sécurité, stabilisation                               |
| **v1.2**   | Mai 2026     | P1 — Préparation monétisation, PaymentSheet, notifications |
| **v1.3**   | Juin 2026    | P1 — Lancement plans payants, personnalisation app         |
| **v1.4**   | Été 2026     | P2 — UX améliorations (calendrier, profil, jobs)           |
| **v2.0**   | Automne 2026 | P3 — Devis/facturation, rapports, communication            |
| **v3.0**   | 2027         | P4 — Marketplace, IA, intégrations                         |
