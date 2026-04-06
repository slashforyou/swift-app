# Plan d'implémentation — Modèles de job modulaires & calcul d'heures

> **Créé le :** 31 mars 2026
> **Complété le :** 31 mars 2026
> **Priorité :** 🟠 P1 — Nécessaire avant monétisation
> **Cible :** v1.2 (Mai 2026)
> **Scope :** Client (React Native) + Server (Node.js)
> **Statut :** ✅ **TERMINÉ**

---

## Objectif

Permettre la création de **modèles de job modulaires** composés de segments de temps typés, afin de :

1. Calculer précisément les **heures payées/non payées** par employé et par job
2. Assigner des employés à des **plages horaires spécifiques** (ex : un packer ne travaille que pendant le chargement)
3. Supporter 5 modes de facturation : **lieu-à-lieu**, **dépôt-à-dépôt**, **forfait**, **packing only**, **unpacking only**
4. Fournir un **récapitulatif post-job** détaillé (durée et coût par segment et par employé)

---

## Fondations existantes (ce qu'on réutilise)

| Brique | Fichier | Ce qu'on réutilise |
|---|---|---|
| 10 `StepType` (DEPARTURE, LOADING, TRANSIT, STORAGE…) | `src/constants/JobSteps.ts` | Mappent directement sur nos segments |
| 5 templates prédéfinis (SIMPLE_MOVE, MULTI_STOP…) | `src/constants/JobSteps.ts` | À convertir en templates modulaires |
| `hour_counting_type: "depot_to_depot" \| "site_only"` | `src/types/jobTransfer.ts` | Concept de mode de facturation existe |
| `depot_to_depot` boolean dans `CreateJobRequest` | `src/services/jobs.ts` | Flag déjà prévu |
| `stepTimes[]` dans le timer | `src/context/JobTimerProvider.tsx` | Temps par étape déjà tracké |
| Template service (CRUD) | `src/services/business/templatesService.ts` | Pattern API prêt |
| Job assignments | `src/services/jobAssignments.ts` | Assignation staff/véhicule |
| 2 timers UI sur le même context | `JobTimerDisplay.tsx` + `JobTimeSection.tsx` | Un seul Provider à enrichir |

---

## Architecture des segments

### Types de segments

| Type | Icône | Description | Exemples |
|---|---|---|---|
| `location` | 📍 | Présence et travail sur un lieu | Maison, appartement, garage, stockage privé, bureau |
| `travel` | 🚚 | Déplacement d'un lieu à un autre | Trajet A→B, départ dépôt, retour dépôt |
| `storage` | 📦 | Stockage de meubles/objets au dépôt | Mise en storage, récupération |
| `loading` | 🏗️ | Chargement/déchargement au dépôt | Chargement camion, déchargement |

### Types de lieux

`house` · `apartment` · `garage` · `private_storage` · `depot` · `office` · `other`

### Modes de facturation

| Mode | Début facturation | Fin facturation | Calcul du coût | Cas d'usage |
|---|---|---|---|---|
| **Lieu à lieu** (`location_to_location`) | Arrivée au 1er lieu | Départ du dernier lieu | Heures × taux horaire | Déménagement classique |
| **Dépôt à dépôt** (`depot_to_depot`) | Départ du dépôt | Retour au dépôt | Heures × taux horaire | Entreprise avec dépôt central |
| **Forfait** (`flat_rate`) | — | — | Montant fixe prédéfini | Devis accepté, prix négocié |
| **Packing only** (`packing_only`) | Arrivée au lieu de packing | Fin du packing sur ce lieu | Heures × taux horaire | Service d'emballage seul |
| **Unpacking only** (`unpacking_only`) | Arrivée au lieu d'unpacking | Fin de l'unpacking sur ce lieu | Heures × taux horaire | Service de déballage seul |

Pour le mode **dépôt-à-dépôt**, le temps de retour est **configurable** par le patron lors du paiement final (ex : le client paie 30 min de retour même si le trajet réel fait 45 min).

Pour le mode **forfait** :

- Le montant total est fixé à l'avance (ex : $2500 pour le déménagement complet)
- Les heures sont **quand même trackées** (pour analyse interne et rentabilité)
- Peut inclure une **limite de temps** (ex : $2500 si ≤ 8h, au-delà le surplus est facturé en heures)
- Peut inclure des **options ajoutables** sur la page de paiement (ex : piano +$200, démontage lit +$80)

Pour les modes **packing/unpacking only** :

- Seuls les segments de type `location` (travail sur site) sont facturables
- Les trajets et chargements/déchargements ne sont **pas comptés**
- Le timer ne tourne que pendant les segments 📍 Lieu

### Exemple : template "Déménagement classique" (lieu-à-lieu)

```
Trajet Dépot ver Lieu N°1 (maison)  ── non facturable──▶
📍 Lieu N°1 (maison)  ──facturable──▶
🚚 Trajet → Lieu N°2  ──facturable──▶
📍 Lieu N°2 (appart)  ──facturable──▶
Trajet Retour vers dépôt  ── non facturable──▶
                                      FIN
```

### Exemple : template "Dépôt-à-dépôt"

```
🚚 Départ dépôt        ──facturable──▶
📍 Lieu N°1 (maison)   ──facturable──▶
🚚 Trajet → Lieu N°2   ──facturable──▶
📍 Lieu N°2 (appart)   ──facturable──▶
🚚 Retour dépôt (cfg)  ──facturable──▶
                                       FIN
```

### Exemple : template "Forfait 8h" (flat_rate)

```
📍 Lieu N°1 (maison)  ── heures trackées mais non facturées ──▶
🚚 Trajet → Lieu N°2  ── heures trackées mais non facturées ──▶
📍 Lieu N°2 (appart)  ── heures trackées mais non facturées ──▶
                                      FIN
Coût = $2,500 forfait (si ≤ 8h)
     + surplus horaire si > 8h
     + options choisies (piano $200, démontage $80...)
```

### Exemple : template "Packing only" (packing_only)

```
🚚 Trajet → Lieu N°1  ── non facturable ──▶
📍 Lieu N°1 (maison)  ── facturable ────▶  ← seul segment compté
🚚 Trajet retour      ── non facturable ──▶
                                      FIN
```

### Exemple : assignation par segment

```
Job: Déménagement avec packing

📍 Lieu N°1 (maison)     → Tom (driver) + Sam (offsider) + Alex (packer)
🚚 Trajet → Lieu N°2     → Tom (driver) + Sam (offsider)         [Alex parti]
📍 Lieu N°2 (appart)     → Tom (driver) + Sam (offsider)

Résultat :
  Tom  → 5h45 travaillées → $562.50
  Sam  → 5h45 travaillées → $450.00
  Alex → 2h43 travaillées → $163.80  (1 segment seulement)
```

---

## Phase 1 — Types TypeScript (fondation)

### 1.1 — Créer `src/types/jobSegment.ts`

```typescript
// Types de segments de temps
export type SegmentType = 'location' | 'travel' | 'storage' | 'loading';

// Types de lieux
export type LocationType =
  | 'house' | 'apartment' | 'garage'
  | 'private_storage' | 'depot' | 'office' | 'other';

// Mode de facturation du template
export type BillingMode =
  | 'location_to_location'   // Heures facturées du 1er lieu au dernier lieu
  | 'depot_to_depot'          // Heures facturées du départ dépôt au retour dépôt
  | 'flat_rate'               // Montant forfaitaire fixe (heures trackées pour analyse)
  | 'packing_only'            // Seuls les segments location (packing) sont facturés
  | 'unpacking_only';         // Seuls les segments location (unpacking) sont facturés

// Un segment dans un template (définition réutilisable)
export interface JobSegmentTemplate {
  id: string;
  order: number;
  type: SegmentType;
  label: string;                    // "Lieu N°1", "Trajet A→B"
  locationType?: LocationType;      // Pour 'location', 'storage', 'loading'
  isBillable: boolean;
  estimatedDurationMinutes?: number;
  requiredRoles?: string[];         // ["driver", "packer", "offsider"]
}

// Instance runtime d'un segment (pendant/après le job)
export interface JobSegmentInstance {
  id: string;
  templateSegmentId: string;
  order: number;
  type: SegmentType;
  label: string;
  locationType?: LocationType;
  isBillable: boolean;

  // Timing réel
  startedAt?: string;               // ISO timestamp
  completedAt?: string;
  durationMs?: number;

  // Employés assignés
  assignedEmployees: SegmentEmployeeAssignment[];

  // Pour les trajets retour configurables
  isReturnTrip?: boolean;
  configuredDurationMinutes?: number;
}

// Assignation employé ↔ segment
export interface SegmentEmployeeAssignment {
  employeeId: string;
  employeeName: string;
  role: string;                     // 'driver' | 'packer' | 'offsider' | 'mover'
  workedDurationMs?: number;
  hourlyRate?: number;
  cost?: number;
}

// Option ajoutable au forfait (page paiement)
export interface FlatRateOption {
  id: string;
  label: string;                    // "Piano", "Démontage lit", "Emballage fragile"
  price: number;                    // Montant fixe en AUD
  isSelected?: boolean;             // Choisi par le patron au paiement
}

// Template de job modulaire complet
export interface ModularJobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  billingMode: BillingMode;
  segments: JobSegmentTemplate[];

  // Config facturation — modes horaires
  defaultHourlyRate?: number;
  minimumHours?: number;
  timeRoundingMinutes?: number;     // 1, 15, 30, 60
  returnTripDefaultMinutes?: number;

  // Config facturation — mode forfait (flat_rate)
  flatRateAmount?: number;          // Montant fixe du forfait
  flatRateMaxHours?: number;        // Limite horaire incluse (ex: 8h)
  flatRateOverageRate?: number;     // Taux horaire si dépassement
  flatRateOptions?: FlatRateOption[]; // Options ajoutables au paiement

  // Méta
  isDefault?: boolean;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

// Récapitulatif post-job
export interface JobTimeBreakdown {
  jobId: string;
  billingMode: BillingMode;
  totalDurationMs: number;
  billableDurationMs: number;
  nonBillableDurationMs: number;

  segments: JobSegmentBreakdown[];
  employees: EmployeeJobBreakdown[];

  // Coût horaire (modes location_to_location, depot_to_depot, packing, unpacking)
  hourlyCost: number;

  // Forfait (mode flat_rate)
  flatRateAmount?: number;          // Montant de base du forfait
  flatRateMaxHours?: number;        // Limite horaire incluse
  flatRateOverageHours?: number;    // Heures en dépassement
  flatRateOverageCost?: number;     // Coût du dépassement
  selectedOptions?: FlatRateOption[]; // Options choisies
  optionsTotalCost?: number;        // Total des options

  totalCost: number;                // hourlyCost OU flatRate + overage + options
}

export interface JobSegmentBreakdown {
  segmentId: string;
  label: string;
  type: SegmentType;
  durationMs: number;
  isBillable: boolean;
  employees: SegmentEmployeeAssignment[];
  segmentCost: number;
}

export interface EmployeeJobBreakdown {
  employeeId: string;
  employeeName: string;
  role: string;
  totalWorkedMs: number;
  billableWorkedMs: number;
  hourlyRate: number;
  totalCost: number;
  segments: { segmentLabel: string; durationMs: number; cost: number }[];
}
```

### 1.2 — Mapping StepType ↔ SegmentType

**Fichier :** `src/constants/JobSteps.ts` — ajouter :

```typescript
import { SegmentType } from '../types/jobSegment';

export const STEP_TO_SEGMENT_MAP: Record<StepType, SegmentType> = {
  DEPARTURE: 'travel',
  FIRST_ADDRESS: 'location',
  LAST_ADDRESS: 'location',
  INTERMEDIATE_ADDRESS: 'location',
  TRANSIT: 'travel',
  LOADING: 'loading',
  UNLOADING: 'loading',
  STORAGE: 'storage',
  RETURN_TO_DEPOT: 'travel',
  COMPLETION: 'location',
};
```

### 1.3 — Étendre `CreateJobRequest`

**Fichier :** `src/services/jobs.ts` — ajouter à l'interface :

```typescript
  template_id?: string;
  segments?: JobSegmentInstance[];
  billing_mode?: BillingMode;
  return_trip_minutes?: number;
```

---

## Phase 2 — Service & logique métier

### 2.1 — Créer `src/services/jobSegmentService.ts`

Fonctions principales :

```typescript
// Créer les segments par défaut depuis un template
createSegmentsFromTemplate(template: ModularJobTemplate): JobSegmentInstance[]

// Appliquer le mode de facturation (marque isBillable)
applyBillingMode(
  segments: JobSegmentInstance[],
  billingMode: BillingMode,
  returnTripMinutes?: number
): JobSegmentInstance[]
// - location_to_location : billable du 1er 'location' au dernier 'location'
//   (trajets entre lieux = billable, départ/retour dépôt = non billable)
// - depot_to_depot : tout billable de DEPARTURE à RETURN_TO_DEPOT
//   (retour = configuredDurationMinutes si fourni)
// - flat_rate : tout est tracké mais rien n'est marqué billable
//   (le coût est le forfait + options + éventuel surplus horaire)
// - packing_only : seuls les segments type 'location' sont billable
//   (trajets, chargement, stockage = non billable)
// - unpacking_only : idem packing_only

// Calculer le coût forfaitaire (mode flat_rate)
calculateFlatRateCost(
  totalTrackedMs: number,
  flatRateAmount: number,
  maxHours?: number,
  overageRate?: number,
  selectedOptions?: FlatRateOption[]
): { baseCost: number; overageHours: number; overageCost: number; optionsCost: number; total: number }
// Si maxHours défini et temps > maxHours : surplus = (temps - maxHours) × overageRate
// + somme des options sélectionnées

// Calculer le coût d'un segment
calculateSegmentCost(
  segment: JobSegmentInstance,
  employees: SegmentEmployeeAssignment[]
): number

// Récapitulatif complet post-job
calculateJobBreakdown(
  jobId: string,
  segments: JobSegmentInstance[],
  billingMode: BillingMode
): JobTimeBreakdown
// Retourne : totalDuration, billableDuration, perSegment[], perEmployee[], totalCost
```

### 2.2 — Étendre `src/services/business/templatesService.ts`

Nouvelles fonctions pour les templates modulaires :

```typescript
fetchModularTemplates(): Promise<ModularJobTemplate[]>
createModularTemplate(data: Omit<ModularJobTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModularJobTemplate>
updateModularTemplate(id: string, data: Partial<ModularJobTemplate>): Promise<ModularJobTemplate>
deleteModularTemplate(id: string): Promise<void>
getDefaultTemplates(): ModularJobTemplate[]   // 5 templates existants convertis
```

---

## Phase 3 — Timer enrichi (segments)

### Architecture actuelle des timers

```
JobTimerProvider (context partagé)
    │
    ├── JobTimerDisplay.tsx  (onglet Summary — timer complet avec workflow)
    │   └── Stepper visuel, Play/Pause/Stop, Next Step, pause modale, signature/paiement
    │
    └── JobTimeSection.tsx   (onglet Job — timer compact collapsible)
        └── Timer replié/déplié, Play/Pause simple, temps facturable
```

Les deux consomment le même `JobTimerProvider`. Le hook `useJobTimer` gère :

- `stepTimes[]` — temps par étape existant
- `totalElapsed`, `billableTime`, `isRunning`, `isOnBreak`
- `startTimer()`, `togglePause()`, `advanceStep()`, `nextStep()`, `stopTimer()`

### 3.1 — Enrichir `JobTimerProvider`

**Fichier :** `src/context/JobTimerProvider.tsx`

Nouvelles données exposées :

```typescript
// Ajouts au context value
segments: JobSegmentInstance[];
currentSegment: JobSegmentInstance | null;
segmentTimes: Record<string, number>;     // segmentId → elapsed ms

// Nouvelles actions
startSegment: (segmentId: string) => void;
completeSegment: (segmentId: string) => void;
setReturnTripDuration: (minutes: number) => void;
```

**Logique :** Quand `advanceStep()` est appelé, on vérifie quel segment est impacté via le mapping ordre → segment. Les `stepTimes[]` existantes restent fonctionnelles — on ajoute `segmentTimes` comme couche au-dessus.

**Compatibilité :** Les jobs existants (sans segments) continuent de fonctionner avec le timer actuel. Les segments ne s'activent que si `segments[]` est fourni au Provider.

### 3.2 — Adapter `JobTimerDisplay.tsx` (onglet Summary)

**Fichier :** `src/components/jobDetails/JobTimerDisplay.tsx` (~1000 lignes)

Changements :

- Le stepper visuel (cercles numérotés) devient une **timeline de segments** (icônes typées 📍🚚📦🏗️)
- Chaque segment affiche son label + type de lieu
- Le bouton **"Étape suivante"** passe au **segment suivant**
- Affichage des **employés actifs** sur le segment courant
- Garde le fonctionnement actuel si pas de segments (rétrocompatible)

### 3.3 — Adapter `JobTimeSection.tsx` (onglet Job)

**Fichier :** `src/components/jobDetails/sections/JobTimeSection.tsx`

Changements :

- **Mode collapsed :** afficher le segment courant (icône + label)
- **Mode expanded :** mini-récap des segments terminés avec leur durée
- Play/Pause reste identique

---

## Phase 4 — UI client

### 4.1 — Écran de création de template modulaire

**Nouveau fichier :** `src/screens/business/JobTemplateEditor.tsx`

```
┌──────────────────────────────────────────┐
│  ✏️ Nouveau modèle de job               │
├──────────────────────────────────────────┤
│                                          │
│  Nom : [Déménagement classique      ]    │
│  Catégorie : [Résidentiel           ▼]   │
│                                          │
│  ─── Mode de facturation ───             │
│  ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │📍 Lieu    │ │🏭 Dépôt   │ │💰Forfait│ │
│  │  à lieu   │ │  à dépôt  │ │         │ │
│  │  ✓ choisi │ │           │ │         │ │
│  └───────────┘ └───────────┘ └─────────┘ │
│  ┌───────────┐ ┌───────────┐             │
│  │📦 Packing │ │📦Unpacking│             │
│  │  only     │ │  only     │             │
│  └───────────┘ └───────────┘             │
│                                          │
│  ─── Segments ───                        │
│  ┌──────────────────────────────────┐    │
│  │ 📍 1. Lieu N°1 (maison)    [≡ ✕]│    │
│  │ 🚚 2. Trajet               [≡ ✕]│    │
│  │ 📍 3. Lieu N°2 (appart)    [≡ ✕]│    │
│  └──────────────────────────────────┘    │
│  [+ Ajouter un segment]                 │
│                                          │
│  ─── Facturation ───                     │
│                                          │
│  [Si horaire]                            │
│  Taux horaire : [$120/h          ]       │
│  Heures minimum : [2h             ]      │
│  Arrondi : [15 min              ▼]       │
│  Retour par défaut : [30 min     ]       │
│                                          │
│  [Si forfait]                            │
│  Montant fixe : [$2,500          ]       │
│  Limite horaire : [8h             ]      │
│  Taux si dépassement : [$150/h   ]       │
│  ─── Options ajoutables ───              │
│  ┌──────────────────────────────────┐    │
│  │ 🎹 Piano              $200 [✕]  │    │
│  │ 🛏️ Démontage lit       $80  [✕] │    │
│  │ 📦 Emballage fragile   $120 [✕] │    │
│  └──────────────────────────────────┘    │
│  [+ Ajouter une option]                 │
│                                          │
│  [💾 Sauvegarder le modèle]             │
└──────────────────────────────────────────┘
```

- **Segments réordonnables** (drag & drop ou boutons ↑↓)
- **Bouton "+ Ajouter un segment"** → modal choix type (📍🚚📦🏗️) + sous-type de lieu
- **Chaque segment** : label éditable, type de lieu (si applicable), rôles requis (multi-select)
- **Swipe to delete** sur chaque segment

### 4.2 — Assignation employés par segment

**Modifier :** zone de staffing dans les écrans job details

Après l'assignation classique des employés au job, nouveau sous-écran accessible :

```
┌──────────────────────────────────────────┐
│  👥 Assignation par segment              │
├──────────────────────────────────────────┤
│                                          │
│  📍 Lieu N°1 (maison)                   │
│  Rôles requis : driver, packer, offsider │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │✅ Tom  │ │✅ Sam  │ │✅ Alex │       │
│  │ driver │ │offsider│ │ packer │       │
│  └────────┘ └────────┘ └────────┘       │
│                                          │
│  🚚 Trajet → Lieu N°2                   │
│  Rôles requis : driver, offsider         │
│  ┌────────┐ ┌────────┐                  │
│  │✅ Tom  │ │✅ Sam  │                  │
│  │ driver │ │offsider│                  │
│  └────────┘ └────────┘                  │
│                                          │
│  📍 Lieu N°2 (appart)                   │
│  Rôles requis : driver, offsider         │
│  ┌────────┐ ┌────────┐                  │
│  │✅ Tom  │ │✅ Sam  │                  │
│  │ driver │ │offsider│                  │
│  └────────┘ └────────┘                  │
│                                          │
│  [Confirmer les assignations]            │
└──────────────────────────────────────────┘
```

### 4.3 — Timer enrichi pendant l'exécution

Déjà décrit en Phase 3.2 et 3.3. Les deux timers existants sont adaptés.

### 4.4 — Écran récapitulatif post-job

**Nouveau fichier :** `src/screens/job/JobTimeBreakdown.tsx`

Accessible depuis le job complété (bouton "Voir le détail des heures").

```
┌──────────────────────────────────────────┐
│  📊 Récapitulatif — JOB-2026-042        │
├──────────────────────────────────────────┤
│                                          │
│  Mode: Dépôt-à-dépôt                    │
│  Total: 6h12    Facturable: 5h45        │
│                                          │
│  ──── Timeline des segments ────         │
│                                          │
│  🚚 Départ dépôt      08:00 → 08:32     │
│     ├ Tom (driver)     0h32  → $48.00    │
│     └ Sam (offsider)   0h32  → $38.40    │
│                                          │
│  📍 Lieu N°1 (maison)  08:32 → 11:15     │
│     ├ Tom (driver)     2h43  → $244.50   │
│     ├ Sam (offsider)   2h43  → $195.60   │
│     └ Alex (packer)    2h43  → $163.80   │
│                                          │
│  🚚 Trajet → Lieu N°2  11:15 → 11:52    │
│     ├ Tom (driver)     0h37  → $55.50    │
│     └ Sam (offsider)   0h37  → $44.40    │
│                                          │
│  📍 Lieu N°2 (appart)  11:52 → 13:45     │
│     ├ Tom (driver)     1h53  → $169.50   │
│     └ Sam (offsider)   1h53  → $135.60   │
│                                          │
│  🚚 Retour dépôt       13:45 → 14:12    │
│     (configuré: 30min)                   │
│     ├ Tom (driver)     0h30  → $45.00    │
│     └ Sam (offsider)   0h30  → $36.00    │
│                                          │
│  ──── Coût par employé ────              │
│                                          │
│  👤 Tom (driver)     5h45   $562.50      │
│  👤 Sam (offsider)   5h45   $450.00      │
│  👤 Alex (packer)    2h43   $163.80      │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  TOTAL                  $1,176.30        │
│                                          │
│  [✏️ Modifier temps de retour]           │
│  [💳 Valider et payer]                   │
└──────────────────────────────────────────┘
```

#### Variante forfait du récapitulatif

```
┌──────────────────────────────────────────┐
│  📊 Récapitulatif — JOB-2026-055        │
├──────────────────────────────────────────┤
│                                          │
│  Mode: Forfait                           │
│  Forfait de base : $2,500 (≤ 8h)        │
│  Temps réel : 9h15                       │
│                                          │
│  ──── Timeline des segments ────         │
│  (identique — heures affichées)          │
│                                          │
│  ──── Détail forfait ────                │
│                                          │
│  💰 Forfait de base         $2,500.00   │
│  ⏱️ Dépassement : 1h15                   │
│     × $150/h              →  $187.50    │
│                                          │
│  ──── Options sélectionnées ────         │
│  🎹 Piano                     $200.00   │
│  🛏️ Démontage lit              $80.00    │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  TOTAL                    $2,967.50      │
│                                          │
│  [✏️ Modifier les options]               │
│  [💳 Valider et payer]                   │
└──────────────────────────────────────────┘
```

---

## Phase 5 — Backend (serveur Node.js)

### 5.1 — Migrations SQL

6 nouvelles tables :

```sql
-- 1. Templates modulaires
CREATE TABLE job_templates_modular (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  billing_mode ENUM('location_to_location', 'depot_to_depot',
                    'flat_rate', 'packing_only', 'unpacking_only')
    DEFAULT 'location_to_location',
  default_hourly_rate DECIMAL(10,2),
  minimum_hours DECIMAL(4,2),
  time_rounding_minutes INT DEFAULT 15,
  return_trip_default_minutes INT,
  -- Champs forfait (flat_rate)
  flat_rate_amount DECIMAL(10,2),           -- Montant fixe
  flat_rate_max_hours DECIMAL(4,2),         -- Limite horaire incluse
  flat_rate_overage_rate DECIMAL(10,2),     -- Taux horaire si dépassement
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 2. Segments d'un template
CREATE TABLE job_template_segments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  segment_order INT NOT NULL,
  type ENUM('location', 'travel', 'storage', 'loading') NOT NULL,
  label VARCHAR(100),
  location_type ENUM('house','apartment','garage','private_storage',
                     'depot','office','other'),
  is_billable BOOLEAN DEFAULT TRUE,
  estimated_duration_minutes INT,
  required_roles JSON,               -- ["driver", "packer"]
  FOREIGN KEY (template_id) REFERENCES job_templates_modular(id)
    ON DELETE CASCADE
);

-- 2b. Options forfaitaires d'un template
CREATE TABLE job_template_flat_rate_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  label VARCHAR(100) NOT NULL,           -- "Piano", "Démontage lit"
  price DECIMAL(10,2) NOT NULL,
  display_order INT DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES job_templates_modular(id)
    ON DELETE CASCADE
);

-- 3. Instances de segments (liées à un job réel)
CREATE TABLE job_segment_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  template_segment_id INT,
  segment_order INT NOT NULL,
  type ENUM('location', 'travel', 'storage', 'loading') NOT NULL,
  label VARCHAR(100),
  location_type ENUM('house','apartment','garage','private_storage',
                     'depot','office','other'),
  is_billable BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  duration_ms BIGINT,
  is_return_trip BOOLEAN DEFAULT FALSE,
  configured_duration_minutes INT,   -- Durée manuelle (retour configurable)
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 3b. Options forfaitaires sélectionnées pour un job
CREATE TABLE job_selected_flat_rate_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  option_label VARCHAR(100) NOT NULL,
  option_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 4. Assignation employé ↔ segment
CREATE TABLE segment_employee_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  segment_instance_id INT NOT NULL,
  employee_id INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  worked_duration_ms BIGINT,
  hourly_rate DECIMAL(10,2),
  cost DECIMAL(10,2),
  FOREIGN KEY (segment_instance_id)
    REFERENCES job_segment_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id)
);
```

**Index recommandés :**

```sql
CREATE INDEX idx_segments_job ON job_segment_instances(job_id);
CREATE INDEX idx_assignments_segment ON segment_employee_assignments(segment_instance_id);
CREATE INDEX idx_templates_company ON job_templates_modular(company_id);
```

### 5.2 — Nouveaux endpoints

| Endpoint | Méthode | Rôle | Auth |
|---|---|---|---|
| `/v1/templates/modular` | GET | Lister les templates de la company | owner |
| `/v1/templates/modular` | POST | Créer un template | owner |
| `/v1/templates/modular/:id` | GET | Détail d'un template | owner |
| `/v1/templates/modular/:id` | PUT | Modifier un template | owner |
| `/v1/templates/modular/:id` | DELETE | Supprimer un template | owner |
| `/v1/jobs/:id/segments` | GET | Récupérer les segments d'un job | owner, assigned |
| `/v1/jobs/:id/segments` | POST | Initialiser segments (depuis template) | owner |
| `/v1/jobs/:id/segments/:segId/start` | POST | Démarrer un segment | owner, assigned |
| `/v1/jobs/:id/segments/:segId/complete` | POST | Terminer un segment | owner, assigned |
| `/v1/jobs/:id/segments/:segId/employees` | POST | Assigner employés à un segment | owner |
| `/v1/jobs/:id/segments/:segId/employees` | PUT | Modifier assignations | owner |
| `/v1/jobs/:id/time-breakdown` | GET | **Récapitulatif complet** | owner |
| `/v1/jobs/:id/return-trip` | PATCH | Modifier durée du retour | owner |
| `/v1/jobs/:id/flat-rate-options` | GET | Options dispo pour ce job (forfait) | owner |
| `/v1/jobs/:id/flat-rate-options` | PUT | Sélectionner/désélectionner options | owner |

### 5.3 — Endpoint clé : `GET /v1/jobs/:id/time-breakdown`

Réponse attendue :

```json
{
  "success": true,
  "breakdown": {
    "jobId": "123",
    "billingMode": "depot_to_depot",
    "totalDurationMs": 22320000,
    "billableDurationMs": 20700000,
    "nonBillableDurationMs": 1620000,
    "segments": [
      {
        "segmentId": "seg-1",
        "label": "Départ dépôt",
        "type": "travel",
        "startedAt": "2026-04-15T08:00:00Z",
        "completedAt": "2026-04-15T08:32:00Z",
        "durationMs": 1920000,
        "isBillable": true,
        "employees": [
          { "employeeId": "1", "employeeName": "Tom", "role": "driver",
            "workedDurationMs": 1920000, "hourlyRate": 90, "cost": 48.00 },
          { "employeeId": "2", "employeeName": "Sam", "role": "offsider",
            "workedDurationMs": 1920000, "hourlyRate": 72, "cost": 38.40 }
        ],
        "segmentCost": 86.40
      }
    ],
    "employees": [
      { "employeeId": "1", "employeeName": "Tom", "role": "driver",
        "totalWorkedMs": 20700000, "billableWorkedMs": 20700000,
        "hourlyRate": 90, "totalCost": 562.50,
        "segments": [
          { "segmentLabel": "Départ dépôt", "durationMs": 1920000, "cost": 48.00 },
          { "segmentLabel": "Lieu N°1", "durationMs": 9780000, "cost": 244.50 }
        ]
      }
    ],
    "totalCost": 1176.30
  }
}
```

---

## Phase 6 — Conversion des templates existants

Les 5 templates dans `JobSteps.ts` (`JOB_TEMPLATES`) sont convertis en `ModularJobTemplate` :

| Template existant | Segments modulaires | Mode |
|---|---|---|
| **SIMPLE_MOVE** | 📍 Lieu 1 → 🚚 Trajet → 📍 Lieu 2 | lieu-à-lieu |
| **MULTI_STOP** | 📍 Lieu 1 → 🚚 Trajet → 📍 Lieu 2 → 🚚 Trajet → 📍 Lieu 3 | lieu-à-lieu |
| **WITH_STORAGE** | 📍 Lieu 1 → 🚚 Trajet → 📦 Storage → 🚚 Trajet → 📍 Lieu 2 | lieu-à-lieu |
| **CONTAINER_MOVE** | 🏗️ Chargement → 🚚 Trajet → 📍 Lieu 1 | dépôt-à-dépôt |
| **DELIVERY_ONLY** | 🏗️ Chargement → 🚚 Trajet → 📍 Lieu 1 | dépôt-à-dépôt |
| **PACKING_ONLY** *(nouveau)* | 🚚 Trajet → 📍 Lieu 1 (packing) | packing_only |
| **UNPACKING_ONLY** *(nouveau)* | 🚚 Trajet → 📍 Lieu 1 (unpacking) | unpacking_only |
| **FORFAIT_STANDARD** *(nouveau)* | 📍 Lieu 1 → 🚚 Trajet → 📍 Lieu 2 | flat_rate ($2500, ≤8h) |

---

## Ordre d'exécution

| # | Tâche | Dépend de | Effort | Côté | Statut |
|---|---|---|---|---|---|
| **1** | Types TypeScript (`jobSegment.ts`) | — | S | Client | ✅ Done |
| **2** | Mapping StepType ↔ SegmentType | 1 | S | Client | ✅ Done |
| **3** | Étendre `CreateJobRequest` | 1 | S | Client | ✅ Done |
| **4** | Migrations SQL (6 tables + 6 cols + 6 index) | — | M | Server | ✅ Done |
| **5** | Endpoints CRUD templates modulaires | 4 | M | Server | ✅ Done + testé |
| **6** | Service `jobSegmentService.ts` (calculs) | 1 | M | Client | ✅ Done |
| **7** | Endpoints segments d'un job | 4, 6 | L | Server | ✅ Done + testé |
| **8** | Endpoint `time-breakdown` | 7 | M | Server | ✅ Done + testé |
| **9** | Écran `JobTemplateEditor.tsx` | 1, 5 | L | Client | ✅ Done |
| **10** | Enrichir `JobTimerProvider` + `useJobTimer` | 1, 6 | M | Client | ✅ Done |
| **11** | Adapter `JobTimerDisplay.tsx` (Summary) | 10 | M | Client | ✅ Done |
| **12** | Adapter `JobTimeSection.tsx` (Job details) | 10 | S | Client | ✅ Done |
| **13** | Assignation employés par segment (UI) | 7 | M | Client | ✅ Done |
| **14** | Écran `JobTimeBreakdownScreen.tsx` (récap) | 6, 8 | L | Client | ✅ Done |
| **15** | Service API segments (`jobSegmentApiService.ts`) | 7 | M | Client | ✅ Done |
| **16** | Câbler `JobTimerProvider` → API backend | 15 | S | Client | ✅ Done |
| **17** | Câbler `JobTimeBreakdownScreen` → API backend | 15 | S | Client | ✅ Done |
| **18** | Convertir les 5+3 templates (migration 014) | 5 | S | Server | ✅ Done |
| **19** | Navigation + intégration globale | 9-14 | M | Client | ✅ Done |

**Légende :** S = petit (~1-2h) · M = moyen (~3-5h) · L = gros (~1 jour+)

> **🎉 IMPLÉMENTATION TERMINÉE — 31 mars 2026**
> Toutes les 19 tâches sont complètes. Feature full-stack opérationnelle.

### Groupement par sprint (complété)

**Sprint 1 — Fondation (Client)** : tâches 1, 2, 3, 6 ✅
**Sprint 2 — Backend** : tâches 4, 5, 7, 8 ✅
**Sprint 3 — UI Templates** : tâches 9, 18 ✅
**Sprint 4 — Timer** : tâches 10, 11, 12 ✅
**Sprint 5 — Assignation & Récap** : tâches 13, 14, 15, 16, 17, 19 ✅

---

## Rétrocompatibilité

- **Jobs existants** (sans segments) continuent de fonctionner avec le timer actuel
- Le `JobTimerProvider` détecte si `segments[]` est fourni → mode classique ou mode segments
- Les `stepTimes[]` existantes restent fonctionnelles
- Les 5 `JOB_TEMPLATES` dans `JobSteps.ts` restent en place (fallback)
- L'ancien flag `depot_to_depot` dans `CreateJobRequest` reste supporté

---

## Fichiers impactés (récapitulatif)

### Nouveaux fichiers

| Fichier | Description |
|---|---|
| `src/types/jobSegment.ts` | Toutes les interfaces segments |
| `src/services/jobSegmentService.ts` | Logique de calcul heures/coûts |
| `src/screens/business/JobTemplateEditor.tsx` | Écran création de template |
| `src/screens/job/JobTimeBreakdown.tsx` | Écran récapitulatif post-job |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/constants/JobSteps.ts` | Ajout mapping STEP_TO_SEGMENT_MAP |
| `src/services/jobs.ts` | Étendre CreateJobRequest |
| `src/services/business/templatesService.ts` | Nouvelles fonctions CRUD modulaires |
| `src/context/JobTimerProvider.tsx` | Ajout segment tracking |
| `src/hooks/useJobTimer.ts` | Ajout segment state + actions |
| `src/components/jobDetails/JobTimerDisplay.tsx` | Timeline segments, employés actifs |
| `src/components/jobDetails/sections/JobTimeSection.tsx` | Segment courant, mini-récap |
| `src/navigation/business.tsx` | Nouvelles routes (editor, breakdown) |

### Fichiers serveur (dans `_backend_deploy/`)

| Fichier | Description |
|---|---|
| `migrations/XXX_create_modular_templates.sql` | 6 tables + index |
| `endPoints/v1/templates/modular.js` | CRUD templates |
| `endPoints/v1/jobs/segments.js` | CRUD segments d'un job |
| `endPoints/v1/jobs/timeBreakdown.js` | Endpoint récapitulatif |
