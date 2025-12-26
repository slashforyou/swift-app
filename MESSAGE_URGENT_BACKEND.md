# 🚨 MESSAGE URGENT DEV BACKEND - 3 BUGS BLOQUANTS

**Date:** 18 Décembre 2025  
**Sévérité:** 🔴 CRITIQUE

---

## TL;DR

Le **client mobile envoie les bonnes requêtes** mais le **backend a 3 bugs** qui cassent l'app.

---

## BUG 1: Timer Start - Erreur 500 (🔴 P0 URGENT)

**Requête client:**
```
POST /swift-app/v1/job/2/start
```

**Erreur backend:**
```json
{
  "error": "Internal server error",
  "details": "pool.execute is not a function"
}
```

**Fix:**
```javascript
// Remplacer pool.execute() par pool.query()
// OU installer mysql2: npm install mysql2
```

---

## BUG 2: Steps Update - Erreur 400 (🔴 P0 URGENT)

**Requête client:**
```json
POST /swift-app/v1/job/2/advance-step
{
  "current_step": 3,
  "notes": "..."
}
```

**Erreur backend:**
```json
{
  "error": "Invalid step number. Must be between 1 and 5"
}
```

**Problème:** Step 3 est dans range 1-5 mais backend refuse quand même!

**Fix:**
```javascript
// Accepter n'importe quel step entre 1 et 5
// Supprimer validation de séquence (step+1 obligatoire)
if (current_step < 1 || current_step > 5) {
  return res.status(400).json({ error: "Invalid step" });
}
```

---

## BUG 3: Complete Job - Step devient 99 (🟡 P1)

**Requête client:**
```
POST /swift-app/v1/job/2/complete
```

**Réponse backend:**
```json
{
  "success": true,
  "job": {
    "current_step": 99,  // ❌ Devrait être 4 ou 5
    "status": "completed"
  }
}
```

**Fix:**
```javascript
// NE PAS modifier current_step lors de completion
UPDATE jobs SET status = 'completed', completed_at = NOW()
WHERE id = ?
// (enlever current_step = 99 de la requête)
```

---

## 📁 DOCUMENTATION COMPLÈTE

- **`ANALYSE_PROBLEMES_SERVEUR.md`** → Analyse détaillée + diagnostics
- **`DEMANDE_CORRECTION_BACKEND.md`** → Solutions avec code complet
- **`test-backend-endpoints.ps1`** → Script de test PowerShell
- **`test-backend-endpoints.sh`** → Script de test Bash

---

## ✅ VÉRIFICATIONS À FAIRE

```bash
# 1. Quelle lib MySQL?
cat package.json | grep mysql

# 2. Où est pool.execute?
grep -rn "pool.execute" backend/

# 3. Handler advance-step
grep -rn "advance-step" backend/routes/

# 4. État du job en DB
SELECT * FROM jobs WHERE id = 2;

# 5. Logs backend
pm2 logs swift-app
```

---

## 🎯 PRIORITÉS

**Urgent (24h):**
- Fix BUG 1 (Timer) → Bloquant total
- Fix BUG 2 (Steps) → Bloquant total

**Important (48h):**
- Fix BUG 3 (Complete) → Bug visuel

---

**Le client est 100% opérationnel. Tous les bugs sont côté backend.**

**Merci de corriger rapidement! 🙏**

**Contact:** Romain
