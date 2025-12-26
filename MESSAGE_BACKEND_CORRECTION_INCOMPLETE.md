# 🚨 MESSAGE URGENT BACKEND - Correction Incomplète

**Date:** 21 Décembre 2025  
**Sujet:** Endpoint advance-step retourne toujours 404

---

## ❌ PROBLÈME

Ton test curl utilise **CODE** dans l'URL:
```bash
curl -X POST "http://localhost:3021/swift-app/v1/job/JOB-NERD-PENDING-002/advance-step"
                                                        ^^^^^^^^^^^^^^^^^^^^
                                                        ✅ CODE fonctionne
```

Mon client mobile envoie **ID numérique**:
```bash
POST https://altivo.fr/swift-app/v1/job/2/advance-step
                                            ^
                                            ❌ ID = 404
```

---

## 🔍 INCOHÉRENCE

| Endpoint | Format accepté | Status |
|----------|----------------|--------|
| `/job/:id/start` | **ID numérique (2)** | ✅ Fonctionne |
| `/job/:id/advance-step` | **CODE (JOB-DEC-002)** | ❌ ID retourne 404 |
| `/job/:id/complete` | **ID numérique (2)** | ✅ Fonctionne |

**Timer et Complete acceptent l'ID, mais pas Advance Step!**

---

## 🧪 TEST À FAIRE

Peux-tu tester avec l'ID numérique (pas le CODE)?

```bash
curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{"current_step": 3}' \
  -v
```

**Je parie que ça retourne 404.**

---

## 🔧 SOLUTION

Modifie `advanceJobStep.js` pour accepter **ID ET CODE** (comme `startJobById.js` et `completeJobById.js`).

**Code complet fourni dans:** `advanceJobStep_FIX.js`

**Logique:**
```javascript
const jobIdOrCode = req.params.id;

if (/^\d+$/.test(jobIdOrCode)) {
  // C'est un ID numérique → SELECT * FROM jobs WHERE id = ?
  jobId = parseInt(jobIdOrCode);
} else {
  // C'est un CODE → SELECT * FROM jobs WHERE code = ?
  const [jobs] = await connection.execute('SELECT * FROM jobs WHERE code = ?', [jobIdOrCode]);
  jobId = jobs[0].id;
}
```

---

## ✅ APRÈS CORRECTION

Les 3 endpoints accepteront **BOTH** formats:

```bash
# Avec ID numérique
POST /job/2/start ✅
POST /job/2/advance-step ✅
POST /job/2/complete ✅

# Avec CODE
POST /job/JOB-DEC-002/start ✅
POST /job/JOB-DEC-002/advance-step ✅
POST /job/JOB-DEC-002/complete ✅
```

---

## 📊 RÉSUMÉ

**Correction actuelle:**
- ✅ Timer 500 → Corrigé
- 🟡 Steps body → Corrigé (`current_step` accepté)
- ❌ Steps URL → **PAS corrigé** (refuse ID)
- ✅ Complete 99 → Corrigé

**Correction nécessaire:**
- Modifier `advanceJobStep.js` pour accepter ID ET CODE dans l'URL

**Temps:** 10-15 minutes  
**Code fourni:** `advanceJobStep_FIX.js`

---

Merci de corriger rapidement! Sans ça, steps ne fonctionneront toujours pas.

**Romain**
