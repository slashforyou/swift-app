# 📊 Logs de Debug - Ownership Multi-Entreprise

**Date:** 1er février 2026  
**Objectif:** Référence rapide des logs pour faciliter le debugging

---

## 🔍 Logs par Fichier

### src/services/jobs.ts (Service API)

#### Log 1: Traitement initial

```javascript
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  contractorCompanyId: number,
  contracteeCompanyId: number,
  hasCompanyData: boolean,
  hasContracteeCompanyData: boolean,
  assignmentStatus: string,
  isSameCompany: boolean
}
```

**Quand:** Dès réception de la réponse API  
**Utilité:** Vérifier que les IDs et statuts sont corrects  
**Valeurs clés:**

- `isSameCompany: true` → Job interne
- `isSameCompany: false` → Multi-entreprise
- `hasContracteeCompanyData: false` → ⚠️ Backend n'a pas retourné contractee_company

---

#### Log 2: Contractor construit

```javascript
✅ [OWNERSHIP] Contractor construit: {
  company_id: number,
  company_name: string,
  assigned_staff_id?: string,
  assigned_staff_name?: string,
  assigned_at?: string
}
```

**Quand:** Après construction de l'objet contractor  
**Utilité:** Vérifier le nom de l'entreprise exécutante  
**Valeurs clés:**

- `company_name` doit être le vrai nom (pas "Entreprise")

---

#### Log 3: Contractee construit

```javascript
✅ [OWNERSHIP] Contractee construit (JOB INTERNE): {
  company_id: number,
  company_name: string,
  created_by_user_id?: number,
  created_by_name?: string,
  stripe_account_id?: string
}

// OU

✅ [OWNERSHIP] Contractee construit (MULTI-ENTREPRISE): {
  company_id: number,
  company_name: string,
  created_by_user_id?: number,
  created_by_name?: string,
  stripe_account_id?: string
}
```

**Quand:** Après construction de l'objet contractee  
**Utilité:** Vérifier le nom de l'entreprise créatrice  
**Valeurs clés:**

- Type "JOB INTERNE" → Même entreprise
- Type "MULTI-ENTREPRISE" → Entreprises différentes
- `company_name` doit être le vrai nom

---

#### Log 4: Warning contractee_company manquant

```javascript
⚠️ [OWNERSHIP] contractee_company absent de l'API - affichage limité
```

**Quand:** Si `contractee_company` absent et job multi-entreprise  
**Utilité:** Alerte si backend n'a pas retourné les données  
**Action:** Vérifier la réponse de `/v1/job/{code}/full`

---

#### Log 5: Permissions calculées

```javascript
🔐 [OWNERSHIP] Permissions calculées: {
  is_owner: boolean,
  is_assigned: boolean,
  can_accept: boolean,
  can_decline: boolean,
  can_start: boolean,
  can_complete: boolean,
  can_edit: boolean
}
```

**Quand:** Après calcul des permissions  
**Utilité:** Vérifier les droits de l'utilisateur  
**Valeurs clés:**

- `is_owner: true` → L'utilisateur appartient à la contractee
- `can_accept: true` → Peut accepter (job pending)
- `can_decline: true` → Peut refuser (job pending)

---

#### Log 6: Données transformées

```javascript
🔄 [getJobDetails] Data transformed for useJobDetails: {
  hasJob: boolean,
  jobId: number,
  jobCode: string,
  hasClient: boolean,
  clientName: string,
  trucksCount: number,
  workersCount: number,
  itemsCount: number,
  notesCount: number,
  addressesCount: number,
  // 🏢 Ownership data
  hasContractee: boolean,
  hasContractor: boolean,
  assignmentStatus: string,
  contracteeName: string,
  contractorName: string,
  isOwner: boolean
}
```

**Quand:** Après transformation complète des données  
**Utilité:** Vue d'ensemble finale avant envoi au hook  
**Valeurs clés:**

- `hasContractee` et `hasContractor` doivent être `true`
- `contracteeName` et `contractorName` doivent être les vrais noms

---

### src/components/jobDetails/sections/CompanyDetailsSection.tsx

#### Log 7: Rendu du composant

```javascript
🏢 [CompanyDetailsSection] Rendu: {
  hasContractee: boolean,
  hasContractor: boolean,
  isDifferentCompany: boolean,
  contracteeName: string,
  contractorName: string,
  contracteeId: number,
  contractorId: number
}
```

**Quand:** À chaque rendu du composant  
**Utilité:** Vérifier les données reçues par le composant  
**Valeurs clés:**

- `isDifferentCompany: true` → Affichera 2 sections
- `isDifferentCompany: false` → Affichera 1 section

---

#### Log 8: Composant masqué

```javascript
⚠️ [CompanyDetailsSection] Aucune donnée ownership - composant masqué
```

**Quand:** Si pas de données contractee/contractor  
**Utilité:** Explique pourquoi le composant n'apparaît pas  
**Action:** Vérifier les logs précédents (services)

---

#### Log 9: Type d'affichage

```javascript
✅ [CompanyDetailsSection] Affichage: MULTI-ENTREPRISE (2 sections)

// OU

✅ [CompanyDetailsSection] Affichage: JOB INTERNE (1 section)
```

**Quand:** Après décision du type d'affichage  
**Utilité:** Confirme ce qui sera affiché visuellement

---

### src/components/jobs/JobOwnershipBanner.tsx

#### Log 10: Rendu du banner

```javascript
👑 [JobOwnershipBanner] Rendu: {
  variant: "compact" | "full",
  isDifferentCompany: boolean,
  assignmentStatus: string,
  isOwner: boolean,
  isAssigned: boolean,
  contracteeName: string,
  contractorName: string
}
```

**Quand:** À chaque rendu du banner  
**Utilité:** Vérifier les props et l'état ownership  
**Valeurs clés:**

- `isOwner: true` → Badge "Vous êtes le créateur"
- `isOwner: false` → Badge "Job assigné"
- `assignmentStatus` → Affecte le message affiché

---

### src/components/jobs/JobAssignmentActions.tsx

#### Log 11: Rendu des actions

```javascript
🎯 [JobAssignmentActions] Rendu: {
  jobId: string,
  jobTitle: string,
  canAccept: boolean,
  canDecline: boolean,
  willDisplay: boolean
}
```

**Quand:** À chaque rendu du composant  
**Utilité:** Vérifier les permissions reçues  
**Valeurs clés:**

- `willDisplay: true` → Au moins un bouton sera affiché

---

#### Log 12: Composant masqué

```javascript
⚠️ [JobAssignmentActions] Composant masqué (pas de permissions)
```

**Quand:** Si ni can_accept ni can_decline  
**Utilité:** Explique pourquoi les boutons ne s'affichent pas  
**Action:** Normal si job déjà accepted/declined

---

#### Log 13: Boutons affichés

```javascript
✅ [JobAssignmentActions] Boutons affichés: {
  acceptButton: boolean,
  declineButton: boolean
}
```

**Quand:** Si au moins un bouton est affiché  
**Utilité:** Confirme quels boutons sont visibles

---

## 🎯 Scénarios de Diagnostic

### Scénario 1: "Entreprise (nom indisponible)" affiché

**Logs à chercher:**

```
⚠️ [OWNERSHIP] contractee_company absent de l'API - affichage limité
```

**Cause:** Backend n'a pas retourné `contractee_company`  
**Solution:** Vérifier l'endpoint `/v1/job/{code}/full`

---

### Scénario 2: CompanyDetailsSection invisible

**Logs à chercher:**

```
⚠️ [CompanyDetailsSection] Aucune donnée ownership - composant masqué
```

**Remonter aux logs:**

```
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  hasCompanyData: false,  // ❌ Problème ici
  hasContracteeCompanyData: false  // ❌ Ou ici
}
```

**Cause:** API n'a pas retourné `company` ou `contractee_company`  
**Solution:** Vérifier la réponse API complète

---

### Scénario 3: Mauvais nombre de sections

**Logs à comparer:**

```
🏢 [OWNERSHIP] Traitement des données d'entreprise: {
  contractorCompanyId: 1,
  contracteeCompanyId: 2,  // Différents
  isSameCompany: false  // ✅ Correct
}

🏢 [CompanyDetailsSection] Rendu: {
  isDifferentCompany: true  // ✅ Cohérent
}

✅ [CompanyDetailsSection] Affichage: MULTI-ENTREPRISE (2 sections)  // ✅ OK
```

**Cause:** Si incohérent, erreur dans la logique  
**Solution:** Vérifier le code de transformation

---

### Scénario 4: Boutons Accept/Decline invisibles

**Logs à vérifier:**

```
🔐 [OWNERSHIP] Permissions calculées: {
  can_accept: false,  // Pourquoi false?
  can_decline: false
}

🎯 [JobAssignmentActions] Rendu: {
  canAccept: false,
  canDecline: false,
  willDisplay: false  // Normal
}

⚠️ [JobAssignmentActions] Composant masqué (pas de permissions)  // OK
```

**Vérifier:**

- `assignmentStatus` dans le log OWNERSHIP
- Si `'accepted'` ou `'declined'` → Normal que boutons invisibles
- Si `'pending'` → Vérifier calcul des permissions

---

## 📋 Checklist de Debugging

### Pour chaque job testé:

1. **Vérifier le traitement initial**

   ```
   [ ] Log "🏢 [OWNERSHIP] Traitement..." présent
   [ ] contractorCompanyId cohérent
   [ ] contracteeCompanyId cohérent
   [ ] hasCompanyData = true
   [ ] hasContracteeCompanyData = true (si multi-entreprise)
   [ ] isSameCompany correct (true pour interne, false pour multi)
   ```

2. **Vérifier la construction des objets**

   ```
   [ ] Log "✅ [OWNERSHIP] Contractor construit" présent
   [ ] Log "✅ [OWNERSHIP] Contractee construit" présent
   [ ] company_name corrects (pas de placeholder)
   ```

3. **Vérifier les permissions**

   ```
   [ ] Log "🔐 [OWNERSHIP] Permissions calculées" présent
   [ ] is_owner cohérent avec isSameCompany
   [ ] can_accept cohérent avec assignmentStatus
   [ ] can_decline cohérent avec assignmentStatus
   ```

4. **Vérifier les composants**
   ```
   [ ] Log "🏢 [CompanyDetailsSection] Rendu" présent
   [ ] Log d'affichage correct (1 section vs 2 sections)
   [ ] Log "👑 [JobOwnershipBanner] Rendu" présent
   [ ] Log "🎯 [JobAssignmentActions]" présent si applicable
   ```

---

## 🎨 Légende des Emojis

| Emoji | Signification              |
| ----- | -------------------------- |
| 🏢    | Données d'entreprise       |
| ✅    | Construction réussie       |
| ⚠️    | Warning / Composant masqué |
| 🔐    | Permissions                |
| 🔄    | Transformation complète    |
| 👑    | Ownership banner           |
| 🎯    | Actions (Accept/Decline)   |

---

**Dernière mise à jour:** 1er février 2026  
**Fichier:** OWNERSHIP_DEBUG_LOGS.md
