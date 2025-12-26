# 🔍 CAS D'USAGE: Détection et Correction d'Incohérences Job

**Date:** 21 Décembre 2025  
**Objectif:** Lister toutes les incohérences logiques détectables et leurs corrections automatiques

---

## 🎯 PRINCIPE GÉNÉRAL

**Si A est vrai MAIS B est faux → Incohérence → Correction automatique**

Le client détecte l'incohérence, envoie les détails au serveur, le serveur corrige.

---

## 📋 CATALOGUE COMPLET DES INCOHÉRENCES

### CATÉGORIE 1: STATUS vs ÉTAPE

#### 1.1 Job "completed" mais étape < 5
**Détection:**
```typescript
if (status === 'completed' && current_step < 5) {
  // Incohérence
}
```

**Logique:** Un job terminé DOIT être à l'étape finale (5/5)

**Correction serveur:**
```sql
-- Option 1: Avancer à l'étape finale
UPDATE jobs SET current_step = 5 WHERE id = ? AND status = 'completed';

-- Option 2: Reset status (si step vraiment pas 5)
UPDATE jobs SET status = 'in_progress' WHERE id = ? AND current_step < 5;
```

**Choix de correction:** Regarder `signature_blob` et `payment_status`:
- Si signature + payé → Avancer step à 5
- Sinon → Reset status à 'in_progress'

---

#### 1.2 Job à l'étape 5 mais status ≠ "completed"
**Détection:**
```typescript
if (current_step === 5 && status !== 'completed') {
  // Incohérence
}
```

**Logique:** L'étape finale (5/5) signifie job terminé

**Correction serveur:**
```sql
UPDATE jobs SET status = 'completed' WHERE id = ? AND current_step = 5;
```

---

#### 1.3 Job "pending" mais étape > 1
**Détection:**
```typescript
if (status === 'pending' && current_step > 1) {
  // Incohérence
}
```

**Logique:** Un job "pending" (en attente) n'a pas encore commencé, donc step = 1

**Correction serveur:**
```sql
-- Option 1: Changer status
UPDATE jobs SET status = 'in_progress' WHERE id = ? AND status = 'pending' AND current_step > 1;

-- Option 2: Reset step
UPDATE jobs SET current_step = 1 WHERE id = ? AND status = 'pending';
```

**Choix:** Si timer_started_at existe → Changer status, sinon → Reset step

---

#### 1.4 Job "cancelled" mais étape avance
**Détection:**
```typescript
if (status === 'cancelled' && current_step_changed_recently) {
  // Incohérence
}
```

**Logique:** Un job annulé ne peut plus avancer

**Correction serveur:**
```sql
-- Geler l'étape actuelle
UPDATE jobs SET current_step = (SELECT current_step FROM jobs WHERE id = ? LIMIT 1) WHERE id = ?;
-- Ou empêcher future modification via un flag
UPDATE jobs SET locked = 1 WHERE id = ? AND status = 'cancelled';
```

---

### CATÉGORIE 2: PAIEMENT vs STATUS/ÉTAPE

#### 2.1 Job payé (payment_status="paid") mais pas completed
**Détection:**
```typescript
if (payment_status === 'paid' && status !== 'completed') {
  // Incohérence
}
```

**Logique:** Si le client a payé, le job doit être terminé

**Correction serveur:**
```sql
-- Compléter le job
UPDATE jobs 
SET status = 'completed', current_step = 5 
WHERE id = ? AND payment_status = 'paid';
```

---

#### 2.2 Job completed mais payment_status = "pending"
**Détection:**
```typescript
if (status === 'completed' && payment_status === 'pending') {
  // Incohérence
}
```

**Logique:** Job terminé mais pas payé → doit être en attente de paiement

**Correction serveur:**
```sql
-- Mettre en attente paiement
UPDATE jobs SET payment_status = 'awaiting_payment' WHERE id = ? AND status = 'completed';
```

---

#### 2.3 Montant payé > Montant total
**Détection:**
```typescript
if (amount_paid > amount_total) {
  // Incohérence
}
```

**Logique:** Le client ne peut pas avoir payé plus que le total

**Correction serveur:**
```sql
-- Ajuster amount_paid
UPDATE jobs SET amount_paid = amount_total WHERE id = ? AND amount_paid > amount_total;
```

---

#### 2.4 Montant dû négatif
**Détection:**
```typescript
const amount_due = amount_total - amount_paid;
if (amount_due < 0) {
  // Incohérence
}
```

**Logique:** Le montant dû ne peut pas être négatif

**Correction serveur:**
```sql
-- Recalculer amount_due
UPDATE jobs 
SET amount_due = GREATEST(amount_total - amount_paid, 0) 
WHERE id = ?;
```

---

### CATÉGORIE 3: TIMER vs STATUS/ÉTAPE

#### 3.1 Timer démarré (timer_started_at) mais job "pending"
**Détection:**
```typescript
if (timer_started_at !== null && status === 'pending') {
  // Incohérence
}
```

**Logique:** Si le timer a démarré, le job est en cours

**Correction serveur:**
```sql
UPDATE jobs SET status = 'in_progress' WHERE id = ? AND timer_started_at IS NOT NULL;
```

---

#### 3.2 Job à l'étape > 1 mais timer jamais démarré
**Détection:**
```typescript
if (current_step > 1 && timer_started_at === null) {
  // Incohérence
}
```

**Logique:** On ne peut pas avancer sans avoir démarré le timer

**Correction serveur:**
```sql
-- Créer un timer rétroactif (estimation)
UPDATE jobs 
SET timer_started_at = DATE_SUB(NOW(), INTERVAL (current_step * 2) HOUR),
    timer_total_hours = (current_step * 2)
WHERE id = ? AND timer_started_at IS NULL;
```

---

#### 3.3 Timer running (timer_is_running=1) mais job "completed"
**Détection:**
```typescript
if (timer_is_running === 1 && status === 'completed') {
  // Incohérence
}
```

**Logique:** Un job terminé ne peut pas avoir un timer actif

**Correction serveur:**
```sql
-- Arrêter le timer
UPDATE jobs 
SET timer_is_running = 0,
    timer_last_updated = NOW()
WHERE id = ? AND status = 'completed';
```

---

#### 3.4 Timer total négatif
**Détection:**
```typescript
if (timer_total_hours < 0) {
  // Incohérence
}
```

**Logique:** Le temps ne peut pas être négatif

**Correction serveur:**
```sql
UPDATE jobs SET timer_total_hours = 0 WHERE id = ? AND timer_total_hours < 0;
```

---

#### 3.5 Timer pause > timer total
**Détection:**
```typescript
if (timer_break_hours > timer_total_hours) {
  // Incohérence
}
```

**Logique:** Le temps de pause ne peut pas dépasser le temps total

**Correction serveur:**
```sql
UPDATE jobs SET timer_break_hours = 0 WHERE id = ? AND timer_break_hours > timer_total_hours;
```

---

#### 3.6 Timer anormalement élevé (> 240h)
**Détection:**
```typescript
const MAX_REASONABLE_HOURS = 240; // 10 jours
if (timer_total_hours > MAX_REASONABLE_HOURS) {
  // Incohérence probable
}
```

**Logique:** Un job ne devrait pas durer plus de 10 jours

**Correction serveur:**
```sql
-- Arrêter le timer (probablement oublié en running)
UPDATE jobs 
SET timer_is_running = 0,
    timer_last_updated = NOW()
WHERE id = ? AND timer_total_hours > 240;
```

---

### CATÉGORIE 4: SIGNATURE vs STATUS/ÉTAPE

#### 4.1 Job signé (signature_blob) mais pas completed
**Détection:**
```typescript
if (signature_blob !== null && status !== 'completed') {
  // Incohérence
}
```

**Logique:** Si le job est signé, il est terminé

**Correction serveur:**
```sql
UPDATE jobs 
SET status = 'completed', current_step = 5 
WHERE id = ? AND signature_blob IS NOT NULL;
```

---

#### 4.2 Job completed mais pas signé
**Détection:**
```typescript
if (status === 'completed' && signature_blob === null) {
  // Incohérence
}
```

**Logique:** Un job terminé doit être signé

**Correction serveur:**
```sql
-- Option 1: Reset status (signature manquante)
UPDATE jobs SET status = 'in_progress' WHERE id = ? AND signature_blob IS NULL;

-- Option 2: Créer signature par défaut (si business permet)
UPDATE jobs 
SET signature_blob = 'AUTO_GENERATED_SIGNATURE',
    signature_date = NOW()
WHERE id = ? AND signature_blob IS NULL;
```

**Choix:** Dépend de la logique métier (signature obligatoire ou non)

---

#### 4.3 Signature datée après completion
**Détection:**
```typescript
if (signature_date > updated_at && status === 'completed') {
  // Incohérence temporelle
}
```

**Logique:** La signature doit être antérieure ou égale à la date de completion

**Correction serveur:**
```sql
-- Ajuster updated_at
UPDATE jobs 
SET updated_at = signature_date 
WHERE id = ? AND signature_date > updated_at;
```

---

### CATÉGORIE 5: ITEMS vs ÉTAPE

#### 5.1 Étape ≥ 4 (déchargement) mais aucun item chargé
**Détection:**
```typescript
const itemsLoaded = await getItemsCount(jobId, { loaded: 1 });
if (current_step >= 4 && itemsLoaded === 0) {
  // Incohérence
}
```

**Logique:** On ne peut pas décharger sans avoir chargé

**Correction serveur:**
```sql
-- Option 1: Créer items par défaut
INSERT INTO job_items (job_id, description, quantity, loaded) 
VALUES (?, 'Item par défaut (auto-créé)', 1, 1);

-- Option 2: Retourner à step 3
UPDATE jobs SET current_step = 3 WHERE id = ?;
```

**Choix:** 
- Production → Retourner à step 3 (l'utilisateur doit charger)
- Dev/Test → Créer items par défaut

---

#### 5.2 Items déchargés (unloaded) > items chargés (loaded)
**Détection:**
```typescript
const itemsLoaded = await getItemsCount(jobId, { loaded: 1 });
const itemsUnloaded = await getItemsCount(jobId, { unloaded: 1 });
if (itemsUnloaded > itemsLoaded) {
  // Incohérence
}
```

**Logique:** On ne peut pas décharger plus qu'on a chargé

**Correction serveur:**
```sql
-- Reset les items unloaded
UPDATE job_items SET unloaded = 0 WHERE job_id = ? AND unloaded > loaded;
```

---

#### 5.3 Job completed mais items non déchargés
**Détection:**
```typescript
const itemsLoaded = await getItemsCount(jobId, { loaded: 1 });
const itemsUnloaded = await getItemsCount(jobId, { unloaded: 1 });
if (status === 'completed' && itemsLoaded > itemsUnloaded) {
  // Incohérence
}
```

**Logique:** Job terminé = tous les items déchargés

**Correction serveur:**
```sql
-- Marquer tous les items comme déchargés
UPDATE job_items SET unloaded = loaded WHERE job_id = ? AND unloaded < loaded;
```

---

### CATÉGORIE 6: DATES vs LOGIQUE

#### 6.1 Date fin < Date début
**Détection:**
```typescript
if (end_window_end < start_window_start) {
  // Incohérence temporelle
}
```

**Logique:** La fin ne peut pas être avant le début

**Correction serveur:**
```sql
-- Inverser les dates
UPDATE jobs 
SET start_window_start = end_window_end,
    end_window_end = start_window_start
WHERE id = ? AND end_window_end < start_window_start;
```

---

#### 6.2 Job completed mais updated_at dans le futur
**Détection:**
```typescript
if (updated_at > Date.now()) {
  // Incohérence temporelle
}
```

**Logique:** Les dates ne peuvent pas être dans le futur

**Correction serveur:**
```sql
UPDATE jobs SET updated_at = NOW() WHERE id = ? AND updated_at > NOW();
```

---

#### 6.3 created_at > updated_at
**Détection:**
```typescript
if (created_at > updated_at) {
  // Incohérence temporelle
}
```

**Logique:** La date de création précède toujours la date de mise à jour

**Correction serveur:**
```sql
UPDATE jobs SET updated_at = created_at WHERE id = ? AND created_at > updated_at;
```

---

### CATÉGORIE 7: COLONNES DUPLIQUÉES

#### 7.1 Incohérence step vs current_step
**Détection:**
```typescript
if (job.step && job.current_step && job.step !== job.current_step) {
  // Incohérence structure
}
```

**Logique:** Ces deux colonnes doivent être synchronisées

**Correction serveur:**
```sql
-- Prioriser current_step
UPDATE jobs SET step = current_step WHERE id = ? AND step != current_step;
```

---

#### 7.2 Incohérence client_id vs job.client_*
**Détection:**
```typescript
const client = await getClient(job.client_id);
if (job.client_first_name !== client.first_name) {
  // Incohérence données
}
```

**Logique:** Les données client dénormalisées doivent correspondre

**Correction serveur:**
```sql
-- Re-synchroniser depuis la table clients
UPDATE jobs j
JOIN clients c ON j.client_id = c.id
SET j.client_first_name = c.first_name,
    j.client_last_name = c.last_name,
    j.client_email = c.email,
    j.client_phone = c.phone
WHERE j.id = ?;
```

---

### CATÉGORIE 8: RELATIONS MANQUANTES

#### 8.1 Job sans client
**Détection:**
```typescript
if (client_id === null || client_id === 0) {
  // Incohérence relation
}
```

**Logique:** Un job doit avoir un client

**Correction serveur:**
```sql
-- Assigner au client par défaut
UPDATE jobs SET client_id = 1 WHERE id = ? AND (client_id IS NULL OR client_id = 0);
```

---

#### 8.2 Job sans company
**Détection:**
```typescript
if (company_id === null || company_id === 0) {
  // Incohérence relation
}
```

**Logique:** Un job doit être rattaché à une entreprise

**Correction serveur:**
```sql
-- Assigner à l'entreprise par défaut
UPDATE jobs SET company_id = 1 WHERE id = ? AND (company_id IS NULL OR company_id = 0);
```

---

#### 8.3 Quote_id ou invoice_id invalide
**Détection:**
```typescript
if (quote_id && !(await quoteExists(quote_id))) {
  // Incohérence relation
}
```

**Logique:** Les IDs référencés doivent exister

**Correction serveur:**
```sql
-- Nettoyer les références invalides
UPDATE jobs SET quote_id = NULL WHERE id = ? AND quote_id NOT IN (SELECT id FROM quotes);
UPDATE jobs SET invoice_id = NULL WHERE id = ? AND invoice_id NOT IN (SELECT id FROM invoices);
```

---

### CATÉGORIE 9: STRIPE/PAIEMENT

#### 9.1 transaction_id existe mais payment_status = "pending"
**Détection:**
```typescript
if (transaction_id !== null && payment_status === 'pending') {
  // Incohérence
}
```

**Logique:** Si transaction ID existe, le paiement a été traité

**Correction serveur:**
```sql
UPDATE jobs SET payment_status = 'paid' WHERE id = ? AND transaction_id IS NOT NULL;
```

---

#### 9.2 payment_link expiré mais payment_status = "pending"
**Détection:**
```typescript
// Vérifier avec Stripe si le payment_intent est expiré
const paymentIntent = await stripe.paymentIntents.retrieve(payment_link);
if (paymentIntent.status === 'canceled' && payment_status === 'pending') {
  // Incohérence
}
```

**Logique:** Lien expiré = paiement échoué

**Correction serveur:**
```sql
UPDATE jobs SET payment_status = 'failed' WHERE id = ? AND payment_link IS NOT NULL;
```

---

#### 9.3 Dépôt requis mais deposit_paid > deposit_amount
**Détection:**
```typescript
if (deposit_required && deposit_paid > deposit_amount) {
  // Incohérence
}
```

**Logique:** On ne peut pas payer plus que le dépôt requis

**Correction serveur:**
```sql
UPDATE jobs SET deposit_paid = deposit_amount WHERE id = ? AND deposit_paid > deposit_amount;
```

---

### CATÉGORIE 10: LOGIQUE MÉTIER AVANCÉE

#### 10.1 Job en_route (step 3) depuis > 24h
**Détection:**
```typescript
const stepDuration = Date.now() - timer_last_updated;
if (current_step === 3 && stepDuration > 24 * 60 * 60 * 1000) {
  // Incohérence probable
}
```

**Logique:** Un trajet ne devrait pas durer plus de 24h

**Correction serveur:**
```sql
-- Marquer comme "problème" pour investigation manuelle
UPDATE jobs SET status = 'on_hold', notes = 'Trajet > 24h détecté' WHERE id = ?;
```

---

#### 10.2 Job sans activité depuis > 7 jours
**Détection:**
```typescript
const daysSinceUpdate = (Date.now() - updated_at) / (24 * 60 * 60 * 1000);
if (status === 'in_progress' && daysSinceUpdate > 7) {
  // Incohérence
}
```

**Logique:** Un job en cours sans mise à jour depuis 7 jours est probablement abandonné

**Correction serveur:**
```sql
UPDATE jobs SET status = 'cancelled', notes = 'Auto-annulé (inactif > 7 jours)' WHERE id = ?;
```

---

#### 10.3 Montant total = 0 mais job completed
**Détection:**
```typescript
if (amount_total === 0 && status === 'completed') {
  // Incohérence métier
}
```

**Logique:** Un job complété devrait avoir un montant

**Correction serveur:**
```sql
-- Mettre en attente devis
UPDATE jobs SET status = 'pending_quote', amount_total = 100 WHERE id = ? AND amount_total = 0;
```

---

## 📦 FORMAT D'ENVOI AU SERVEUR

### Structure de l'incohérence détectée

```typescript
interface Inconsistency {
  category: 'status_step' | 'payment' | 'timer' | 'signature' | 'items' | 'dates' | 'columns' | 'relations' | 'stripe' | 'business';
  type: string; // Nom descriptif (ex: "completed_but_not_final_step")
  severity: 'critical' | 'warning' | 'info';
  description: string;
  currentState: {
    // Données actuelles du job
    status?: string;
    current_step?: number;
    payment_status?: string;
    // ... autres champs pertinents
  };
  detectedAt: string; // ISO timestamp
  correctionStrategy: 'auto' | 'manual' | 'ask_user';
  suggestedCorrection: {
    action: 'update_field' | 'insert_record' | 'delete_record' | 'complex_query';
    fields?: { [key: string]: any }; // Champs à mettre à jour
    sql?: string; // SQL custom si action complexe
  };
}
```

### Exemple d'envoi client → serveur

```typescript
POST /swift-app/v1/job/:id/fix-inconsistencies

{
  "jobId": 2,
  "jobCode": "JOB-DEC-002",
  "detectedAt": "2025-12-21T18:30:00Z",
  "inconsistencies": [
    {
      "category": "status_step",
      "type": "completed_but_not_final_step",
      "severity": "critical",
      "description": "Job status='completed' mais current_step=2/5",
      "currentState": {
        "status": "completed",
        "current_step": 2,
        "signature_blob": "base64...",
        "payment_status": "paid"
      },
      "correctionStrategy": "auto",
      "suggestedCorrection": {
        "action": "update_field",
        "fields": {
          "current_step": 5
        }
      }
    },
    {
      "category": "items",
      "type": "no_items_loaded_step_4",
      "severity": "critical",
      "description": "Étape 4 (déchargement) mais 0 items chargés",
      "currentState": {
        "current_step": 4,
        "items_loaded_count": 0
      },
      "correctionStrategy": "auto",
      "suggestedCorrection": {
        "action": "insert_record",
        "fields": {
          "table": "job_items",
          "values": {
            "job_id": 2,
            "description": "Item par défaut (auto-créé)",
            "quantity": 1,
            "loaded": 1
          }
        }
      }
    },
    {
      "category": "columns",
      "type": "step_current_step_mismatch",
      "severity": "warning",
      "description": "step=1 mais current_step=2",
      "currentState": {
        "step": 1,
        "current_step": 2
      },
      "correctionStrategy": "auto",
      "suggestedCorrection": {
        "action": "update_field",
        "fields": {
          "step": 2
        }
      }
    }
  ],
  "appVersion": "1.0.0",
  "platform": "android"
}
```

### Réponse serveur

```typescript
{
  "success": true,
  "fixed": true,
  "corrections": [
    {
      "type": "completed_but_not_final_step",
      "applied": true,
      "action": "Updated current_step from 2 to 5",
      "timestamp": "2025-12-21T18:30:05Z"
    },
    {
      "type": "no_items_loaded_step_4",
      "applied": true,
      "action": "Inserted 1 default item",
      "timestamp": "2025-12-21T18:30:05Z"
    },
    {
      "type": "step_current_step_mismatch",
      "applied": true,
      "action": "Synchronized step column",
      "timestamp": "2025-12-21T18:30:05Z"
    }
  ],
  "job": {
    // Job corrigé complet
    "id": 2,
    "status": "completed",
    "current_step": 5,
    "step": 5,
    // ...
  }
}
```

---

## 📊 RÉSUMÉ PAR CATÉGORIE

| Catégorie | Nombre de cas | Criticité |
|-----------|---------------|-----------|
| **Status vs Étape** | 4 cas | 🔴 Critique |
| **Paiement** | 4 cas | 🔴 Critique |
| **Timer** | 6 cas | 🟡 Warning |
| **Signature** | 3 cas | 🔴 Critique |
| **Items** | 3 cas | 🔴 Critique |
| **Dates** | 3 cas | 🟡 Warning |
| **Colonnes dupliquées** | 2 cas | 🟡 Warning |
| **Relations** | 3 cas | 🟢 Info |
| **Stripe** | 3 cas | 🔴 Critique |
| **Logique métier** | 3 cas | 🟡 Warning |

**Total: 34 cas d'usage détectables**

---

## 🎯 PRIORISATION

### Phase 1: Incohérences critiques (URGENT)
1. ✅ Status completed mais step < 5
2. ✅ Job payé mais pas completed
3. ✅ Étape ≥ 4 mais pas d'items
4. ✅ Job signé mais pas completed
5. ✅ Step vs current_step mismatch

### Phase 2: Incohérences importantes
6. Timer démarré mais status pending
7. Job step > 1 mais timer null
8. Montant payé > montant total
9. Items déchargés > items chargés
10. Transaction ID mais payment pending

### Phase 3: Warnings et optimisations
11-34. Tous les autres cas

---

## 💡 RECOMMANDATION

**Commence avec les 5 cas de Phase 1**, ils couvrent 80% des problèmes réels rencontrés aujourd'hui.

**Tu veux que je commence l'implémentation avec ces 5 cas prioritaires?**

