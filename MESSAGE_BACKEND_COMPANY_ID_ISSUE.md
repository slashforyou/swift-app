# MESSAGE BACKEND - Company ID Issue

**Date:** 7 décembre 2025  
**Problème:** Company not found avec l'ID utilisateur réel

## 🚨 PROBLÈME

L'utilisateur Romain (ID: 15) tente de créer un compte Stripe mais le backend retourne :
```json
{"success":false,"error":"Company not found"}
```

## 📊 DÉTAILS TECHNIQUES

**Endpoint appelé:**
```
POST https://altivo.fr/swift-app/v1/stripe/connect/create
Content-Type: application/json
Authorization: Bearer 4b40ce7b7b72b630ad6c...

Body: {"company_id": 15}
```

**Utilisateur connecté:**
```json
{
  "id": "15",
  "firstName": "Romain",
  "lastName": "Giovanni", 
  "email": "romaingiovanni@gmail.com",
  "role": "admin"
}
```

## ❓ QUESTIONS POUR L'ÉQUIPE BACKEND

1. **Mapping user_id → company_id**
   - L'utilisateur ID 15 existe-t-il dans votre table users ? ✅ (on peut se connecter)
   - Doit-on utiliser `user.id` ou un autre champ comme `company_id` ?
   - Y a-t-il une table séparée `companies` avec d'autres IDs ?

2. **Structure attendue**
   ```sql
   -- Quelle est la bonne requête ?
   SELECT company_id FROM users WHERE id = 15;
   -- OU
   SELECT id FROM companies WHERE user_id = 15;
   -- OU
   SELECT id FROM companies WHERE owner_id = 15;
   ```

3. **ID de test**
   - Quel `company_id` valide puis-je utiliser pour tester ?
   - Comment créer une company pour l'utilisateur ID 15 ?

## 🎯 SOLUTION DEMANDÉE

1. **Confirmer l'ID correct** à utiliser pour l'utilisateur Romain (ID: 15)
2. **Créer l'entrée company** si elle manque
3. **Documenter le mapping** user_id → company_id

## 📋 REPRODUCTIBILITÉ 

**Test facile :**
```bash
curl -X POST "https://altivo.fr/swift-app/v1/stripe/connect/create" \
  -H "Authorization: Bearer 4b40ce7b7b72b630ad6c..." \
  -H "Content-Type: application/json" \
  -d '{"company_id": 15}'

# Retourne: {"success":false,"error":"Company not found"}
```

**Besoin :** Un company_id qui fonctionne pour cet utilisateur ! 🚀

---
**Contact:** Frontend Team  
**Utilisateur de test:** Romain Giovanni (user_id: 15)  
**Status:** Bloqué sur création compte Stripe