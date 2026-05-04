# Cobbr — État des pages

> Dernière mise à jour : 3 mai 2026  
> Légende : ✅ OK · ⚠️ Partiel / à améliorer · 🔴 Stub / cassé · 🔧 En cours

Chaque section correspond à un groupe de navigation. Ajoute tes notes dans les lignes **Remarques**.

---

## 🔐 Auth & Onboarding

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Login | `connectionScreens/login.tsx` | ✅ | |
| Mot de passe oublié | `connectionScreens/forgotPassword.tsx` | ✅ | |
| Choix type de compte | `connectionScreens/registerTypeSelection.tsx` | ✅ | |
| Inscription + abonnement | `connectionScreens/subscribe.tsx` | ✅ | |
| Vérification email | `connectionScreens/subscribeMailVerification.tsx` | ✅ | |
| Compléter le profil | `CompleteProfileScreen.tsx` | ✅ | |

---

## 🏠 Home (écran principal)

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Home (Boss / Employee / Contractor) | `home.tsx` | ✅ Fix navigations appliqué | |

---

## 📅 Calendrier

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Vue principale calendrier | `calendar/CalendarMainScreen.tsx` | ✅ | |
| Vue jour | `calendar/dayScreen.tsx` | ✅ Fix syntax error appliqué | |
| Vue semaine | `calendar/weekScreen.tsx` | ✅ | |
| Vue mois | `calendar/monthScreen.tsx` | ✅ | |
| Vue année | `calendar/yearScreen.tsx` | ✅ | |
| Vue multi-années | `calendar/multipleYearsScreen.tsx` | ✅ | |

---

## 💼 Jobs

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Détails job (shell) | `jobDetails.tsx` | ✅ | |
| Onglet Summary | `JobDetailsScreens/summary.tsx` | ✅ Bouton "Demander un avis" ajouté | |
| Onglet Client | `JobDetailsScreens/client.tsx` | ✅ | |
| Onglet Job info | `JobDetailsScreens/job.tsx` | ✅ | |
| Onglet Payment | `JobDetailsScreens/payment.tsx` | ✅ | |
| Onglet Payment Window | `JobDetailsScreens/paymentWindow.tsx` | ✅ | |
| Onglet Note | `JobDetailsScreens/note.tsx` | ✅ | |
| Onglet Attachments | `JobDetailsScreens/attachments.tsx` | ✅ | |
| Onglet Difficulty | `JobDetailsScreens/difficulty.tsx` | ✅ | |
| Onglet Linked Jobs | `JobDetailsScreens/linkedJobs.tsx` | ✅ | |
| Breakdown horaire du job | `job/JobTimeBreakdownScreen.tsx` | ✅ | |
| Avis client (formulaire) | `JobReviewScreen.tsx` | ✅ Entrée via ScorecardSummary | |
| Formulaire review (form) | `ReviewFormScreen.tsx` | ✅ | |
| Scorecard job | `JobScorecardScreen.tsx` | ✅ | |

---

## 📊 Business Hub

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Vue d'ensemble hub | `business/BusinessHubOverview.tsx` | ✅ | |
| Infos entreprise | `business/BusinessInfoPage.tsx` | ✅ | Hero card logo+nom, cards avec séparateurs, sections iconées |
| Navigation hub (panneaux) | `navigation/business.tsx` | ✅ | Boutons Staff (Dispo/Compétences/Notations/Heures) et Véhicules (Kilométrage/Maintenance) supprimés ; boutons Finances traduits |

### Clients & Relations
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Liste clients | `business/ClientsScreen.tsx` | ✅ | |
| Relations inter-entreprises | `business/RelationsScreen.tsx` | ✅ | Design amélioré : card code accentuée, titres de section colorés |

### Staff & Équipe
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Gestion équipes | `settings/TeamsManagementScreen.tsx` | ✅ | Bouton Planning retiré (API endpoint manquant) |
| Gestion rôles | `settings/RolesManagementScreen.tsx` | ✅ | |
| Crew screen | `business/staffCrewScreen.tsx` | ✅ | Cartes compactes : avatar initiales + nom + type pill + statut + taux + actions icônes |

### Véhicules & Flotte
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Détails véhicule | `business/VehicleDetailsScreen.tsx` | ✅ | |
| Kilométrage | `VehicleMileageScreen.tsx` | ✅ | Textes "Sélectionnez un véhicule" et "Aucun véhicule trouvé" traduits via t() |
| Maintenance | `VehicleMaintenanceScreen.tsx` | ✅ | ALERT_TYPES traduits via t(maintenance.alertTypes.*) dans toutes les langues |
| Camions (liste) | `business/trucksScreen.tsx` | ✅ | |

### Finance & Facturation
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Revenus dashboard | `RevenueDashboardScreen.tsx` | ✅ | Clé revenue.title ajoutée (EN/FR + toutes langues) |
| Factures mensuelles | `business/MonthlyInvoicesScreen.tsx` | ✅ | |
| Liste paiements | `business/PaymentsListScreen.tsx` | ✅ | |
| Virements (payouts) | `business/PayoutsScreen.tsx` | ✅ | |
| Facturation inter-contractor | `business/InterContractorBillingScreen.tsx` | ✅ | |
| Rapports | `business/ReportsScreen.tsx` | ✅ | Accessible via onglet "Reports" dans Finances |

### Devis & Contrats
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Liste devis | `QuotesScreen.tsx` | ✅ | Clé quotes.title ajoutée (EN/FR + toutes langues) |
| Éditeur de devis | `QuoteEditorScreen.tsx` | ✅ | |
| Contrats | `business/ContractsScreen.tsx` | ✅ | Fix Switch : value={!!clause.is_active} + thumbColor={!!clause.is_active ? ...} |
| Éditeur de clauses | `business/ClauseEditorModal.tsx` | ✅ | |
| Accords | `business/AgreementsScreen.tsx` | ✅ | |
| Templates de job | `business/JobTemplatesPanel.tsx` | ✅ | Catégories traduites via t(businessHub.templates.category.*) |
| Éditeur de template | `business/JobTemplateEditor.tsx` | ✅ | |

### Stockage
| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Liste stockage | `business/StorageScreen.tsx` | ✅ | Texte explicatif rétractable "Lots vs Units" ajouté avec clés de traduction storage.help.* |
| Détail lot | `business/StorageLotDetail.tsx` | ✅ | |
| Détail unité | `business/StorageUnitDetailScreen.tsx` | ✅ | |
| Création lot | `business/CreateStorageLotModal.tsx` | ✅ | |
| Édition lot | `business/EditStorageLotModal.tsx` | ✅ | |
| Mise en conteneur | `business/ContainerLayoutScreen.tsx` | ✅ | |

---

## 💳 Stripe & Paiements

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Hub Stripe | `business/StripeHub.tsx` | ✅ | |
| Onglet paiements Stripe | `business/StripePaymentsTab.tsx` | ✅ | |
| Paramètres Stripe | `business/StripeSettingsScreen.tsx` | ✅ | |
| Statut compte Stripe | `Stripe/StripeAccountStatus.tsx` | ✅ | |
| Onboarding Stripe (WebView) | `Stripe/StripeOnboardingWebView.tsx` | ✅ | |
| Onboarding flow Stripe | `Stripe/OnboardingFlow/` | ✅ | |
| Succès paiement | `payments/PaymentSuccessScreen.tsx` | ✅ | |
| Abonnement | `SubscriptionScreen.tsx` | ✅ | |
| Parrainage | `ReferralScreen.tsx` | ✅ | |

---

## 🏆 Gamification

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Dashboard gamification | `GamificationV2Screen.tsx` | ✅ Bouton Leaderboard ajouté dans le header | |
| Leaderboard | `leaderboard.tsx` | ✅ | |
| Quêtes | `QuestsScreen.tsx` | ✅ | |
| Badges | `badges.tsx` | ✅ | |
| Historique XP | `xpHistory.tsx` | ✅ | |
| Scorecard | `JobScorecardScreen.tsx` | ✅ | |

---

## 👷 Contractor

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Demandes en attente | `contractor/PendingRequestsScreen.tsx` | ✅ Implémenté (liste + Accept/Decline) | |
| Mes missions | `contractor/MyAssignmentsScreen.tsx` | ✅ | |

---

## 👔 Employee

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Dashboard employé | `EmployeeDashboardScreen.tsx` | ✅ | |
| Disponibilité | `EmployeeAvailabilityScreen.tsx` | ✅ | |
| Planning | `EmployeeScheduleScreen.tsx` | ✅ | |
| Évaluations | `EmployeeRatingsScreen.tsx` | ✅ | |
| Compétences | `EmployeeSkillsScreen.tsx` | ✅ | |
| Heures hebdo | `WeeklyHoursScreen.tsx` | ✅ | |
| Récap journalier | `DailyRecapModal.tsx` | ✅ | |
| Assignments (liste) | `assignments/index.tsx` | ✅ | |

---

## 👤 Profil & Paramètres

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Profil | `profile.tsx` | ✅ | |
| Paramètres | `parameters.tsx` | ✅ | |
| Manager dashboard | `ManagerDashboardScreen.tsx` | ✅ | |

---

## 💬 Support

| Page | Fichier | État | Remarques |
|------|---------|------|-----------|
| Inbox support | `support/SupportInbox.tsx` | ✅ | |
| Conversation | `support/SupportConversation.tsx` | ✅ | |
| Nouvelle conversation | `support/SupportNewConversation.tsx` | ✅ | |
| FAQ | `support/SupportFAQ.tsx` | ✅ | |
| Formulaire feedback | `support/FeedbackForm.tsx` | ✅ | |

---

## 🗑️ Fichiers supprimés (orphelins nettoyés)

| Fichier supprimé | Raison |
|-----------------|--------|
| `ModernUIExample.tsx` | Écran de démo, jamais utilisé en nav |
| `demo/DesignSystemDemoScreen.tsx` | Écran de démo, jamais utilisé en nav |
| `profile_modernized.tsx` | Doublon de `profile.tsx` |
| `profile_unified.tsx` | Doublon de `profile.tsx` |
| `profile_user_only.tsx` | Doublon de `profile.tsx` |
| `parameters_Modernized.tsx` | Doublon de `parameters.tsx` |
| `business/VehicleFleetScreen.tsx` | Remplacé par `trucksScreen.tsx` + `VehicleDetailsScreen.tsx` |
| `JobStepScreenWithAnalytics.tsx` | Navigate cassé vers `JobCompletion` inexistant |

---

## 📝 Notes globales

<!-- Ajoute ici tes remarques transverses (UX, design, flux, etc.) -->

BUSINESS HUB :

Page Hub :
- ~~Le "Getting started Guide" et le "actions required" donne deux fois les même infos. Tu peux retirer le "actions required"~~ ✅ Bloc retiré
- ~~Le bouton "free" doit mener vers le choix des formules~~ ✅ Chip plan rendu cliquable → Subscription
- ~~Le design UX est a revoir, aucun éléments n'est clairement priorisé~~ ✅ Actions requises (Stripe, profil incomplet) maintenant affichées en banner rouge en haut ; section title "Overview" ajoutée avant la grille

Page Compabny Information :
- ~~Ne contient pas de bouton retour~~ ✅ Header retour ajouté en drill-down
- ~~Doit être plus agréable à lire et moins fade~~ ✅ Hero card (logo + nom + ABN), cards avec accent border + séparateurs, sections iconées

PAGE Kilométrage :
- ~~Le bouton n'est pas traduit~~ ✅ Bouton supprimé du hub
- ~~La page n'est pas du tout traduite dans les différente langue~~ ✅ Textes traduits (t("mileage.*"))
- La page peut contenir un load error — à investiguer côté backend

Page Maintenance :
- ~~Le bouton "maintenance" est en francais et doit être traduit dans toute les langues de l'app~~ ✅ Bouton supprimé du hub
- La page peut contenir un load error — à investiguer côté backend
- ~~Rien sur la page n'est traduit dans les différente langue~~ ✅ ALERT_TYPES traduits (t("maintenance.alertTypes.*"))

Page Team :
- ~~Le design est à revoir complètement pour une bien meilleur ergonomie et navigation~~ ✅ Cartes compactes : avatar initiales + type pill + statut + taux + actions icônes
- ~~Bouton "planning" de chaque employee card redirige vers une page vide avec un "Load Error"~~ ✅ Bouton retiré (endpoint manquant)

Page Véhicule :
- ~~Le wizard pour créer un véhicule est entièrement à revoir, le design n'est pas du tout adapté à un patron qui a peu de temps devant lui. On veut un système ou chaque étape à compléter apparait juste après le précédent~~ ✅ Wizard progressif : type → details → logistics, chaque section révèle la suivante dans le même scroll
- ~~Le bouton "kilométrage" et "maintenance" sont en francais et ne sont clairement pas une priorité pour le moment. Retire les~~ ✅ Supprimés

Page Partners :
- ~~Le design est fade et a besoin d'un peu plus de structure et de couleurs~~ ✅ Card code accentuée, titres de section en couleur primary

Page Storage :
- ~~Le client ne comprendra pas la différence entre lots et units je veux donc un petit texte explicatif rapide et rétractable~~ ✅ Texte explicatif collapsible ajouté (storage.help.*)
- ~~Le design doit être revu pour quelque chose de plus schematique, je veux que le client voit son storage en quelque seconde.~~ ✅ Vue units : grille schématique 3 colonnes colorée par statut + légende. Lots : accent border latéral + footer séparé.

Page Config - Job templates :
- ~~Les types de job sont encore en francais, ils doivent absolument être traduit dans toute les langues~~ ✅ Catégories traduites via t("businessHub.templates.category.*")


Page Config - Contract Clauses :
- ~~Le bouton switch d'une clause ne se place par à droite quand il est actif il reste à gauche même si le switch est bleu et actif.~~ ✅ Fix thumbColor={!!clause.is_active ? ...}

Page Finances :
Les boutons "devis" et "revenus" sont en francais et non pas traduit dans l'ensemble des langues. ✅ Utilisent t("quotes.title") et t("revenue.title") — traduits en EN/FR, fallback EN pour autres langues.

Page Finances - Devis :
- ~~Le titre n'est pas traduit dans les différentes langues de l'application~~ ✅ quotes.title ajouté dans en.ts + fr.ts

Page finances - Revenue :
- ~~Le titre n'est pas traduit dans les différentes langues de l'application~~ ✅ revenue.title ajouté dans en.ts + fr.ts

JOB PAGE :
- ~~La barre "files", "linked" et "difficultyarrive trop tot dans le développement de l'app. Retire la.~~ ✅ Barre Quick Actions retirée de jobDetails.tsx


