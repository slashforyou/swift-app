# Cobbr — Description des fonctionnalités & interfaces pour la Landing Page

> Ce document décrit chaque fonctionnalité majeure de l'application Cobbr avec le détail de l'interface graphique associée. Il est destiné à l'IA en charge de la landing page pour recréer des animations fidèles à l'app.

---

## 🎨 Design System global

- **Thème** : Light / Dark mode automatique avec couleurs adaptées
- **Couleur primaire** : Orange Cobbr (`#FF6B35`), personnalisable par entreprise (color picker dans le profil)
- **Typographie** : Système hiérarchique (title, subtitle, body, caption) avec poids variés
- **Bordures** : Arrondis généreux (`radius.sm`, `radius.md`, `radius.lg`) — style moderne et doux
- **Ombres** : Ombres subtiles sur les cartes (elevation 2-3), plus marquées sur les FABs
- **Icônes** : Ionicons partout (outline et filled selon contexte)
- **Langue** : 7 langues supportées (EN, FR, ES, IT, PT, HI, ZH), bouton rond de sélection de langue sur chaque écran principal

---

## 1. 🏠 Écran d'accueil (Home)

### Description fonctionnelle
Tableau de bord personnel du travailleur. En un coup d'œil : profil, progression gamifiée, jobs du jour, alertes, et accès rapide à toutes les sections.

### Interface graphique

```
┌──────────────────────────────────┐
│ 🔔(n)     [LOGO Cobbr]     🌐  │  ← Barre supérieure : notifs (badge rouge), logo centré, sélecteur langue
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 👤 Avatar  Lvl 12  ████░ 72%│ │  ← ProfileHeader : avatar rond, niveau, barre XP animée, rang (emoji+couleur)
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📅 Today  Mer. 9 avril   3⃣ │ │  ← TodaySection : icône calendrier, date localisée, badge nb jobs (couleur selon statut)
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ⚠️ Pending Assignments (2)  │ │  ← Bandeau assignments en attente (si existants) : jobs transférés à accepter/refuser
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ✅ Onboarding  ██░░  2/4    │ │  ← Checklist onboarding dépliable : profil, 1er job, inviter équipe, paiements
│ │   ✓ Complete profile    80xp│ │     Chaque étape avec icône, label, XP reward, check vert si complété
│ │   ○ Create first job    50xp│ │
│ │   ○ Invite team         30xp│ │
│ │   ✓ Setup payments     120xp│ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌── ⚠️ Stripe Alert ──────────┐ │  ← Bandeau ambre si Stripe pas configuré : icône warning, titre, description, chevron
│ │ Payments not configured      │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📅 Calendar              ➜  │ │  ← MenuItem : icône carrée colorée (bleu), titre, sous-description, chevron droit
│ ├──────────────────────────────┤ │
│ │ 🏢 Business              ➜  │ │  ← MenuItem : icône carrée colorée (vert), titre, description
│ ├──────────────────────────────┤ │
│ │ ⚙ Settings  │  🚪 Logout   │ │  ← Deux boutons compacts côte à côte : settings (ambre), logout (rouge)
│ └──────────────────────────────┘ │
│                                  │
│ 💬                               │  ← FAB support en bas à gauche : cercle primaire, icône chat, badge messages non-lus
└──────────────────────────────────┘
```

**Éléments clés** :
- Cards avec fond `backgroundSecondary`, bordure fine, ombre légère, `borderRadius.lg`
- ProfileHeader avec avatar personnalisable (choix parmi presets), barre de progression gradient
- notifications : panneau slide-in depuis la droite avec animation, listing des notifs avec icônes colorées et temps relatif

---

## 2. 📅 Calendrier (Calendar)

### Description fonctionnelle
Planification et suivi des jobs sur un calendrier mensuel. Chaque jour affiche des indicateurs de couleur selon le statut des jobs. Navigation fluide entre mois, années, et vue journalière détaillée.

### Interface graphique — Vue Mois

```
┌──────────────────────────────────┐
│  ← Retour    [LOGO]      🌐    │  ← CalendarHeader : bouton retour circulaire, logo, sélecteur langue
│                                  │
│      ◀  Avril 2026  ▶          │  ← Navigation mois : flèches gauche/droite, mois + année centré
│                                  │
│  Lu  Ma  Me  Je  Ve  Sa  Di     │  ← En-têtes jours de la semaine
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │
│  │  ││  ││ 1││ 2││ 3││ 4││ 5│  │  ← Grille de jours : chaque cellule carrée arrondie
│  │  ││  ││🟢││  ││🟡││  ││  │  │     Indicateurs couleur sous le numéro :
│  └──┘└──┘└──┘└──┘└──┘└──┘└──┘  │       🟢 = complété, 🟡 = en attente, 🔵 = en cours
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │       🔴 = refusé, 🟣 = assignment en attente
│  │ 6││ 7││ 8││●9││10││11││12│  │     Jour sélectionné : fond primaire, texte blanc
│  │  ││🔵││  ││3⃣││🟢││  ││  │  │     Plusieurs jobs : badge chiffre (ex: "3")
│  └──┘└──┘└──┘└──┘└──┘└──┘└──┘  │
│  ...                             │
└──────────────────────────────────┘
```

### Interface graphique — Vue Jour

```
┌──────────────────────────────────┐
│  ← Retour    [LOGO]      🌐    │
│                                  │
│  📅 Mercredi 9 Avril 2026      │  ← Date formatée localisée en gras
│     3 jobs · 1 completed        │  ← Compteur de jobs
│                                  │
│  [Filter ▾]  [Sort: Time ▾]    │  ← Barre de filtres/tri dépliable : statut, priorité, tri par heure/statut
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🔵 08:00 - 12:00            ││  ← JobBox : barre couleur gauche (statut), horaires
│  │ Move - Smith Family          ││     Titre du job, nom du client
│  │ 📍 15 King St → 42 Queen St ││     Adresses pickup → dropoff avec icône location
│  │ 🚛 REG-001  👤 John D.     ││     Véhicule assigné + staff assigné
│  │ ⚡ High priority             ││     Badge priorité coloré
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🟢 13:00 - 17:00            ││  ← Job complété : barre verte
│  │ Delivery - Johnson Corp      ││
│  │ 📍 Warehouse → 8 Park Ave   ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🟣 Pending Assignment        ││  ← Job provenant d'un transfert inter-entreprise
│  │ Pack - External Co.          ││     Boutons Accept ✓ / Decline ✗
│  │ [✓ Accept] [✗ Decline]      ││
│  └──────────────────────────────┘│
│                                  │
│              [＋]                │  ← FAB "+" pour créer un nouveau job
└──────────────────────────────────┘
```

---

## 3. 📋 Détails d'un Job (Job Details)

### Description fonctionnelle
Vue complète d'un job avec navigation par onglets : résumé, client, job (étapes), notes, et paiement. Contrôle du timer de travail, gestion des items, signature électronique.

### Interface graphique

```
┌──────────────────────────────────┐
│  ← Retour    [LOGO]      🌐    │
│                                  │
│  ┌──────────────────────────────┐│
│  │ #LM0000001  ⚡High          ││  ← En-tête job : code unique, badge priorité
│  │ Status: In Progress 🔵      ││     Statut avec pastille colorée
│  │                              ││
│  │  ▶ 02:34:15                  ││  ← Timer live : gros chiffres, boutons Start/Pause/Resume/Complete
│  │  [⏸ Pause]  [✓ Complete]   ││     Boutons d'action contextuels selon le statut
│  └──────────────────────────────┘│
│                                  │
│  [Summary][Client][Job][Notes][💳]│ ← TabMenu horizontal scrollable : 5 onglets avec icônes
│  ──────────────────────────────  │
│                                  │
│  ── Tab "Job" (étapes) ──       │
│  ┌──────────────────────────────┐│
│  │ Step 1  ✅ Chargement        ││  ← Stepper visuel vertical : points connectés par une ligne
│  │ │                            ││     Étape complétée : coche verte, étape actuelle : point bleu pulsant
│  │ Step 2  🔵 Transit           ││     Étapes générées dynamiquement depuis les adresses
│  │ │                            ││
│  │ Step 3  ○  Déchargement      ││  ← Étape future : cercle vide gris
│  │ │                            ││
│  │ Step 4  ○  Signature         ││
│  └──────────────────────────────┘│
│                                  │
│  ── Tab "Client" ──             │
│  │ 👤 John Smith                │  ← Infos client : nom, téléphone (tap to call), email
│  │ 📞 0412 345 678              │
│  │ ✉️ john@email.com            │
│                                  │
│  ── Tab "Notes" ──              │
│  │ 📝 Note 1 — 09:15           │  ← Liste de notes avec horodatage, badge non-lues
│  │ "Attention escalier étroit"  │     Bouton ajouter note
│  │ [+ Add Note]                 │
│                                  │
│  ── Tab "Payment" ──            │
│  │ Amount: $1,250.00 AUD       │  ← Montant total, GST détaillée, statut paiement
│  │ GST: $125.00                │     Lien de paiement Stripe, statut (paid/unsettled)
│  │ Status: 🟡 Unsettled        │
│  │ [🔗 Create Payment Link]    │
└──────────────────────────────────┘
```

**Éléments clés** :
- Header avec infos job + timer en temps réel (JobTimerDisplay)
- Onglet "Job" avec stepper vertical dynamique (nombre d'étapes = 2 × nombre d'adresses + 2)
- Boutons d'action : Assign Staff, Edit Job, Delegate Job, Delete Job
- Bandeaux contextuels : ownership (job reçu d'un partenaire), pending assignment actions

---

## 4. ➕ Création de Job (Create Job Wizard)

### Description fonctionnelle
Modal en 7 étapes pour créer un job complet : sélection client, organisation (staff/véhicule), planning, détails (adresses/items), pricing, confirmation.

### Interface graphique

```
┌──────────────────────────────────┐
│  ✕ Close          Step 3/7      │  ← Header modal : bouton fermer, indicateur étape
│                                  │
│  ● ● ● ○ ○ ○ ○                 │  ← Dots de progression : remplis = complétés, vide = à venir
│                                  │
│  ── Step 1: Client ──           │
│  🔍 Search existing clients     │  ← Barre de recherche clients existants
│  │ ┌── John Smith ──┐           │     Liste filtrée de clients avec infos
│  │ └─────────────────┘           │
│  │ [+ New Client]               │  ← Ou créer un nouveau client (sous-step)
│                                  │
│  ── Step 3: Schedule ──         │
│  📅 Date picker                 │  ← Sélecteur de date natif iOS/Android
│  🕐 Start window: 08:00-10:00  │  ← Fenêtres horaires avec TimePicklers
│  🕐 End window: 14:00-18:00    │
│  ⏱ Estimated duration: 4h      │
│                                  │
│  ── Step 4: Details ──          │
│  📦 Pickup: [street, city, state, zip]  │  ← Formulaire adresse avec picker état australien
│  🏠 Dropoff: [street, city, state, zip] │     (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
│  Items:                         │
│  │ ☐ Sofa  ☐ Fridge  ☐ Boxes  │  ← Checkboxes items
│  │ [+ Add item]                │
│                                  │
│  ── Step 5: Pricing ──         │
│  Template: [Dropdown]           │  ← Sélection depuis les modèles de job configurés
│  Base rate: $____               │
│  Priority: 🟢Low 🟡Med 🟠High 🔴Urgent │  ← Chips de sélection priorité
│                                  │
│  [◀ Back]              [Next ▶] │  ← Navigation entre étapes
└──────────────────────────────────┘
```

---

## 5. 🤝 Délégation de Job (Delegate Job Wizard)

### Description fonctionnelle
Wizard pour déléguer tout ou partie d'un job à un partenaire ou assigner des ressources internes. 3 modes : assigner ressources, déléguer partiellement, déléguer complètement.

### Interface graphique

```
┌──────────────────────────────────┐
│  ✕ Close       ● ● ○ ○ ○       │  ← ProgressDots
│                                  │
│  ── Mode Selection ──           │
│  ┌──────────────────────────────┐│
│  │ 👥 Assign Resources          ││  ← ModeCard : grande carte avec icône, titre, description
│  │ Add staff & vehicles         ││     Bordure primaire si sélectionné
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 📤 Delegate Part             ││
│  │ Send part of the job         ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 🔄 Delegate Full             ││
│  │ Transfer entire job          ││
│  └──────────────────────────────┘│
│                                  │
│  ── Partner Selection ──        │
│  📇 Relations Carnet            │  ← Carnet de contacts partenaires (relations B2B)
│  │ ABC Removals  ✓              │     Sélection d'un partenaire existant
│  │ XYZ Transport                │
│  🔑 Enter Company Code          │  ← Ou saisir le code unique d'une entreprise
│                                  │
│  ── Pricing ──                  │
│  Rôle: [Driver ▾]              │  ← Sélecteur de rôle : full_job, driver, offsider, custom
│  Modèle: [Flat ▾]              │  ← Type de pricing : flat, hourly, daily
│  Montant: $___                  │  ← Champ montant
│  Comptage heures: [Portal ▾]   │  ← Comptage heures : portal, manual
│                                  │
│  [◀ Back]           [Confirm ▶] │
└──────────────────────────────────┘
```

---

## 6. 🏢 Business Hub — Tableau de bord

### Description fonctionnelle
Centre de commande de l'entreprise avec 4 onglets principaux. Le Hub affiche un dashboard avec indicateurs clés, actions requises, et raccourcis vers chaque section.

### Interface graphique — Navigation principale

```
┌──────────────────────────────────┐
│           [LOGO Cobbr]          │  ← Logo centré en haut
│                                  │
│  ◀ Back     Business Hub    🌐  │  ← BusinessHeader : retour, titre, langue
│                                  │
│  [Hub] [Resources] [Config] [💰]│  ← BusinessTabMenu : 4 onglets horizontaux
│  ════                            │     Onglet actif : souligné + texte primaire
└──────────────────────────────────┘
```

### Interface graphique — Onglet Hub (Dashboard)

```
│  ── Actions requises ──          │
│  ┌─ 🔴 Configure Stripe ─────┐  │  ← Cards d'alerte avec icône, texte, couleur urgence
│  ┌─ 🟡 Complete Profile ─────┐  │     Tapable : redirige vers l'écran correspondant
│  ┌─ 🟢 Add first vehicle ────┐  │
│                                  │
│  ── Aperçu entreprise ──        │
│  ┌──────────┐ ┌──────────┐      │
│  │ 👥 Staff │ │ 🚛 Fleet │      │  ← StatCards 2×2 : fond coloré (indigo, orange, vert, violet)
│  │    12    │ │     8    │      │     Icône, label, chiffre en gros, sous-détail
│  │ 8E · 4C  │ │ available│      │     E=employés, C=prestataires
│  └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐      │
│  │ 🤝 Part. │ │ 💳 Stripe│      │
│  │     5    │ │  Active  │      │     Stripe : status (Active ✓ / Not set ✗)
│  └──────────┘ └──────────┘      │
│                                  │
│  ── Raccourcis outils ──        │
│  [📄 Templates] [📋 Contracts] │  ← Boutons raccourcis vers Config
│  [🏢 Company Profile]          │  ← Drill-down vers le profil entreprise
```

---

## 7. 👥 Gestion du Personnel (Staff & Crew)

### Description fonctionnelle
Gestion complète des employés et prestataires avec invitation, modification, suppression, filtres par type.

### Interface graphique

```
┌──────────────────────────────────┐
│  Sous-tabs: [Staff] [Vehicles] [Partners] │  ← BusinessSubTabMenu : pills horizontales
│  ═════                           │
│  🔍 Rechercher...               │  ← Barre de recherche avec icône loupe
│                                  │
│  [All (12)] [Employees (8)] [Contractors (4)] │  ← Filtres type avec compteurs
│                                  │
│  ┌──────────────────────────────┐│
│  │ 👤 John Davies               ││  ← StaffCard : avatar placeholder, nom complet
│  │    Employee · Driver          ││     Type (employee/contractor), rôle
│  │    📞 0412 345 678           ││     Téléphone
│  │    $35/hr                    ││     Taux horaire
│  │    [✏️ Edit] [🗑 Remove]    ││     Actions : éditer, supprimer (avec confirmation Alert)
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 👤 Sarah Chen                ││
│  │    Contractor · Offsider     ││
│  │    $40/hr                    ││
│  └──────────────────────────────┘│
│                                  │
│  [+ Add Staff]                   │  ← Bouton d'ajout en bas : ouvre AddStaffModal
└──────────────────────────────────┘
```

**Modal d'ajout** : Formulaire avec nom, prénom, email, téléphone, type (employee/contractor), rôle, taux horaire. Mode "invite par email" pour les employés, "recherche par code" pour les contractors.

---

## 8. 🚛 Gestion de la Flotte (Vehicles)

### Description fonctionnelle
Inventaire des véhicules avec statut, détails techniques, et assignation aux jobs.

### Interface graphique

```
│  ┌──────────────────────────────┐│
│  │ Type filter chips:           ││
│  │ [All] [Truck] [Van] [Trailer]││  ← Chips filtres par type de véhicule
│  │ [Ute] [Dolly] [Tools]       ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🚛 Toyota HiAce LWB         ││  ← VehicleCard : emoji type, marque modèle
│  │    Van · REG-ABC-123         ││     Type, immatriculation
│  │    Status: 🟢 Available      ││     Pastille statut (available/in-use/maintenance/out-of-service)
│  │    📍 Sydney Depot           ││     Localisation
│  │    📅 Next service: 15/06   ││     Date prochain entretien
│  │    👤 Assigned: John D.     ││     Staff assigné (si applicable)
│  └──────────────────────────────┘│
│                                  │
│  [+ Add Vehicle]                 │  ← AddVehicleModal : formulaire complet (make, model, year, rego, type, capacity)
└──────────────────────────────────┘
```

---

## 9. 🤝 Carnet de Relations B2B (Partners)

### Description fonctionnelle
Réseau inter-entreprises avec code unique pour se connecter. Permet de transférer/déléguer des jobs entre entreprises partenaires.

### Interface graphique

```
│  ┌──────────────────────────────┐│
│  │ 🔑 Your Company Code        ││  ← Encart avec code unique (ex: "CBBR-7X4M")
│  │    CBBR-7X4M                 ││     Bouton copier avec feedback "Copied!" temporaire
│  │    [📋 Copy]                ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🤝 ABC Removals              ││  ← Carte relation : nom, surnom personnalisé
│  │    Nickname: "Partner ABC"   ││     Actions (long press ou menu) : renommer, supprimer
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 🤝 XYZ Transport Co.        ││
│  └──────────────────────────────┘│
│                                  │
│  [+ Add Relation]                │  ← Modal : entrer le code entreprise + surnom
│  │  🔑 Enter company code      │     CompanyCodeInput : champ texte + lookup en temps réel
│  │  ✅ Found: "XYZ Transport"  │     Résultat trouvé : nom affiché + bouton sauvegarder
└──────────────────────────────────┘
```

---

## 10. 💳 Paiements Stripe (Finances > Payments)

### Description fonctionnelle
Dashboard Stripe Connect intégré. Deux états : non configuré (onboarding CTA) ou actif (revenus, paiements, virements).

### Interface graphique — État non configuré

```
│  ┌──────────────────────────────┐│
│  │   🦊 Mascotte Stripe        ││  ← Image mascotte Cobbr en costume Stripe
│  │                              ││
│  │   Setup payments to get paid ││  ← Titre + description en texte secondaire
│  │   Accept cards, Apple Pay,   ││
│  │   Google Pay directly.       ││
│  │                              ││
│  │   [🚀 Get Started]          ││  ← Bouton CTA primaire large
│  └──────────────────────────────┘│
```

### Interface graphique — État actif

```
│  ── Stats rapides ──            │
│  ┌──────────┐ ┌──────────┐     │
│  │ Revenue  │ │ Monthly  │     │  ← Cards stats 2×2 : Total revenue, Monthly revenue
│  │ $12,450  │ │  $3,200  │     │     Pending payouts, Currency
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │ Pending  │ │  AUD 💵  │     │
│  │   $800   │ │          │     │
│  └──────────┘ └──────────┘     │
│                                 │
│  ── Actions rapides ──         │
│  [📄 Payments received]        │  ← Drill-down : liste des paiements reçus
│  [💰 Payouts / Transfers]      │  ← Drill-down : liste des virements
│  [⚙️ Stripe Settings]         │  ← Drill-down : paramètres du compte Stripe
│                                 │
│  ⚠️ TEST MODE ─── Dev only    │  ← Bandeau "TEST MODE" en mode développeur
```

---

## 11. 💰 Facturation Inter-Prestataires (Finances > Billing)

### Description fonctionnelle
Suivi de la facturation entre entreprises partenaires pour les jobs délégués/transférés. Vue des montants à recevoir et à payer.

### Interface graphique

```
│  ── Stats résumé ──             │
│  ┌──────────┐ ┌──────────┐     │
│  │Receivable│ │ Payable  │     │  ← 2 cards : montant total à recevoir / à payer
│  │ $4,250   │ │  $1,800  │     │     Couleurs : vert pour receivable, orange pour payable
│  └──────────┘ └──────────┘     │
│                                 │
│  [À recevoir] [À payer]        │  ← Toggle tabs : direction (receivable / payable)
│  ═══════════                    │
│                                 │
│  Status filter:                 │
│  [All] [Not billed] [Invoiced] [Paid] [Overdue]  │  ← Chips de filtre par statut
│                                 │
│  ┌──────────────────────────────┐│
│  │ 🔵 Job #LM0001              ││  ← TransferCard : code job, partenaire, montant
│  │    Partner: ABC Removals     ││     Rôle (driver/offsider), pricing type (flat/hourly)
│  │    Role: Driver · $350 flat  ││     Pastille statut colorée
│  │    Status: 🟡 Invoiced      ││
│  │    [Mark as Paid ✓]         ││  ← Action contextuelle selon le statut
│  └──────────────────────────────┘│
```

---

## 12. 🧾 Factures (Finances > Invoices)

### Description fonctionnelle
Génération et gestion de factures récapitulatives. Wizard 4 étapes pour générer : choix période (mensuelle/hebdo/bimensuelle), date, client, confirmation. Liste avec filtres et détail.

### Interface graphique — Liste

```
│  Status filter:                 │
│  [All] [Draft] [Sent] [Paid] [Overdue] [Cancelled] │  ← Chips statut avec icônes
│                                 │
│  ┌──────────────────────────────┐│
│  │ 🧾 Avril 2026               ││  ← InvoiceCard : période, montant, nb jobs
│  │    $8,450.00 AUD · 12 jobs  ││     Client (si filtré), statut avec badge coloré
│  │    Client: Smith Family      ││
│  │    Status: 📝 Draft         ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 🧾 Mars 2026                ││
│  │    $6,200.00 AUD · 8 jobs   ││
│  │    Status: ✅ Paid          ││
│  └──────────────────────────────┘│
│                                  │
│  [+ Generate Invoice]            │  ← Ouvre le wizard de génération
│                                  │
│  ── Empty state ──              │
│  │  📭 No invoices yet          │  ← Illustration + message + CTA "Generate your first invoice"
│  │  Generate your first invoice │
```

### Interface graphique — Wizard de génération (Modal 4 étapes)

```
│  Step 1: Period Type            │
│  ┌───────────┐ ┌───────────┐   │
│  │ 📅 Monthly│ │ 📆 Weekly │   │  ← 3 cards sélectionnables : Monthly, Weekly, Fortnightly
│  └───────────┘ └───────────┘   │
│  ┌───────────┐                  │
│  │📆Fortnight│                  │
│  └───────────┘                  │
│                                 │
│  Step 2: Date Selection         │
│  Monthly → Picker mois + année │  ← Picker mois (dropdown) + année (boutons +/-)
│  Weekly → Picker semaine        │     Affiche "week of 1 Apr — 7 Apr"
│                                 │
│  Step 3: Client Selection       │
│  [🌐 All clients]              │  ← Option "tous les clients" sélectionnée par défaut
│  │ Smith (5 jobs)               │     Liste des clients avec nb de jobs sur la période
│  │ Johnson Corp (3 jobs)        │     Sélection unique
│  │ Williams (2 jobs)            │
│                                 │
│  Step 4: Confirmation           │
│  📋 Résumé : Avril 2026        │  ← Récapitulatif : période, client, type
│     Client: All                 │
│     Type: Monthly               │
│  [✓ Generate]                  │  ← Bouton de confirmation primaire
```

### Interface graphique — Détail facture (Modal)

```
│  ┌──────────────────────────────┐│
│  │ 🏢 [Logo entreprise]        ││  ← Logo entreprise (si uploadé) + couleur primaire en bordure
│  │ Invoice #INV-2026-04        ││     Numéro de facture
│  │ April 2026 · Monthly        ││     Période + type
│  │                              ││
│  │ Amount: $8,450.00 AUD       ││  ← Montant en gros
│  │ Jobs: 12                    ││
│  │ Status: 📝 Draft            ││     Badge statut
│  │                              ││
│  │ Actions:                    ││
│  │ [📧 Send] [✅ Mark Paid]   ││  ← Boutons contextuels selon le statut
│  │ [❌ Cancel]                 ││
│  └──────────────────────────────┘│
```

---

## 13. 📄 Modèles de Job (Config > Templates)

### Description fonctionnelle
Templates réutilisables pour créer des jobs rapidement. Chaque template définit le mode de facturation et les segments du job.

### Interface graphique

```
│  ┌──────────────────────────────┐│
│  │ 📄 Local Move                ││  ← TemplateCard : icône mode facturation, nom, description
│  │    📍 Location to Location   ││     Mode de facturation (location-to-location, depot-to-depot, flat rate…)
│  │    Segments: Pack → Load →  ││     Liste des segments du template
│  │    Transit → Unload          ││
│  │    [Edit ✏️]                ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 📄 Interstate Move           ││
│  │    🏢 Depot to Depot         ││
│  └──────────────────────────────┘│
│                                  │
│  [+ Create Template]             │  ← Navigation vers JobTemplateEditor (écran plein)
```

**JobTemplateEditor** : Écran plein page avec :
- Nom du template
- Mode de facturation (dropdown)
- Builder de segments : drag & reorder, ajout/suppression
- Chaque segment : type (pack, load, transit, unload, custom), durée estimée

---

## 14. 📝 Clauses de Contrat (Config > Clauses)

### Description fonctionnelle
Clauses modulaires appliquées automatiquement aux jobs selon des conditions (toujours, par type de segment, par postcode, ville, état).

### Interface graphique

```
│  ┌──────────────────────────────┐│
│  │ 📜 Stair carry surcharge     ││  ← ClauseCard : titre, condition, toggle actif/inactif
│  │    Condition: 🗺 By postcode ││     Icône condition (infini=always, layers=segment, map=postcode…)
│  │    Active: [🟢 ON]          ││     Switch toggle
│  │    [Edit ✏️] [Delete 🗑]   ││     Actions
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 📜 Heavy item fee            ││
│  │    Condition: ∞ Always       ││
│  │    Active: [🔴 OFF]         ││
│  └──────────────────────────────┘│
│                                  │
│  [+ Add Clause]                  │  ← Ouvre ClauseEditorModal
```

**ClauseEditorModal** : Formulaire avec titre, texte de la clause, type de condition, valeur condition, toggle actif.

---

## 15. 👤 Profil Entreprise (Complete Profile)

### Description fonctionnelle
Formulaire complet du profil entreprise avec auto-save par debounce, lookup ABN automatique, et sélecteur de couleur de marque.

### Interface graphique

```
│  ── Sections dépliables ──      │
│                                  │
│  ┌─ 🏢 Business Info ────────┐  │  ← CollapsibleSection avec emoji, titre, chevron, bouton edit
│  │  Name: Cobbr Transport     │  │     Formulaire : name, trading name, legal name
│  │  ABN: [61 123 456 789] ✅  │  │     ABN avec auto-lookup (API ABR) : affiche nom officiel si trouvé
│  │  ACN: _______________      │  │
│  │  Type: Moving Company ▾    │  │     Dropdowns business_type, industry_type
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 📍 Address ──────────────┐  │
│  │  Street: 15 King Street   │  │     Formulaire adresse australienne
│  │  Suburb: Sydney           │  │     Picker état (NSW, VIC, QLD…)
│  │  State: [NSW ▾]           │  │
│  │  Postcode: 2000           │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 📞 Contact ──────────────┐  │
│  │  Phone, Email, Website    │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🛡 Insurance ────────────┐  │
│  │  Provider, Policy #, Expiry│  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🏦 Banking ──────────────┐  │
│  │  BSB, Account #, Name     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🎨 Branding ─────────────┐  │
│  │  Primary Color:           │  │     Grille de 12 pastilles de couleur sélectionnables
│  │  ● ● ● ● ● ●             │  │     La couleur sélectionnée est appliquée en temps réel au thème
│  │  ● ● ● ● ● ●             │  │     (boutons, accents, header)
│  └────────────────────────────┘  │
│                                  │
│  💾 Auto-save indicator         │  ← Indicateur discret de sauvegarde automatique (debounce 2s)
```

---

## 16. 👤 Profil Utilisateur (Profile)

### Description fonctionnelle
Profil personnel avec sections dépliables : infos personnelles, sécurité (changement mot de passe, email), avatar.

### Interface graphique

```
│  ┌─ 👤 Personal Info ────────┐  │
│  │  [Avatar Image 🖼]        │  │  ← Avatar rond cliquable → AvatarPickerModal (grille de presets)
│  │  First Name: Romain       │  │
│  │  Last Name: Giovanni      │  │
│  │  Email: romain@cobbr.com  │  │
│  │  Role: Owner / Admin      │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🔒 Security ─────────────┐  │
│  │  [Change Password]        │  │  ← Formulaire : ancien mot de passe, nouveau, confirmation
│  │  [Change Email]           │  │     Validation en temps réel (force du mot de passe)
│  └────────────────────────────┘  │
```

---

## 17. 🏆 Gamification (Leaderboard, Badges, XP History)

### Description fonctionnelle
Système de gamification complet : niveaux, XP, rang (emoji + couleur), classement par période, badges à débloquer.

### Interface graphique — Leaderboard

```
│  [This Week] [This Month] [Year] │  ← Filtres période
│                                  │
│  🥇 #1  John D.    Lvl 15     │  ← Top 3 mis en avant (or, argent, bronze)
│        ⭐ Diamond   4,250 XP   │     Rang emoji, nom, niveau, XP total
│  🥈 #2  Sarah C.   Lvl 12     │
│        💎 Platinum  3,800 XP   │
│  🥉 #3  Mike T.    Lvl 10     │
│                                 │
│  ── Your rank ──               │
│  #7  You   Lvl 8  2,100 XP    │  ← Mise en avant du rang de l'utilisateur actuel
│                                 │
│  4.  Lisa M.    Lvl 9  2,900  │  ← Liste scrollable FlatList
│  5.  Tom B.     Lvl 8  2,500  │
│  ...                           │
```

---

## 18. 💬 Support (Inbox & Conversation)

### Description fonctionnelle
Messagerie de support intégrée avec catégories (aide, feedback, feature request, bug), statuts (open, answered, closed), et messages non-lus.

### Interface graphique — Inbox

```
│  ┌──────────────────────────────┐│
│  │ 🔵 Help                     ││  ← Catégorie : icône + couleur (bleu=help, vert=feedback, ambre=feature, rouge=bug)
│  │ Payment issue                ││     Sujet de la conversation
│  │ Status: 🟢 Answered  · 2h  ││     Statut + temps relatif
│  │ 🔴 2 unread                 ││     Badge messages non-lus
│  └──────────────────────────────┘│
│                                  │
│  [+ New Conversation]            │  ← FAB ou bouton pour créer une nouvelle conversation
```

### Interface graphique — Conversation

```
│  Subject: Payment issue         │
│                                 │
│  ┌── You · 14:30 ──────────┐  │  ← Bulle message (style chat) : expéditeur, heure
│  │ I can't find my payment  │  │     Background différent pour user / support
│  └──────────────────────────┘  │
│  ┌── Support · 14:45 ──────┐  │
│  │ Please check Settings... │  │
│  └──────────────────────────┘  │
│                                 │
│  [Type your message...] [Send]  │  ← Input + bouton envoi
```

---

## 19. ⚙️ Paramètres (Settings)

### Description fonctionnelle
Préférences de l'app organisées en sections : notifications, préférences, confidentialité, abonnement, gestion du compte.

### Interface graphique

```
│  ┌─ 🔔 Notifications ────────┐  │
│  │  Push notifications  [ON]  │  │  ← Chaque item : label, description, Switch toggle iOS-style
│  │  Email notifications [ON]  │  │
│  │  SMS notifications   [OFF] │  │
│  │  Task reminders      [ON]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🎨 Preferences ──────────┐  │
│  │  Dark Mode          [OFF]  │  │  ← Toggle dark mode (changement instantané)
│  │  Auto Sync          [ON]   │  │
│  │  Offline Mode       [OFF]  │  │
│  │  Sound              [ON]   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 🔒 Privacy ──────────────┐  │
│  │  Share Location     [ON]   │  │
│  │  Analytics          [OFF]  │  │
│  │  Biometric Auth     [ON]   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ 💳 Subscription ─────────┐  │
│  │  Current: Pro Plan         │  │  ← Lien vers SubscriptionScreen
│  │  [Manage Subscription →]  │  │
│  └────────────────────────────┘  │
│                                  │
│  [🗑 Delete Account]            │  ← Bouton destructif rouge avec double confirmation
```

---

## 20. 💎 Abonnement (Subscription)

### Description fonctionnelle
Gestion de l'abonnement avec comparatif de plans, paiement Stripe PaymentSheet intégré.

### Interface graphique

```
│  ── Plan actuel ──              │
│  ┌──────────────────────────────┐│
│  │ 🚀 Pro Plan                  ││  ← Card plan actuel : icône plan, nom, statut
│  │    Status: Active ✅         ││     Prix mensuel, date de renouvellement
│  │    $79/month                 ││
│  │    Renews: May 1, 2026      ││
│  └──────────────────────────────┘│
│                                  │
│  ── Tous les plans ──           │
│  ┌──────────┐ ┌──────────┐     │
│  │🌱 Free   │ │🚀 Pro    │     │  ← Cards plans en grille : icône, nom, prix, couleur unique
│  │  $0/mo   │ │ $79/mo   │     │     Plan actuel : bordure primaire + badge "Current"
│  │ 5 jobs   │ │ Unlimited│     │     Limites : nb jobs, nb staff, features
│  │ 2 staff  │ │ 20 staff │     │
│  │ [Free]   │ │[Current] │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │💎 Expert │ │🌟Unlimit.│     │
│  │ $179/mo  │ │  Custom  │     │
│  │ Unlimited│ │Everything│     │
│  │ Reports  │ │ Priority │     │
│  │[Upgrade] │ │[Contact] │     │     Boutons : Subscribe / Upgrade / Current / Contact
│  └──────────┘ └──────────┘     │
```

---

## 21. 🔐 Connexion & Inscription

### Description fonctionnelle
Écran de bienvenue avec connexion ou inscription. Inscription en tant que Business Owner avec vérification email.

### Interface graphique — Écran de connexion

```
┌──────────────────────────────────┐
│                          🌐     │  ← Bouton langue en haut à droite
│                                  │
│        [LOGO Cobbr carré]       │  ← Logo centré, grande taille
│                                  │
│     Welcome to Cobbr            │  ← Titre de bienvenue
│     Manage your moving          │     Sous-titre explicatif
│     business efficiently        │
│                                  │
│     [🔑 Login]                  │  ← Bouton primaire large
│     [📝 Register]               │  ← Bouton secondaire (outline)
│                                  │
│     [Forgot Password?]          │  ← Lien texte
└──────────────────────────────────┘
```

### Inscription Business Owner
Formulaire multi-champs : prénom, nom, email, mot de passe, nom d'entreprise, ABN (avec lookup auto), état australien. Validation en temps réel. Envoi de mail de vérification.

---

## 22. 🔔 Notifications Push & Panel

### Description fonctionnelle
Notifications push en temps réel + panneau de notifications in-app. Types : nouveau job assigné, job accepté/refusé, rappels, récap quotidien (07:00).

### Interface graphique — Panel (slide-in)

```
┌──────────────────────────────────┐
│  Notifications (5)    [Mark all]│  ← Header avec compteur + "Mark all as read"
│                                 │
│  🔵 New job assigned     2m ago│  ← Notification : icône type colorée, titre, temps relatif
│     Job #LM0001 from ABC Co.  │     Sous-texte contextuel
│                                 │
│  🟢 Job completed       1h ago│
│     Job #LM0002 finished      │
│                                 │
│  🟡 Payment received    3h ago│
│     $350 from Smith Family    │
│                                 │
│  📋 Daily Recap        7:00 AM│  ← Récap quotidien : nb jobs du jour, rappels
│     3 jobs scheduled today    │
│                                 │
│  [Clear All]                   │  ← Bouton effacer toutes les notifications
└──────────────────────────────────┘
```

L'animation est un **slide depuis la droite** de l'écran avec **backdrop semi-transparent** animé.

---

## Résumé des écrans pour les animations landing page

| # | Feature | Écran principal | Éléments visuels clés |
|---|---------|-----------------|----------------------|
| 1 | Accueil | Home | Profile header + gamification, jobs du jour, checklist onboarding, menu cards |
| 2 | Calendrier | Month → Day | Grille mensuelle avec dots colorés, vue jour avec JobBox cards |
| 3 | Détails Job | JobDetails | Timer live, stepper vertical, 5 onglets (Summary/Client/Job/Notes/Payment) |
| 4 | Création Job | CreateJobModal | Wizard 7 étapes, formulaire progressif, dots progression |
| 5 | Délégation | DelegateJobWizard | 3 modes, carnet relations, pricing config |
| 6 | Business Hub | BusinessHubOverview | Dashboard 4 stat cards, actions requises, raccourcis |
| 7 | Personnel | StaffCrewScreen | Liste filtrée, cards staff, modal ajout |
| 8 | Flotte | TrucksScreen | Filtres par type, cards véhicules, statuts colorés |
| 9 | Relations B2B | RelationsScreen | Code entreprise, carnet contacts, lookup |
| 10 | Paiements | StripePaymentsTab | Dashboard revenus, 2 états (setup/actif) |
| 11 | Facturation B2B | InterContractorBillingScreen | Tabs receivable/payable, cartes transfert |
| 12 | Factures | MonthlyInvoicesScreen | Wizard 4 étapes, liste avec filtres, détail branded |
| 13 | Templates | JobTemplatesPanel | Liste de templates, segment builder |
| 14 | Clauses | ContractsScreen | Cards avec conditions, toggle actif |
| 15 | Profil Entreprise | CompleteProfileScreen | Sections dépliables, ABN lookup, color picker |
| 16 | Profil User | Profile | Avatar, infos perso, sécurité |
| 17 | Gamification | Leaderboard | Top 3 podium, classement scrollable |
| 18 | Support | SupportInbox | Chat catégorisé, messages style bulle |
| 19 | Paramètres | Parameters | Toggles par section |
| 20 | Abonnement | SubscriptionScreen | Comparatif plans, Stripe PaymentSheet |
| 21 | Connexion | Connection | Logo, CTA login/register |
| 22 | Notifications | NotificationsPanel | Slide-in animé, liste typée |
