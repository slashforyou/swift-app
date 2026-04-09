# Business Hub — Stratégie de Refonte UX

> **Objectif** : Passer d'un hub "par modules techniques" à un hub "par priorités d'action".
> L'utilisateur doit voir directement ce dont il a besoin sans scroller ni comprendre toute l'administration.

---

## 1. Diagnostic : Pourquoi le hub actuel fait peur

### L'état actuel

- **8 onglets** au même niveau : Info, Staff, Trucks, Stripe, Partenaires, Modèles, Contrats, Facturation
- **Écran par défaut** : BusinessInfo (fiche profil = impression administrative, pas impression d'action)
- **Stripe** : 1854 lignes, mélange setup/diagnostic/exploitation/admin dans un seul écran
- **Tout est "principal"** → rien n'est priorisé → surcharge cognitive

### Le vrai problème
>
> Le contenu n'est pas le problème. C'est la **hiérarchie**.
> Trop de portes au même étage, alors que l'utilisateur a besoin d'un **centre de contrôle simple**.

### Ce qui est bien et qu'on garde

- Relations / multi-compagnies : flow clair
- Délégation : logique bien pensée  
- StaffCrew, Trucks : écrans fonctionnels
- Contrats, Templates : features utiles
- Stripe : riche et complet

---

## 2. Nouvelle architecture : 4 onglets

```
┌─────────┬─────────────┬──────────┬───────────┐
│   Hub   │  Ressources │  Réseau  │  Finances │
│  (def)  │             │          │           │
└─────────┴─────────────┴──────────┴───────────┘
```

### Pourquoi 4 et pas 3, 5 ou 8

| Nombre | Problème |
|--------|----------|
| 3 | Trop de sous-sections dans chaque tab, perd la navigation rapide |
| 5+ | Retombe dans le problème actuel : trop de choix au même niveau |
| **4** | **Idéal mobile** : chaque tab a ~40px, reste lisible, correspond aux 4 questions du patron |

Les 4 questions du patron :

1. **Hub** → "Qu'est-ce qui demande mon attention ?"
2. **Ressources** → "Mon équipe et mes véhicules sont prêts ?"
3. **Réseau** → "Mes partenaires et accords sont en ordre ?"
4. **Finances** → "L'argent rentre bien ?"

---

## 3. Détail de chaque onglet

### 3.1 — Hub (🏠 `home-outline`) — ÉCRAN PAR DÉFAUT

> Remplace BusinessInfo comme page d'entrée.
> C'est un **command center**, pas une fiche d'identité.

#### Bloc A : Actions requises (dynamique)

Affiché **seulement** quand il y a des actions. Disparaît quand tout est OK.

```
╔══════════════════════════════════════╗
║  ⚠️  3 actions à compléter          ║
╠══════════════════════════════════════╣
║  🔴 Terminer la config Stripe       ║
║  🟡 Ajouter un véhicule             ║
║  🟡 Inviter un membre d'équipe      ║
╚══════════════════════════════════════╝
```

**Logique de détection :**

| Action | Condition |
|--------|-----------|
| Terminer Stripe | `stripe_account_id` null OU `stripe_status !== 'active'` |
| Compléter le profil | Champs manquants dans company (address, phone, ABN...) |
| Ajouter un véhicule | `vehicles_count === 0` |
| Inviter un staff | `staff_count === 0` (et `role === 'patron'`) |
| Ajouter un partenaire | `partners_count === 0` |
| Créer un contrat | `contracts_count === 0` |

Chaque action = `TouchableOpacity` qui navigue vers l'écran concerné (dans le bon onglet).

#### Bloc B : État de la boîte (toujours visible)

Dashboard compact en grille 2×2.

```
┌──────────────────┬──────────────────┐
│  👥 3 staff      │  🚛 2 véhicules  │
│  actifs          │  enregistrés     │
├──────────────────┼──────────────────┤
│  🤝 5 partenaires│  💳 Stripe ✅    │
│  connectés       │  Actif           │
└──────────────────┴──────────────────┘
```

Chaque carte = tap → navigue vers l'onglet correspondant.

- Staff → onglet Ressources (sous-tab Staff)
- Véhicules → onglet Ressources (sous-tab Véhicules)
- Partenaires → onglet Réseau
- Stripe → onglet Finances

#### Bloc C : Raccourcis outils (toujours visible)

Grille horizontale scrollable de raccourcis vers les features occasionnelles.

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 🏢      │ │ 📋      │ │ 📄      │ │ 📊      │
│ Profil  │ │ Modèles │ │ Contrats│ │ Rapports│
│ société │ │ de job  │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- **Profil société** → ouvre BusinessInfoPage (en modal/push)
- **Modèles de job** → ouvre JobTemplatesPanel (en modal/push)
- **Contrats** → ouvre ContractsScreen (en modal/push)
- **Rapports** → ouvre ReportsScreen (en modal/push)

> **Principe** : Ces items sont utiles mais pas quotidiens. Ils méritent
> d'exister mais pas d'avoir leur propre onglet de premier niveau.

#### Bloc D : Infos entreprise (résumé)

Version **ultra-compacte** de BusinessInfo — juste le logo + nom + ville.
Tap → ouvre le profil complet.

```
┌─────────────────────────────────────┐
│  [Logo]  Cobbr Moving Co.          │
│          Sydney, NSW  ·  ABN ✅     │
│                         Modifier →  │
└─────────────────────────────────────┘
```

---

### 3.2 — Ressources (👥 `people`)

> Regroupe tout ce que le patron "gère physiquement" : les personnes et les véhicules.

#### Navigation interne : 2 sous-tabs légers

```
  ┌──────────────┬──────────────┐
  │   Équipe     │  Véhicules   │
  │  (actif)     │              │
  └──────────────┴──────────────┘
```

Sous-tab **Équipe** → `StaffCrewScreen` existant (849 lignes, inchangé)
Sous-tab **Véhicules** → `TrucksScreen` existant (881 lignes, inchangé)

#### Pourquoi regrouper Staff + Véhicules

- Ce sont les **ressources opérationnelles** du patron
- Ce sont les 2 choses qu'il vérifie le plus souvent ("qui travaille ? quels camions sont dispo ?")
- Ils partagent la même logique CRUD (ajouter, modifier, supprimer)
- Sur mobile, 2 sous-tabs = très léger et naturel

#### Pas de changement dans les écrans existants

Les composants `StaffCrewScreen` et `TrucksScreen` restent **identiques**.
On change uniquement leur point d'entrée (sous-tab au lieu d'onglet principal).

---

### 3.3 — Réseau (🤝 `people-circle-outline`)

> Tout ce qui touche aux **relations inter-entreprises** et aux **accords formels**.

#### Navigation interne : 2 sous-tabs

```
  ┌──────────────┬──────────────┐
  │  Partenaires │  Accords     │
  │  (actif)     │              │
  └──────────────┴──────────────┘
```

Sous-tab **Partenaires** → `RelationsScreen` existant (633 lignes, inchangé)
Sous-tab **Accords** → Vue combinée Contrats + Modèles

#### Pourquoi Réseau = Partenaires + Accords

Les contrats et modèles de job ne sont pas des features "standalone" dans la vie du patron.
Ce sont des **outils de formalisation des relations** :

- Un contrat est signé **avec** un partenaire ou un client
- Un modèle de job est souvent partagé ou réutilisé **entre** partenaires

Regrouper "Partenaires" et "Accords" crée un espace cohérent :
> "Avec qui je travaille, et sous quels termes."

#### Sous-tab Accords : vue combinée

```
╔══════════════════════════════════╗
║  📋 Modèles de job          (3) ║
║  ──────────────────────────────  ║
║  Standard Move  ·  Inter-state   ║
║  Piano Special                   ║
║                    + Nouveau  →  ║
╠══════════════════════════════════╣
║  📄 Clauses de contrat      (5) ║
║  ──────────────────────────────  ║
║  Assurance  ·  Délai  ·  Prix    ║
║  Annulation  ·  Responsabilité   ║
║                    + Nouvelle →  ║
╚══════════════════════════════════╝
```

Chaque item = tap pour éditer/voir le détail.

---

### 3.4 — Finances (💰 `wallet-outline`)

> Tout ce qui touche à l'argent : recevoir des paiements, facturer, suivre les flux.

#### Navigation interne : 2 sous-tabs

```
  ┌──────────────┬──────────────┐
  │  Paiements   │  Facturation │
  │  (actif)     │              │
  └──────────────┴──────────────┘
```

#### Sous-tab Paiements : StripeHub simplifié (2 états)

**ÉTAT A — Pas configuré** (Stripe non actif)

```
╔══════════════════════════════════════╗
║         💳                           ║
║                                      ║
║  Configurez vos paiements            ║
║                                      ║
║  Acceptez les paiements par carte    ║
║  et recevez vos fonds directement    ║
║  sur votre compte bancaire.          ║
║                                      ║
║  ┌────────────────────────────────┐  ║
║  │      Commencer la config       │  ║
║  └────────────────────────────────┘  ║
║                                      ║
║  Si vous avez des exigences :        ║
║  • ⚠️ Vérification d'identité       ║
║  • ⚠️ Compte bancaire               ║
╚══════════════════════════════════════╝
```

Un seul CTA principal. Les exigences manquantes en mini-liste en dessous.
Simplicité maximale.

**ÉTAT B — Configuré** (Stripe actif)

```
┌──────────────────────────────────────┐
│  Revenu total      Mois en cours     │
│  $12,450           $2,340            │
├──────────────────────────────────────┤
│  Solde en attente   Prochain virement│
│  $890               Mar 15           │
└──────────────────────────────────────┘

Actions rapides :
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Paiements │ │ Virements │ │ Réglages  │
│   reçus   │ │           │ │           │
└───────────┘ └───────────┘ └───────────┘
```

Les "Actions rapides" ouvrent les écrans existants en drill-down :

- Paiements reçus → `PaymentsListScreen` (push/modal)
- Virements → `PayoutsScreen` (push/modal)
- Réglages → `StripeSettingsScreen` (push/modal)

> **Principe clé** : Aujourd'hui StripeHub = 1854 lignes qui mélangent setup + monitoring + admin.
> On sépare en 2 états clairs. Les détails restent accessibles mais en drill-down.

#### Sous-tab Facturation : InterContractorBillingScreen

`InterContractorBillingScreen` existant (583 lignes, inchangé).

---

## 4. Plan de navigation complet

```
Business (4 onglets)
│
├── Hub (défaut) ─────────────────────────
│   ├── Actions requises (dynamique)
│   ├── État de la boîte (grille 2×2)
│   ├── Raccourcis outils (scroll horizontal)
│   │   ├── → Profil société (push BusinessInfoPage)
│   │   ├── → Modèles de job (push JobTemplatesPanel)
│   │   ├── → Contrats (push ContractsScreen) 
│   │   └── → Rapports (push ReportsScreen)
│   └── Résumé entreprise (mini-card)
│
├── Ressources ───────────────────────────
│   ├── [sous-tab] Équipe → StaffCrewScreen
│   └── [sous-tab] Véhicules → TrucksScreen
│
├── Réseau ───────────────────────────────
│   ├── [sous-tab] Partenaires → RelationsScreen
│   └── [sous-tab] Accords
│       ├── Modèles de job (liste + tap → JobTemplateEditor)
│       └── Clauses de contrat (liste + tap → ClauseEditorModal)
│
└── Finances ─────────────────────────────
    ├── [sous-tab] Paiements
    │   ├── État A: Setup wizard (1 CTA)
    │   └── État B: Dashboard + Actions rapides
    │       ├── → Paiements reçus (push PaymentsListScreen)
    │       ├── → Virements (push PayoutsScreen)
    │       └── → Réglages (push StripeSettingsScreen)
    └── [sous-tab] Facturation → InterContractorBillingScreen
```

---

## 5. Implémentation technique

### 5.1 Fichiers à modifier

| Fichier | Action | Complexité |
|---------|--------|------------|
| `BusinessTabMenu.tsx` | Refonte : 8 tabs → 4 tabs | Moyenne |
| `business.tsx` | Refonte : ajout sous-tabs + drill-down | Haute |
| **Nouveau** `BusinessHubOverview.tsx` | Écran Hub (command center) | Haute |
| **Nouveau** `BusinessSubTabMenu.tsx` | Composant sous-tabs (léger) | Faible |
| **Nouveau** `AgreementsScreen.tsx` | Vue combinée Templates + Contrats | Moyenne |
| **Nouveau** `StripePaymentsTab.tsx` | StripeHub simplifié (2 états) | Moyenne |
| Traductions (en.ts, fr.ts) | Nouveaux labels | Faible |

### 5.2 Fichiers inchangés (zéro modification)

| Fichier | Lignes | Raison |
|---------|--------|--------|
| `staffCrewScreen.tsx` | 849 | Rendu tel quel dans Ressources/Équipe |
| `trucksScreen.tsx` | 881 | Rendu tel quel dans Ressources/Véhicules |
| `RelationsScreen.tsx` | 633 | Rendu tel quel dans Réseau/Partenaires |
| `JobTemplatesPanel.tsx` | 314 | Accessible depuis Hub raccourci + Réseau/Accords |
| `ContractsScreen.tsx` | 380 | Accessible depuis Hub raccourci + Réseau/Accords |
| `InterContractorBillingScreen.tsx` | 583 | Rendu tel quel dans Finances/Facturation |
| `PaymentsListScreen.tsx` | 464 | Drill-down depuis Finances/Paiements |
| `PayoutsScreen.tsx` | 490 | Drill-down depuis Finances/Paiements |
| `StripeSettingsScreen.tsx` | 736 | Drill-down depuis Finances/Paiements |
| `BusinessInfoPage.tsx` | 429 | Drill-down depuis Hub/Profil société |
| `ReportsScreen.tsx` | 817 | Drill-down depuis Hub/Rapports |

### 5.3 Architecture des composants

```
business.tsx (container principal)
├── BusinessTabMenu (4 onglets en bas)
├── Si onglet = Hub
│   └── BusinessHubOverview
│       └── Push/Modal → BusinessInfoPage, JobTemplatesPanel, etc.
├── Si onglet = Ressources
│   ├── BusinessSubTabMenu (Équipe | Véhicules)
│   └── StaffCrewScreen | TrucksScreen
├── Si onglet = Réseau
│   ├── BusinessSubTabMenu (Partenaires | Accords)
│   └── RelationsScreen | AgreementsScreen
└── Si onglet = Finances
    ├── BusinessSubTabMenu (Paiements | Facturation)
    └── StripePaymentsTab | InterContractorBillingScreen
```

### 5.4 Gestion du state

```typescript
// État principal
const [activeTab, setActiveTab] = useState<'Hub' | 'Resources' | 'Network' | 'Finances'>('Hub');

// État des sous-tabs (un par onglet)
const [resourcesSubTab, setResourcesSubTab] = useState<'staff' | 'vehicles'>('staff');
const [networkSubTab, setNetworkSubTab] = useState<'partners' | 'agreements'>('partners');
const [financesSubTab, setFinancesSubTab] = useState<'payments' | 'billing'>('payments');

// État drill-down (pour les push/modals depuis le Hub)
const [drillDownScreen, setDrillDownScreen] = useState<string | null>(null);
```

### 5.5 Support de navigation externe

Les routes existantes qui naviguent vers Business doivent continuer à fonctionner :

```typescript
// Avant : navigation.navigate('Business', { initialTab: 'StaffCrew' })
// Après : mapping automatique
const TAB_MAPPING = {
  'BusinessInfo': { tab: 'Hub', drillDown: 'BusinessInfo' },
  'StaffCrew':    { tab: 'Resources', subTab: 'staff' },
  'Trucks':       { tab: 'Resources', subTab: 'vehicles' },
  'JobsBilling':  { tab: 'Finances', subTab: 'payments' },
  'Relations':    { tab: 'Network', subTab: 'partners' },
  'JobTemplates': { tab: 'Network', subTab: 'agreements' },
  'Contracts':    { tab: 'Network', subTab: 'agreements' },
  'Billing':      { tab: 'Finances', subTab: 'billing' },
};
```

---

## 6. Principes UX appliqués

### 6.1 Découverte progressive

L'utilisateur ne voit pas 100% du hub au premier regard :

- **D'abord** : ce qui demande une action (bloc Actions requises)
- **Ensuite** : l'état global de sa boîte (grille 2×2)
- **Enfin** : les outils avancés (raccourcis scrollables)

### 6.2 Organisation par fréquence d'usage

| Fréquence | Features | Placement |
|-----------|----------|-----------|
| **Quotidien** | Staff, Véhicules, Paiements | Onglets dédiés (Ressources, Finances) |
| **Hebdomadaire** | Partenaires, Facturation | Onglets dédiés (Réseau, Finances) |
| **Occasionnel** | Profil, Contrats, Modèles, Rapports | Raccourcis dans le Hub |

### 6.3 Langage métier (pas technique)

| Avant (technique) | Après (métier) |
|-------------------|----------------|
| Stripe | Paiements |
| BusinessInfo | Profil société |
| Relations | Partenaires |
| Trucks | Véhicules |
| JobsBilling | Facturation |
| StaffCrew | Équipe |

### 6.4 Simplification de Stripe (2 états nets)

Aujourd'hui StripeHub mélange 4 modes :

1. Setup (onboarding)
2. Diagnostic (exigences manquantes)  
3. Exploitation (revenus, paiements)
4. Admin (réglages, suppression)

Après :

- **État A** (pas configuré) = Setup uniquement, 1 CTA
- **État B** (configuré) = Dashboard + 3 raccourcis drill-down

Le reste vit dans les écrans existants accessibles en drill-down.

---

## 7. Ordre d'implémentation

### Phase 1 — Structure (estimé : majeur)

1. Créer `BusinessSubTabMenu.tsx` (composant réutilisable de sous-tabs)
2. Modifier `BusinessTabMenu.tsx` (4 tabs au lieu de 8)
3. Modifier `business.tsx` (nouveau state + routing interne)

### Phase 2 — Hub Overview (estimé : majeur)

4. Créer `BusinessHubOverview.tsx` (command center)
   - Bloc A : Actions requises (nécessite un hook `useBusinessAlerts`)
   - Bloc B : Grille stats (réutilise hooks existants)
   - Bloc C : Raccourcis outils
   - Bloc D : Mini-card entreprise

### Phase 3 — Écrans combinés (estimé : moyen)

5. Créer `AgreementsScreen.tsx` (combine Templates + Contrats en 1 vue)
2. Créer `StripePaymentsTab.tsx` (StripeHub simplifié, 2 états)

### Phase 4 — Polish

7. Ajouter traductions (en.ts, fr.ts minimum)
2. Tester tous les deep-links / navigations externes
3. Vérifier que `initialTab` mapping fonctionne

---

## 8. Résumé en une phrase

> On passe de **8 modules techniques au même niveau** à **4 zones métier hiérarchisées**,
> avec un **command center** comme porte d'entrée qui répond à la question :
> *"Qu'est-ce qui demande mon attention maintenant ?"*
