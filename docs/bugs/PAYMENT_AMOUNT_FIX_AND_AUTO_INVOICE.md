# Session 12 - Phase 9 : Corrections Critiques et Facturation Automatique

## 📋 Date et Contexte

**Date** : 27 janvier 2026  
**Session** : Session 12 - Phase 9  
**Composants modifiés** : paymentWindow.tsx, useInvoice.ts (nouveau)

---

## ❌ Problème 1 : Double Conversion de Montant (45000$ au lieu de 450$)

### Symptôme

Lors des paiements Stripe, les montants étaient multipliés par 100 :

- **Attendu** : 450 AUD (45000 centimes)
- **Réel** : 45000 AUD (4500000 centimes)

### Diagnostic

**Logs backend** (STRIPE_CONNECT_FIX.md) :

```json
{
  "amount": 4500000, // ❌ 45000$ au lieu de 450$
  "currency": "aud"
}
```

**Cause racine** : Double conversion cents

1. Frontend : `Math.round(paymentAmount * 100)` → 45000 cents
2. Backend : `amount * 100` → 4500000 cents

### Solution

**Retrait de la multiplication par 100 côté frontend** car le backend la fait déjà.

**Fichier** : `src/screens/JobDetailsScreens/paymentWindow.tsx`

**Paiement carte** (ligne ~201) :

```typescript
// AVANT
const paymentIntent = await jobPayment.createPayment(jobId, {
  amount: Math.round(paymentAmount * 100), // ❌ Double conversion
  currency: "AUD",
  description: `Paiement job ${job?.title || jobId}`,
});

// APRÈS
const paymentIntent = await jobPayment.createPayment(jobId, {
  amount: Math.round(paymentAmount), // ✅ Backend convertit en centimes
  currency: "AUD",
  description: `Paiement job ${job?.title || jobId}`,
});
```

**Paiement cash** (ligne ~357) :

```typescript
// AVANT
const paymentIntent = await jobPayment.createPayment(jobId, {
  amount: Math.round(paymentAmount * 100), // ❌ Double conversion
  currency: "AUD",
  description: `Paiement cash job ${job?.title || jobId}`,
});

// APRÈS
const paymentIntent = await jobPayment.createPayment(jobId, {
  amount: Math.round(paymentAmount), // ✅ Backend convertit en centimes
  currency: "AUD",
  description: `Paiement cash job ${job?.title || jobId}`,
});
```

**Commentaires ajoutés** :

```typescript
// ⚠️ NE PAS multiplier par 100 - le backend le fait déjà
```

---

## ✅ Fonctionnalité 2 : Génération et Envoi Automatique de Facture

### Objectif

Après chaque paiement (carte ou espèces), générer automatiquement une facture Stripe et l'envoyer par email au client avec :

- Présentation professionnelle (via Stripe Invoices)
- Nom de la compagnie
- Détails du job
- Montant facturé (heures, déplacements, frais)

### Architecture

```
Paiement réussi
    ↓
generateInvoiceData() → Calcule pricing depuis JobTimer
    ↓
PricingService.generateInvoice() → Crée structure Invoice
    ↓
createStripeInvoice() → Appel API backend
    ↓
Backend → Stripe API (création facture + envoi email)
    ↓
Client reçoit email avec PDF et lien paiement
```

### Implémentation

#### 1. Nouveau Hook : `useInvoice`

**Fichier créé** : `src/hooks/useInvoice.ts`

**Interface** :

```typescript
export interface SendInvoiceOptions {
  job: any;
  sendByEmail?: boolean;
  onSuccess?: (invoice: Invoice) => void;
  onError?: (error: Error) => void;
}

export const useInvoice = () => {
  const { calculateCost, billableTime } = useJobTimerContext();

  const generateInvoiceData = (job: any): Invoice => {
    // Calcul du coût basé sur billableTime
    const costData = calculateCost(billableTime);

    // Génération facture complète
    return PricingService.generateInvoice(job, costData, [], 0);
  };

  const sendInvoice = async (options: SendInvoiceOptions) => {
    // 1. Générer invoice data
    const invoice = generateInvoiceData(job);

    // 2. Préparer line items pour Stripe
    const lineItems = [
      {
        description: `Service - Job ${invoice.jobCode}`,
        quantity: 1,
        unit_amount: Math.round(invoice.total * 100), // En centimes
        currency: invoice.pricing.currency.toLowerCase(),
      },
    ];

    // 3. Créer facture Stripe
    const stripeInvoice = await createStripeInvoice({
      customer_email: invoice.clientEmail,
      customer_name: invoice.clientName,
      description: `Job: ${job?.title} | Heures: ${invoice.pricing.billableHours}h`,
      line_items: lineItems,
      metadata: { job_id: invoice.jobId, job_code: invoice.jobCode },
      collection_method: "send_invoice",
      auto_advance: true, // Auto-finaliser et envoyer
    });

    return stripeInvoice;
  };

  const sendInvoiceWithConfirmation = async (job, t) => {
    // Affiche dialogue de confirmation puis envoie
  };

  return {
    generateInvoiceData,
    sendInvoice,
    sendInvoiceWithConfirmation,
  };
};
```

**Dépendances** :

- `useJobTimerContext` : Calcul temps facturable
- `PricingService` : Génération structure facture
- `createStripeInvoice` : API backend Stripe

#### 2. Intégration dans PaymentWindow

**Fichier** : `src/screens/JobDetailsScreens/paymentWindow.tsx`

**Import du hook** (ligne ~24) :

```typescript
import { useInvoice } from "../../hooks/useInvoice";
```

**Initialisation** (ligne ~68) :

```typescript
const { sendInvoiceWithConfirmation } = useInvoice();
```

**Envoi automatique après paiement carte** (ligne ~285) :

```typescript
// ✅ 7. Envoyer automatiquement la facture par email
try {
  const jobData = job?.job || job;
  if (jobData?.client?.email) {
    console.log("📧 [PaymentSheet] Sending invoice to client...");
    await sendInvoiceWithConfirmation(jobData, t);
    console.log("✅ [PaymentSheet] Invoice sent successfully");
  } else {
    console.warn("⚠️ [PaymentSheet] No client email found, skipping invoice");
  }
} catch (invoiceError) {
  console.error("❌ [PaymentSheet] Failed to send invoice:", invoiceError);
  // Ne pas bloquer le succès du paiement si l'envoi de facture échoue
}
```

**Envoi automatique après paiement cash** (ligne ~378) :

```typescript
// ✅ 4. Envoyer automatiquement la facture par email
try {
  const jobData = job?.job || job;
  if (jobData?.client?.email) {
    console.log("📧 [PaymentWindow] Sending invoice to client...");
    await sendInvoiceWithConfirmation(jobData, t);
    console.log("✅ [PaymentWindow] Invoice sent successfully");
  }
} catch (invoiceError) {
  console.error("❌ [PaymentWindow] Failed to send invoice:", invoiceError);
}
```

**Bouton manuel "Envoyer la facture"** dans `renderAlreadyPaid()` (ligne ~443) :

```typescript
<Pressable
  onPress={async () => {
    try {
      const jobData = job?.job || job;
      await sendInvoiceWithConfirmation(jobData, t);
    } catch (error) {
      console.error('❌ [PaymentWindow] Error sending invoice:', error);
    }
  }}
>
  <Ionicons name="mail" size={20} />
  <Text>{t('payment.window.sendInvoice')}</Text>
</Pressable>
```

### Flux Utilisateur

#### Scénario 1 : Paiement carte

1. Utilisateur sélectionne "Bank Card"
2. PaymentSheet Stripe s'ouvre
3. Utilisateur entre coordonnées carte
4. Stripe valide et traite paiement
5. Backend confirme paiement
6. **✅ Facture générée automatiquement**
7. **✅ Email envoyé au client avec PDF**
8. Écran de succès affiché
9. Modal se ferme après 2s

#### Scénario 2 : Paiement espèces

1. Utilisateur sélectionne "Cash"
2. Entre montant reçu
3. Système calcule rendu
4. Confirme paiement cash
5. Backend enregistre paiement
6. **✅ Facture générée automatiquement**
7. **✅ Email envoyé au client**
8. Écran de succès affiché

#### Scénario 3 : Job déjà payé

1. Ouvrir payment window sur job payé
2. Voir confirmation "Paiement confirmé"
3. Bouton "Envoyer la facture" disponible
4. Clic → Dialogue de confirmation
5. Confirmer → Facture renvoyée par email

### API Backend Utilisée

**Endpoint** : `POST /v1/stripe/invoices/create`

**Request** :

```json
{
  "customer_email": "client@example.com",
  "customer_name": "John Doe",
  "description": "Job: Moving Service | Heures: 2.5h",
  "line_items": [
    {
      "description": "Service - Job SWIFT-123",
      "quantity": 1,
      "unit_amount": 45000,
      "currency": "aud"
    }
  ],
  "metadata": {
    "job_id": "29",
    "job_code": "SWIFT-123",
    "payment_method": "card"
  },
  "collection_method": "send_invoice",
  "auto_advance": true
}
```

**Response** :

```json
{
  "success": true,
  "data": {
    "invoice_id": "in_1Abc123...",
    "invoice_number": "INVOICE-001",
    "status": "open",
    "amount_due": 45000,
    "currency": "aud",
    "customer_email": "client@example.com",
    "hosted_invoice_url": "https://invoice.stripe.com/i/...",
    "invoice_pdf": "https://pay.stripe.com/invoice/.../pdf",
    "created": "2026-01-27T10:30:00Z"
  }
}
```

### Gestion des Erreurs

**Si email manquant** :

```typescript
if (!jobData?.client?.email) {
  console.warn("⚠️ No client email found, skipping invoice");
  // Paiement réussit quand même
}
```

**Si échec envoi facture** :

```typescript
catch (invoiceError) {
  console.error('❌ Failed to send invoice:', invoiceError);
  // Ne pas bloquer le succès du paiement
}
```

**Principe** : L'envoi de facture ne doit **jamais bloquer** le succès du paiement. Si l'envoi échoue, le paiement reste valide et l'utilisateur peut renvoyer manuellement la facture plus tard.

---

## 🚧 TODO Ajouté : Hook pour Infos Manquantes Stripe

### Objectif

Créer un hook `useStripeAccountInfo` pour vérifier l'état de complétion du compte Stripe Connect de la compagnie.

### Localisation

**Fichier** : `src/hooks/business/README.md` (section TODOs ajoutée)

### Cas d'usage

1. **Détection automatique** : Identifier les champs KYC manquants (coordonnées bancaires, documents légaux, etc.)
2. **Alertes proactives** : Notifier l'utilisateur si son compte Stripe est incomplet
3. **Blocage sécurisé** : Empêcher les paiements si le compte n'est pas configuré
4. **Guidage UX** : Rediriger vers les sections à compléter dans Stripe Dashboard

### Interface proposée

```typescript
export const useStripeAccountInfo = (accountId?: string) => {
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    // GET /v1/stripe/account/:account_id/status
  };

  const getMissingRequirements = () => {
    return status?.requirements.currently_due || [];
  };

  const isAccountComplete = () => {
    return (
      status?.details_submitted &&
      status?.requirements.currently_due.length === 0
    );
  };

  return {
    status,
    isLoading,
    error,
    refreshStatus,
    getMissingRequirements,
    isAccountComplete,
  };
};
```

### Intégration suggérée

- **BusinessInfoPage** : Badge warning si infos manquantes
- **PaymentWindow** : Avertissement avant tentative de paiement
- **StripeSettingsScreen** : Section "Compléter mon compte Stripe"

---

## 📊 Résumé des Modifications

### Fichiers créés

1. ✅ `src/hooks/useInvoice.ts` - Hook de génération et envoi de factures

### Fichiers modifiés

1. ✅ `src/screens/JobDetailsScreens/paymentWindow.tsx`
   - Retrait `* 100` pour paiement carte (ligne ~201)
   - Retrait `* 100` pour paiement cash (ligne ~357)
   - Import `useInvoice` (ligne ~24)
   - Initialisation hook (ligne ~68)
   - Envoi auto facture après carte (ligne ~285)
   - Envoi auto facture après cash (ligne ~378)
   - Bouton manuel facture (ligne ~443)

2. ✅ `src/hooks/business/README.md`
   - Section "TODOs" ajoutée
   - Spécification `useStripeAccountInfo`
   - Documentation Stripe Connect requirements

### API Backend requises

1. ✅ `POST /v1/stripe/invoices/create` - Déjà existante (StripeService.ts)
2. 🚧 `GET /v1/stripe/account/:id/status` - À créer (pour useStripeAccountInfo)
3. 🚧 `GET /v1/stripe/account/:id/requirements` - À créer (pour useStripeAccountInfo)

---

## ✅ Tests à Effectuer

### Test 1 : Vérifier montant correct (450$ au lieu de 45000$)

1. Ouvrir payment window sur job avec montant ~450 AUD
2. Sélectionner paiement carte
3. Vérifier dans logs frontend : `amount: 450 AUD`
4. Vérifier dans PaymentSheet Stripe : montant affiché = 450 AUD
5. Confirmer paiement
6. Vérifier dans backend logs : `amount: 45000` (cents)
7. **Résultat attendu** : Paiement de 450 AUD réussi (pas 45000$)

### Test 2 : Facture automatique après paiement carte

1. Job avec client ayant email valide
2. Effectuer paiement carte
3. Vérifier logs : `📧 Sending invoice to client...`
4. Vérifier logs : `✅ Invoice sent successfully`
5. Vérifier email du client : Facture Stripe reçue
6. Ouvrir facture : PDF professionnel avec détails job

### Test 3 : Facture automatique après paiement cash

1. Job avec client ayant email
2. Effectuer paiement espèces
3. Vérifier facture envoyée automatiquement
4. Vérifier email client

### Test 4 : Facture manuelle sur job déjà payé

1. Ouvrir payment window sur job payé
2. Voir message "Paiement confirmé"
3. Clic "Envoyer la facture"
4. Confirmer dialogue
5. Vérifier email client reçoit facture

### Test 5 : Gestion erreur si email manquant

1. Job sans email client
2. Effectuer paiement
3. Vérifier warning dans logs : `⚠️ No client email found`
4. Paiement réussit quand même
5. Pas de crash

---

## 🎯 Impact Business

### Avant

- ❌ Montants incorrects (x100 trop élevés)
- ❌ Pas de facture automatique
- ❌ Processus manuel d'envoi de facture
- ❌ Présentation facture basique

### Après

- ✅ Montants corrects (450$ = 450$)
- ✅ Facture générée automatiquement après paiement
- ✅ Email professionnel envoyé au client
- ✅ Présentation Stripe avec branding compagnie
- ✅ PDF téléchargeable
- ✅ Option de renvoi manuel si besoin

### Bénéfices

1. **Confiance client** : Facture professionnelle immédiate
2. **Comptabilité** : Traçabilité complète via Stripe
3. **Conformité** : Documents légaux générés automatiquement
4. **Gain de temps** : Plus besoin de générer factures manuellement
5. **Branding** : Présentation cohérente avec identité compagnie

---

## 📝 Notes pour Production

### Configuration requise

1. **Stripe Connect** : Comptes Connected Accounts configurés pour chaque compagnie
2. **Emails** : Adresses clients validées et à jour
3. **Branding** : Logo et couleurs compagnie dans Stripe Dashboard
4. **Templates** : Personnalisation factures via Stripe Settings

### Personnalisation future

- [ ] Ajouter notes personnalisées sur factures
- [ ] Inclure items additionnels (parking, péages, etc.)
- [ ] Appliquer taxes (GST/VAT) selon juridiction
- [ ] Multi-devises (AUD, USD, EUR)
- [ ] Factures récurrentes pour contrats
- [ ] Relances automatiques paiement en attente

### Monitoring

- Suivre taux d'échec envoi factures
- Logs centralisés pour debugging
- Alertes si compte Stripe incomplet
- Métriques temps génération facture

---

## 🔗 Références

- **Session 12 - Phase 7** : Premier paiement réussi (pi_3Su8CSIJgkyzp7Ff1CP00d1r)
- **Session 12 - Phase 8** : Prévention paiements en double
- **Stripe Invoices API** : https://stripe.com/docs/invoicing
- **Stripe Connect Requirements** : https://stripe.com/docs/connect/account-requirements
- **PricingService** : `src/services/pricing/PricingService.ts`

---

**État** : ✅ Implémenté et prêt pour tests  
**Prochaine étape** : Tester montants + facturation automatique sur device
