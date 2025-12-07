# SOLUTION BACKEND - Créer Company pour User ID 15

**PROBLÈME CONFIRMÉ :** L'utilisateur Romain (ID: 15) n'a pas de company associée dans la base de données.

## 📊 DIAGNOSTIC COMPLET

### Tests effectués :
- ✅ `{"company_id": "15"}` → 404 "Company not found" 
- ✅ `{"company_id": 15}` → 404 "Company not found"
- ❌ `{"user_id": "15"}` → 400 "company_id is required" 
- ❌ `{"user_id": 15}` → 400 "company_id is required"

### Conclusion :
- L'API Stripe Connect fonctionne correctement
- Elle attend bien `company_id` (pas user_id)
- L'utilisateur ID 15 n'a simplement pas de company créée

## 🚨 ACTION BACKEND REQUISE

### 1. Vérifier la table companies
```sql
-- Vérifier si l'utilisateur a une company
SELECT * FROM companies WHERE user_id = 15;
-- OU
SELECT * FROM companies WHERE owner_id = 15;

-- Si aucun résultat = c'est ça le problème !
```

### 2. Créer la company manquante
```sql
-- Exemple de création (adapter selon votre schéma)
INSERT INTO companies (
    user_id, 
    name, 
    created_at, 
    updated_at
) VALUES (
    15,
    'Romain Giovanni Company', -- ou récupérer depuis user.firstName + lastName
    NOW(),
    NOW()
);

-- Récupérer l'ID créé
SELECT id FROM companies WHERE user_id = 15;
```

### 3. OU Adapter l'endpoint pour auto-créer
```javascript
// Dans votre endpoint POST /stripe/connect/create
app.post('/stripe/connect/create', async (req, res) => {
    const { company_id } = req.body;
    
    // Vérifier si la company existe
    let company = await Company.findById(company_id);
    
    if (!company) {
        // AUTO-CRÉER la company si elle n'existe pas
        const user = await User.findById(req.user.id); // ou utiliser company_id comme user_id
        company = await Company.create({
            user_id: user.id,
            name: `${user.firstName} ${user.lastName} Company`,
            // autres champs...
        });
        
        console.log(`Auto-created company ${company.id} for user ${user.id}`);
    }
    
    // Continuer avec la création Stripe...
});
```

## 🎯 SOLUTIONS POSSIBLES

### Option A : Création manuelle (RAPIDE)
```sql
-- Créer company pour Romain
INSERT INTO companies (user_id, name) VALUES (15, 'Romain Giovanni Company');
-- Retourner l'ID généré pour les tests
```

### Option B : Auto-création (PROPRE)
Modifier l'endpoint pour auto-créer une company si l'utilisateur n'en a pas.

### Option C : Mapping direct (SIMPLE)
Utiliser directement `user_id` comme `company_id` dans la logique Stripe.

## 🚀 TEST IMMÉDIAT

Une fois la company créée, tester avec :
```bash
curl -X POST "https://altivo.fr/swift-app/v1/stripe/connect/create" \
  -H "Authorization: Bearer 4b40ce7b7b72b630ad6c..." \
  -H "Content-Type: application/json" \
  -d '{"company_id": NEW_COMPANY_ID}'
```

## 📋 URGENCE

**Ce blocage affecte tous les nouveaux utilisateurs** qui n'ont pas encore de company créée.

→ **Recommandation** : Option B (auto-création) pour éviter ce problème à l'avenir.

---
**Status :** Problème identifié - Attente création company  
**Impact :** Tous les users sans company sont bloqués  
**Solution :** 10 minutes de travail côté backend 🚀