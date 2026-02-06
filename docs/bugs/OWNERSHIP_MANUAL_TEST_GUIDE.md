# 🧪 Guide de Test Manuel - Ownership Multi-Entreprise

**Date:** 1er février 2026  
**Objectif:** Vérifier que les composants ownership s'affichent correctement  
**Durée estimée:** 10-15 minutes

---

## 📋 Prérequis

1. ✅ Backend implémenté (contractee_company dans l'API)
2. ✅ Frontend avec logs de debug actifs
3. ✅ App lancée (`npm start`)
4. ✅ Console React Native Debugger ouverte (ou logs Metro)

---

## 🔍 Scénarios de Test

### Scénario 1: Job Interne (Même Entreprise)

**Données attendues de l'API:**

```json
{
  "job": {
    "contractor_company_id": 1,
    "contractee_company_id": 1,
    "assignment_status": "accepted"
  },
  "company": {
    "id": 1,
    "name": "Quick Movers Pty Ltd"
  },
  "contractee_company": {
    "id": 1,
    "name": "Quick Movers Pty Ltd"
  }
}
```

**Actions:**

1. Ouvrir un job où votre entreprise est créatrice ET exécutante
2. Observer la console

**Logs attendus:**

```
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  contractorCompanyId: 1,
  contracteeCompanyId: 1,
  hasCompanyData: true,
  hasContracteeCompanyData: true,
  assignmentStatus: "accepted",
  isSameCompany: true  // ✅ IMPORTANT
}

✅ [OWNERSHIP] Contractor construit: {
  company_id: 1,
  company_name: "Quick Movers Pty Ltd",
  ...
}

✅ [OWNERSHIP] Contractee construit (JOB INTERNE): {
  company_id: 1,
  company_name: "Quick Movers Pty Ltd",  // ✅ Même nom
  ...
}

🔐 [OWNERSHIP] Permissions calculées: {
  is_owner: true,  // ✅ true car même entreprise
  can_accept: false,
  can_decline: false,
  can_start: true,
  ...
}

🏢 [CompanyDetailsSection] Rendu: {
  hasContractee: true,
  hasContractor: true,
  isDifferentCompany: false,  // ✅ IMPORTANT
  contracteeName: "Quick Movers Pty Ltd",
  contractorName: "Quick Movers Pty Ltd"
}

✅ [CompanyDetailsSection] Affichage: JOB INTERNE (1 section)

👑 [JobOwnershipBanner] Rendu: {
  isDifferentCompany: false,
  assignmentStatus: "accepted",
  isOwner: true,
  ...
}

🎯 [JobAssignmentActions] Rendu: {
  canAccept: false,
  canDecline: false,
  willDisplay: false
}

⚠️ [JobAssignmentActions] Composant masqué (pas de permissions)
```

**Résultat visuel attendu:**

✅ **Panel Summary:**

- 1 section "Entreprise"
- Nom: "Quick Movers Pty Ltd"
- Créateur + Assigné affichés

✅ **Panel Job:**

- 1 section "Entreprise" (identique à Summary)

✅ **JobOwnershipBanner:**

- Badge "👑 Vous êtes le créateur"
- Fond vert clair

❌ **JobAssignmentActions:**

- INVISIBLE (pas de boutons Accept/Decline)

---

### Scénario 2: Job Multi-Entreprise (Status: Pending)

**Données attendues de l'API:**

```json
{
  "job": {
    "contractor_company_id": 2,
    "contractee_company_id": 1,
    "assignment_status": "pending"
  },
  "company": {
    "id": 2,
    "name": "Transport Pro Ltd"
  },
  "contractee_company": {
    "id": 1,
    "name": "Quick Movers Pty Ltd"
  }
}
```

**Actions:**

1. Se connecter avec un compte de l'entreprise contractor (id: 2)
2. Ouvrir un job créé par une autre entreprise (id: 1)
3. Observer la console

**Logs attendus:**

```
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  contractorCompanyId: 2,
  contracteeCompanyId: 1,
  hasCompanyData: true,
  hasContracteeCompanyData: true,
  assignmentStatus: "pending",
  isSameCompany: false  // ✅ IMPORTANT
}

✅ [OWNERSHIP] Contractor construit: {
  company_id: 2,
  company_name: "Transport Pro Ltd",
  ...
}

✅ [OWNERSHIP] Contractee construit (MULTI-ENTREPRISE): {
  company_id: 1,
  company_name: "Quick Movers Pty Ltd",  // ✅ Nom différent
  ...
}

🔐 [OWNERSHIP] Permissions calculées: {
  is_owner: false,  // ✅ false car entreprises différentes
  can_accept: true,  // ✅ true car pending
  can_decline: true,  // ✅ true car pending
  can_start: false,
  ...
}

🏢 [CompanyDetailsSection] Rendu: {
  hasContractee: true,
  hasContractor: true,
  isDifferentCompany: true,  // ✅ IMPORTANT
  contracteeName: "Quick Movers Pty Ltd",
  contractorName: "Transport Pro Ltd"
}

✅ [CompanyDetailsSection] Affichage: MULTI-ENTREPRISE (2 sections)

👑 [JobOwnershipBanner] Rendu: {
  isDifferentCompany: true,
  assignmentStatus: "pending",
  isOwner: false,
  ...
}

🎯 [JobAssignmentActions] Rendu: {
  canAccept: true,
  canDecline: true,
  willDisplay: true
}

✅ [JobAssignmentActions] Boutons affichés: {
  acceptButton: true,
  declineButton: true
}
```

**Résultat visuel attendu:**

✅ **Panel Summary:**

- **2 sections** côte à côte ou empilées
- Section 1 (bordure verte): "Quick Movers Pty Ltd" - Badge "CRÉATEUR"
- Section 2 (bordure bleue): "Transport Pro Ltd" - Badge "EXÉCUTANT"

✅ **Panel Job:**

- **2 sections** (identique à Summary)

✅ **JobOwnershipBanner:**

- Badge "🚚 Job assigné par une autre entreprise"
- Texte: "Quick Movers → Transport Pro"
- Fond orange/jaune

✅ **JobAssignmentActions:**

- **VISIBLE** avec 2 boutons:
  - Bouton vert "✅ Accepter"
  - Bouton rouge "❌ Refuser"
- Message: "Ce job vous a été assigné..."

---

### Scénario 3: Job Multi-Entreprise (Status: Accepted)

**Données attendues de l'API:**

```json
{
  "job": {
    "contractor_company_id": 2,
    "contractee_company_id": 1,
    "assignment_status": "accepted"
  },
  "company": {
    "id": 2,
    "name": "Transport Pro Ltd"
  },
  "contractee_company": {
    "id": 1,
    "name": "Quick Movers Pty Ltd"
  }
}
```

**Actions:**

1. Ouvrir un job multi-entreprise déjà accepté
2. Observer la console

**Logs attendus:**

```
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  contractorCompanyId: 2,
  contracteeCompanyId: 1,
  hasCompanyData: true,
  hasContracteeCompanyData: true,
  assignmentStatus: "accepted",  // ✅ Accepté
  isSameCompany: false
}

🔐 [OWNERSHIP] Permissions calculées: {
  is_owner: false,
  can_accept: false,  // ✅ false car déjà accepté
  can_decline: false,  // ✅ false car déjà accepté
  can_start: true,
  ...
}

✅ [CompanyDetailsSection] Affichage: MULTI-ENTREPRISE (2 sections)

🎯 [JobAssignmentActions] Rendu: {
  canAccept: false,
  canDecline: false,
  willDisplay: false
}

⚠️ [JobAssignmentActions] Composant masqué (pas de permissions)
```

**Résultat visuel attendu:**

✅ **CompanyDetailsSection:**

- **2 sections** affichées

✅ **JobOwnershipBanner:**

- Badge "🚚 Job assigné par une autre entreprise"
- Statut: "ACCEPTÉ"

❌ **JobAssignmentActions:**

- INVISIBLE (déjà accepté)

---

## ⚠️ Problèmes Potentiels et Solutions

### Problème 1: "Entreprise (nom indisponible)" affiché

**Cause:** `contractee_company` absent de la réponse API

**Logs:**

```
⚠️ [OWNERSHIP] contractee_company absent de l'API - affichage limité
```

**Solution:**

- Vérifier que le backend retourne bien `contractee_company`
- Vérifier l'endpoint: `GET /v1/job/{code}/full`

---

### Problème 2: Composants invisibles

**Cause:** Données ownership manquantes

**Logs:**

```
⚠️ [CompanyDetailsSection] Aucune donnée ownership - composant masqué
```

**Solution:**

- Vérifier que l'API retourne `contractor_company_id` et `contractee_company_id`
- Vérifier dans les logs `[OWNERSHIP] Traitement des données`

---

### Problème 3: Mauvais nombre de sections

**Cause:** `isSameCompany` mal calculé

**Debug:**

```
// Vérifier dans les logs:
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  isSameCompany: ???  // Doit être true/false selon les IDs
}

🏢 [CompanyDetailsSection] Rendu: {
  isDifferentCompany: ???  // Inverse de isSameCompany
}
```

**Solution:**

- Comparer `contracteeCompanyId` et `contractorCompanyId` dans les logs
- Vérifier que les IDs sont cohérents

---

## ✅ Checklist de Validation

### Job Interne

- [ ] Log "JOB INTERNE" visible
- [ ] `isSameCompany: true`
- [ ] 1 seule section "Entreprise"
- [ ] Nom d'entreprise correct
- [ ] JobOwnershipBanner affiche "👑 Vous êtes le créateur"
- [ ] JobAssignmentActions invisible
- [ ] `is_owner: true`

### Job Multi-Entreprise (Pending)

- [ ] Log "MULTI-ENTREPRISE" visible
- [ ] `isSameCompany: false`
- [ ] 2 sections affichées
- [ ] Section verte (contractee) avec bon nom
- [ ] Section bleue (contractor) avec bon nom
- [ ] JobOwnershipBanner affiche "🚚 Job assigné"
- [ ] JobAssignmentActions visible avec 2 boutons
- [ ] `is_owner: false`
- [ ] `can_accept: true`
- [ ] `can_decline: true`

### Job Multi-Entreprise (Accepted)

- [ ] 2 sections affichées
- [ ] JobOwnershipBanner affiche "ACCEPTÉ"
- [ ] JobAssignmentActions invisible
- [ ] `can_accept: false`
- [ ] `can_decline: false`

---

## 📸 Captures d'écran Recommandées

1. **Job Interne:**
   - Panel Summary (1 section)
   - JobOwnershipBanner
   - Console logs

2. **Multi-Entreprise Pending:**
   - Panel Summary (2 sections)
   - JobOwnershipBanner
   - JobAssignmentActions avec boutons
   - Console logs

3. **Multi-Entreprise Accepted:**
   - Panel Summary (2 sections)
   - JobOwnershipBanner (status accepté)
   - Console logs

---

## 🎯 Résultat Attendu Final

Si tout fonctionne correctement:

✅ Les logs montrent clairement le traitement des données  
✅ Les noms d'entreprises sont corrects (pas de "Entreprise externe")  
✅ Les sections s'affichent selon le type de job (1 vs 2)  
✅ Les couleurs/bordures sont correctes (vert/bleu)  
✅ Les boutons Accept/Decline apparaissent uniquement si pending  
✅ Les permissions sont cohérentes avec le statut

**Status: Prêt pour production! 🚀**

---

**Dernière mise à jour:** 1er février 2026  
**Auteur:** Frontend Team  
**Version:** 1.0
