# 🚨 Stripe Platform Profile - Configuration Requise

**Date:** 5 Février 2026  
**Problème:** Impossible de créer des comptes Stripe Connect  
**Erreur:** "Please review the responsibilities of managing losses for connected accounts"

---

## ❌ Erreur Actuelle

```json
{
  "success": false,
  "error": "Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile."
}
```

**Contexte:**

- La suppression du compte a fonctionné ✅
- Tentative de créer un nouveau compte → Erreur 500
- L'API Stripe refuse de créer le compte tant que le Platform Profile n'est pas configuré

---

## 🔍 Cause

Stripe exige que les **plateformes Connect** (applications qui créent des comptes pour d'autres utilisateurs) configurent un **Platform Profile** avant de pouvoir créer des comptes Express ou Custom.

Cette configuration définit :

- Le type de plateforme
- Les responsabilités en cas de litiges/pertes
- Les informations légales de la plateforme
- La gestion des remboursements et chargebacks

---

## ✅ Solution : Configuration Stripe Dashboard

### Étape 1 : Accéder au Dashboard Stripe

1. Se connecter sur **https://dashboard.stripe.com**
2. Passer en **mode Test** (toggle en haut à droite)
3. Aller dans **Settings** (⚙️ en haut à droite)
4. Naviguer vers **Connect** → **Platform profile**

**URL directe :** https://dashboard.stripe.com/settings/connect/platform-profile

---

### Étape 2 : Remplir le Platform Profile

#### Section 1 : Platform Information

**Business name:**

- Nom de votre entreprise/plateforme
- Exemple : "Swift App" ou "Altivo Services"

**Platform URL:**

- URL de votre application
- Exemple : "https://altivo.fr"

**Support email:**

- Email de support client
- Exemple : "support@altivo.fr"

**Platform description:**

- Décrivez votre plateforme en quelques lignes
- Exemple : "Application mobile de gestion de jobs et paiements pour entreprises de services"

---

#### Section 2 : Loss Liability

**Question critique :** "Who is responsible for losses on connected accounts?"

**Options :**

1. **The platform (recommended for most cases)** ✅
   - **Choisir cette option si :** Vous voulez avoir le contrôle total
   - La plateforme assume les pertes (chargebacks, refunds)
   - Plus simple pour démarrer
   - Stripe recommande cette option pour les nouvelles plateformes

2. **The connected account**
   - Le compte connecté assume ses propres pertes
   - Nécessite plus de configuration
   - Les utilisateurs doivent gérer leurs propres litiges

**Recommandation :** Choisir **"The platform"** pour commencer.

---

#### Section 3 : Pricing & Fees (optionnel)

**Application fee:**

- Pourcentage ou montant fixe prélevé sur chaque transaction
- Exemple : 2% ou 0.50 AUD par transaction
- **Peut être configuré plus tard**

---

#### Section 4 : Branding (optionnel)

**Business name display:**

- Comment votre nom apparaît aux clients finaux
- Peut être laissé par défaut

**Icon/Logo:**

- Logo de votre plateforme (optionnel)

---

### Étape 3 : Accepter les Termes

1. Lire les **Terms of Service** pour les plateformes Connect
2. Cocher **"I agree to the Stripe Connected Account Agreement"**
3. Cliquer sur **"Save profile"**

---

## 🧪 Vérification

Une fois le Platform Profile configuré :

### Test 1 : Créer un compte via l'API

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer <token>"
```

**Résultat attendu ✅ :**

```json
{
  "success": true,
  "stripe_account_id": "acct_NEW_xxxxx",
  "status": "incomplete",
  "progress": 0
}
```

**Si ça échoue encore ❌ :**

- Vérifier que vous êtes bien en mode **Test** dans le Dashboard
- Vérifier que le profile a bien été **sauvegardé**
- Attendre 1-2 minutes (propagation des changements)

---

### Test 2 : Via l'app frontend

1. Rechargez l'app
2. Allez dans StripeHub
3. Cliquez sur **"Activer Stripe"**
4. **Attendu :** Création réussie + navigation vers WelcomeScreen

**Logs attendus :**

```
🚀 [ONBOARDING] Starting Stripe onboarding...
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Started successfully: acct_NEW_xxxxx
🚀 [StripeHub] Navigation vers StripeOnboarding...
```

---

## 📋 Checklist de Configuration

- [ ] Connecté au Dashboard Stripe (mode Test)
- [ ] Navigué vers Settings > Connect > Platform profile
- [ ] Rempli les informations de base (Business name, URL, Support email)
- [ ] Choisi la responsabilité des pertes ("The platform" recommandé)
- [ ] Accepté les Terms of Service
- [ ] Cliqué sur "Save profile"
- [ ] Testé la création d'un compte via l'API
- [ ] Vérifié que l'app peut créer un compte

---

## ⚠️ Notes Importantes

### Mode Test vs Production

**Mode Test (actuel) :**

- Configuration du Platform Profile **séparée** de la production
- Doit être fait dans le Dashboard en mode Test
- Permet de tester sans impact réel

**Mode Production (futur) :**

- Devra être **reconfiguré** séparément
- Informations plus complètes requises
- Vérification KYC de la plateforme obligatoire

### Clés API

Une fois le Platform Profile configuré, vérifier que le backend utilise bien :

- **Clé secrète Test :** `sk_test_...` (pour le développement)
- **Clé secrète Live :** `sk_live_...` (pour la production, après configuration)

---

## 🔗 Ressources

**Documentation Stripe :**

- Platform Profile : https://stripe.com/docs/connect/platform-profile
- Connect Onboarding : https://stripe.com/docs/connect/onboarding
- Loss Liability : https://stripe.com/docs/connect/liability

**Support Stripe :**

- Dashboard : https://dashboard.stripe.com
- Support : https://support.stripe.com

---

## 🎯 Prochaines Étapes

### Immédiat (Bloquant) 🔴

1. ✅ **Configurer Platform Profile** (backend)
2. 🧪 Tester création de compte
3. 🧪 Tester PersonalInfo (enfin !)

### Après Déblocage ✅

4. Tester AddressScreen
5. Tester BankAccountScreen
6. Tester DocumentsScreen
7. Tester ReviewScreen
8. Flow complet end-to-end

---

## 📞 Contact

**Frontend :** Prêt à tester dès que le Platform Profile est configuré  
**Backend :** Doit configurer le Platform Profile dans le Dashboard Stripe  
**Dashboard Stripe :** https://dashboard.stripe.com/settings/connect/platform-profile

---

**Temps estimé de configuration :** 5-10 minutes  
**Bloquant :** Oui, aucune création de compte possible sans cette config

---

**Document créé le :** 5 Février 2026, 18:52  
**Status :** ⏳ En attente de configuration backend
