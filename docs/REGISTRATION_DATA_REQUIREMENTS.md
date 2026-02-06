# 📋 Exigences de Données d'Inscription - SwiftApp

## Vue d'ensemble

Ce document détaille toutes les données nécessaires pour les différents types d'inscription dans SwiftApp, en tenant compte du système australien (TFN/ABN) et des besoins métier spécifiques au déménagement.

---

## 🏢 1. Utilisateur Propriétaire d'Entreprise (Business Owner)

### Informations Personnelles

| Champ             | Type   | Requis | Validation                               | Notes                         |
| ----------------- | ------ | ------ | ---------------------------------------- | ----------------------------- |
| `firstName`       | string | ✅     | 2-50 caractères                          | Prénom du propriétaire        |
| `lastName`        | string | ✅     | 2-50 caractères                          | Nom du propriétaire           |
| `email`           | string | ✅     | Format email valide                      | Email principal (connexion)   |
| `phone`           | string | ✅     | Format australien `+61 xxx xxx xxx`      | Mobile du propriétaire        |
| `dateOfBirth`     | date   | ✅     | 18+ ans                                  | Nécessaire pour vérifications |
| `password`        | string | ✅     | Min 8 caractères, 1 majuscule, 1 chiffre | Sécurité                      |
| `confirmPassword` | string | ✅     | Doit correspondre à password             | -                             |

### Informations d'Entreprise

| Champ          | Type   | Requis | Validation                                       | Notes                         |
| -------------- | ------ | ------ | ------------------------------------------------ | ----------------------------- |
| `companyName`  | string | ✅     | 2-100 caractères                                 | Nom officiel                  |
| `tradingName`  | string | ❌     | 2-100 caractères                                 | Nom commercial (si différent) |
| `abn`          | string | ✅     | Format ABN: `XX XXX XXX XXX` (11 chiffres)       | Australian Business Number    |
| `acn`          | string | ❌     | Format ACN: `XXX XXX XXX` (9 chiffres)           | Australian Company Number     |
| `businessType` | enum   | ✅     | `sole_trader`, `partnership`, `company`, `trust` | Type juridique                |
| `industryType` | enum   | ✅     | `removals`, `logistics`, `storage`, `other`      | Secteur d'activité            |

| `companyEmail` | string | ❌ | Format email | Email général de l'entreprise |
| `companyPhone` | string | ✅ | Format australien | Téléphone principal |

### Adresse Professionnelle

| Champ           | Type   | Requis | Validation       | Notes         |
| --------------- | ------ | ------ | ---------------- | ------------- |
| `streetAddress` | string | ✅     | 5-200 caractères | Numéro et rue |

| `suburb` | string | ✅ | 2-50 caractères | Suburb (Australie) |
| `state` | enum | ✅ | `NSW`, `VIC`, `QLD`, `SA`, `WA`, `TAS`, `NT`, `ACT` | État australien |
| `postcode` | string | ✅ | 4 chiffres | Code postal australien |

| `country` | string | ✅ | Default: `Australia` | Pays |

### Informations Bancaires (pour Stripe Connect)

| Champ | Type | Requis | Validation | Notes |

| --------------- | ------ | ------ | ---------------------------------------- | ------------------------- |
| `bsb` | string | ✅ | Format: `XXX-XXX` (6 chiffres) | Bank State Branch |
| `accountNumber` | string | ✅ | 6-10 chiffres | Numéro de compte bancaire |
| `accountName` | string | ✅ | Doit correspondre au nom de l'entreprise | Nom du titulaire |

| `taxIdType` | enum | ✅ | `abn` | Type d'identifiant fiscal |
| `taxId` | string | ✅ | Même que ABN | Pour Stripe |

### Informations Légales

| Champ                        | Type    | Requis | Validation | Notes                        |
| ---------------------------- | ------- | ------ | ---------- | ---------------------------- |
| `termsAccepted`              | boolean | ✅     | true       | Conditions générales         |
| `privacyPolicyAccepted`      | boolean | ✅     | true       | Politique de confidentialité |
| `stripeConnectTermsAccepted` | boolean | ✅     | true       | Conditions Stripe Connect    |

| `insuranceProvider` | string | ❌ | - | Fournisseur d'assurance |

| `insurancePolicyNumber` | string | ❌ | - | Numéro de police |
| `insuranceExpiryDate` | date | ❌ | Date future | Expiration assurance |

### Paramètres d'Abonnement

| Champ | Type | Requis | Validation | Notes |

| ----------------------- | ------ | ------ | --------------------------------------- | --------------------------- |
| `planType` | enum | ✅ | `starter`, `professional`, `enterprise` | Plan choisi |
| `billingFrequency` | enum | ✅ | `monthly`, `yearly` | Fréquence de paiement |
| `estimatedJobsPerMonth` | number | ❌ | 1-1000 | Pour recommandation de plan |

### Documents à Télécharger (optionnel mais recommandé)

- Preuve d'ABN (ABN lookup screenshot ou document officiel)
- Certificat d'assurance
- Licence de déménageur (si applicable selon l'état)
- Photo d'identité du propriétaire (pour vérification KYC Stripe)

---

## 👷 2. Utilisateur Employé (Employee)

**Note:** Les employés sont invités par leur entreprise. Leur paiement est géré EN DEHORS de la plateforme. L'inscription est donc très simple et rapide.

### Informations Personnelles

| Champ | Type | Requis | Validation | Notes |

| ----------------- | ------ | ------ | ------------------- | --------------------------- |

| `firstName` | string | ✅ | 2-50 caractères | Prénom |
| `lastName` | string | ✅ | 2-50 caractères | Nom |
| `email` | string | ✅ | Format email valide | Email personnel (connexion) |
| `phone` | string | ✅ | Format australien | Mobile |
| `password` | string | ✅ | Min 8 caractères | Sécurité |
| `confirmPassword` | string | ✅ | Doit correspondre | - |

### Informations d'Emploi (définies par l'entreprise à l'invitation)

| Champ        | Type   | Requis | Validation                                                                                                                      | Notes                                    |
| ------------ | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `role`       | enum   | ✅     | `Moving Supervisor`, `Senior Mover`, `Junior Mover`, `Packing Specialist`, `Truck Driver`, `Customer Service`, `Administration` | Poste assigné                            |
| `team`       | enum   | ✅     | `Local Moving Team A`, `Local Moving Team B`, `Interstate Moving Team`, `Packing Team`, `Storage Team`, `Customer Service Team` | Équipe assignée                          |
| `hourlyRate` | number | ✅     | Min 21.38 (salaire minimum australien 2025)                                                                                     | Taux horaire (informationnel uniquement) |

### Informations Liées à l'Entreprise (auto-remplies lors de l'invitation)

| Champ | Type | Requis | Notes |

| ------------------ | ------- | ------- | ---------------------------------------------------------- |
| `companyId` | string | ✅ Auto | ID de l'entreprise qui invite |
| `invitedBy` | string | ✅ Auto | ID du propriétaire/manager |
| `invitationToken` | string | ✅ Auto | Token d'invitation unique |
| `invitationStatus` | enum | ✅ Auto | `sent`, `accepted`, `completed`, `expired` |
| `accountLinked` | boolean | ✅ Auto | false au départ, true après setup |
| `startDate` | date | ✅ Auto | Date de début (définie à l'invitation) |
| `employmentType` | enum | ✅ Auto | `full_time`, `part_time`, `casual` (défini à l'invitation) |

### Documents à Télécharger (optionnel)

- Photo de profil (optionnel)
- Certificats de formation (RSA, White Card, etc.) si applicable (optionnel)

---

## 🔧 3. Utilisateur Prestataire/Contractor (ABN)

### Informations Personnelles

| Champ       | Type   | Requis | Validation      | Notes  |
| ----------- | ------ | ------ | --------------- | ------ |
| `firstName` | string | ✅     | 2-50 caractères | Prénom |
| `lastName`  | string | ✅     | 2-50 caractères | Nom    |

| `email` | string | ✅ | Format email valide | Email professionnel |
| `phone` | string | ✅ | Format australien | Mobile |
| `dateOfBirth` | date | ✅ | 18+ ans | Vérification |
| `password` | string | ✅ | Min 8 caractères | Sécurité |

| `confirmPassword` | string | ✅ | Doit correspondre | - |

### Informations Business/ABN

| Champ | Type | Requis | Validation | Notes |

| ---------------- | ------- | ------ | --------------------------------------- | -------------------------- |
| `tradingName` | string | ✅ | 2-100 caractères | Nom commercial |
| `abn` | string | ✅ | Format: `XX XXX XXX XXX` | Australian Business Number |
| `businessType` | enum | ✅ | `sole_trader`, `partnership`, `company` | Type d'entité |

| `gstRegistered` | boolean | ✅ | - | Enregistré pour la TPS ? |
| `companyWebsite` | string | ❌ | URL valide | Site web (si existe) |

### Adresse Professionnelle

| Champ           | Type   | Requis | Validation        | Notes               |
| --------------- | ------ | ------ | ----------------- | ------------------- |
| `streetAddress` | string | ✅     | 5-200 caractères  | Adresse commerciale |
| `suburb`        | string | ✅     | 2-50 caractères   | Suburb              |
| `state`         | enum   | ✅     | États australiens | État                |

| `postcode` | string | ✅ | 4 chiffres | Code postal |
| `country` | string | ✅ | Default: `Australia` | Pays |

### Informations de Services

| Champ            | Type  | Requis | Validation      | Notes                                                                                       |
| ---------------- | ----- | ------ | --------------- | ------------------------------------------------------------------------------------------- |
| `specialization` | array | ✅     | Multiple select | `Heavy Lifting`, `Piano Moving`, `Interstate`, `Packing`, `Storage`, `Assembly`, `Cleaning` |

| `serviceArea` | array | ✅ | Multiple select | Zones couvertes (suburbs/régions) |
| `experienceYears` | number | ✅ | 0-50 | Années d'expérience |
| `teamSize` | number | ❌ | 1-100 | Nombre de personnes dans l'équipe |
| `hasOwnVehicles` | boolean | ✅ | - | Possède des véhicules ? |
| `vehicleTypes` | array | ❌ | Conditionnel si hasOwnVehicles=true | `Small Van`, `Large Truck`, `Trailer` |

### Tarification

| Champ        | Type   | Requis       | Validation                   | Notes                       |
| ------------ | ------ | ------------ | ---------------------------- | --------------------------- |
| `rateType`   | enum   | ✅           | `hourly`, `fixed`, `project` | Type de tarification        |
| `hourlyRate` | number | Conditionnel | Min 30, Max 200              | Si rateType=hourly (en AUD) |

| `minimumJobFee` | number | ❌ | - | Frais minimum par job |
| `callOutFee` | number | ❌ | - | Frais de déplacement |

### Informations Bancaires (pour Stripe Connect)

| Champ           | Type   | Requis | Validation                        | Notes            |
| --------------- | ------ | ------ | --------------------------------- | ---------------- |
| `bsb`           | string | ✅     | Format: `XXX-XXX`                 | BSB              |
| `accountNumber` | string | ✅     | 6-10 chiffres                     | Numéro de compte |
| `accountName`   | string | ✅     | Doit correspondre au trading name | Titulaire        |

### Assurance et Certifications

| Champ                         | Type    | Requis       | Validation                                 | Notes                           |
| ----------------------------- | ------- | ------------ | ------------------------------------------ | ------------------------------- |
| `hasPublicLiabilityInsurance` | boolean | ✅           | -                                          | Assurance responsabilité civile |
| `insuranceProvider`           | string  | Conditionnel | Requis si hasPublicLiabilityInsurance=true | Fournisseur                     |
| `insurancePolicyNumber`       | string  | Conditionnel | -                                          | Numéro de police                |

| `insuranceCoverageAmount` | number | Conditionnel | Min 1000000 (1M AUD recommandé) | Montant couvert |
| `insuranceExpiryDate` | date | Conditionnel | Date future | Expiration |
| `certifications` | array | ❌ | Multiple select | `White Card`, `RSA`, `Heavy Vehicle License`, `Forklift License` |

### Statut de Contrat (définit par l'entreprise qui engage)

| Champ                | Type | Requis  | Notes                                                                                   |
| -------------------- | ---- | ------- | --------------------------------------------------------------------------------------- |
| `contractStatus`     | enum | ❌ Auto | `standard`, `preferred`, `exclusive`, `non-exclusive` (défini lors de l'ajout au staff) |
| `availabilityStatus` | enum | ✅      | `available`, `busy`, `limited`, `unavailable`                                           |

### Documents à Télécharger

- Preuve d'ABN (ABN lookup screenshot)
- Certificat d'assurance

- Certificats de formation/licences
- Photos des véhicules (si applicable)
- Références clients précédents (optionnel)

### Informations de Vérification

| Champ        | Type    | Requis  | Notes                                           |
| ------------ | ------- | ------- | ----------------------------------------------- |
| `isVerified` | boolean | ❌ Auto | false par défaut, true après vérification admin |

| `verificationDate` | date | ❌ Auto | Date de vérification |
| `backgroundCheckComplete` | boolean | ❌ | Police check (optionnel) |

---

## 🏭 4. Fournisseur de Jobs (Job Provider/Supplier)

**Note:** Ce type d'utilisateur peut créer et assigner des jobs à d'autres entreprises. C'est essentiellement une entreprise qui sous-traite du travail.

### Informations Personnelles du Représentant

| Champ | Type | Requis | Validation | Notes |
| ----- | ---- | ------ | ---------- | ----- |

| `firstName` | string | ✅ | 2-50 caractères | Prénom du représentant |
| `lastName` | string | ✅ | 2-50 caractères | Nom du représentant |
| `position` | string | ✅ | - | Poste (ex: Manager, Dispatcher) |
| `email` | string | ✅ | Format email | Email professionnel |

| `phone` | string | ✅ | Format australien | Téléphone direct |
| `password` | string | ✅ | Min 8 caractères | Sécurité |
| `confirmPassword` | string | ✅ | Doit correspondre | - |

### Informations de l'Entreprise Fournisseur

| Champ | Type | Requis | Validation | Notes |

| ---------------- | ------ | ------ | -------------------------------------------------------------------------------- | ------------------- |
| `companyName` | string | ✅ | 2-100 caractères | Nom officiel |
| `tradingName` | string | ❌ | 2-100 caractères | Nom commercial |
| `abn` | string | ✅ | Format ABN: `XX XXX XXX XXX` | ABN de l'entreprise |
| `acn` | string | ❌ | Format ACN: `XXX XXX XXX` | ACN (si company) |
| `businessType` | enum | ✅ | `company`, `partnership`, `franchise` | Type juridique |
| `industryType` | enum | ✅ | `logistics_broker`, `real_estate`, `corporate_relocation`, `government`, `other` | Type de fournisseur |

| `companyEmail` | string | ✅ | Format email | Email général |

| `companyPhone` | string | ✅ | Format australien | Téléphone principal |
| `companyWebsite` | string | ❌ | URL valide | Site web |

### Adresse du Siège Social

| Champ           | Type   | Requis | Validation       | Notes   |
| --------------- | ------ | ------ | ---------------- | ------- |
| `streetAddress` | string | ✅     | 5-200 caractères | Adresse |

| `suburb` | string | ✅ | 2-50 caractères | Suburb |

| `state` | enum | ✅ | États australiens | État |
| `postcode` | string | ✅ | 4 chiffres | Code postal |
| `country` | string | ✅ | Default: `Australia` | Pays |

### Informations de Service

| Champ | Type | Requis | Validation | Notes |
| ----- | ---- | ------ | ---------- | ----- |

| `serviceType` | enum | ✅ | `job_broker`, `real_estate_network`, `corporate_partner`, `government_contract` | Type de service |
| `expectedJobVolume` | enum | ✅ | `low` (1-10/mois), `medium` (11-50/mois), `high` (51-200/mois), `enterprise` (200+/mois) | Volume attendu |
| `operatingRegions` | array | ✅ | Multiple select | Régions d'opération |
| `contractorNetwork` | boolean | ✅ | - | Possède un réseau de contractors ? |
| `networkSize` | number | Conditionnel | Requis si contractorNetwork=true | Nombre de contractors |

### Modèle de Facturation

| Champ | Type | Requis | Validation | Notes |

| ----------------- | ------ | ------------ | -------------------------------------------------- | -------------------------------------- |
| `billingModel` | enum | ✅ | `commission`, `markup`, `flat_fee`, `subscription` | Modèle de facturation |
| `commissionRate` | number | Conditionnel | 5-30% | Si billingModel=commission |
| `markupRate` | number | Conditionnel | 5-50% | Si billingModel=markup |
| `flatFeeAmount` | number | Conditionnel | - | Si billingModel=flat_fee (par job) |
| `subscriptionFee` | number | Conditionnel | - | Si billingModel=subscription (mensuel) |
| `paymentTerms` | enum | ✅ | `immediate`, `net7`, `net14`, `net30` | Conditions de paiement |

### Informations Bancaires

| Champ           | Type   | Requis | Validation                               | Notes            |
| --------------- | ------ | ------ | ---------------------------------------- | ---------------- |
| `bsb`           | string | ✅     | Format: `XXX-XXX`                        | BSB              |
| `accountNumber` | string | ✅     | 6-10 chiffres                            | Numéro de compte |
| `accountName`   | string | ✅     | Doit correspondre au nom de l'entreprise | Titulaire        |

| `preferredPaymentMethod` | enum | ✅ | `bank_transfer`, `stripe`, `invoice` | Méthode préférée |

### Permissions et Capacités

| Champ | Type | Requis | Notes |

| ------------------------------- | ------- | ------ | --------------------------------------------- |

| `canCreateJobs` | boolean | ✅ | Peut créer des jobs |
| `canAssignToCompanies` | boolean | ✅ | Peut assigner à d'autres entreprises |
| `canViewJobProgress` | boolean | ✅ | Peut suivre la progression |
| `canAccessReporting` | boolean | ✅ | Accès aux rapports |
| `requiresApprovalForAssignment` | boolean | ✅ | Jobs doivent être approuvés avant assignation |

### Informations de Vérification

| Champ              | Type    | Requis  | Validation       | Notes              |
| ------------------ | ------- | ------- | ---------------- | ------------------ |
| `businessVerified` | boolean | ❌ Auto | false par défaut | Vérification admin |

| `creditCheckComplete` | boolean | ❌ | - | Vérification crédit (optionnel) |
| `tradeReferences` | array | ❌ | - | Références commerciales |
| `termsAccepted` | boolean | ✅ | true | CGV spécifiques fournisseurs |

### Documents à Télécharger

- Preuve d'ABN/ACN
- Certificat d'enregistrement de l'entreprise
- Contrat de partenariat (template fourni)
- Références commerciales

- Preuve d'assurance (responsabilité professionnelle)

### Accès API (optionnel pour intégrations)

| Champ | Type | Requis | Notes |
| ----- | ---- | ------ | ----- |

| `requiresAPIAccess` | boolean | ❌ | Besoin d'accès API pour intégration |
| `webhookURL` | string | Conditionnel | URL pour notifications webhooks |
| `apiDocumentationAccepted` | boolean | Conditionnel | Conditions d'utilisation API |

---

## � Relations et Contraintes entre Types de Comptes

### Hiérarchie et Dépendances

```
┌─────────────────────────────────────────────────────────────────┐

│                       JOB PROVIDER                              │
│  (Crée et distribue des jobs à plusieurs entreprises)          │
└────────────────────────┬────────────────────────────────────────┘

                         │ Peut créer des jobs pour ▼
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼──────────────┐         ┌───────▼──────────────┐
│   BUSINESS OWNER     │         │   BUSINESS OWNER     │
│   (Entreprise A)     │         │   (Entreprise B)     │
└──────┬───────────────┘         └──────┬───────────────┘

       │ Invite et gère ▼               │ Invite et gère ▼

       │                                │

┌──────┴────────┬──────────┐    ┌──────┴────────┬──────────┐

│   EMPLOYEE    │CONTRACTOR│    │   EMPLOYEE    │CONTRACTOR│

│  (Lié à A)    │(Ajouté)  │    │  (Lié à B)    │(Ajouté)  │
└───────────────┴──────────┘    └───────────────┴──────────┘
```

### Contraintes par Type de Compte

#### 🏢 BUSINESS OWNER

**Dépendances:**

- ❌ **N'est lié à aucun autre compte** (compte racine)
- ✅ Peut créer et gérer **plusieurs Employees**

- ✅ Peut ajouter **plusieurs Contractors** à son staff
- ✅ Peut recevoir des jobs de **plusieurs Job Providers**

**Restrictions:**

- 🚫 Ne peut pas être employé d'une autre entreprise
- 🚫 Ne peut pas être contractor pour une autre entreprise

- 🚫 Un Business Owner = 1 seule entreprise (pas de multi-entreprises par compte)

**Relations:**

```
Business Owner (1) ──< Employees (n)
Business Owner (1) ──< Contractors (n) [many-to-many via table de liaison]
Business Owner (1) ──< Jobs Created (n)
Business Owner (1) ──< Jobs Received (n) [de Job Providers]

```

---

#### 👷 EMPLOYEE

**Dépendances:**

- ✅ **DOIT être lié à UN SEUL Business Owner** (contrainte forte)

- ✅ **DOIT avoir un token d'invitation valide** pour s'inscrire
- ✅ **DOIT être invité par un Business Owner** (ne peut pas s'inscrire seul)

**Restrictions:**

- 🚫 Ne peut pas être employé de plusieurs entreprises simultanément

- 🚫 Ne peut pas avoir de compte Stripe Connect
- 🚫 Ne peut pas créer de jobs
- 🚫 Ne peut pas inviter d'autres employés
- 🚫 Son compte est **désactivé automatiquement** si l'entreprise est supprimée
- 🚫 Si retiré du staff: compte **désactivé** (pas supprimé, pour historique)

**Relations:**

```
Employee (n) ──> Business Owner (1) [many-to-one]
Employee (1) ──< Jobs Assigned (n) [assignments]
Employee (1) ──< Invitation Token (1) [one-to-one]
```

**Cycle de vie:**

```
1. Business Owner crée invitation → Token généré

2. Token envoyé par email → Employee reçoit lien
3. Employee s'inscrit via token → Compte créé (accountLinked=false)
4. Email vérifié → accountLinked=true
5. Peut être assigné à des jobs → Actif
6. Si retiré du staff → Status=inactive (pas supprimé)
```

---

#### 🔧 CONTRACTOR (ABN)

**Dépendances:**

- ❌ **N'est lié à aucune entreprise de manière permanente** (indépendant)
- ✅ Peut être **ajouté au staff de plusieurs Business Owners** (many-to-many)
- ✅ Peut s'inscrire **seul** OU être invité par une entreprise

**Restrictions:**

- 🚫 Si ajouté au staff d'une entreprise: doit accepter l'invitation
- 🚫 Peut refuser d'être ajouté au staff
- 🚫 Peut se retirer du staff d'une entreprise à tout moment
- 🚫 Son `contractStatus` est **spécifique à chaque entreprise** (peut être "preferred" chez A et "standard" chez B)

**Relations:**

```
Contractor (n) ──< Business Owners (n) [many-to-many via contractor_company]
Contractor (1) ──< Jobs Assigned (n)

Contractor (1) ──> Stripe Connect Account (1)
```

**États de relation avec une entreprise:**

```
contractor_company {
  contractor_id: string
  company_id: string

  contractStatus: 'standard' | 'preferred' | 'exclusive' | 'non-exclusive'
  addedAt: timestamp
  isActive: boolean
}
```

**Particularités:**

- Un contractor peut avoir `contractStatus='exclusive'` avec UNE SEULE entreprise

- Si `exclusive`: ne peut pas accepter de jobs d'autres entreprises
- Si retiré du staff: relation supprimée mais compte contractor reste actif

---

#### 🏭 JOB PROVIDER

**Dépendances:**

- ❌ **N'est lié à aucune entreprise** (compte indépendant)
- ✅ Peut créer des jobs pour **plusieurs Business Owners**
- ✅ Doit avoir des **accords commerciaux** avec les Business Owners

**Restrictions:**

- 🚫 Ne peut pas être assigné à des jobs
- 🚫 Ne peut pas avoir d'employees
- 🚫 Ne peut assigner un job à une entreprise QUE si un accord existe
- 🚫 Ne voit QUE les jobs qu'il a créés (pas tous les jobs)

**Relations:**

```
Job Provider (1) ──< Jobs Created (n)
Job Provider (1) ──< Business Partnerships (n) [many-to-many]
Job Provider (1) ──> Stripe Connect Account (1)
```

**Table de liaison Partnership:**

```
provider_company_agreement {

  provider_id: string

  company_id: string
  billingModel: 'commission' | 'markup' | 'flat_fee' | 'subscription'
  rate: number
  status: 'active' | 'inactive' | 'pending'
  createdAt: timestamp
}
```

---

## 📊 Tableau Comparatif des Types d'Utilisateurs

| Fonctionnalité                   | Business Owner          | Employee             | Contractor (ABN)        | Job Provider     |
| -------------------------------- | ----------------------- | -------------------- | ----------------------- | ---------------- |
| **Peut créer des jobs**          | ✅                      | ❌                   | ❌                      | ✅               |
| **Peut être assigné à des jobs** | ✅                      | ✅                   | ✅                      | ❌               |
| **Reçoit des paiements directs** | ✅ (via Stripe Connect) | ❌ (salaire externe) | ✅ (via Stripe Connect) | ✅ (commissions) |

| **Gère une équipe** | ✅ | ❌ | ❌ (peut avoir sa team) | ❌ |

| **A un compte Stripe Connect** | ✅ | ❌ | ✅ | ✅ |
| **Besoin ABN** | ✅ | ❌ | ✅ | ✅ |
| **Besoin TFN** | ❌ | ❌ (non géré) | ❌ | ❌ |
| **Peut inviter du staff** | ✅ | ❌ | ❌ | ❌ |
| **Accès dashboard complet** | ✅ | ❌ (vue limitée) | ❌ (vue jobs assignés) | ✅ (vue jobs créés) |
| **Peut assigner jobs à d'autres entreprises** | ❌ | ❌ | ❌ | ✅ |
| **Inscription autonome possible** | ✅ | ❌ (invitation obligatoire) | ✅ | ✅ |
| **Peut appartenir à plusieurs entités** | ❌ | ❌ (1 seule entreprise) | ✅ (plusieurs entreprises) | ❌ |

---

## 🔐 Règles de Validation des Relations

### Règle 1: Unicité de l'Employee

```typescript
// Un employee ne peut être lié qu'à UNE SEULE entreprise
if (employee.companyId && newInvitation.companyId !== employee.companyId) {
  throw new Error("Employee already linked to another company");
}
```

### Règle 2: Vérification Token d'Invitation

```typescript
// Token doit être valide, non expiré, et correspondre à l'email
if (!invitation.isValid || invitation.expiresAt < Date.now()) {
  throw new Error("Invalid or expired invitation token");
}
if (invitation.email !== employee.email) {
  throw new Error("Email does not match invitation");
}
```

### Règle 3: Contractor Exclusivité

```typescript
// Si un contractor a un contrat exclusif, il ne peut pas accepter d'autres
const exclusiveContract = contractor.companies.find(
  (c) => c.contractStatus === "exclusive",
);
if (exclusiveContract && newCompanyId !== exclusiveContract.companyId) {
  throw new Error("Contractor has exclusive contract with another company");
}
```

### Règle 4: Job Provider - Business Partnership

```typescript
// Un Job Provider ne peut créer un job pour une entreprise que s'il y a un accord actif
const partnership = await getPartnership(providerId, companyId);
if (!partnership || partnership.status !== "active") {
  throw new Error("No active partnership agreement");
}
```

### Règle 5: Cascade de Suppression

```typescript
// Si Business Owner est supprimé:
onDeleteBusinessOwner(ownerId) {
  // 1. Désactiver tous les employees (ne pas supprimer pour historique)
  employees.forEach(e => e.status = 'inactive');


  // 2. Supprimer les relations avec contractors (pas les contractors eux-mêmes)
  contractorCompanyLinks.forEach(link => link.delete());

  // 3. Annuler tous les jobs pending

  jobs.filter(j => j.status === 'pending').forEach(j => j.status = 'cancelled');


  // 4. Garder l'historique des jobs completed
  // (ne pas supprimer pour conformité légale/comptable)

}
```

---

## 🎯 Scénarios d'Usage des Relations

### Scénario 1: Nouvelle Entreprise

```
1. User s'inscrit comme Business Owner

2. Crée son entreprise (ABN vérifié)
3. Configure Stripe Connect
4. Peut maintenant:

   - Inviter des Employees ✅
   - Rechercher et ajouter des Contractors ✅
   - Créer des Jobs ✅

   - Accepter des Jobs de Job Providers ✅

```

### Scénario 2: Invitation Employee

```
1. Business Owner invite "john@email.com" comme Employee
2. Système crée invitation token (valide 7 jours)
3. Email envoyé à John avec lien unique
4. John clique → formulaire simplifié (nom, password)
5. John vérifie email → accountLinked=true
6. John peut maintenant être assigné aux jobs de l'entreprise
```

### Scénario 3: Contractor Multi-Entreprises

```
1. Contractor "Mike" s'inscrit avec son ABN
2. Entreprise A le recherche et l'ajoute (status: 'standard')
3. Entreprise B le recherche et l'ajoute (status: 'preferred')

4. Mike voit les jobs des DEUX entreprises
5. Mike peut accepter/refuser selon disponibilité
6. Chaque entreprise voit son propre contractStatus pour Mike
```

### Scénario 4: Job Provider Distribution

```
1. Real Estate Company s'inscrit comme Job Provider
2. Crée un partenariat avec Moving Company A (commission: 15%)

3. Crée un partenariat avec Moving Company B (commission: 12%)
4. Client demande un déménagement via Real Estate
5. Job Provider crée le job et l'assigne à Moving Company A
6. Moving Company A accepte et exécute

7. Paiement: Client → Job Provider → Moving Company A (- 15%)
```

---

## � Authentification par Réseaux Sociaux (OAuth)

### Providers Supportés

| Provider          | Status            | Informations récupérées                | Notes                        |
| ----------------- | ----------------- | -------------------------------------- | ---------------------------- |
| **Google**        | ✅ Recommandé     | email, firstName, lastName, photo      | Le plus utilisé en Australie |
| **Facebook/Meta** | ✅ Recommandé     | email, firstName, lastName, photo      | Populaire pour B2C           |
| **Apple**         | ⚠️ iOS uniquement | email (optionnel), firstName, lastName | Obligatoire pour App Store   |
| **Microsoft**     | 🔄 Futur          | email, firstName, lastName             | Pour clients corporate       |
| **LinkedIn**      | 🔄 Futur          | email, firstName, lastName, company    | Pour B2B/Contractors         |

### Flux OAuth Simplifié

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX AUTHENTIFICATION SOCIALE                 │
└─────────────────────────────────────────────────────────────────┘

1. User clique "Sign up with Google"
   ↓
2. Redirection vers Google OAuth
   ↓
3. User accepte permissions → Google retourne token
   ↓
4. Backend vérifie token + récupère infos user
   ↓
5. Vérification si email existe déjà
   │
   ├─→ OUI: Login automatique ✅
   │
   └─→ NON: Création compte avec infos pré-remplies
       ↓
       User choisit son type de compte:
       - Business Owner
       - Contractor (ABN)
       - Job Provider
       ↓
       Compléter les infos manquantes (ABN, adresse, etc.)
       ↓
       Compte créé ✅
```

### Données Récupérées par Provider

#### Google OAuth

```json
{
  "email": "john.smith@gmail.com",
  "email_verified": true,
  "given_name": "John",
  "family_name": "Smith",
  "picture": "https://lh3.googleusercontent.com/...",
  "locale": "en-AU"
}
```

**Avantages:**

- Email toujours vérifié par Google
- Haute confiance (moins de fraude)
- Photo de profil de qualité

#### Facebook/Meta OAuth

```json
{
  "email": "john.smith@facebook.com",
  "first_name": "John",
  "last_name": "Smith",
  "picture": {
    "data": {
      "url": "https://platform-lookaside.fbsbx.com/..."
    }
  }
}
```

**Avantages:**

- Large base d'utilisateurs
- Photo de profil
- Peut récupérer l'âge (pour validation 18+)

#### Apple Sign In (iOS uniquement)

```json
{
  "email": "john.smith@privaterelay.appleid.com", // Peut être masqué
  "email_verified": true,
  "is_private_email": true,
  "first_name": "John",
  "last_name": "Smith"
}
```

**Particularités:**

- Email peut être un relay privé Apple
- User peut choisir de masquer son vrai email
- Obligatoire si on propose d'autres méthodes sociales (règle App Store)

---

### Intégration OAuth par Type de Compte

#### 🏢 Business Owner avec OAuth

**Informations pré-remplies:**

- ✅ `firstName`, `lastName`, `email` (de Google/Facebook)
- ✅ `profilePicture` (photo du compte social)

**Informations à compléter:**

- ❌ `companyName`, `abn`, `businessType`
- ❌ `streetAddress`, `suburb`, `state`, `postcode`
- ❌ Informations bancaires (Stripe Connect)
- ❌ `phone` (requis pour SMS)

**Flux:**

```
1. Sign up with Google
2. Infos personnelles pré-remplies ✅
3. Étape: Informations d'entreprise (ABN, nom, type)
4. Étape: Adresse professionnelle
5. Étape: Configuration Stripe Connect
6. Étape: Numéro de téléphone (vérification SMS)
7. Compte créé ✅
```

#### 👷 Employee avec OAuth

**Note:** Les Employees sont invités, donc OAuth est optionnel mais recommandé.

**Scénario A: Invitation avec email Gmail**

```
1. Business Owner invite "john@gmail.com"
2. John reçoit email d'invitation
3. John clique → option "Continue with Google"
4. Infos pré-remplies (nom, email déjà matchent)
5. John crée juste son password OU utilise Google login
6. Compte lié ✅
```

**Scénario B: Invitation avec email personnel**

```
1. Business Owner invite "john.personal@email.com"
2. John préfère utiliser son compte Google
3. Système vérifie: "john.personal@email.com" ≠ "john@gmail.com"
4. Demande confirmation: "Voulez-vous lier ces deux emails?"
5. Vérification des deux emails requise
6. Comptes liés ✅
```

#### 🔧 Contractor avec OAuth

**Informations pré-remplies:**

- ✅ `firstName`, `lastName`, `email`
- ✅ `profilePicture`

**Informations à compléter:**

- ❌ `tradingName`, `abn`, `businessType`
- ❌ `specialization`, `serviceArea`
- ❌ `rateType`, `hourlyRate`
- ❌ Adresse professionnelle
- ❌ Configuration Stripe Connect
- ❌ `phone`, assurance

**Flux similaire au Business Owner** (7 étapes)

#### 🏭 Job Provider avec OAuth

**Flux identique au Business Owner** avec informations d'entreprise différentes.

---

### Configuration Technique

#### Variables d'Environnement Nécessaires

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_REDIRECT_URI=https://yourapp.com/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-secret
FACEBOOK_REDIRECT_URI=https://yourapp.com/auth/facebook/callback

# Apple Sign In (iOS)
APPLE_SERVICES_ID=com.slash4u.swiftapp
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple-private-key.p8
```

#### Packages React Native Requis

```json
{
  "@react-native-google-signin/google-signin": "^11.0.0",
  "react-native-fbsdk-next": "^12.1.2",
  "@invertase/react-native-apple-authentication": "^2.3.0"
}
```

#### Configuration Expo (app.json)

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.slash4u.swiftapp"
        }
      ],
      [
        "react-native-fbsdk-next",
        {
          "appID": "your-facebook-app-id",
          "clientToken": "your-client-token",
          "displayName": "Swift App",
          "scheme": "fb{your-app-id}",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false
        }
      ],
      ["@invertase/react-native-apple-authentication"]
    ]
  }
}
```

---

### Base de Données - Table OAuth

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'apple', 'microsoft'
  provider_user_id VARCHAR(255) NOT NULL, -- ID chez le provider
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  access_token TEXT, -- Chiffré
  refresh_token TEXT, -- Chiffré
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes
  UNIQUE(provider, provider_user_id), -- Un user ne peut se connecter qu'une fois par provider
  UNIQUE(provider, email) -- Un email ne peut être lié qu'une fois par provider
);

-- Index
CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider_email ON oauth_accounts(provider, email);
```

---

### Sécurité OAuth

#### ✅ Bonnes Pratiques

1. **Validation du Token**

```typescript
async function verifyGoogleToken(idToken: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
  );
  const data = await response.json();

  if (data.error || data.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Invalid Google token");
  }

  return data;
}
```

1. **Prévention de l'Usurpation d'Email**

```typescript
// Si l'email existe déjà avec une autre méthode:
if (existingUser && existingUser.authMethod === "password") {
  // Demander confirmation par email
  await sendEmailConfirmation(existingUser.email);
  throw new Error("Please verify email to link accounts");
}
```

1. **Tokens Chiffrés**

```typescript
// Ne jamais stocker les tokens en clair
const encryptedToken = encrypt(accessToken, SECRET_KEY);
await saveOAuthAccount({
  ...data,
  access_token: encryptedToken,
});
```

1. **State Parameter** (CSRF Protection)

```typescript
// Générer un state aléatoire avant redirection OAuth
const state = crypto.randomBytes(32).toString("hex");
await redis.set(`oauth_state:${state}`, userId, "EX", 600); // 10 min

// Vérifier le state au callback
const storedUserId = await redis.get(`oauth_state:${state}`);
if (!storedUserId) {
  throw new Error("Invalid OAuth state");
}
```

---

### Gestion des Erreurs OAuth

| Erreur                    | Code                 | Solution                                            |
| ------------------------- | -------------------- | --------------------------------------------------- |
| **Email déjà utilisé**    | `EMAIL_EXISTS`       | Proposer de lier les comptes ou se connecter        |
| **Token invalide**        | `INVALID_TOKEN`      | Redemander l'authentification                       |
| **Permissions refusées**  | `ACCESS_DENIED`      | Expliquer pourquoi les permissions sont nécessaires |
| **Provider indisponible** | `SERVICE_ERROR`      | Fallback vers inscription classique                 |
| **Email non vérifié**     | `EMAIL_NOT_VERIFIED` | Demander vérification manuelle                      |

---

### UX Recommendations

#### Écran de Connexion/Inscription

```
┌─────────────────────────────────────────┐
│                                         │
│         [Logo Swift App]                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📧 Continue with Email          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔵 Continue with Google         │  │ ← Recommandé
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📘 Continue with Facebook       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │ (iOS uniquement)
│  │  🍎 Sign in with Apple           │  │
│  └───────────────────────────────────┘  │
│                                         │
│     Already have an account? Sign in   │
│                                         │
└─────────────────────────────────────────┘
```

#### Messages Clairs

- ✅ "Continue with Google" (pas "Sign up")
- ✅ "We'll never post without your permission"
- ✅ Afficher les permissions demandées avant redirect
- ✅ Option de déconnecter le compte social plus tard

---

### Avantages de l'OAuth pour SwiftApp

| Aspect          | Avantage                                                     |
| --------------- | ------------------------------------------------------------ |
| **Conversion**  | 📈 +40% d'inscriptions complétées (moins de friction)        |
| **Sécurité**    | 🔒 Pas de gestion de mots de passe (Google/FB s'en chargent) |
| **Trust**       | ✅ Email déjà vérifié par les providers                      |
| **UX Mobile**   | 📱 Connexion en 1 clic sur mobile (SDK natifs)               |
| **Photo**       | 👤 Photo de profil automatique                               |
| **Maintenance** | 🛠️ Moins de "Forgot password" à gérer                        |

---

### Limitations et Considérations

⚠️ **Email Privé Apple**: Users peuvent choisir un email relay, complique la communication
⚠️ **Dépendance**: Si Google/Facebook ont un outage, connexion impossible
⚠️ **Données limitées**: Pas d'accès au numéro de téléphone via OAuth
⚠️ **Révocation**: User peut révoquer l'accès depuis le provider
⚠️ **Business Users**: Certains préfèrent email professionnel vs Gmail personnel

---

## �🔄 Flux d'Inscription Recommandés

### 1. Business Owner

```

Étape 1: Informations personnelles

Étape 2: Informations d'entreprise + ABN
Étape 3: Adresse professionnelle

Étape 4: Choix du plan d'abonnement

Étape 5: Configuration Stripe Connect
Étape 6: Documents (optionnel)

Étape 7: Vérification email
Étape 8: Configuration initiale (créer équipe, véhicules)
```

### 2. Employee (SIMPLIFIÉ)

```
Étape 1: Token d'invitation (reçu par email)
Étape 2: Informations personnelles + mot de passe

Étape 3: Vérification email
Étape 4: Compte lié à l'entreprise (accountLinked=true)
✅ Inscription complète - Prêt à travailler


```

### 3. Contractor (ABN)

```
2tape 1: Informations personnelles
1
2tape 2: Informations ABN + business

Étape 3: Spécialisations et services
2tape 4: Tarification
1tape 5: Adresse professionnelle
2tape 6: Configuration Stripe Connect
3tape 7: Assurance et certifications
4tape 8: Documents
Étape 9: Vérification email
Étape 10: En attente de vérification admin
```

### 4. Job Provider

```
Étape 1: Informations du représentant
Étape 2: Informations de l'entreprise + ABN

Étape 3: Type de service et volume
Étape 4: Modèle de facturation
Étape 5: Adresse du siège
Étape 6: Informations bancaires
Étape 7: Permissions et capacités

Étape 8: Documents et références
Étape 9: Vérification email
Étape 10: Approbation admin + signature contrat
Étape 11: (Optionnel) Configuration API
```

---

## 🔐 Validations Communes à Tous les Types

### Format Email

```regex
^[^\s@]+@[^\s@]+\.[^\s@]+$

```

### Téléphone Australien

```regex

^(\+61\s?[2-9]\d{8}|04\d{2}\s?\d{3}\s?\d{3})$
```

### ABN (Australian Business Number)

```regex
^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$
```

Validation: 11 chiffres, peut avoir des espaces

### TFN (Tax File Number)

```regex
^\d{3}-?\d{3}-?\d{3}$
```

Validation: 9 chiffres, format XXX-XXX-XXX

### BSB (Bank State Branch)

```regex
^\d{3}-?\d{3}$
```

Validation: 6 chiffres, format XXX-XXX

### Postcode Australien

```regex
^\d{4}$
```

2alidation: 4 chiffres

### Mot de passe Fort

2 Minimum 8 caractères
3 Au moins 1 majuscule
4 Au moins 1 minuscule

- Au moins 1 chiffre
- Au moins 1 caractère spécial (recommandé)

---

## 📱 Considérations UX

### Champs Auto-complétés

- **ABN Lookup**: Utiliser l'API ABR (Australian Business Register) pour auto-compléter les informations d'entreprise
- **Adresse**: Intégration Google Places API pour auto-complétion
- **BSB**: Vérification avec l'API APCA pour valider le BSB et obtenir le nom de la banque

### Sauvegarde Progressive

- Sauvegarder les données à chaque étape
- Permettre de revenir en arrière sans perdre les données
- Email de rappel si inscription non complétée après 24h

### Vérification en Temps Réel

- ABN: Vérification immédiate via ABR Lookup
- Email: Vérification de disponibilité
- TFN: Validation du format (pas de vérification en ligne pour raisons de confidentialité)

### Upload de Documents

- Formats acceptés: PDF, JPG, PNG
- Taille max par fichier: 5MB
- Scan de documents avec OCR pour extraction automatique des données (ABN, licence, etc.)

---

## 🔗 Intégrations Nécessaires

### Stripe Connect

- Création de comptes Connected (pour Business Owner, Contractor, Job Provider)
- Vérification KYC (Know Your Customer)
- Configuration des paiements automatiques

### Australian Business Register (ABR)

- Vérification ABN en temps réel
- Récupération des informations d'entreprise

### Xero/MYOB (optionnel)

- Synchronisation comptable pour Business Owners
- Export automatique des factures et paiements

### Background Check Services (optionnel)

- Pour les Employees et Contractors
- Police check via services australiens agréés

---

## 📈 Métriques de Conversion à Suivre

- Taux de complétion par étape
- Temps moyen d'inscription par type
- Taux d'abandon (et à quelle étape)
- Taux de vérification des documents
- Taux d'activation Stripe Connect
- Temps entre inscription et premier job créé/accepté

---

## 🎯 Recommandations Prioritaires

### Phase 1 (MVP)

1. ✅ Business Owner registration (complet avec Stripe Connect)
2. ✅ Employee invitation et onboarding
3. ✅ Contractor search et invitation

### Phase 2

1. ⏳ Contractor self-registration (avec vérification admin)
2. ⏳ Job Provider registration et workflow d'approbation

### Phase 3

1. ⏳ ABN Lookup automatique
2. ⏳ OCR pour documents
3. ⏳ Background checks intégrés
4. ⏳ API access pour Job Providers

---

## 📝 Notes Importantes

1. **Conformité RGPD/Privacy Act**: Toutes les données personnelles doivent être stockées de manière sécurisée et conforme aux lois australiennes
2. **Stripe Connect KYC**: Certaines informations sont requises par Stripe pour la vérification KYC (photos d'identité, etc.)
3. **TFN Confidentialité**: Le TFN est une information hautement sensible et ne doit jamais être affiché en clair
4. **ABN Public**: Les informations ABN sont publiques en Australie via le registre ABR
5. **Assurance Obligatoire**: En Australie, l'assurance responsabilité civile est fortement recommandée (parfois obligatoire selon l'état) pour les déménageurs

---

**Dernière mise à jour**: 28 janvier 2026  
**Version**: 1.0  
**Auteur**: SwiftApp Development Team

---

## 📧 Système d'Email - État des Lieux

### 📨 Système d'Envoi d'Emails Actuel

#### Configuration Backend

**Fonction d'envoi (`endPoints/functions/mailSender.js`):**

```javascript
// Méthode principale
verificationMail(email, code);
// Envoie un email avec le code de vérification à 6 chiffres
```

**Emplacement:** `endPoints/functions/mailSender.js`  
**État:** ✅ Implémenté et fonctionnel

---

### ✅ Emails Actuellement Envoyés

#### 1. Email de Vérification (Inscription)

**Déclencheur:** Après inscription via `POST /subscribe`

**Processus:**

1. User s'inscrit avec `{ mail, firstName, lastName, password }`
2. Backend crée le compte
3. Génération code aléatoire à 6 chiffres
4. Stockage du code dans BDD (`verification_code` column)
5. Envoi email via `verificationMail(email, code)`

6. User reçoit l'email avec le code

**Template d'email (supposé):**

```
Sujet: Vérifiez votre adresse email - SwiftApp

Bonjour [firstName],

Merci de vous être inscrit(e) sur SwiftApp !

Votre code de vérification est : 123456

Ce code est valide pendant 24 heures.

Si vous n'avez pas créé de compte, ignorez cet email.

Cordialement,

L'équipe SwiftApp
```

**Validation du code:**

- Endpoint: `POST /verifyMail`
- Body: `{ mail, code }`
- Process:
  1. Recherche user avec email + code
  2. Si match: suppression du code (mise à NULL)
  3. Compte activé
  4. Retour success

**Expiration:** Non spécifiée dans le code (probablement aucune expiration actuellement)

**État:** ✅ Fonctionnel

---

### ❌ Emails NON Implémentés (Requis pour Documentation)

#### 1. Email d'Invitation Employee

**Besoin:**

- Business Owner invite un Employee
- Email envoyé automatiquement avec lien d'invitation

**Template requis:**

```
Sujet: Vous êtes invité(e) à rejoindre [Company Name] sur SwiftApp

Bonjour [firstName],

[Business Owner Name] vous invite à rejoindre [Company Name] sur SwiftApp.

Informations du poste:
- Rôle: [role]
- Équipe: [team]
- Taux horaire: $[hourlyRate] AUD/h
- Date de début: [startDate]

Cliquez sur le lien ci-dessous pour créer votre compte:
[App Link with Token]

Ce lien est valide pendant 7 jours.


Si vous n'êtes pas concerné(e), ignorez cet email.

Cordialement,
L'équipe SwiftApp
```

**Données nécessaires:**

- Nom de l'employeur (Business Owner)
- Nom de l'entreprise
- Prénom/Nom de l'invité
- Email de l'invité
- Rôle assigné
- Équipe assignée
- Taux horaire
- Date de début
- Token unique (UUID)
- Lien deep link: `swiftapp://invite/{token}`

**Endpoint à créer:** `POST /swift-app/invite/employee`

**État:** ❌ Non implémenté

---

#### 2. Email de Réinitialisation de Mot de Passe

**Besoin:**

- User clique "Mot de passe oublié"
- Email envoyé avec code à 6 chiffres

**Template requis:**

```
Sujet: Réinitialisation de votre mot de passe - SwiftApp

Bonjour [firstName],

Vous avez demandé la réinitialisation de votre mot de passe.

Votre code de réinitialisation est : 123456


Ce code est valide pendant 30 minutes.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe SwiftApp
```

**Processus:**

1. User demande reset: `POST /password/forgot` avec `{ email }`
2. Backend génère code 6 chiffres
3. Stockage dans BDD avec expiration (30 min)
4. Envoi email
5. User entre le code + nouveau password: `POST /password/reset` avec `{ email, code, newPassword }`
6. Validation code + expiration
7. Hash nouveau password
8. Update BDD + suppression code
9. Success

**Endpoint à créer:**

- `POST /swift-app/password/forgot`
- `POST /swift-app/password/reset`

**État:** ❌ Non implémenté

---

#### 3. Email de Bienvenue (Post-Vérification)

**Besoin:**

- Après vérification de l'email
- Email de bienvenue avec prochaines étapes

**Template requis:**

```
Sujet: Bienvenue sur SwiftApp ! 🚚

Bonjour [firstName],

Votre email a été vérifié avec succès !

Prochaines étapes pour [User Type]:

[Si Business Owner]
1. Complétez vos informations d'entreprise
2. Configurez votre compte Stripe Connect
3. Invitez votre équipe
4. Créez votre premier job

[Si Employee]
1. Complétez votre profil
2. Consultez vos jobs assignés
3. Téléchargez l'application mobile

[Si Contractor]
1. Complétez votre profil ABN
2. Ajoutez vos certifications
3. Attendez la vérification admin
4. Commencez à accepter des jobs

Besoin d'aide ? support@swiftapp.com


Cordialement,
L'équipe SwiftApp
```

**Déclencheur:** Après succès de `POST /verifyMail`

**État:** ❌ Non implémenté

---

#### 4. Email de Confirmation Stripe Connect

**Besoin:**

- Après setup Stripe Connect réussi
- Confirmation que les paiements sont activés

**Template requis:**

```
Sujet: Vos paiements sont activés ! 💳

Bonjour [firstName],

Votre compte Stripe Connect a été configuré avec succès !

Vous pouvez maintenant:
✅ Recevoir des paiements de vos clients
✅ Générer des factures automatiques
✅ Suivre vos revenus en temps réel

Compte bancaire lié:
- BSB: [bsb]
- Compte: ****[last4digits]


Pour modifier vos informations bancaires, rendez-vous dans:
Paramètres → Paiements → Stripe Connect

Cordialement,

L'équipe SwiftApp
```

**Déclencheur:** Callback Stripe Connect `account.updated` webhook

**État:** ❌ Non implémenté

---

#### 5. Email de Vérification Admin (Contractor)

**Besoin:**

- Admin vérifie un contractor
- Notification envoyée au contractor

**Template requis:**

```
Sujet: Votre compte Contractor a été vérifié ! ✅

Bonjour [firstName],

Bonne nouvelle ! Votre compte contractor a été vérifié par notre équipe.

Vous pouvez maintenant:
✅ Apparaître dans les recherches des entreprises
✅ Accepter des invitations
✅ Postuler aux jobs disponibles

Documents vérifiés:
- ABN: [abn] ✓
- Assurance: [insuranceProvider] ✓
- Certifications: [certifications] ✓


Pour commencer, consultez les jobs disponibles dans l'onglet "Jobs".

Cordialement,
L'équipe SwiftApp
```

**Déclencheur:** Admin clique "Verify Contractor" dans le dashboard

**Endpoint à créer:** `POST /swift-app/admin/verify-contractor/:id`

**État:** ❌ Non implémenté

---

#### 6. Email de Facture Stripe (Auto)

**Besoin:**

- Facture générée automatiquement après paiement
- Stripe envoie l'email automatiquement

**Template:** Géré par Stripe (personnalisable dans dashboard Stripe)

**Configuration:**

- Dans `POST /stripe/create-invoice`:

  ```javascript
  collection_method: 'send_invoice',
  auto_advance: true, // Auto-finaliser et envoyer
  ```

**État:** ✅ Implémenté côté code, dépend de la configuration Stripe

---

#### 7. Email de Job Assignment (Employee/Contractor)

**Besoin:**

- Employee/Contractor assigné à un job
- Notification avec détails du job

**Template requis:**

```
Sujet: Nouveau job assigné - [Job Title]

Bonjour [firstName],

Vous avez été assigné(e) à un nouveau job :

Job: [jobTitle]
Client: [clientName]
Date: [jobDate]
Adresse: [jobAddress]

Détails:
- Début: [startTime]
- Fin estimée: [endTime]
- Équipe: [team members]
- Véhicule: [truck]

Voir les détails complets dans l'application.

Cordialement,
L'équipe SwiftApp
```

**Déclencheur:** Assignment dans le job management

**Endpoint à créer:** `POST /swift-app/jobs/:id/assign`

**État:** ❌ Non implémenté

---

### 🔧 Configuration Email Requise

#### Provider Email (à choisir)

**Options:**

1. **SendGrid** (recommandé pour production)
   - API robuste
   - Templates HTML
   - Analytics
   - Deliverability élevée
   - Prix: Gratuit jusqu'à 100 emails/jour, puis $15/mois (40k emails)

2. **AWS SES** (économique)
   - $0.10 / 1000 emails
   - Nécessite vérification domaine
   - Bonne deliverability
   - Complexe à setup

3. **Nodemailer + SMTP** (simple pour dev)
   - Gratuit
   - Gmail SMTP pour dev/test
   - Non recommandé pour production (limites, spam)

**Recommandation:** SendGrid pour production, Nodemailer+Gmail pour dev

---

#### Variables d'environnement requises

```bash
# Email Provider (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@swiftapp.com
SENDGRID_FROM_NAME=SwiftApp

# Email Templates IDs (SendGrid)
SENDGRID_TEMPLATE_VERIFICATION=d-xxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_INVITATION=d-xxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_JOB_ASSIGNMENT=d-xxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_CONTRACTOR_VERIFIED=d-xxxxxxxxxxxxxxxxxx

# Deep Links
APP_DEEP_LINK_BASE=swiftapp://
APP_WEB_LINK_BASE=https://app.swiftapp.com/

```

---

### 📊 Résumé Emails

| Email                      | Status        | Déclencheur     | Template | Backend API |
| -------------------------- | ------------- | --------------- | -------- | ----------- |
| Vérification (inscription) | ✅ Implémenté | POST /subscribe | ✅       | ✅          |
| Invitation Employee        | ❌ À créer    | Invite employee | ❌       | ❌          |

| Reset Password | ❌ À créer | Forgot password | ❌ | ❌ |
| Bienvenue | ❌ À créer | Email vérifié | ❌ | ❌ |
| Stripe Connect Confirmé | ❌ À créer | Stripe webhook | ❌ | ❌ |
| Contractor Vérifié | ❌ À créer | Admin verification | ❌ | ❌ |
| Facture (Stripe auto) | ⚠️ Partiel | Invoice finalized | Stripe | ✅ |
| Job Assignment | ❌ À créer | Job assign | ❌ | ❌ |

---

### 🚀 Prochaines Étapes - Emails

**Phase 1: Setup Provider (Priorité HAUTE)**

1. Créer compte SendGrid
2. Vérifier domaine email (swiftapp.com)
3. Configurer DNS (SPF, DKIM, DMARC)
4. Tester envoi avec API key

**Estimation:** 1 jour

---

**Phase 2: Templates HTML (Priorité HAUTE)**

1. Designer 7 templates dans SendGrid
2. Variables dynamiques pour chaque template
3. Responsive design (mobile-first)
4. Brand colors + logo SwiftApp
5. Footers avec unsubscribe + support

**Estimation:** 3 jours

---

**Phase 3: Backend Email Service (Priorité HAUTE)**

1. Créer `services/emailService.js`
   - Méthode `sendVerificationEmail(email, firstName, code)`
   - Méthode `sendInvitationEmail(email, firstName, invitationData)`
   - Méthode `sendPasswordResetEmail(email, firstName, code)`
   - Méthode `sendWelcomeEmail(email, firstName, userType)`
   - Méthode `sendJobAssignmentEmail(email, firstName, jobData)`
   - Méthode `sendContractorVerifiedEmail(email, firstName, contractorData)`
   - Méthode `sendStripeConnectConfirmationEmail(email, firstName, accountData)`

2. Intégration SendGrid SDK:

   ```javascript
   const sgMail = require("@sendgrid/mail");
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   async function sendVerificationEmail(email, firstName, code) {
     const msg = {
       to: email,
       from: process.env.SENDGRID_FROM_EMAIL,
       templateId: process.env.SENDGRID_TEMPLATE_VERIFICATION,
       dynamicTemplateData: {
         firstName: firstName,
         verificationCode: code,
         expiryHours: 24,
       },
     };

     await sgMail.send(msg);
   }
   ```

3. Gestion des erreurs:
   - Retry logic (3 tentatives)
   - Logging (success/failure)
   - Alertes admin si échec multiple

**Estimation:** 4 jours

---

**Phase 4: Endpoints Manquants (Priorité MOYENNE)**

1. **Invitation Employee:**
   - `POST /swift-app/invite/employee`
   - Generate UUID token

   - Store in `employee_invitations` table
   - Send email
   - Return success

2. **Password Reset:**

- `POST /swift-app/password/forgot`
  - Generate 6-digit code
  - Store with 30-min expiry
  - Send email
  - `POST /swift-app/password/reset`
  - Validate code + expiry
- Hash new password
  - Update user
  - Delete code

1. **Contractor Verification:**
   - `POST /swift-app/admin/verify-contractor/:id`
   - Set `isVerified = true`
   - Send notification email

**Estimation:** 5 jours

---

**Phase 5: Email Analytics (Priorité BASSE)**

1. Dashboard SendGrid pour:
   - Taux d'ouverture
   - Taux de clics
   - Bounces
   - Spam reports
2. Webhooks SendGrid → Backend:
   - Email opened
   - Email clicked
   - Email bounced
   - Unsubscribed
3. Stockage analytics en BDD

**Estimation:** 3 jours

---

### 🔒 Sécurité Email

**Best Practices à implémenter:**

1. **Rate Limiting:**
   - Max 3 codes de vérification par heure par email
   - Max 5 reset password par jour par IP
   - Protection contre spam

2. **Validation Email:**
   - Vérifier format avant envoi
   - Vérifier domaine existe (DNS MX records)
   - Blacklist emails jetables (mailinator, etc.)

3. **Codes Sécurisés:**
   - 6 chiffres aléatoires (crypto.randomInt)

   - Expiration automatique (vérification: 24h, reset: 30 min)
   - Invalider après utilisation

4. **Protection SMTP:**
   - TLS obligatoire
   - API keys dans variables d'environnement (jamais en clair)
   - Rotation des API keys tous les 90 jours

5. **Contenu Email:**
   - Pas de données sensibles (pas de password en clair)
   - Liens avec HTTPS uniquement
   - Deep links signés (HMAC)

---

### 📋 Checklist Email System

**Setup Initial:**

- [ ] Créer compte SendGrid
- [ ] Vérifier domaine email
- [ ] Configurer DNS (SPF, DKIM, DMARC)
- [ ] Tester envoi email

**Templates:**

- [ ] Template vérification (existant à améliorer)
- [ ] Template invitation employee
- [ ] Template password reset
- [ ] Template bienvenue

- [ ] Template job assignment
- [ ] Template contractor verified
- [ ] Template Stripe Connect confirmé

**Backend:**

- [ ] Créer `services/emailService.js`
- [ ] Intégrer SendGrid SDK
- [ ] Créer toutes les méthodes d'envoi
- [ ] Ajouter retry logic + logging
- [ ] Tests unitaires

**Endpoints:**

- [ ] `POST /invite/employee` (avec email)
- [ ] `POST /password/forgot` (avec email)
- [ ] `POST /password/reset` (validation code)
- [ ] `POST /admin/verify-contractor/:id` (avec email)
- [ ] Webhooks Stripe (email confirmation)

**Sécurité:**

- [ ] Rate limiting
- [ ] Validation email avancée
- [ ] Codes sécurisés avec expiration
- [ ] Protection API keys
- [ ] Blacklist emails jetables

**Monitoring:**

- [ ] Dashboard SendGrid analytics
- [ ] Webhooks SendGrid → Backend
- [ ] Alertes échecs d'en
      voi
- [ ] Logs centralisés

---

### 💡 Recommandations Immédiates

1. **Améliorer email de vérification actuel:**
   - Passer à un template HTML pro
   - Ajouter logo SwiftApp
   - Ajouter expiration du code (24h)
   - Meilleur wording

2. **Priorité 1 - Invitation Employee:**
   - Requis pour workflow Business Owner
   - Bloquer pour MVP
   - Template + Backend + Email

3. **Priorité 2 - Password Reset:**
   - Feature standard attendue
   - Peu complexe à implémenter
   - Améliore UX

4. **Provider Email:**
   - SendGrid pour production
   - Setup dès maintenant pour éviter retards

---

## 🗄️ Schémas de Base de Données

### Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('business_owner', 'employee', 'contractor', 'job_provider')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'pending_verification' CHECK (account_status IN ('pending_verification', 'pending_documents', 'pending_approval', 'active', 'suspended', 'inactive')),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  terms_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### Table: `companies`

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  trading_name VARCHAR(200),
  abn VARCHAR(11) UNIQUE NOT NULL,
  acn VARCHAR(9),
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('sole_trader', 'partnership', 'company', 'trust')),
  industry_type VARCHAR(50) NOT NULL,
  company_email VARCHAR(255),
  company_phone VARCHAR(20) NOT NULL,

  -- Adresse
  street_address VARCHAR(200) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state VARCHAR(3) NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  postcode VARCHAR(4) NOT NULL,
  country VARCHAR(50) DEFAULT 'Australia',

  -- Banking (Stripe Connect)
  stripe_account_id VARCHAR(100) UNIQUE,
  stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
  bsb VARCHAR(7),
  account_number VARCHAR(10),
  account_name VARCHAR(200),

  -- Assurance
  insurance_provider VARCHAR(200),
  insurance_policy_number VARCHAR(100),
  insurance_expiry_date DATE,

  -- Abonnement
  plan_type VARCHAR(50) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  billing_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'yearly')),
  subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  subscription_start_date DATE,
  subscription_end_date DATE,

  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_companies_abn ON companies(abn);
CREATE INDEX idx_companies_stripe_account_id ON companies(stripe_account_id);
```

### Table: `employees`

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Informations d'emploi
  role VARCHAR(100),
  team VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  company_role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (company_role IN ('patron', 'cadre', 'employee')),

  -- Invitation
  invited_by UUID REFERENCES users(id),
  invitation_token UUID UNIQUE,
  invitation_sent_at TIMESTAMP,
  invitation_accepted_at TIMESTAMP,
  invitation_status VARCHAR(20) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'expired', 'cancelled')),

  account_linked BOOLEAN DEFAULT FALSE,
  employment_start_date DATE,
  employment_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_invitation_token ON employees(invitation_token);
CREATE UNIQUE INDEX idx_employees_one_company_per_user ON employees(user_id) WHERE is_active = TRUE;
```

### Table: `contractors`

```sql
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Informations Business
  business_name VARCHAR(200),
  trading_name VARCHAR(200),
  abn VARCHAR(11) UNIQUE NOT NULL,
  acn VARCHAR(9),
  gst_registered BOOLEAN DEFAULT FALSE,

  -- Adresse
  street_address VARCHAR(200) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state VARCHAR(3) NOT NULL,
  postcode VARCHAR(4) NOT NULL,
  country VARCHAR(50) DEFAULT 'Australia',

  -- Services
  specialization TEXT[], -- Array de spécialisations
  service_radius_km INT,
  experience_years INT,
  has_own_vehicle BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(100),
  team_size INT DEFAULT 1,

  -- Tarification
  rate_type VARCHAR(20) CHECK (rate_type IN ('hourly', 'daily', 'job_based')),
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2),
  minimum_job_charge DECIMAL(10, 2),

  -- Banking (Stripe Connect)
  stripe_account_id VARCHAR(100) UNIQUE,
  stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
  bsb VARCHAR(7),
  account_number VARCHAR(10),
  account_name VARCHAR(200),

  -- Assurance & Certifications
  insurance_provider VARCHAR(200),
  insurance_policy_number VARCHAR(100),
  insurance_expiry_date DATE,
  public_liability_amount DECIMAL(12, 2),
  workers_comp_policy VARCHAR(100),

  certifications TEXT[],
  police_check_date DATE,
  police_check_expiry DATE,

  -- Vérification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  verification_notes TEXT,

  availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contractors_user_id ON contractors(user_id);
CREATE INDEX idx_contractors_abn ON contractors(abn);
CREATE INDEX idx_contractors_is_verified ON contractors(is_verified);
CREATE INDEX idx_contractors_specialization ON contractors USING GIN(specialization);
```

### Table: `contractors_companies` (Many-to-Many)

```sql
CREATE TABLE contractors_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  contract_status VARCHAR(20) DEFAULT 'active' CHECK (contract_status IN ('active', 'paused', 'terminated')),
  is_exclusive BOOLEAN DEFAULT FALSE,
  contract_start_date DATE,
  contract_end_date DATE,
  negotiated_rate DECIMAL(10, 2),

  added_by UUID REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(contractor_id, company_id)
);

CREATE INDEX idx_contractors_companies_contractor ON contractors_companies(contractor_id);
CREATE INDEX idx_contractors_companies_company ON contractors_companies(company_id);
```

### Table: `job_providers`

```sql
CREATE TABLE job_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Entreprise fournisseur
  company_name VARCHAR(200) NOT NULL,
  trading_name VARCHAR(200),
  abn VARCHAR(11) UNIQUE NOT NULL,
  company_type VARCHAR(50),
  industry VARCHAR(100),
  company_email VARCHAR(255),
  company_phone VARCHAR(20) NOT NULL,
  website VARCHAR(255),

  -- Adresse
  street_address VARCHAR(200) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state VARCHAR(3) NOT NULL,
  postcode VARCHAR(4) NOT NULL,
  country VARCHAR(50) DEFAULT 'Australia',

  -- Services
  service_types TEXT[],
  coverage_areas TEXT[],
  service_capacity INT,

  -- Facturation
  billing_model VARCHAR(50) CHECK (billing_model IN ('commission', 'fixed_fee', 'subscription', 'hybrid')),
  commission_rate DECIMAL(5, 2),
  fixed_fee_per_job DECIMAL(10, 2),
  monthly_subscription DECIMAL(10, 2),

  -- Banking
  bsb VARCHAR(7),
  account_number VARCHAR(10),
  account_name VARCHAR(200),

  -- Permissions
  can_create_jobs BOOLEAN DEFAULT TRUE,
  can_assign_workers BOOLEAN DEFAULT FALSE,
  can_access_rates BOOLEAN DEFAULT FALSE,
  max_jobs_per_month INT,

  -- Vérification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  partnership_agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_date DATE,

  -- API
  api_access BOOLEAN DEFAULT FALSE,
  api_key_hash VARCHAR(255),
  api_rate_limit INT DEFAULT 1000,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_providers_user_id ON job_providers(user_id);
CREATE INDEX idx_job_providers_abn ON job_providers(abn);
CREATE INDEX idx_job_providers_is_verified ON job_providers(is_verified);
```

### Table: `oauth_accounts`

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'microsoft', 'linkedin')),
  provider_user_id VARCHAR(255) NOT NULL,

  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,

  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,

  profile_data JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id);
```

### Table: `employee_invitations`

```sql
CREATE TABLE employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),

  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(100),
  team VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  company_role VARCHAR(20) DEFAULT 'employee',

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  sent_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_company_id ON employee_invitations(company_id);
CREATE INDEX idx_employee_invitations_status ON employee_invitations(status);
```

### Table: `password_reset_codes`

```sql
CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,

  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX idx_password_reset_codes_code_hash ON password_reset_codes(code_hash);
CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
```

### Table: `verification_codes`

```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,

  type VARCHAR(20) NOT NULL CHECK (type IN ('email_verification', 'password_reset', 'phone_verification')),

  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,

  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code_hash ON verification_codes(code_hash);
CREATE INDEX idx_verification_codes_type ON verification_codes(type);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

### Table: `documents`

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,

  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'abn_proof', 'insurance_certificate', 'license', 'photo_id',
    'police_check', 'certification', 'partnership_agreement', 'contract'
  )),

  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT,
  file_type VARCHAR(50),

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,

  expiry_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_contractor_id ON documents(contractor_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
```

### Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,

  old_values JSONB,
  new_values JSONB,

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🔌 Spécifications API Complètes

### Base URL

```
Production: https://api.swiftapp.com.au/v1
Staging: https://api-staging.swiftapp.com.au/v1
Development: http://localhost:3000/api/v1
```

### Authentication Headers

```
Authorization: Bearer {session_token}
Content-Type: application/json
X-API-Version: 1.0
X-Device-ID: {unique_device_id}
```

### Rate Limiting

```
General: 100 requests / minute / IP
Authenticated: 500 requests / minute / user
Upload endpoints: 20 requests / minute / user
```

---

### POST /auth/register/business-owner

**Description:** Crée un compte Business Owner avec entreprise.

**Request Body:**

```json
{
  "user": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@movingcompany.com.au",
    "phone": "+61412345678",
    "dateOfBirth": "1985-03-15",
    "password": "SecurePass123!",
    "termsAccepted": true,
    "privacyAccepted": true
  },
  "company": {
    "companyName": "Smith Moving Services Pty Ltd",
    "tradingName": "Smith Movers",
    "abn": "12345678901",
    "acn": "123456789",
    "businessType": "company",
    "industryType": "removals",
    "companyEmail": "info@smithmovers.com.au",
    "companyPhone": "+61298765432",
    "address": {
      "streetAddress": "123 George Street",
      "suburb": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "country": "Australia"
    },
    "banking": {
      "bsb": "062-000",
      "accountNumber": "12345678",
      "accountName": "Smith Moving Services Pty Ltd"
    },
    "insurance": {
      "provider": "CGU Insurance",
      "policyNumber": "INS-123456",
      "expiryDate": "2027-12-31"
    },
    "subscription": {
      "planType": "professional",
      "billingFrequency": "monthly"
    }
  },
  "stripeConnectTermsAccepted": true
}
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "660e8400-e29b-41d4-a716-446655440001",
    "email": "john@movingcompany.com.au",
    "verificationCodeSent": true,
    "nextStep": "email_verification"
  },
  "message": "Account created successfully. Please check your email for verification code."
}
```

**Errors:**

```json
// 400 Bad Request - Validation
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ABN format",
    "field": "company.abn",
    "details": "ABN must be 11 digits"
  }
}

// 409 Conflict - Email exists
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists",
    "suggestion": "Try logging in or use password reset"
  }
}

// 409 Conflict - ABN exists
{
  "success": false,
  "error": {
    "code": "ABN_ALREADY_REGISTERED",
    "message": "This ABN is already registered",
    "field": "company.abn"
  }
}

// 422 Unprocessable Entity - ABN invalid
{
  "success": false,
  "error": {
    "code": "ABN_LOOKUP_FAILED",
    "message": "ABN validation failed",
    "details": "ABN not found in Australian Business Register or is inactive"
  }
}
```

---

### POST /auth/register/contractor

**Description:** Crée un compte Contractor (ABN).

**Request Body:**

```json
{
  "user": {
    "firstName": "Mike",
    "lastName": "Johnson",
    "email": "mike@contractorservices.com.au",
    "phone": "+61423456789",
    "dateOfBirth": "1990-07-22",
    "password": "SecurePass123!"
  },
  "contractor": {
    "businessName": "Mike Johnson Removals",
    "tradingName": "MJ Movers",
    "abn": "98765432101",
    "gstRegistered": true,
    "address": {
      "streetAddress": "45 Main Road",
      "suburb": "Melbourne",
      "state": "VIC",
      "postcode": "3000"
    },
    "services": {
      "specialization": ["furniture_removal", "packing", "interstate"],
      "serviceRadiusKm": 100,
      "experienceYears": 8,
      "hasOwnVehicle": true,
      "vehicleType": "10_tonne_truck",
      "teamSize": 3
    },
    "pricing": {
      "rateType": "hourly",
      "hourlyRate": 85.0,
      "minimumJobCharge": 200.0
    },
    "banking": {
      "bsb": "033-000",
      "accountNumber": "87654321",
      "accountName": "Mike Johnson"
    },
    "insurance": {
      "provider": "Allianz",
      "policyNumber": "POL-789012",
      "expiryDate": "2027-06-30",
      "publicLiabilityAmount": 20000000,
      "workersCompPolicy": "WC-456789"
    },
    "certifications": ["forklift_license", "first_aid", "white_card"]
  }
}
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "userId": "770e8400-e29b-41d4-a716-446655440002",
    "contractorId": "880e8400-e29b-41d4-a716-446655440003",
    "email": "mike@contractorservices.com.au",
    "verificationStatus": "pending_documents",
    "nextStep": "email_verification",
    "message": "Please verify your email and upload required documents for admin approval"
  }
}
```

---

### POST /auth/invite/employee

**Description:** Envoie une invitation par email à un employé.

**Headers:**

```
Authorization: Bearer {business_owner_token}
```

**Request Body:**

```json
{
  "email": "sarah@gmail.com",
  "firstName": "Sarah",
  "lastName": "Brown",
  "role": "Driver",
  "team": "Team A",
  "hourlyRate": 35.0,
  "companyRole": "employee"
}
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "invitationId": "990e8400-e29b-41d4-a716-446655440004",
    "token": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "email": "sarah@gmail.com",
    "expiresAt": "2026-02-04T10:30:00Z",
    "invitationLink": "swiftapp://invite/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "emailSent": true
  },
  "message": "Invitation sent successfully to sarah@gmail.com"
}
```

**Errors:**

```json
// 403 Forbidden - Not authorized
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only business owners and managers can invite employees"
  }
}

// 409 Conflict - Already invited
{
  "success": false,
  "error": {
    "code": "INVITATION_ALREADY_SENT",
    "message": "An active invitation already exists for this email",
    "expiresAt": "2026-02-04T10:30:00Z"
  }
}

// 409 Conflict - Already employee
{
  "success": false,
  "error": {
    "code": "ALREADY_EMPLOYEE",
    "message": "This user is already an employee of another company"
  }
}

// 429 Too Many Requests - Rate limit
{
  "success": false,
  "error": {
    "code": "INVITATION_RATE_LIMIT",
    "message": "Maximum 10 invitations per day reached",
    "retryAfter": "2026-01-29T00:00:00Z"
  }
}
```

---

### POST /auth/accept-invitation

**Description:** Accepte une invitation employé et crée le compte.

**Request Body:**

```json
{
  "token": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "email": "sarah@gmail.com",
  "phone": "+61434567890",
  "password": "MySecurePass456!",
  "termsAccepted": true,
  "privacyAccepted": true
}
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "userId": "aa0e8400-e29b-41d4-a716-446655440005",
    "employeeId": "bb0e8400-e29b-41d4-a716-446655440006",
    "email": "sarah@gmail.com",
    "company": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Smith Moving Services Pty Ltd",
      "tradingName": "Smith Movers"
    },
    "role": "Driver",
    "team": "Team A",
    "companyRole": "employee",
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_a1b2c3d4e5f6g7h8i9j0",
    "expiresIn": 900
  },
  "message": "Welcome to Smith Movers!"
}
```

**Errors:**

```json
// 400 Bad Request - Email mismatch
{
  "success": false,
  "error": {
    "code": "EMAIL_MISMATCH",
    "message": "Email does not match invitation"
  }
}

// 404 Not Found - Invalid token
{
  "success": false,
  "error": {
    "code": "INVITATION_NOT_FOUND",
    "message": "Invalid or expired invitation token"
  }
}

// 410 Gone - Expired
{
  "success": false,
  "error": {
    "code": "INVITATION_EXPIRED",
    "message": "This invitation has expired",
    "expiredAt": "2026-01-21T10:30:00Z"
  }
}
```

---

### POST /auth/password/forgot

**Description:** Envoie un code de réinitialisation par email.

**Request Body:**

```json
{
  "email": "john@movingcompany.com.au"
}
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "If an account exists with this email, a reset code has been sent",
  "expiresIn": 1800
}
```

**Note:** Même réponse si l'email n'existe pas (sécurité - pas de user enumeration).

---

### POST /auth/password/reset

**Description:** Réinitialise le mot de passe avec le code reçu.

**Request Body:**

```json
{
  "email": "john@movingcompany.com.au",
  "code": "123456",
  "newPassword": "NewSecurePass789!"
}
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Errors:**

```json
// 400 Bad Request - Invalid code
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_CODE",
    "message": "Invalid or expired reset code",
    "attemptsRemaining": 2
  }
}

// 429 Too Many Requests - Too many attempts
{
  "success": false,
  "error": {
    "code": "TOO_MANY_ATTEMPTS",
    "message": "Too many failed attempts. Please request a new code.",
    "retryAfter": "2026-01-28T11:00:00Z"
  }
}
```

---

### POST /auth/verify-email

**Description:** Vérifie l'email avec le code reçu (existant).

**Request Body:**

```json
{
  "email": "john@movingcompany.com.au",
  "code": "654321"
}
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "emailVerified": true,
    "accountStatus": "active"
  },
  "message": "Email verified successfully!"
}
```

---

### GET /validation/abn/{abn}

**Description:** Valide un ABN via Australian Business Register API.

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "abn": "12345678901",
    "abnFormatted": "12 345 678 901",
    "isValid": true,
    "isActive": true,
    "entityName": "SMITH MOVING SERVICES PTY LTD",
    "entityTypeName": "Australian Private Company",
    "gstRegistered": true,
    "gstEffectiveFrom": "2015-01-01",
    "address": {
      "state": "NSW",
      "postcode": "2000"
    }
  }
}
```

**Errors:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ABN_NOT_FOUND",
    "message": "ABN not found in Australian Business Register"
  }
}

// 422 Unprocessable Entity
{
  "success": false,
  "error": {
    "code": "ABN_INACTIVE",
    "message": "This ABN is registered but currently inactive",
    "cancelledDate": "2025-06-15"
  }
}
```

---

### POST /documents/upload

**Description:** Upload un document (ABN proof, insurance, etc.).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (multipart/form-data):**

```
file: [binary]
documentType: "abn_proof"
expiryDate: "2027-12-31" (optionnel)
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "documentId": "cc0e8400-e29b-41d4-a716-446655440007",
    "documentType": "abn_proof",
    "fileName": "abn_certificate.pdf",
    "fileSize": 245678,
    "status": "pending",
    "uploadedAt": "2026-01-28T10:15:00Z",
    "expiryDate": "2027-12-31"
  },
  "message": "Document uploaded successfully. Awaiting admin review."
}
```

**Errors:**

```json
// 400 Bad Request - Invalid file
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PDF, JPG, PNG files are accepted",
    "allowedTypes": ["application/pdf", "image/jpeg", "image/png"]
  }
}

// 413 Payload Too Large
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit",
    "maxSize": "5MB",
    "actualSize": "7.2MB"
  }
}
```

---

### GET /users/me

**Description:** Récupère les informations du profil utilisateur connecté.

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200 OK (Business Owner):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@movingcompany.com.au",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+61412345678",
      "userType": "business_owner",
      "accountStatus": "active",
      "emailVerified": true,
      "createdAt": "2026-01-15T08:30:00Z"
    },
    "company": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "companyName": "Smith Moving Services Pty Ltd",
      "tradingName": "Smith Movers",
      "abn": "12345678901",
      "planType": "professional",
      "subscriptionStatus": "active",
      "stripeAccountId": "acct_1234567890",
      "stripeOnboardingCompleted": true
    }
  }
}
```

---

## 🌍 Internationalisation (i18n)

### Langues Supportées

```typescript
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];
```

### Structure des Traductions

**Fichiers:** `src/localization/translations/{lang}.ts`

```typescript
// src/localization/translations/en.ts
export default {
  registration: {
    businessOwner: {
      title: "Register Your Business",
      subtitle: "Get started with SwiftApp",
      steps: {
        personal: "Personal Info",
        business: "Business Details",
        address: "Address",
        banking: "Banking",
        insurance: "Insurance",
        subscription: "Choose Plan",
        documents: "Documents",
        review: "Review & Submit",
      },
      fields: {
        firstName: {
          label: "First Name",
          placeholder: "Enter your first name",
          error: {
            required: "First name is required",
            minLength: "Must be at least 2 characters",
            maxLength: "Must be less than 50 characters",
          },
        },
        lastName: {
          label: "Last Name",
          placeholder: "Enter your last name",
          error: {
            required: "Last name is required",
            minLength: "Must be at least 2 characters",
          },
        },
        email: {
          label: "Email Address",
          placeholder: "your@email.com",
          error: {
            required: "Email is required",
            invalid: "Please enter a valid email address",
            alreadyExists: "An account with this email already exists",
          },
        },
        phone: {
          label: "Mobile Phone",
          placeholder: "+61 4XX XXX XXX",
          error: {
            required: "Phone number is required",
            invalid: "Please enter a valid Australian mobile number",
          },
        },
        abn: {
          label: "ABN (Australian Business Number)",
          placeholder: "XX XXX XXX XXX",
          error: {
            required: "ABN is required",
            invalid: "ABN must be 11 digits",
            notFound: "ABN not found in Australian Business Register",
            inactive: "This ABN is inactive",
            alreadyRegistered: "This ABN is already registered",
          },
          helperText: "Your 11-digit Australian Business Number",
        },
        bsb: {
          label: "BSB",
          placeholder: "XXX-XXX",
          error: {
            required: "BSB is required",
            invalid: "BSB must be 6 digits (XXX-XXX format)",
          },
        },
      },
      buttons: {
        next: "Next",
        previous: "Previous",
        submit: "Submit Registration",
        skip: "Skip for now",
        cancel: "Cancel",
      },
      success: {
        title: "Registration Successful!",
        message: "Please check your email to verify your account",
        action: "Go to Email Verification",
      },
    },
    employee: {
      title: "Accept Invitation",
      subtitle: "Join {{companyName}}",
      invitationExpired: "This invitation has expired",
      invitationInvalid: "Invalid invitation link",
      alreadyAccepted: "This invitation has already been accepted",
      fields: {
        // Similar structure...
      },
    },
    contractor: {
      title: "Register as Contractor",
      subtitle: "Join SwiftApp network",
      // Similar structure...
    },
    validation: {
      password: {
        tooShort: "Password must be at least 8 characters",
        noUppercase: "Password must contain at least one uppercase letter",
        noLowercase: "Password must contain at least one lowercase letter",
        noNumber: "Password must contain at least one number",
        noSpecial: "Password must contain at least one special character",
      },
      passwordMismatch: "Passwords do not match",
      termsRequired: "You must accept the Terms and Conditions",
      privacyRequired: "You must accept the Privacy Policy",
      minAge: "You must be at least 18 years old",
    },
    errors: {
      networkError: "Network error. Please check your connection.",
      serverError: "Server error. Please try again later.",
      timeoutError: "Request timeout. Please try again.",
      unknownError: "An unexpected error occurred",
      validationFailed: "Please correct the errors and try again",
    },
  },
  emailVerification: {
    title: "Verify Your Email",
    subtitle: "Enter the 6-digit code sent to {{email}}",
    codePlaceholder: "Enter code",
    resendCode: "Resend Code",
    resendIn: "Resend in {{seconds}}s",
    codeResent: "Code resent successfully",
    verifying: "Verifying...",
    success: "Email verified successfully!",
    errors: {
      invalidCode: "Invalid verification code",
      expiredCode: "This code has expired. Please request a new one.",
      tooManyAttempts: "Too many attempts. Please request a new code.",
    },
  },
  oauth: {
    continueWith: "Continue with {{provider}}",
    orSeparator: "OR",
    linking: "Linking your {{provider}} account...",
    errors: {
      cancelled: "Sign in was cancelled",
      failed: "Failed to sign in with {{provider}}",
      emailExists: "An account with this email already exists. Please log in.",
      invalidToken: "Invalid authentication token",
      networkError: "Network error. Please try again.",
    },
  },
};
```

### Validation des Formats par Pays

```typescript
// src/utils/validators.ts
export const validationPatterns = {
  phone: {
    AU: /^\+61\s?4\d{2}\s?\d{3}\s?\d{3}$/,
    US: /^\+1\s?\d{3}\s?\d{3}\s?\d{4}$/,
    FR: /^\+33\s?[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
  },
  postcode: {
    AU: /^\d{4}$/,
    US: /^\d{5}(-\d{4})?$/,
    FR: /^\d{5}$/,
  },
  businessNumber: {
    AU: {
      abn: /^\d{11}$/,
      acn: /^\d{9}$/,
    },
    US: {
      ein: /^\d{2}-?\d{7}$/,
    },
  },
};
```

### Clés de Traduction - Messages d'Erreur API

```typescript
// Backend error codes mapped to i18n keys
export const ERROR_CODE_TO_I18N_KEY = {
  EMAIL_ALREADY_EXISTS: "registration.errors.emailExists",
  ABN_ALREADY_REGISTERED:
    "registration.businessOwner.fields.abn.error.alreadyRegistered",
  ABN_NOT_FOUND: "registration.businessOwner.fields.abn.error.notFound",
  ABN_INACTIVE: "registration.businessOwner.fields.abn.error.inactive",
  VALIDATION_ERROR: "registration.errors.validationFailed",
  INVITATION_EXPIRED: "registration.employee.invitationExpired",
  INVALID_RESET_CODE: "passwordReset.errors.invalidCode",
  INSUFFICIENT_PERMISSIONS: "errors.insufficientPermissions",
  // ... etc
};
```

---

## 📊 Analytics & Tracking

### Events à Tracker

**Configuration:** Amplitude / Mixpanel / Firebase Analytics

```typescript
// src/services/analytics.ts

export const ANALYTICS_EVENTS = {
  // Registration Flow
  REGISTRATION_STARTED: "registration_started",
  REGISTRATION_STEP_VIEWED: "registration_step_viewed",
  REGISTRATION_STEP_COMPLETED: "registration_step_completed",
  REGISTRATION_FAILED: "registration_failed",
  REGISTRATION_COMPLETED: "registration_completed",
  REGISTRATION_ABANDONED: "registration_abandoned",

  // Email Verification
  EMAIL_VERIFICATION_STARTED: "email_verification_started",
  EMAIL_VERIFICATION_CODE_ENTERED: "email_verification_code_entered",
  EMAIL_VERIFICATION_CODE_RESENT: "email_verification_code_resent",
  EMAIL_VERIFICATION_COMPLETED: "email_verification_completed",
  EMAIL_VERIFICATION_FAILED: "email_verification_failed",

  // OAuth
  OAUTH_STARTED: "oauth_started",
  OAUTH_COMPLETED: "oauth_completed",
  OAUTH_FAILED: "oauth_failed",
  OAUTH_CANCELLED: "oauth_cancelled",

  // Employee Invitation
  INVITATION_SENT: "invitation_sent",
  INVITATION_VIEWED: "invitation_viewed",
  INVITATION_ACCEPTED: "invitation_accepted",
  INVITATION_EXPIRED: "invitation_expired",

  // Document Upload
  DOCUMENT_UPLOAD_STARTED: "document_upload_started",
  DOCUMENT_UPLOAD_COMPLETED: "document_upload_completed",
  DOCUMENT_UPLOAD_FAILED: "document_upload_failed",

  // Errors
  VALIDATION_ERROR: "validation_error",
  API_ERROR: "api_error",
  NETWORK_ERROR: "network_error",
};

export interface RegistrationStartedProperties {
  user_type: "business_owner" | "employee" | "contractor" | "job_provider";
  source: "organic" | "invitation" | "oauth" | "referral";
  device_type: "ios" | "android" | "web";
  language: string;
}

export interface RegistrationStepViewedProperties {
  user_type: string;
  step_number: number;
  step_name: string;
  time_on_previous_step?: number; // seconds
}

export interface RegistrationStepCompletedProperties {
  user_type: string;
  step_number: number;
  step_name: string;
  time_to_complete: number; // seconds
  fields_filled: number;
  fields_total: number;
}

export interface RegistrationFailedProperties {
  user_type: string;
  step_number: number;
  step_name: string;
  error_code: string;
  error_message: string;
  field_name?: string;
}

export interface RegistrationCompletedProperties {
  user_id: string;
  user_type: string;
  total_time: number; // seconds
  steps_completed: number;
  oauth_used: boolean;
  oauth_provider?: string;
  documents_uploaded: number;
}

// Usage Example
import { trackEvent } from "./analytics";

trackEvent(ANALYTICS_EVENTS.REGISTRATION_STARTED, {
  user_type: "business_owner",
  source: "organic",
  device_type: "android",
  language: "en",
});

trackEvent(ANALYTICS_EVENTS.REGISTRATION_STEP_COMPLETED, {
  user_type: "business_owner",
  step_number: 2,
  step_name: "business_details",
  time_to_complete: 145,
  fields_filled: 8,
  fields_total: 10,
});
```

### Funnels d'Inscription

```typescript
// Funnel steps to monitor in Amplitude/Mixpanel
export const REGISTRATION_FUNNELS = {
  BUSINESS_OWNER: [
    "registration_started",
    "registration_step_viewed", // step 1
    "registration_step_completed", // step 1
    "registration_step_viewed", // step 2
    // ... all steps
    "registration_completed",
    "email_verification_started",
    "email_verification_completed",
    "stripe_connect_started",
    "stripe_connect_completed",
  ],
  EMPLOYEE: [
    "invitation_viewed",
    "registration_started",
    "registration_step_completed",
    "registration_completed",
    "email_verification_completed",
  ],
  CONTRACTOR: [
    "registration_started",
    // ... steps
    "document_upload_completed",
    "registration_completed",
    "admin_verification_pending",
    "admin_verification_approved",
  ],
};
```

### User Properties à Définir

```typescript
export interface UserProperties {
  user_id: string;
  user_type: "business_owner" | "employee" | "contractor" | "job_provider";
  account_status: string;
  email_verified: boolean;
  registration_date: string; // ISO date
  registration_source: string;
  oauth_providers: string[]; // ['google', 'facebook']

  // Business Owner specific
  company_id?: string;
  company_name?: string;
  abn?: string;
  plan_type?: string;
  subscription_status?: string;
  stripe_connected?: boolean;
  employees_count?: number;

  // Contractor specific
  contractor_verified?: boolean;
  specializations?: string[];
  active_contracts?: number;

  // Employee specific
  company_role?: string;
  invitation_accepted_date?: string;
}
```

### Dashboard Metrics

**KPIs à Monitorer:**

1. **Taux de Conversion Global**
   - Started → Completed
   - Par user type
   - Par source (organic, oauth, invitation)

2. **Taux d'Abandon par Étape**
   - Identifier les étapes bloquantes
   - Heat map des champs avec erreurs

3. **Temps Moyen de Complétion**
   - Par user type
   - Par étape
   - Benchmark: <5min Business Owner, <2min Employee

4. **Taux de Succès OAuth**
   - Par provider (Google, Facebook, Apple)
   - Conversion OAuth vs email/password

5. **Email Verification**
   - Taux de vérification (1h, 24h, 7j)
   - Nombre de codes renvoyés
   - Taux d'échec

6. **Documents Upload**
   - Taux de complétion
   - Taux de rejet
   - Types de documents les plus rejetés

---

## 🛡️ GDPR & Privacy

### Consentements Requis

```typescript
// src/types/consent.ts
export interface UserConsents {
  terms_and_conditions: {
    accepted: boolean;
    version: string; // e.g., "1.2"
    accepted_at: Date;
    ip_address: string;
  };
  privacy_policy: {
    accepted: boolean;
    version: string;
    accepted_at: Date;
    ip_address: string;
  };
  marketing_communications: {
    email: boolean;
    sms: boolean;
    push_notifications: boolean;
    accepted_at?: Date;
  };
  data_sharing: {
    with_contractors: boolean; // Share contact info with assigned contractors
    with_job_providers: boolean;
    analytics: boolean; // Anonymous analytics
    accepted_at?: Date;
  };
  cookies: {
    necessary: boolean; // Always true, can't opt out
    functional: boolean;
    analytics: boolean;
    advertising: boolean;
    accepted_at?: Date;
  };
}
```

### Table Base de Données - Consentements

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
    'terms_and_conditions',
    'privacy_policy',
    'marketing_email',
    'marketing_sms',
    'marketing_push',
    'data_sharing_contractors',
    'data_sharing_job_providers',
    'analytics',
    'cookies_functional',
    'cookies_analytics',
    'cookies_advertising'
  )),

  consent_given BOOLEAN NOT NULL,
  version VARCHAR(10), -- e.g., "1.2" for T&C version

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
```

### Écran de Consentement (Registration)

```typescript
// Dans le formulaire d'inscription
<View style={styles.consentsSection}>
  <Text style={styles.sectionTitle}>Required Agreements</Text>

  <Checkbox
    checked={consents.termsAccepted}
    onChange={(checked) => setConsents({...consents, termsAccepted: checked})}
    label={
      <Text>
        I accept the{' '}
        <Link href="/terms" style={styles.link}>Terms and Conditions</Link>
        {' '}(v1.2)
      </Text>
    }
    required
  />

  <Checkbox
    checked={consents.privacyAccepted}
    onChange={(checked) => setConsents({...consents, privacyAccepted: checked})}
    label={
      <Text>
        I accept the{' '}
        <Link href="/privacy" style={styles.link}>Privacy Policy</Link>
        {' '}(v1.2)
      </Text>
    }
    required
  />

  {userType === 'business_owner' && (
    <Checkbox
      checked={consents.stripeConnectAccepted}
      onChange={(checked) => setConsents({...consents, stripeConnectAccepted: checked})}
      label={
        <Text>
          I accept the{' '}
          <Link href="/stripe-connected-account" style={styles.link}>
            Stripe Connected Account Agreement
          </Link>
        </Text>
      }
      required
    />
  )}

  <Text style={styles.sectionTitle}>Optional (You can change these later)</Text>

  <Checkbox
    checked={consents.marketingEmail}
    onChange={(checked) => setConsents({...consents, marketingEmail: checked})}
    label="I want to receive marketing emails about new features and offers"
  />

  <Checkbox
    checked={consents.marketingSms}
    onChange={(checked) => setConsents({...consents, marketingSms: checked})}
    label="I want to receive SMS notifications about jobs and updates"
  />
</View>
```

### Droit à l'Oubli (Right to be Forgotten)

**Endpoint:** `DELETE /users/me`

**Process:**

1. User requests account deletion
2. 30-day grace period (soft delete)
3. After 30 days, permanent deletion:
   - Anonymize personal data (keep for analytics: "user_12345")
   - Delete: email, phone, address, documents
   - Keep: transaction records (legal requirement - 7 years)
   - Cascade delete: OAuth accounts, tokens, sessions
   - Notify: Stripe (close connected account), SendGrid (unsubscribe)

```sql
-- Soft delete (user can still recover within 30 days)
UPDATE users
SET deleted_at = NOW(),
    account_status = 'deleted'
WHERE id = '...';

-- Hard delete (after 30 days)
-- 1. Anonymize
UPDATE users
SET
  email = CONCAT('deleted_', id, '@deleted.swiftapp.local'),
  phone = NULL,
  first_name = 'Deleted',
  last_name = 'User',
  date_of_birth = NULL,
  password_hash = 'DELETED'
WHERE id = '...' AND deleted_at < NOW() - INTERVAL '30 days';

-- 2. Delete related data
DELETE FROM oauth_accounts WHERE user_id = '...';
DELETE FROM documents WHERE user_id = '...';
DELETE FROM verification_codes WHERE user_id = '...';
-- Keep audit_logs for compliance
```

### Export de Données (Data Portability)

**Endpoint:** `GET /users/me/export`

**Response:** ZIP file containing JSON files:

- `profile.json`: User personal info
- `company.json`: Company data (if business owner)
- `consents.json`: All consents history
- `documents.json`: Metadata + download links
- `jobs.json`: Jobs history
- `invoices.json`: Billing history
- `audit_log.json`: Account activity

```json
// profile.json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@movingcompany.com.au",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+61412345678",
    "dateOfBirth": "1985-03-15",
    "userType": "business_owner",
    "createdAt": "2026-01-15T08:30:00Z"
  },
  "consents": [
    {
      "type": "terms_and_conditions",
      "version": "1.2",
      "accepted": true,
      "acceptedAt": "2026-01-15T08:30:00Z"
    }
  ]
}
```

### Durée de Conservation des Données

| Type de Données             | Durée de Conservation           | Raison                   |
| --------------------------- | ------------------------------- | ------------------------ |
| Profil utilisateur actif    | Indéfinie (jusqu'à suppression) | Service actif            |
| Compte supprimé (soft)      | 30 jours                        | Grace period             |
| Compte supprimé (anonymisé) | 7 ans                           | Compliance légale (ATO)  |
| Transactions financières    | 7 ans                           | Australian Tax Law       |
| Documents KYC (Stripe)      | 7 ans après fin relation        | Compliance Stripe        |
| Codes de vérification       | 24-48h                          | Sécurité                 |
| Tokens d'invitation         | 7 jours                         | Feature expiry           |
| Sessions (access tokens)    | 15 minutes                      | Sécurité                 |
| Refresh tokens              | 30 jours                        | Sécurité                 |
| Audit logs                  | 2 ans                           | Sécurité & investigation |
| Analytics (anonyme)         | Indéfinie                       | Amélioration service     |

---

## 🔔 Système de Notifications Push

### Configuration FCM (Firebase Cloud Messaging)

**Fichiers requis:**

- `android/app/google-services.json`
- `ios/GoogleService-Info.plist`

**Installation:**

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Table Base de Données - Push Tokens

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(500) UNIQUE NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),

  device_id VARCHAR(255),
  device_name VARCHAR(255),
  device_model VARCHAR(100),
  os_version VARCHAR(50),
  app_version VARCHAR(20),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);
```

### Demande de Permission (UX Timing)

**❌ Mauvais:** Demander immédiatement à l'ouverture de l'app

**✅ Bon:** Demander après inscription complétée

```typescript
// src/screens/RegistrationCompletedScreen.tsx
const RegistrationCompletedScreen = () => {
  const requestPushPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // User denied, continue without push
      console.log('Push notifications denied');
      return;
    }

    // Get token and save to backend
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await savePushToken(token);
  };

  return (
    <View style={styles.container}>
      <CheckmarkAnimation />
      <Text style={styles.title}>Welcome to SwiftApp!</Text>
      <Text style={styles.subtitle}>Your account is ready</Text>

      <Card style={styles.pushCard}>
        <Icon name="bell" size={48} color="#7E3AF2" />
        <Text style={styles.pushTitle}>Stay Updated</Text>
        <Text style={styles.pushDescription}>
          Get notified about new jobs, team messages, and important updates
        </Text>
        <Button onPress={requestPushPermission}>
          Enable Notifications
        </Button>
        <TextButton onPress={navigateToHome}>
          Skip for now
        </TextButton>
      </Card>
    </View>
  );
};
```

### Notifications Post-Inscription

**Business Owner:**

- "Welcome! Start by inviting your first employee"
- "Don't forget to upload your insurance certificate"
- "Your Stripe Connect setup is pending"

**Employee:**

- "Welcome to [Company Name]!"
- "Check out your first assigned job"
- "Complete your profile to get started"

**Contractor:**

- "Your documents are under review"
- "You're now verified! Start accepting jobs"

**Job Provider:**

- "Your partnership agreement is pending signature"
- "API access granted - check your dashboard"

### Types de Notifications

```typescript
export enum NotificationType {
  // Registration
  WELCOME = "welcome",
  EMAIL_VERIFIED = "email_verified",
  DOCUMENTS_APPROVED = "documents_approved",
  DOCUMENTS_REJECTED = "documents_rejected",

  // Invitation
  EMPLOYEE_INVITED = "employee_invited",
  INVITATION_REMINDER = "invitation_reminder",

  // Jobs
  JOB_ASSIGNED = "job_assigned",
  JOB_STARTED = "job_started",
  JOB_COMPLETED = "job_completed",

  // Payments
  INVOICE_SENT = "invoice_sent",
  PAYMENT_RECEIVED = "payment_received",
  PAYOUT_PROCESSED = "payout_processed",

  // System
  SUBSCRIPTION_EXPIRING = "subscription_expiring",
  INSURANCE_EXPIRING = "insurance_expiring",
  SYSTEM_MAINTENANCE = "system_maintenance",
}
```

---

## 🔗 Deep Linking & Universal Links

### Configuration

**iOS - Universal Links:**

**Fichier:** `ios/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.swiftapp.mobile",
        "paths": ["/invite/*", "/reset-password/*", "/verify-email/*"]
      }
    ]
  }
}
```

**Android - App Links:**

**Fichier:** `android/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.swiftapp.mobile",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

### Schema URLs

```typescript
// app.json
{
  "expo": {
    "scheme": "swiftapp",
    "ios": {
      "associatedDomains": ["applinks:swiftapp.com.au"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "swiftapp.com.au",
              "pathPrefix": "/invite"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Deep Link Handlers

```typescript
// src/navigation/DeepLinkHandler.tsx
import * as Linking from "expo-linking";

const DeepLinkHandler = () => {
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { hostname, path, queryParams } = Linking.parse(event.url);

      // swiftapp://invite/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
      // https://swiftapp.com.au/invite/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d

      if (path?.startsWith("invite/")) {
        const token = path.split("invite/")[1];
        navigation.navigate("AcceptInvitation", { token });
      }

      // swiftapp://reset-password/123456
      else if (path?.startsWith("reset-password/")) {
        const code = path.split("reset-password/")[1];
        navigation.navigate("ResetPassword", { code });
      }

      // swiftapp://verify-email/654321
      else if (path?.startsWith("verify-email/")) {
        const code = path.split("verify-email/")[1];
        navigation.navigate("VerifyEmail", { code });
      }
    };

    // Handle app opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Handle deep link while app is open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => subscription.remove();
  }, []);

  return null;
};
```

### Deferred Deep Linking

**Problème:** User clique sur invitation link mais app pas installée.

**Solution:** Branch.io ou Firebase Dynamic Links

```typescript
// src/services/branchio.ts
import branch from "react-native-branch";

// Create invitation link with deferred deep linking
export const createInvitationLink = async (invitationData: {
  token: string;
  companyName: string;
  inviterName: string;
}) => {
  const buo = await branch.createBranchUniversalObject("invitation", {
    canonicalIdentifier: `invitation/${invitationData.token}`,
    title: `Join ${invitationData.companyName} on SwiftApp`,
    contentDescription: `${invitationData.inviterName} invited you to join their team`,
    contentImageUrl: "https://swiftapp.com.au/images/invitation-preview.png",
    contentMetadata: {
      customMetadata: {
        token: invitationData.token,
        type: "employee_invitation",
      },
    },
  });

  const linkProperties = {
    feature: "invitation",
    channel: "email",
    campaign: "employee_invitation",
  };

  const controlParams = {
    $desktop_url: `https://swiftapp.com.au/invite/${invitationData.token}`,
    $ios_url: `swiftapp://invite/${invitationData.token}`,
    $android_url: `swiftapp://invite/${invitationData.token}`,
    $fallback_url: "https://swiftapp.com.au/download",
  };

  const { url } = await buo.generateShortUrl(linkProperties, controlParams);
  return url; // https://swiftapp.app.link/abc123
};

// Handle deferred deep link (app just installed)
export const subscribeToDeferredDeepLink = (
  callback: (params: any) => void,
) => {
  branch.subscribe(({ error, params }) => {
    if (error) {
      console.error("Branch error:", error);
      return;
    }

    if (params["+non_branch_link"]) {
      // Non-Branch link, ignore
      return;
    }

    if (params["+clicked_branch_link"]) {
      // User came from Branch link
      const { token, type } = params;

      if (type === "employee_invitation") {
        callback({ type: "invitation", token });
      }
    }
  });
};
```

**Email Template avec Deep Link:**

```html
<a
  href="https://swiftapp.app.link/invite-abc123"
  style="display: inline-block; padding: 12px 24px; background: #7E3AF2; color: white; text-decoration: none; border-radius: 8px;"
>
  Accept Invitation
</a>
```

**Workflow:**

1. User clique sur link dans email
2. Si app installée → Ouvre app avec token
3. Si app pas installée → Redirect vers App Store/Play Store
4. Après installation → App ouvre avec token (deferred deep link)
5. User arrive directement sur écran d'inscription avec données pré-remplies

---

## 💰 Analyse des Coûts

### Coûts Mensuels Estimés

**Email - SendGrid:**

- Free: 100 emails/jour (3,000/mois) - GRATUIT
- Essentials: $19.95/mois - 50,000 emails
- Pro: $89.95/mois - 100,000 emails
- **Recommandé pour MVP:** Essentials ($19.95)

**Stripe Connect:**

- Pas de frais mensuels
- 1.75% + $0.30 par transaction réussie (Australia)
- **Exemple:** Job de $500 → Frais = $9.05

**ABN Lookup API:**

- ABR Web Services: GRATUIT
- Commercial providers (plus rapide): $0.01-0.05 par lookup
- **Estimation:** 100 registrations/mois = $1-5/mois

**Stockage Documents (AWS S3 / Cloudflare R2):**

- S3: $0.023 par GB/mois + $0.09 per GB transfer
- R2: $0.015 per GB/mois + NO egress fees
- **Estimation:** 1000 documents (10MB chacun) = 10GB = $0.15/mois (R2)

**Firebase (Push Notifications, Analytics):**

- Spark Plan: GRATUIT jusqu'à:
  - 10GB Cloud Storage
  - 20k writes/jour
  - 50k reads/jour
  - Notifications illimitées
- **Cost:** GRATUIT pour MVP

**Background Checks (CheckWorkRights / VEDA):**

- Police Check: $50-80 par vérification
- Reference Check: $30-50 par check
- **Optionnel pour MVP**

**Branch.io (Deferred Deep Linking):**

- Free: 10,000 MAU (Monthly Active Users)
- Growth: $299/mois - 100,000 MAU
- **Recommandé:** Free tier pour MVP

**Amplitude / Mixpanel (Analytics):**

- Amplitude Free: 10M events/mois
- Mixpanel Free: 100k events/mois
- **Cost:** GRATUIT pour MVP

### Total Coûts MVP (0-500 users)

| Service               | Cost/mois     | Notes                         |
| --------------------- | ------------- | ----------------------------- |
| SendGrid Essentials   | $19.95        | 50k emails                    |
| Stripe Connect        | Variable      | 1.75% + $0.30 par transaction |
| ABN Lookup            | $5            | ~100 registrations            |
| Cloudflare R2 Storage | $1            | ~10GB documents               |
| Firebase              | GRATUIT       | Push, Analytics               |
| Branch.io             | GRATUIT       | <10k MAU                      |
| Amplitude             | GRATUIT       | <10M events                   |
| **TOTAL FIXE**        | **~$26/mois** | Hors Stripe fees              |

### Scaling (500-5000 users)

| Service          | Cost/mois      |
| ---------------- | -------------- |
| SendGrid Pro     | $89.95         |
| ABN Lookup       | $50            |
| R2 Storage       | $15            |
| Firebase Blaze   | $25            |
| Branch.io Growth | $299           |
| Amplitude Plus   | $99            |
| **TOTAL**        | **~$578/mois** |

---

## 🧪 Stratégie de Test

### Tests Unitaires

**Fichiers à tester:**

```
__tests__/
  validation/
    validators.test.ts          # ABN, BSB, email, phone
    passwordStrength.test.ts
  utils/
    formatters.test.ts          # Format ABN, phone, etc.
  services/
    authService.test.ts
    registrationService.test.ts
```

**Exemple - ABN Validator:**

```typescript
// __tests__/validation/validators.test.ts
import { validateABN, formatABN } from "@/utils/validators";

describe("ABN Validator", () => {
  it("should validate correct ABN", () => {
    expect(validateABN("12345678901")).toBe(true);
    expect(validateABN("12 345 678 901")).toBe(true);
  });

  it("should reject invalid ABN format", () => {
    expect(validateABN("123456789")).toBe(false); // Too short
    expect(validateABN("12345678901234")).toBe(false); // Too long
    expect(validateABN("abc12345678")).toBe(false); // Letters
  });

  it("should format ABN correctly", () => {
    expect(formatABN("12345678901")).toBe("12 345 678 901");
  });
});

describe("BSB Validator", () => {
  it("should validate correct BSB", () => {
    expect(validateBSB("062000")).toBe(true);
    expect(validateBSB("062-000")).toBe(true);
  });

  it("should reject invalid BSB", () => {
    expect(validateBSB("12345")).toBe(false); // Too short
    expect(validateBSB("abc123")).toBe(false); // Letters
  });
});
```

**Coverage Minimum:** 80% pour utils/validators

### Tests d'Intégration

**Fichiers:**

```
__tests__/
  integration/
    registration/
      businessOwner.test.ts
      employee.test.ts
      contractor.test.ts
    api/
      auth.test.ts
      invitations.test.ts
```

**Exemple:**

```typescript
// __tests__/integration/registration/businessOwner.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BusinessOwnerRegistration from '@/screens/registration/BusinessOwnerRegistration';
import { mockAPI } from '@/tests/mocks';

describe('Business Owner Registration Flow', () => {
  beforeEach(() => {
    mockAPI.reset();
  });

  it('should complete full registration flow', async () => {
    const { getByPlaceholderText, getByText } = render(<BusinessOwnerRegistration />);

    // Step 1: Personal Info
    fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Smith');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@test.com');
    fireEvent.press(getByText('Next'));

    // Step 2: Business Details
    await waitFor(() => {
      expect(getByPlaceholderText('Company Name')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Company Name'), 'Test Movers');
    fireEvent.changeText(getByPlaceholderText('ABN'), '12345678901');

    // Mock ABN validation API
    mockAPI.onGet('/validation/abn/12345678901').reply(200, {
      success: true,
      data: { isValid: true, isActive: true }
    });

    await waitFor(() => {
      expect(getByText('✓ ABN Verified')).toBeTruthy();
    });

    // ... Continue with other steps

    fireEvent.press(getByText('Submit Registration'));

    // Mock registration API
    mockAPI.onPost('/auth/register/business-owner').reply(201, {
      success: true,
      data: { userId: '123', verificationCodeSent: true }
    });

    await waitFor(() => {
      expect(getByText('Registration Successful!')).toBeTruthy();
    });
  });

  it('should show error for duplicate ABN', async () => {
    // ... Setup

    mockAPI.onPost('/auth/register/business-owner').reply(409, {
      success: false,
      error: {
        code: 'ABN_ALREADY_REGISTERED',
        message: 'This ABN is already registered'
      }
    });

    fireEvent.press(getByText('Submit Registration'));

    await waitFor(() => {
      expect(getByText('This ABN is already registered')).toBeTruthy();
    });
  });
});
```

### Tests E2E (Detox)

**Fichiers:**

```
e2e/
  registration.e2e.ts
  invitation.e2e.ts
  oauth.e2e.ts
```

**Exemple:**

```typescript
// e2e/registration.e2e.ts
import { device, expect, element, by } from "detox";

describe("Business Owner Registration E2E", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should complete registration and verify email", async () => {
    // Navigate to registration
    await element(by.text("Get Started")).tap();
    await element(by.text("Register as Business Owner")).tap();

    // Fill form
    await element(by.id("firstName-input")).typeText("John");
    await element(by.id("lastName-input")).typeText("Smith");
    await element(by.id("email-input")).typeText("john@testcompany.com.au");
    await element(by.id("password-input")).typeText("SecurePass123!");
    await element(by.id("next-button")).tap();

    // ... Continue through steps

    await element(by.id("submit-button")).tap();

    // Should navigate to email verification
    await waitFor(element(by.text("Verify Your Email")))
      .toBeVisible()
      .withTimeout(5000);

    // Get verification code from test email service
    const code = await getTestVerificationCode("john@testcompany.com.au");

    // Enter code
    await element(by.id("code-input")).typeText(code);
    await element(by.id("verify-button")).tap();

    // Should navigate to dashboard
    await waitFor(element(by.text("Welcome to SwiftApp")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### Scénarios de Test par Type

**Business Owner:**

1. ✅ Registration complète avec tous les champs
2. ✅ ABN invalide → Affiche erreur
3. ✅ Email déjà existant → Affiche erreur
4. ✅ Password trop faible → Affiche erreur
5. ✅ Sauvegarde progressive (quitter et revenir)
6. ✅ Upload documents
7. ✅ Stripe Connect onboarding

**Employee:**

1. ✅ Accepter invitation avec token valide
2. ✅ Token expiré → Affiche erreur
3. ✅ Email ne correspond pas → Affiche erreur
4. ✅ Registration complète + account linking

**Contractor:**

1. ✅ Registration avec ABN
2. ✅ Upload certifications
3. ✅ Multiple specializations
4. ✅ Admin verification workflow

**OAuth:**

1. ✅ Google Sign In → Succès
2. ✅ Facebook Sign In → Succès
3. ✅ Apple Sign In → Succès
4. ✅ Email OAuth déjà existant → Affiche option login
5. ✅ OAuth cancelled par user → Retour à registration

### Coverage Targets

- **Unit Tests:** 80% minimum
- **Integration Tests:** 70% des flows critiques
- **E2E Tests:** 5-10 happy paths principaux

---

## 🎯 KPIs & Success Metrics

### Objectifs Chiffrés

**Business Owner Registration:**

- Temps moyen: <5 minutes
- Taux de complétion: >60%
- Taux d'abandon Step 1→2: <15%
- Email verification dans 24h: >80%

**Employee Invitation:**

- Temps moyen acceptation: <2 minutes
- Taux d'acceptation invitations: >70%
- Délai moyen acceptation: <48h

**Contractor Registration:**

- Temps moyen: <7 minutes
- Documents uploaded: 100% (requis)
- Admin verification délai: <24h
- Taux d'approbation: >85%

**OAuth:**

- Taux de succès OAuth: >95%
- Taux conversion OAuth vs email: +40%
- Providers les plus utilisés: Google (60%), Facebook (25%), Apple (15%)

### Dashboard Metrics

**Real-time:**

- Registrations en cours (par type)
- Registrations complétées (dernières 24h)
- Taux d'abandon par étape
- Emails de vérification envoyés vs vérifiés

**Weekly:**

- Registrations par type (graph)
- Taux de conversion global
- Top abandonment steps
- Documents pending review
- Invitation acceptance rate

**Monthly:**

- Total new users
- Breakdown par source (organic, oauth, invitation)
- Average registration time (par type)
- Customer Acquisition Cost (CAC)

---

**Document mis à jour:** 28 janvier 2026  
**Sections complètes ajoutées:** Schémas BDD, API, i18n, Analytics, GDPR, Push Notifications, Deep Linking, Coûts, Tests, KPIs
