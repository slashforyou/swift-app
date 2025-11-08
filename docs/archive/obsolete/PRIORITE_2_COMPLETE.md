# ✅ PRIORITÉ 2 TERMINÉE - Intégration paymentWindow.tsx au Timer Context

**Date** : 2 novembre 2025  
**Objectif** : Intégrer `paymentWindow.tsx` au `JobTimerContext` pour des calculs en temps réel

---

## 📋 Modifications effectuées

### **1. paymentWindow.tsx** - Intégration complète au timer context

#### **Avant** ❌
```tsx
// ❌ Calculs statiques depuis job data
const getPaymentAmount = () => {
  const jobData = job?.job || job;
  return jobData?.actualCost || jobData?.estimatedCost || 0;
};

// ❌ Format EUR au lieu de AUD
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
```

#### **Après** ✅
```tsx
// ✅ Import du timer context
import { useJobTimerContext } from '../../context/JobTimerProvider';

// ✅ Extraction des données temps réel
const { 
  billableTime, 
  calculateCost, 
  formatTime,
  HOURLY_RATE_AUD 
} = useJobTimerContext();

// ✅ Calcul en temps réel basé sur billableTime
const getPaymentAmount = () => {
  const costData = calculateCost(billableTime);
  const realTimeCost = costData.cost;
  
  // Fallback sur estimé si timer pas démarré
  const jobData = job?.job || job;
  const estimatedCost = jobData?.estimatedCost || jobData?.actualCost || 0;
  
  return realTimeCost > 0 ? realTimeCost : estimatedCost;
};

// ✅ Format AUD (cohérent avec HOURLY_RATE_AUD)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
};

const costData = calculateCost(billableTime);
```

---

### **2. Affichage temps réel dans Method Selection**

```tsx
const renderMethodSelection = () => (
  <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
    <Text>Choisir le mode de paiement</Text>
    
    <Text>Montant à payer : {formatCurrency(paymentAmount)}</Text>

    {/* ✅ NOUVEAU : Affichage temps facturable */}
    {billableTime > 0 && (
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          Temps facturable
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.tint }}>
          {formatTime(billableTime)} • {costData.hours.toFixed(2)}h @ {HOURLY_RATE_AUD} AUD/h
        </Text>
      </View>
    )}
    
    {/* Boutons Card / Cash */}
  </View>
);
```

---

### **3. Affichage détaillé dans Card Form**

```tsx
const renderCardForm = () => (
  <ScrollView>
    <Text>Informations de la carte</Text>
    <Text>{formatCurrency(paymentAmount)}</Text>

    {/* ✅ NOUVEAU : Détail du calcul */}
    {billableTime > 0 && (
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Temps facturable</Text>
          <Text>{formatTime(billableTime)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Taux horaire</Text>
          <Text>{costData.hours.toFixed(2)}h × {HOURLY_RATE_AUD} AUD/h</Text>
        </View>
      </View>
    )}
    
    {/* Champs de formulaire */}
  </ScrollView>
);
```

---

### **4. Affichage détaillé dans Cash Form**

```tsx
const renderCashForm = () => (
  <View>
    <Text>Paiement en espèces</Text>
    <Text>Montant à payer : {formatCurrency(paymentAmount)}</Text>

    {/* ✅ NOUVEAU : Détail du calcul (identique au Card Form) */}
    {billableTime > 0 && (
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Temps facturable</Text>
          <Text>{formatTime(billableTime)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Taux horaire</Text>
          <Text>{costData.hours.toFixed(2)}h × {HOURLY_RATE_AUD} AUD/h</Text>
        </View>
      </View>
    )}
    
    {/* Champ montant reçu */}
  </View>
);
```

---

## 🎯 Résultats obtenus

### **1. Calculs en temps réel** ✅
- **Avant** : `actualCost` ou `estimatedCost` statique du job
- **Après** : `calculateCost(billableTime)` dynamique

### **2. Devise cohérente** ✅
- **Avant** : EUR (Euros)
- **Après** : AUD (Dollars australiens) - cohérent avec `HOURLY_RATE_AUD`

### **3. Transparence pour le client** ✅
- Affichage du temps facturable en HH:MM:SS
- Affichage du nombre d'heures (ex: 2.45h)
- Affichage du taux horaire (ex: 85 AUD/h)
- Calcul visible : `2.45h × 85 AUD/h = 208.25 AUD`

### **4. Synchronisation parfaite** ✅
- `paymentWindow.tsx` utilise les mêmes données que `payment.tsx`
- Pas de dérive possible entre les deux pages
- Une seule source de vérité : `JobTimerContext`

---

## 📊 Comparaison Avant/Après

| Critère | Avant ❌ | Après ✅ |
|---------|---------|----------|
| **Source de données** | `job.actualCost` ou `job.estimatedCost` | `calculateCost(billableTime)` |
| **Devise** | EUR (incohérent) | AUD (cohérent) |
| **Temps réel** | Non | Oui |
| **Transparence** | Montant seul | Temps + Taux + Calcul |
| **Synchronisation** | Indépendant de payment.tsx | Synchronisé via context |
| **Fallback** | Estimé seulement | Estimé si timer pas démarré |

---

## 🧪 Scénarios de test

### **Scénario 1 : Job avec timer actif**
1. Démarrer un job
2. Laisser tourner le timer (ex: 2h30)
3. Ouvrir `paymentWindow.tsx`
4. **Résultat attendu** :
   - Montant = `2.5h × 85 AUD/h = 212.50 AUD`
   - Temps facturable affiché : `02:30:00`
   - Détail visible : `2.50h × 85 AUD/h`

### **Scénario 2 : Job avec pauses**
1. Démarrer un job
2. Timer tourne 2h
3. Prendre 30min de pause
4. Reprendre 1h
5. Ouvrir `paymentWindow.tsx`
6. **Résultat attendu** :
   - Temps total : 3h30
   - Temps facturable : 3h (pause exclue)
   - Montant = `3h × 85 AUD/h = 255 AUD`

### **Scénario 3 : Job pas encore démarré**
1. Ouvrir un job sans démarrer le timer
2. Ouvrir `paymentWindow.tsx`
3. **Résultat attendu** :
   - Montant = `estimatedCost` du job
   - Pas d'affichage du bloc "Temps facturable"
   - Fallback gracieux sur les données du job

### **Scénario 4 : Comparaison avec payment.tsx**
1. Démarrer un job, timer à 1h30
2. Ouvrir `payment.tsx` → Noter le montant
3. Ouvrir `paymentWindow.tsx` → Noter le montant
4. **Résultat attendu** :
   - Les deux montants sont **identiques**
   - Les deux affichent le même temps facturable
   - Pas de dérive entre les pages

---

## 🎨 Interface utilisateur

### **Method Selection Screen**
```
┌─────────────────────────────────────┐
│  Choisir le mode de paiement        │
│                                     │
│  Montant à payer : 212.50 AUD       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Temps facturable             │ │
│  │  02:30:00 • 2.50h @ 85 AUD/h  │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ 💳 Carte bancaire         > ]   │
│  [ 💵 Espèces                > ]   │
└─────────────────────────────────────┘
```

### **Card Form Screen**
```
┌─────────────────────────────────────┐
│  Informations de la carte           │
│  212.50 AUD                         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Temps facturable   02:30:00   │ │
│  │ Taux horaire   2.50h × 85 AUD │ │
│  └───────────────────────────────┘ │
│                                     │
│  Numéro de carte                    │
│  [____________________]             │
│                                     │
│  Date / CVV                         │
│  [______]  [____]                   │
│                                     │
│  [ Retour ]  [ Payer 212.50 AUD ]  │
└─────────────────────────────────────┘
```

---

## ✅ Avantages obtenus

1. **Transparence totale** : Le client voit exactement ce qu'il paie
2. **Calculs justes** : Basés sur le temps réel, pas une estimation
3. **Cohérence** : Même calcul partout (payment.tsx, paymentWindow.tsx)
4. **Professionnalisme** : Détail du calcul visible
5. **Confiance** : Pas de surprise, tout est clair
6. **Maintenance** : Une seule source de calcul (JobTimerContext)

---

## 🚀 Prochaines étapes suggérées

### **Priorité 3 : Nettoyage du code**
- [ ] Supprimer les fonctions utilitaires non utilisées (`jobStepsUtils.ts`)
- [ ] Retirer `job.step.actualStep` et `job.current_step` (optionnel)
- [ ] Nettoyer les console.log de debug
- [ ] Ajouter des commentaires de documentation

### **Améliorations futures**
- [ ] Ajouter un historique des paiements
- [ ] Permettre les paiements partiels
- [ ] Envoyer un reçu par email
- [ ] Intégrer un vrai processeur de paiement (Stripe, Square)
- [ ] Ajouter des taxes/TVA si applicable

---

## 📝 Notes techniques

### **Dépendances**
- `JobTimerContext` doit être wrappé autour de `JobDetailsWithProvider`
- `billableTime` peut être `0` si le timer n'a pas démarré
- `calculateCost()` retourne `{ hours, cost, rawHours }`
- `formatTime()` formate en `HH:MM:SS` par défaut

### **Fallback gracieux**
```tsx
// Si billableTime = 0, utiliser estimatedCost
const realTimeCost = costData.cost;
const estimatedCost = jobData?.estimatedCost || jobData?.actualCost || 0;
return realTimeCost > 0 ? realTimeCost : estimatedCost;
```

### **Affichage conditionnel**
```tsx
// N'afficher le bloc temps facturable que si billableTime > 0
{billableTime > 0 && (
  <View>...</View>
)}
```

---

## 🎉 Conclusion

**paymentWindow.tsx** est maintenant **100% intégré** au `JobTimerContext` :
- ✅ Calculs en temps réel
- ✅ Devise AUD cohérente
- ✅ Transparence totale pour le client
- ✅ Synchronisation parfaite avec payment.tsx
- ✅ Interface utilisateur améliorée

**Statut** : TERMINÉ ✅  
**Prochaine priorité** : Nettoyage et optimisation du code
