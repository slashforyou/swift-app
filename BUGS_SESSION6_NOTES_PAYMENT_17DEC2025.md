# 🐛 SESSION 6 - BUGS NOTES & PAYMENT

**Date**: 17 décembre 2025 - 20:50  
**Status**: 🔍 **EN ANALYSE**

---

## 🚨 PROBLÈMES REPORTÉS

### Bug #1: Impossible de créer une note sur le job
**Symptôme**: Les notes ne se créent pas, raison inconnue

### Bug #2: Job considéré payé avant paiement effectif
**Symptôme**: À l'étape 5/5, le job passe en mode paiement mais:
- Ne reste pas en étape 5/5
- Ne propose pas de payer
- Est considéré comme déjà payé

---

## 🔍 DIAGNOSTIC BUG #1 - NOTES

### Architecture actuelle

**Composants impliqués**:
1. `src/screens/JobDetailsScreens/note.tsx` - Page des notes
2. `src/components/jobDetails/modals/ImprovedNoteModal.tsx` - Modal de création
3. `src/hooks/useJobNotes.ts` - Hook de gestion des notes
4. `src/services/jobNotes.ts` - Service API

**Flux de création**:
```typescript
// 1. Utilisateur clique "Ajouter note" → Modal s'ouvre
<ImprovedNoteModal
    isVisible={isNoteModalVisible}
    onClose={() => setIsNoteModalVisible(false)}
    onAddNote={handleAddNote}  // ← Callback
    jobId={job?.id}
/>

// 2. Modal submit → appelle handleAddNote
const handleAddNote = async (content, note_type, title) => {
    const result = await addNote({  // ← useJobNotes hook
        title: title || `Note du ${new Date().toLocaleDateString()}`,
        content, 
        note_type 
    });
};

// 3. Hook addNote → Service API
const addNote = async (noteData) => {
    const noteWithUser = {
        ...noteData,
        created_by: profile.id  // ← PROBLÈME POTENTIEL #1
    };
    
    const newNote = await addJobNote(jobId, noteWithUser);
};

// 4. Service API → Backend
POST /swift-app/v1/job/{jobId}/notes
{
    "title": "...",
    "content": "...",
    "note_type": "general",
    "created_by": 123  // ← ID utilisateur requis
}
```

### Problèmes identifiés

**PROBLÈME #1: `profile.id` peut être undefined**

**Fichier**: `src/hooks/useJobNotes.ts` ligne 104-118
```typescript
const addNote = useCallback(async (noteData: CreateJobNoteRequest): Promise<JobNoteAPI | null> => {
    if (!jobId || !profile) return null;  // ✅ Vérifie profile

    const noteWithUser: CreateJobNoteRequest = {
        ...noteData,
        created_by: profile.id  // ❌ Mais si profile.id est undefined?
    };
```

**Impact**: Si `profile` existe mais `profile.id` est `undefined`, la requête API échoue avec 400 Bad Request

**Solution**: Vérifier explicitement `profile.id`:
```typescript
if (!jobId || !profile || !profile.id) {
    console.error('❌ [useJobNotes] Missing jobId, profile, or profile.id');
    return null;
}
```

---

**PROBLÈME #2: Pas de logs d'erreur visibles**

**Fichier**: `src/hooks/useJobNotes.ts` ligne 126-128
```typescript
} catch (err) {
    console.error('Error adding job note:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
```

**Impact**: L'erreur est loguée mais pas affichée à l'utilisateur

**Solution actuelle**: Le `catch` dans `note.tsx` devrait afficher l'erreur via `showError()`, mais ça dépend si l'erreur est bien propagée.

**Vérification**: `note.tsx` ligne 29-48
```typescript
const handleAddNote = async (content, note_type, title) => {
    try {
        const result = await addNote({ title, content, note_type });
        if (result) {
            showSuccess('Note ajoutée', '...');
            await refetch();
            return Promise.resolve();
        } else {
            throw new Error('Échec de l\'ajout de la note');  // ✅ Erreur lancée si result = null
        }
    } catch (error) {
        console.error('Error adding note:', error);
        showError('Erreur', 'Impossible d\'ajouter la note...');  // ✅ Toast affiché
        throw error;
    }
};
```

**Analyse**: Le flux d'erreur semble correct, mais si `addNote()` retourne `null` au lieu de lancer une erreur, `showError()` est appelé mais la modal reste ouverte (car l'erreur est `throw` après).

---

**PROBLÈME #3: Fallback local potentiellement cassé**

**Fichier**: `src/hooks/useJobNotes.ts` ligne 130-160
```typescript
// Si l'API n'est pas disponible, sauvegarder localement
if (errorMessage.includes('404') || errorMessage.includes('400')) {
    const localNote: JobNoteAPI = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        job_id: jobId,
        title: noteData.title,
        content: noteData.content,
        note_type: noteData.note_type || 'general',
        created_by: profile.id,  // ❌ Toujours undefined si profile.id manque
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const updatedNotes = [localNote, ...notes];
    setNotes(updatedNotes);
    
    // Sauvegarder dans AsyncStorage
    await saveNotesLocally(jobId, updatedNotes);
    return localNote;
}
```

**Impact**: Même le fallback local échoue si `profile.id` est manquant

---

### Actions de correction - Bug #1

**1. Vérifier profile.id avant toute opération**
```typescript
if (!jobId || !profile || !profile.id) {
    console.error('❌ [useJobNotes] Missing required data:', { 
        jobId: !!jobId, 
        profile: !!profile, 
        profileId: profile?.id 
    });
    return null;
}
```

**2. Ajouter logs détaillés pour debugging**
```typescript
console.log('📝 [useJobNotes] Adding note:', {
    jobId,
    userId: profile.id,
    noteType: noteData.note_type,
    hasContent: !!noteData.content
});
```

**3. Améliorer le message d'erreur utilisateur**
```typescript
showError(
    'Erreur', 
    `Impossible d'ajouter la note. ${error.message || 'Veuillez vérifier votre connexion.'}`
);
```

**4. Vérifier l'endpoint backend**
- L'endpoint `POST /swift-app/v1/job/{jobId}/notes` existe-t-il ?
- Retourne-t-il 404 comme `/logs` et `/analytics/events` ?

---

## 🔍 DIAGNOSTIC BUG #2 - PAYMENT

### Comportement attendu vs actuel

**Attendu**:
1. Job progresse: Step 1 → 2 → 3 → 4 → **5/5**
2. À step 5/5: Job terminé, bouton "Signer" apparaît
3. Après signature: Bouton "Payer maintenant" apparaît
4. Statut paiement: "En attente" (pending)

**Actuel**:
1. Job arrive à step 5/5 ✅
2. Job passe en mode paiement ✅
3. ❌ **Ne reste pas en étape 5/5** (régresse ?)
4. ❌ **Ne propose pas de payer** (considéré payé)
5. ❌ **Statut = "completed"** au lieu de "pending"

### Logique problématique

**Fichier**: `src/screens/JobDetailsScreens/payment.tsx` ligne 56-60
```typescript
const determinePaymentStatus = (actualCost: number, estimatedCost: number) => {
    if (actualCost === 0) return 'pending';      // Coût = 0 → pending
    if (actualCost < estimatedCost) return 'partial';  // Coût < estimé → partial
    return 'completed';  // ❌ Coût >= estimé → COMPLETED (même si pas payé!)
};
```

**PROBLÈME**: La fonction ne vérifie PAS si le paiement a été effectué !

Elle compare uniquement:
- `actualCost` (calculé du temps passé) 
- `estimatedCost` (devis initial)

**Scénario du bug**:
```
Step 5/5 atteint:
- actualCost = 550 AUD (temps billable calculé)
- estimatedCost = 550 AUD (devis)
- actualCost >= estimatedCost → status = 'completed' ❌
- Mais isPaid = false (pas encore payé)

Résultat:
- Badge "Payé" s'affiche (statusInfo.label = 'Payé')
- Bouton "Payer maintenant" désactivé (status !== 'pending')
- Utilisateur bloqué
```

### Correction requise

**AVANT** (❌ Ne vérifie pas isPaid):
```typescript
const determinePaymentStatus = (actualCost: number, estimatedCost: number) => {
    if (actualCost === 0) return 'pending';
    if (actualCost < estimatedCost) return 'partial';
    return 'completed';  // ❌ FAUX si pas encore payé
};
```

**APRÈS** (✅ Vérifie isPaid):
```typescript
const determinePaymentStatus = (actualCost: number, estimatedCost: number, isPaid: boolean) => {
    // Si déjà payé via Stripe, statut = completed (peu importe le coût)
    if (isPaid) return 'completed';
    
    // Sinon, déterminer selon le coût
    if (actualCost === 0) return 'pending';
    if (actualCost < estimatedCost) return 'partial';
    
    // Coût calculé >= estimé MAIS pas encore payé → 'ready' ou 'pending'
    return 'pending';  // ✅ Attend le paiement
};
```

**Ligne 49** - Appel corrigé:
```typescript
const getRealTimePaymentInfo = () => {
    const costData = calculateCost(billableTime);
    const estimatedCost = job?.job?.estimatedCost || job?.estimatedCost || 0;
    const currentCost = costData.cost;
    const isPaid = job?.job?.isPaid || job?.isPaid || false;  // ← Récupérer isPaid
    
    return {
        estimated: estimatedCost,
        current: currentCost,
        billableHours: costData.hours,
        actualTime: billableTime,
        totalTime: totalElapsed,
        currency: 'AUD',
        status: determinePaymentStatus(currentCost, estimatedCost, isPaid),  // ← Passer isPaid
        isPaid: isPaid,
        isRunning
    };
};
```

---

### Problème secondaire: Step régresse

**Symptôme**: "Ne reste pas en étape 5/5"

**Hypothèses**:
1. **Timer reset ?**: Le `JobTimerProvider` pourrait reset le step après completion
2. **API sync ?**: Endpoint `PATCH /job/{id}/step` retourne une erreur 404 → step non sauvegardé → reset au reload
3. **State management**: `currentStep` dans le context vs `job.step.actualStep` désynchronisés

**Vérification nécessaire**:
- Logs du `JobTimerProvider` lors de la transition 4 → 5
- Comportement après reload de l'app
- Valeur de `job.step.actualStep` vs `currentStep` du context

**Fichier à analyser**:
- `src/context/JobTimerProvider.tsx` - Gestion du timer et steps
- `src/services/jobSteps.ts` - Mise à jour step (retourne 404 actuellement)

---

## 📋 PLAN DE CORRECTION

### Bug #1 - Notes

- [ ] **Vérifier profile.id avant addNote**
  - Fichier: `src/hooks/useJobNotes.ts` ligne 104
  - Ajout: `if (!profile.id) return null;`

- [ ] **Ajouter logs détaillés**
  - Logs à l'entrée de `addNote()`
  - Logs de la réponse API (success/error)

- [ ] **Tester endpoint backend**
  - Vérifier si `POST /job/{id}/notes` existe
  - Si 404 → Ajouter à la roadmap

- [ ] **Améliorer messages d'erreur**
  - Afficher détails spécifiques (400 vs 404 vs 500)

### Bug #2 - Payment

- [ ] **Corriger determinePaymentStatus**
  - Fichier: `src/screens/JobDetailsScreens/payment.tsx` ligne 56
  - Ajouter paramètre `isPaid`
  - Retourner 'pending' si pas payé

- [ ] **Vérifier persistance step 5**
  - Analyser `JobTimerProvider`
  - Vérifier synchronisation avec API

- [ ] **Tester workflow complet**
  - Step 1 → 5
  - Signature
  - Paiement
  - Validation statut final

---

## 🎯 PRIORITÉS

| Bug | Sévérité | Impact | Priorité |
|-----|----------|--------|----------|
| **#1 Notes** | 🟡 Moyenne | Utilisateurs ne peuvent pas noter | **HAUTE** |
| **#2 Payment** | 🔴 Critique | Bloque le workflow de paiement | **CRITIQUE** |

---

**Prochaines étapes**: Appliquer les corrections et tester
