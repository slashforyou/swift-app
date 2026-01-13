# ✅ GUIDE DE TEST RAPIDE - Session 9

**Temps estimé:** 15-30 minutes  
**Prérequis:** App lancée sur device/simulator

---

## 🎯 CHECKLIST TESTS

### ✅ Test 1: Timer Start (5 min)

**Étapes:**
1. Ouvrir un job (ex: JOB-DEC-002)
2. Cliquer sur "Démarrer timer"
3. Observer les logs

**✅ SUCCÈS si:**
```
LOG 🚀 [startTimerAPI] Response status: 200 OK: true
LOG 🚀 [startTimerAPI] Job started successfully
```
- Aucune erreur 500
- Aucun message "pool.execute is not a function"
- UI affiche "Timer démarré"

**❌ ÉCHEC si:**
```
ERROR ❌ [startTimerAPI] Response status: 500
ERROR pool.execute is not a function
```

---

### ✅ Test 2: Steps Update (5 min)

**Étapes:**
1. Job ouvert (devrait être à step 2)
2. Cliquer "Étape suivante" → Step 3
3. Cliquer "Étape suivante" → Step 4
4. Cliquer "Étape suivante" → Step 5
5. Observer les logs

**✅ SUCCÈS si:**
```
LOG 📊 [UPDATE JOB STEP] Calling API: {"current_step": 3, ...}
LOG ✅ Step updated successfully

LOG 📊 [UPDATE JOB STEP] Calling API: {"current_step": 4, ...}
LOG ✅ Step updated successfully

LOG 📊 [UPDATE JOB STEP] Calling API: {"current_step": 5, ...}
LOG ✅ Step updated successfully
```
- Aucune erreur 400
- Aucun message "Invalid step number"
- UI affiche Step 3/5, puis 4/5, puis 5/5

**❌ ÉCHEC si:**
```
WARN ⚠️ Failed to update job step: 400
ERROR Invalid step number. Must be between 1 and 5
```

---

### ✅ Test 3: Complete Job (3 min)

**Étapes:**
1. Job à step 5
2. Cliquer "Terminer job"
3. Observer les logs

**✅ SUCCÈS si:**
```
LOG ✅ [COMPLETE JOB] Job completed successfully
LOG Response: {
  "job": {
    "current_step": 5,     // ✅ PAS 99!
    "status": "completed"
  }
}
```
- UI affiche "Étape 5/5" (pas "99/5")
- Status job = "Terminé" ou "Completed"

**❌ ÉCHEC si:**
```
LOG Response: {
  "job": {
    "current_step": 99,    // ❌ BAD!
    "status": "completed"
  }
}
```
- UI affiche "Étape 99/5"

---

### ✅ Test 4: Persistance Steps (10 min)

**Étapes:**
1. Ouvrir job (step 2)
2. Avancer à step 3
3. **FERMER l'app complètement** (swipe kill, pas juste minimiser)
4. Attendre 10 secondes
5. Rouvrir l'app
6. Rouvrir le même job
7. Observer le step affiché

**✅ SUCCÈS si:**
- Job s'ouvre directement à Step 3/5
- Pas de retour à step 2

**❌ ÉCHEC si:**
- Job revient à step 2
- Steps ne persistent pas

---

### ✅ Test 5: Timer Persistance (5 min)

**Étapes:**
1. Job avec timer démarré
2. Noter le temps écoulé (ex: "2m 15s")
3. **FERMER l'app complètement**
4. Attendre 1 minute
5. Rouvrir app
6. Rouvrir job
7. Observer le timer

**✅ SUCCÈS si:**
- Timer continue depuis dernière valeur
- Temps écoulé > 3 minutes (2m15s + 1min attente)

**❌ ÉCHEC si:**
- Timer revient à 0h
- Timer ne tourne pas

---

## 📊 RÉSULTATS

### Copier-coller ce template après tests

```
# RÉSULTATS TESTS SESSION 9
Date: 19 Décembre 2025
Heure: [HEURE]

✅ Test 1 (Timer Start): [PASS/FAIL]
Logs: [copier logs pertinents]

✅ Test 2 (Steps Update): [PASS/FAIL]
Steps testés: 2→3→4→5
Logs: [copier logs]

✅ Test 3 (Complete Job): [PASS/FAIL]
current_step final: [5 ou 99?]
Logs: [copier logs]

✅ Test 4 (Persistance Steps): [PASS/FAIL]
Step avant fermeture: 3
Step après réouverture: [?]

✅ Test 5 (Timer Persistance): [PASS/FAIL]
Temps avant: [?]
Temps après: [?]

VERDICT GLOBAL: [SUCCÈS TOTAL / ÉCHEC PARTIEL / ÉCHEC]
```

---

## 🚀 SI TOUS LES TESTS PASSENT

**Message au backend:**
```
🎉 TOUS LES TESTS PASSENT!

Les 3 corrections fonctionnent parfaitement:
✅ Timer démarre (200 OK)
✅ Steps s'actualisent (3, 4, 5)
✅ Complete job préserve step (5 pas 99)
✅ Steps persistent après fermeture app
✅ Timer persiste après fermeture app

Merci pour les corrections rapides! 
Session 9 = SUCCÈS COMPLET 🎊

Romain
```

**Créer rapport final:**
- SESSION_9_SUCCESS_FINAL.md

**Planifier Session 10:**
- Fix Signature FileSystem (expo-file-system/legacy)
- Améliorer API Discovery (patterns /:id/)
- Features Notes/Photos

---

## 🔴 SI UN TEST ÉCHOUE

### Test 1 échoue (Timer)
**Demander au backend:**
```
Timer start échoue toujours avec erreur 500.

Logs:
[copier logs]

Questions:
1. Le fichier startJobById.js a bien été modifié?
2. Le serveur a bien été redémarré? (uptime?)
3. Peux-tu vérifier les logs backend au moment de l'appel?

Commande pour tester manuellement:
curl -X POST http://localhost:3021/swift-app/v1/job/2/start
```

### Test 2 échoue (Steps)
**Demander au backend:**
```
Steps update échoue toujours avec erreur 400.

Logs:
[copier logs]

Questions:
1. Le fichier advanceJobStep.js a bien été modifié?
2. Le paramètre 'current_step' est accepté?
3. Peux-tu logger req.body pour voir ce qu'on envoie?

Payload envoyé:
{"current_step": 3, "notes": "..."}
```

### Test 3 échoue (Complete)
**Demander au backend:**
```
Complete job retourne toujours current_step = 99.

Logs:
[copier logs]

Questions:
1. Le fichier completeJobById.js ligne 240 a été modifié?
2. Peux-tu exécuter en DB:
   SELECT current_step FROM jobs WHERE id = 2;
3. La valeur en DB est 99 ou 5?
```

### Test 4 échoue (Persistance)
**Vérifier d'abord:**
```
Est-ce que Tests 1-3 passent?
- Si NON → Fixer Tests 1-3 d'abord
- Si OUI → Continuer

Est-ce qu'on voit "✅ Step updated successfully" dans logs?
- Si NON → Backend ne sauve pas
- Si OUI → Bug sync côté client
```

**Si backend ne sauve pas:**
```
Demander au backend de logger la requête UPDATE:

console.log('Executing UPDATE:', {
  sql: 'UPDATE jobs SET current_step = ? WHERE id = ?',
  params: [current_step, jobId]
});

const result = await connection.execute(...);

console.log('Update result:', {
  affectedRows: result.affectedRows,
  changedRows: result.changedRows
});
```

---

## 📞 SUPPORT

**Si besoin d'aide:**
1. Copier les logs complets
2. Noter quel test échoue
3. Prendre screenshot si bug visuel
4. Me contacter avec:
   - Résultats tests (template ci-dessus)
   - Logs pertinents
   - Screenshots

---

**🎯 OBJECTIF: Valider que les 3 bugs backend sont corrigés**

**Temps max:** 30 minutes  
**Tests critiques:** 1, 2, 3  
**Tests bonus:** 4, 5

**BONNE CHANCE! 🚀**
