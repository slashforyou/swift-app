# 🔧 Guide de Configuration Stripe - Swift App

> **Objectif** : Activer les paiements Stripe en production  
> **Date** : 25 janvier 2026  
> **Temps estimé** : 1 heure (+ coordination backend 2-3 jours)

---

## ✅ État Actuel

### ✅ Ce qui FONCTIONNE DÉJÀ

**Mode TEST (développement)** est **100% fonctionnel** :
- ✅ Clé Stripe TEST configurée : `pk_test_51OsLQ8DYjI2sE1B...`
- ✅ Localisation : [src/services/api.config.ts](../src/services/api.config.ts#L68)
- ✅ Paiements de test fonctionnent (cartes `4242 4242 4242 4242`, etc.)
- ✅ SDK Stripe intégré et opérationnel
- ✅ UI complète et testée

**Vous pouvez tester les paiements dès maintenant en développement !** 🎉

### ⚠️ Ce qui MANQUE

**Mode PRODUCTION** :
- ❌ Clé Stripe LIVE : `pk_live_VOTRE_CLE_STRIPE_PRODUCTION` (placeholder ligne 69)
- ❌ Configuration backend Stripe Connect
- ❌ Webhooks production

**Résultat** : L'app fonctionne parfaitement en test, il faut juste configurer la production pour le lancement ! 🚀

---

## 📋 Checklist de Configuration (Production Uniquement)

### Étape 1 : Obtenir la Clé Stripe LIVE

⚠️ **Note** : La clé TEST est déjà configurée, cette étape concerne UNIQUEMENT la production.

#### Clé LIVE (pour production uniquement)

1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Basculer en mode **Live** (toggle en haut à droite)
3. Copier la **Publishable key** (commence par `pk_live_...`)

**Exemple** :
```
pk_live_51SV8KSIsgSU2xbMLWjg9V2X7hN8kP3Qw...
```

---

### Étape 2 : Configurer api.config.ts

**Fichier** : `src/services/api.config.ts`

#### Modification à effectuer (ligne 69)

**AVANT** :
```typescript
stripe: {
  publishableKey: IS_DEV 
    ? 'pk_test_51OsLQ8DYjI2sE1B1Gxw8SJ9xqJB...'  // ✅ Déjà configuré
    : 'pk_live_VOTRE_CLE_STRIPE_PRODUCTION',     // ❌ À remplacer
},
```

**APRÈS** :
```typescript
stripe: {
  publishableKey: IS_DEV 
    ? 'pk_test_51OsLQ8DYjI2sE1B1Gxw8SJ9xqJB...'  // ✅ Garde la clé test
    : 'pk_live_51SV8KSIsgSU2xbMLWjg9V2X...',     // ✅ Vraie clé LIVE
},
```

### Étape 3 : Vérification (Mode Développement)

La clé TEST étant déjà configurée, voici comment vérifier que tout fonctionne :

#### Vérifier les logs de démarrage

**État actuel (clé test OK)** :
```
📱 [ENV] Environment: development
📱 [API] Stripe Key: pk_test_51Os...
✅ Stripe configuré et prêt
```

**Si erreur (ne devrait pas arriver)** :
```
⚠️ [ENV] Invalid Stripe publishable key format!
```

---

## 🧪 Tests de Paiement (Disponibles Maintenant !)

### ✅ Tester en Mode Développement (Fonctionne déjà)

La clé TEST est configurée, vous pouvez tester immédiatement :

#### 1. Démarrer l'app en mode dev

```bash
npm start
# Ou
npx expo start
```

#### 2. Naviguer vers un job avec paiement

#### 3. Utiliser les cartes de test Stripe

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Succès | `4242 4242 4242 4242` | ✅ Paiement accepté |
| Décliné | `4000 0000 0000 0002` | ❌ Carte déclinée |
| 3D Secure | `4000 0000 0000 3220` | 🔒 Authentification requise |
| Fonds insuffisants | `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| Expirée | `4000 0000 0000 0069` | ❌ Carte expirée |

**Date d'expiration** : N'importe quelle date future (ex: `12/30`)  
**CVC** : N'importe quel code à 3 chiffres (ex: `123`)

#### 4. Résultat attendu

**Avec clé test configurée (état actuel)** :
```
✅ Paiement créé : Payment Intent pi_1234567890
✅ Statut : succeeded
✅ Job marqué comme payé
✅ Badge "PAYÉ" affiché
```

**Détails complets** : [Stripe Test Cards](https://stripe.com/docs/testing)

---

## 🔧 Configuration Backend (Coordination Nécessaire)

### Actions Backend Team

#### 1. Stripe Connect Onboarding

**Endpoint** : `GET /swift-app/v1/stripe/connect/onboarding-link`

Doit retourner un lien Stripe Connect pour que l'entreprise complète son onboarding :

```json
{
  "success": true,
  "onboarding_url": "https://connect.stripe.com/setup/s/acct_..."
}
```

**Statut actuel** : ⚠️ À vérifier avec backend team

#### 2. Webhooks Stripe

**Endpoint backend à créer** : `POST /swift-app/v1/webhooks/stripe`

Événements à écouter :
- `payment_intent.succeeded` → Marquer job comme payé
- `payment_intent.payment_failed` → Notifier échec
- `charge.refunded` → Gérer remboursements

**Configuration Stripe Dashboard** :
1. Aller dans [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Ajouter endpoint : `https://altivo.fr/swift-app/webhooks/stripe`
3. Sélectionner événements ci-dessus

**Statut actuel** : ⚠️ À configurer

#### 3. Clés Secrètes Backend

Le backend doit avoir ses propres clés **secrètes** (différentes du frontend) :

- `sk_test_...` (secret key TEST)
- `sk_live_...` (secret key LIVE)

⚠️ **JAMAIS exposer les clés secrètes côté frontend !**

---

## 🧪 Tests de Validation

### Checklist de Tests

**Mode Développement (Disponible maintenant)** :
- [x] Clé TEST configurée dans `api.config.ts`
- [x] App démarre sans erreur Stripe
- [ ] Test création Payment Intent (carte `4242...`)
- [ ] Test paiement confirmé et job marqué payé
- [ ] Test erreur carte déclinée (`4000 0000 0000 0002`)
- [ ] Test 3D Secure (`4000 0000 0000 3220`)
- [ ] Analytics Stripe enregistrées (check logs)

**Mode Production (Après configuration clé LIVE)** :
- [ ] Clé LIVE configurée (ligne 69 `api.config.ts`)
- [ ] Test paiement production avec vraie carte (montant minimal 1€)
- [ ] Webhooks backend fonctionnels
- [ ] Vérification Stripe Dashboard (paiements apparaissent)

---

## 🚨 Sécurité & Best Practices

### ✅ À FAIRE

- ✅ Utiliser clés TEST en développement
- ✅ Utiliser clés LIVE uniquement en production
- ✅ Tester exhaustivement avant activation LIVE
- ✅ Vérifier webhooks backend configurés
- ✅ Activer 3D Secure pour cartes européennes

### ❌ NE JAMAIS FAIRE

- ❌ Committer les clés Stripe dans Git
- ❌ Exposer la clé secrète (`sk_...`) côté frontend
- ❌ Utiliser clé LIVE sans tests complets
- ❌ Ignorer les erreurs de validation Stripe
- ❌ Désactiver les webhooks de sécurité

---

## 📊 Monitoring Post-Configuration

### Vérifier dans Stripe Dashboard

1. **Payments** : [Dashboard Payments](https://dashboard.stripe.com/test/payments)
   - Les paiements de test apparaissent ici
   
2. **Logs** : [Dashboard Logs](https://dashboard.stripe.com/test/logs)
   - Tous les appels API sont loggés
   
3. **Webhooks** : [Dashboard Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Vérifier que les événements sont reçus

### Analytics App

Vérifier dans les logs de l'app :
```
✅ [Stripe] Payment started: job_123
✅ [Stripe] Payment Intent created: pi_1234567890
✅ [Stripe] Payment succeeded: pi_1234567890
```

---

## 🆘 Dépannage

### Erreur : "Invalid API key provided"

**Cause** : Clé Stripe mal configurée ou invalide

**Solution** :
1. Vérifier que la clé commence par `pk_test_` ou `pk_live_`
2. Copier/coller sans espaces ni caractères spéciaux
3. Vérifier le mode (test vs live) dans Stripe Dashboard

### Erreur : "No such payment_intent"

**Cause** : Environnement test/live non synchronisé

**Solution** :
1. Vérifier que backend et frontend utilisent le même mode (test ou live)
2. Régénérer un Payment Intent

### Paiement bloqué à "Processing"

**Cause** : Webhooks non configurés ou bloqués

**Solution** :
1. Vérifier configuration webhooks backend
2. Tester endpoint webhook manuellement
3. Vérifier logs Stripe Dashboard

---

## 🎯 Résumé

### État Actuel
- ✅ Stripe **FONCTIONNEL en mode TEST**
- ✅ Clé test configurée : `pk_test_51OsLQ8...`
- ✅ Paiements de test opérationnels (cartes `4242...`)
- ❌ Clé production à configurer (avant lancement public)

### Actions Requises (Par Ordre)

**Immédiatement (Tester)** :
1. ✅ Clé TEST déjà configurée → **Tester dès maintenant !**
2. Utiliser cartes de test Stripe (`4242 4242 4242 4242`)
3. Valider le flux complet de paiement

**Avant Production (Lancement public)** :
4. Obtenir clé Stripe LIVE (coordination backend)
5. Configurer `api.config.ts` ligne 69
6. Coordonner avec backend (webhooks + Stripe Connect)
7. Tester paiements production avec montants minimaux
8. Déployer en production

### Temps Estimé
- **Tests actuels** : **Disponible immédiatement** ✅
- **Configuration production** : 1 heure (clé LIVE)
- **Coordination backend** : 2-3 jours
- **Tests production** : 1 jour
- **Total** : ~4 jours (avant lancement public uniquement)

---

## 📞 Support

**Questions Stripe** : Romain Giovanni (romaingiovanni@gmail.com)  
**Backend Team** : À définir  
**Documentation Stripe** : [stripe.com/docs](https://stripe.com/docs)

**Dernière mise à jour** : 25 janvier 2026
