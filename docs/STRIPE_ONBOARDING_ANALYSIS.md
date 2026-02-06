# 📊 Stripe Onboarding - Analyse Complète & Plan d'Action

**Date:** 2026-02-03  
**Status:** 🔍 ANALYSE EN COURS  
**Objectif:** Permettre aux utilisateurs de compléter leur onboarding Stripe depuis l'app

---

## 🎯 Objectif Global

Permettre aux utilisateurs de:

1. **Voir** le statut de leur compte Stripe (complet, incomplet, restrictions)
2. **Identifier** les paramètres manquants requis par Stripe
3. **Compléter** l'onboarding directement depuis l'app via WebView
4. **Envoyer** les informations manquantes à Stripe via notre API

---

## 📋 État Actuel

### ✅ Ce Qui Existe Déjà

#### Frontend

**Composants UI:**

- ✅ `StripeHub.tsx` - Page principale Stripe avec statut et actions
- ✅ `StripeAccountStatus.tsx` - Composant d'affichage du statut
- ✅ `StripeConnectWebView.tsx` - WebView pour onboarding Stripe
- ✅ `CreatePaymentLinkModal.tsx` - Création de liens de paiement

**Hooks:**

- ✅ `useStripeAccount()` - Informations du compte
- ✅ `useStripePayments()` - Historique des paiements
- ✅ `useStripePayouts()` - Historique des virements
- ✅ `useStripeConnection()` - Statut de connexion
- ✅ `useStripeConnect()` - Onboarding et déconnexion

**Services:**

- ✅ `fetchStripeAccount()` - GET /v1/stripe/company/{id}/account
- ✅ `fetchStripePayments()` - GET /v1/stripe/company/{id}/payments
- ✅ `fetchStripeBalance()` - Récupère les balances
- ✅ `createStripeConnectAccountAndLink()` - Crée compte + lien onboarding

**Types:**

```typescript
interface AccountInfo {
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_completed: boolean;
  business_name: string;
  support_email: string;
  country: string;
  default_currency: string;
  available_balance: number;
  pending_balance: number;
  requirements: {
    currently_due: string[]; // Paramètres manquants MAINTENANT
    eventually_due: string[]; // Paramètres requis PLUS TARD
    past_due: string[]; // Paramètres EN RETARD
    disabled_reason: string | null;
  };
}
```

#### Backend (Opérationnels)

**Endpoints Fonctionnels:**

- ✅ `GET /v1/stripe/company/{id}/account` - Infos compte
- ✅ `GET /v1/stripe/company/{id}/payments` - Paiements
- ✅ `GET /v1/stripe/payment-links/list?company_id={id}` - Payment links
- ✅ `POST /v1/stripe/connect/create` - Crée compte + lien onboarding
- ✅ `GET /v1/stripe/connect/status` - Statut connexion

---

## ❌ Ce Qui Manque

### Frontend

#### 1. Affichage des Requirements Détaillés

**Besoin:**

- Afficher la liste des `currently_due` avec labels lisibles
- Afficher la liste des `past_due` (priorité haute)
- Afficher la liste des `eventually_due` (info)

**Actuellement:**

```typescript
// Dans AccountInfo.requirements
requirements: {
  currently_due: ["individual.id_number", "individual.dob.day"],  // ❌ Codes bruts
  eventually_due: ["business_profile.url"],
  past_due: []
}
```

**Besoin:**

```typescript
// Mapping human-readable
const REQUIREMENT_LABELS = {
  "individual.id_number": "Numéro d'identité",
  "individual.dob.day": "Date de naissance (jour)",
  "individual.dob.month": "Date de naissance (mois)",
  "individual.dob.year": "Date de naissance (année)",
  "business_profile.url": "Site web de l'entreprise",
  external_account: "Compte bancaire",
  // ... etc
};
```

#### 2. Interface de Complétion des Paramètres

**Options:**

**Option A: WebView Stripe (RECOMMANDÉ ⭐)**

- Utilise Stripe Account Links API
- Stripe gère le formulaire et la validation
- UX cohérente avec Stripe
- Moins de code frontend
- ✅ Déjà partiellement implémenté dans `StripeConnectWebView`

**Option B: Formulaires Custom (Complexe)**

- Formulaires React Native custom
- Envoie données via API backend
- Plus de contrôle UI/UX
- Beaucoup plus de code
- Validation complexe

**→ RECOMMANDATION: Utiliser WebView avec Account Links**

#### 3. Bouton "Compléter le Profil"

**Comportement:**

1. Détecte si `requirements.currently_due.length > 0`
2. Affiche bouton "Compléter les informations manquantes"
3. Au clic:
   - Appelle backend pour générer Account Link
   - Ouvre WebView avec URL d'onboarding
   - Handle success/error/cancel

**Code suggéré:**

```typescript
const handleCompleteOnboarding = async () => {
  try {
    // Backend génère un nouveau Account Link
    const { url } = await refreshStripeAccountLink();

    // Ouvre WebView
    setStripeAccountLink(url);
    setShowStripeWebView(true);
  } catch (error) {
    Alert.alert("Erreur", "Impossible de charger le formulaire");
  }
};
```

#### 4. Statut Visuel Amélioré

**Actuellement:**

- Affichage basique "Active" / "Setup Required"

**Besoin:**

- Badge de statut avec couleur selon état:
  - 🟢 **Complete** - `charges_enabled && payouts_enabled && requirements.currently_due.length === 0`
  - 🟡 **Pending** - `details_submitted && requirements.currently_due.length > 0`
  - 🔴 **Restricted** - `requirements.past_due.length > 0`
  - ⚪ **Incomplete** - `!details_submitted`

### Backend

#### 1. Endpoint: Refresh Account Link

**CRITIQUE - MANQUANT**

**Endpoint suggéré:**

```
POST /v1/stripe/connect/refresh-link
Body: { type: "account_update" }
Response: { success: true, url: "https://connect.stripe.com/setup/...", expires_at: 1234567890 }
```

**Fonction:**

- Génère un nouveau Account Link Stripe
- Type: `account_update` (pour compléter un compte existant)
- Expire après 5 minutes
- Redirige vers l'app après complétion

**Code backend suggéré (Node.js):**

```javascript
router.post("/v1/stripe/connect/refresh-link", async (req, res) => {
  const { company_id } = req.user; // Depuis le token JWT

  // 1. Récupérer le stripe_account_id de la company
  const company = await db.companies.findOne({ id: company_id });
  if (!company.stripe_account_id) {
    return res.status(404).json({
      success: false,
      error: "No Stripe account found",
    });
  }

  // 2. Créer un Account Link Stripe
  const accountLink = await stripe.accountLinks.create({
    account: company.stripe_account_id,
    refresh_url: "swiftapp://stripe/onboarding/refresh",
    return_url: "swiftapp://stripe/onboarding/success",
    type: "account_update", // ⭐ Permet de compléter un compte existant
  });

  // 3. Retourner l'URL
  res.json({
    success: true,
    url: accountLink.url,
    expires_at: accountLink.expires_at,
  });
});
```

#### 2. Endpoint: Get Detailed Requirements

**OPTIONNEL - Amélioration**

**Endpoint suggéré:**

```
GET /v1/stripe/company/{id}/requirements
Response: {
  success: true,
  data: {
    currently_due: [
      { field: "individual.id_number", label: "Numéro d'identité", priority: "high" },
      { field: "individual.dob", label: "Date de naissance", priority: "high" }
    ],
    past_due: [],
    eventually_due: []
  }
}
```

**Fonction:**

- Enrichit les requirements avec labels et priorités
- Permet au frontend d'afficher des messages clairs
- Traduit les codes Stripe en texte lisible

#### 3. Webhook: account.updated

**IMPORTANT - Pour sync en temps réel**

**Webhook Stripe:**

```javascript
// Backend webhook handler
router.post("/v1/webhooks/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

  if (event.type === "account.updated") {
    const account = event.data.object;

    // Mettre à jour en BDD
    await db.companies.update(
      { stripe_account_id: account.id },
      {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements_currently_due: account.requirements.currently_due,
        requirements_past_due: account.requirements.past_due,
      },
    );

    console.log(`✅ Account ${account.id} updated`);
  }

  res.json({ received: true });
});
```

---

## 🔄 Flow Utilisateur Complet

### Scénario 1: Nouveau Compte (Premier Onboarding)

```
1. User clique "Connecter Stripe" dans StripeHub
   ↓
2. Frontend appelle: POST /v1/stripe/connect/create
   ↓
3. Backend:
   - Crée compte Stripe Connect
   - Crée Account Link (type: account_onboarding)
   - Retourne: { accountId, url }
   ↓
4. Frontend ouvre WebView avec url
   ↓
5. User remplit formulaire Stripe
   ↓
6. Stripe redirige vers: swiftapp://stripe/onboarding/success
   ↓
7. Frontend ferme WebView, refresh statut
   ↓
8. Si incomplete → Affiche "Compléter les informations"
```

### Scénario 2: Compléter un Compte Existant

```
1. User voit dans StripeHub:
   "⚠️ Informations manquantes: Numéro d'identité, Date de naissance"
   [Bouton: Compléter mon profil]
   ↓
2. User clique "Compléter mon profil"
   ↓
3. Frontend appelle: POST /v1/stripe/connect/refresh-link
   Body: { type: "account_update" }
   ↓
4. Backend:
   - Récupère stripe_account_id de la company
   - Crée Account Link (type: account_update) ⭐
   - Retourne: { url, expires_at }
   ↓
5. Frontend ouvre WebView avec url
   ↓
6. Stripe affiche SEULEMENT les champs manquants
   ↓
7. User complète les champs
   ↓
8. Stripe redirige vers: swiftapp://stripe/onboarding/success
   ↓
9. Frontend ferme WebView, refresh statut
   ↓
10. Si complete → Affiche "✅ Compte vérifié"
```

### Scénario 3: Compte Restreint (Past Due)

```
1. StripeHub affiche:
   "🔴 Compte restreint - Action urgente requise"
   "Paramètres en retard: Vérification d'identité"
   [Bouton: Régulariser maintenant]
   ↓
2. Même flow que Scénario 2
   ↓
3. Stripe priorise les champs past_due
```

---

## 🏗️ Plan d'Implémentation

### Phase 1: Backend (PRIORITÉ 1) 🔴

**Durée estimée:** 2-3 heures

#### Task 1.1: Créer endpoint refresh-link

```bash
POST /v1/stripe/connect/refresh-link
```

- [ ] Récupérer company_id depuis JWT
- [ ] Récupérer stripe_account_id depuis DB
- [ ] Créer Stripe Account Link (type: account_update)
- [ ] Retourner { success, url, expires_at }
- [ ] Gestion d'erreurs si compte non trouvé

#### Task 1.2: Enrichir endpoint account

```bash
GET /v1/stripe/company/{id}/account
```

- [ ] Vérifier que requirements sont bien retournés
- [ ] Format: { currently_due: [], past_due: [], eventually_due: [] }
- [ ] Ajouter verification_status si disponible

#### Task 1.3: Configurer webhook account.updated

- [ ] Créer route POST /v1/webhooks/stripe
- [ ] Vérifier signature Stripe
- [ ] Handle event 'account.updated'
- [ ] Update DB avec nouveaux statuts
- [ ] Logger les changements

### Phase 2: Frontend Core (PRIORITÉ 2) 🟡

**Durée estimée:** 3-4 heures

#### Task 2.1: Service refresh-link

**Fichier:** `src/services/StripeService.ts`

```typescript
export const refreshStripeAccountLink = async (): Promise<{
  url: string;
  expires_at: number;
}> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/connect/refresh-link`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error("Failed to refresh account link");
  }

  const data = await response.json();
  return { url: data.url, expires_at: data.expires_at };
};
```

#### Task 2.2: Requirements display logic

**Fichier:** `src/screens/business/StripeHub.tsx`

```typescript
// Mapping des requirements vers labels français
const REQUIREMENT_LABELS: Record<string, string> = {
  "individual.id_number": "Numéro d'identité",
  "individual.dob.day": "Date de naissance",
  "individual.verification.document": "Pièce d'identité",
  "business_profile.url": "Site web",
  external_account: "Compte bancaire",
  "tos_acceptance.date": "Acceptation des conditions",
  // ... ajouter plus selon besoins
};

const getRequirementLabel = (field: string): string => {
  return REQUIREMENT_LABELS[field] || field;
};
```

#### Task 2.3: Complete Profile button

```typescript
const handleCompleteProfile = async () => {
  setIsLoading(true);
  try {
    console.log("🔄 [StripeHub] Refreshing account link...");
    const { url } = await refreshStripeAccountLink();

    setStripeAccountLink(url);
    setShowStripeWebView(true);
  } catch (error) {
    console.error("❌ [StripeHub] Failed to refresh link:", error);
    Alert.alert(
      t("common.error"),
      "Impossible de charger le formulaire. Vérifiez votre connexion.",
    );
  } finally {
    setIsLoading(false);
  }
};
```

### Phase 3: UI/UX Improvements (PRIORITÉ 3) 🟢

**Durée estimée:** 2-3 heures

#### Task 3.1: Requirements list component

**Nouveau fichier:** `src/components/stripe/RequirementsList.tsx`

```typescript
interface RequirementsListProps {
  requirements: {
    currently_due: string[];
    past_due: string[];
    eventually_due: string[];
  };
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
  requirements,
}) => {
  // Affichage styled des requirements
  // Priorité visuelle: past_due > currently_due > eventually_due
};
```

#### Task 3.2: Status badges

```typescript
const getAccountStatusBadge = () => {
  const { account } = stripeAccount;
  if (!account) return null;

  const isComplete =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.requirements.currently_due.length === 0 &&
    account.requirements.past_due.length === 0;

  const isPastDue = account.requirements.past_due.length > 0;
  const isPending =
    account.details_submitted && account.requirements.currently_due.length > 0;

  if (isComplete) {
    return {
      color: "success",
      icon: "checkmark-circle",
      text: "Compte vérifié",
    };
  }
  if (isPastDue) {
    return { color: "error", icon: "alert-circle", text: "Action requise" };
  }
  if (isPending) {
    return { color: "warning", icon: "time", text: "En attente" };
  }
  return { color: "neutral", icon: "information-circle", text: "Incomplet" };
};
```

#### Task 3.3: Onboarding progress indicator

```typescript
const calculateOnboardingProgress = (): number => {
  const { account } = stripeAccount;
  if (!account) return 0;

  const totalSteps = [
    account.details_submitted,
    account.charges_enabled,
    account.payouts_enabled,
    account.requirements.currently_due.length === 0,
  ];

  const completedSteps = totalSteps.filter(Boolean).length;
  return (completedSteps / totalSteps.length) * 100;
};
```

### Phase 4: Testing & Polish (PRIORITÉ 4) ⚪

**Durée estimée:** 2 heures

- [ ] Test flow onboarding complet (nouveau compte)
- [ ] Test flow complétion (compte existant)
- [ ] Test affichage requirements
- [ ] Test WebView success/cancel/error
- [ ] Test refresh après onboarding
- [ ] Traductions (FR, EN, ES, etc.)
- [ ] Logs de debug nettoyés

---

## 📊 Données Stripe Requirements

### Champs Courants (Individual Account)

| Code Stripe                        | Label Français     | Priorité | Type      |
| ---------------------------------- | ------------------ | -------- | --------- |
| `individual.id_number`             | Numéro d'identité  | Haute    | Text      |
| `individual.dob.day`               | Jour de naissance  | Haute    | Number    |
| `individual.dob.month`             | Mois de naissance  | Haute    | Number    |
| `individual.dob.year`              | Année de naissance | Haute    | Number    |
| `individual.first_name`            | Prénom             | Haute    | Text      |
| `individual.last_name`             | Nom                | Haute    | Text      |
| `individual.email`                 | Email              | Haute    | Email     |
| `individual.phone`                 | Téléphone          | Moyenne  | Phone     |
| `individual.address.line1`         | Adresse ligne 1    | Haute    | Text      |
| `individual.address.city`          | Ville              | Haute    | Text      |
| `individual.address.postal_code`   | Code postal        | Haute    | Text      |
| `individual.address.state`         | État/Province      | Haute    | Text      |
| `individual.verification.document` | Pièce d'identité   | Haute    | File      |
| `external_account`                 | Compte bancaire    | Haute    | Bank      |
| `business_profile.url`             | Site web           | Basse    | URL       |
| `tos_acceptance.date`              | Acceptation CGV    | Haute    | Timestamp |

### Champs Courants (Company Account)

| Code Stripe                     | Label Français       | Priorité |
| ------------------------------- | -------------------- | -------- |
| `company.name`                  | Nom de l'entreprise  | Haute    |
| `company.tax_id`                | Numéro SIRET/SIREN   | Haute    |
| `company.address.line1`         | Adresse entreprise   | Haute    |
| `company.phone`                 | Téléphone entreprise | Moyenne  |
| `company.verification.document` | Extrait Kbis         | Haute    |
| `business_type`                 | Type d'entreprise    | Haute    |

---

## 🔐 Sécurité & Considérations

### Sécurité Backend

- ✅ Vérifier JWT token pour company_id
- ✅ Valider que l'user a les droits sur la company
- ✅ Vérifier signature Stripe pour webhooks
- ✅ Logger toutes les opérations sensibles
- ✅ Rate limiting sur refresh-link (max 5/min)

### Sécurité Frontend

- ✅ Pas de données sensibles en logs
- ✅ WebView isolée (pas de JS injection)
- ✅ Valider les redirect URLs
- ✅ Timeout sur les Account Links (5 min)

### UX Considerations

- ⚠️ Account Links expirent après 5 minutes
- ⚠️ User peut annuler l'onboarding (handle gracefully)
- ⚠️ Certains champs prennent du temps à verify (ID upload)
- ⚠️ Afficher messages clairs si restricted/disabled

---

## 📝 Checklist Finale

### Backend

- [ ] Endpoint POST /v1/stripe/connect/refresh-link créé
- [ ] Requirements enrichis dans GET /v1/stripe/company/{id}/account
- [ ] Webhook account.updated configuré
- [ ] Tests avec compte test Stripe
- [ ] Logs backend propres

### Frontend

- [ ] Service refreshStripeAccountLink() implémenté
- [ ] Mapping REQUIREMENT_LABELS complet
- [ ] Bouton "Compléter le profil" ajouté
- [ ] Liste des requirements affichée
- [ ] Status badges améliorés
- [ ] Progress indicator ajouté
- [ ] WebView flow testé
- [ ] Traductions complètes
- [ ] Logs debug nettoyés

### Tests

- [ ] Flow nouveau compte testé
- [ ] Flow complétion testé
- [ ] Flow restriction testé
- [ ] WebView success/cancel/error testés
- [ ] Refresh après onboarding testé

---

## 🎯 Résumé - Quick Start

### Pour le Backend Developer

**Tâche Critique #1: Créer endpoint refresh-link**

```javascript
POST / v1 / stripe / connect / refresh - link;
// Crée un Account Link Stripe (type: account_update)
// Retourne { success: true, url: "...", expires_at: ... }
```

**Tâche #2: Vérifier requirements dans account endpoint**

```javascript
GET / v1 / stripe / company / { id } / account;
// S'assurer que requirements.currently_due est bien retourné
```

### Pour le Frontend Developer

**Tâche Critique #1: Ajouter bouton "Compléter le profil"**

```typescript
// Dans StripeHub.tsx
if (requirements.currently_due.length > 0) {
  <Button onPress={handleCompleteProfile}>
    Compléter les informations manquantes
  </Button>
}
```

**Tâche #2: Afficher requirements lisibles**

```typescript
requirements.currently_due.map(field => (
  <Text>{getRequirementLabel(field)}</Text>
))
```

---

**Document complet - Prêt pour implémentation** ✅
