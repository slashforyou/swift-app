# 🧪 Guide de Test Rapide - Onboarding Stripe Natif

**Date:** 4 février 2026  
**Version:** 1.0 - Intégration Native  
**Durée:** 15-20 minutes

---

## ✅ Pré-requis

- [ ] App lancée avec `npx expo start`
- [ ] Compte test créé et connecté
- [ ] Backend avec clés Stripe test configurées
- [ ] Caméra accessible (physique ou simulateur)

---

## 🚀 Test Rapide - Flux Complet (10 min)

### 1. Accéder à StripeHub

- Naviguer: **Business → JobsBilling**
- ✅ Badge "Non connecté" visible
- ✅ Bouton "Activer Stripe" présent

### 2. Lancer l'onboarding

- Tapper **"Activer Stripe"**
- ✅ API `startStripeOnboarding()` appelée (check console)
- ✅ Navigation vers WelcomeScreen
- ✅ Écran avec logo Stripe + bénéfices
- Tapper **"Commencer"**

### 3. Étape 1/5 - Infos personnelles

Progress: 20%

```
Prénom:    John
Nom:       Doe
Date:      15/01/1990
Email:     john.doe@test.com
Tél:       +61 400 000 000
```

- Tapper **"Suivant"**
- ✅ Loading indicator visible
- ✅ Navigation vers Address

### 4. Étape 2/5 - Adresse

Progress: 40%

```
Adresse:   123 Main Street
Ville:     Sydney
État:      NSW
Code:      2000
```

- Tapper **"Suivant"**
- ✅ Navigation vers BankAccount

### 5. Étape 3/5 - Compte bancaire

Progress: 60%

```
Titulaire: John Doe
BSB:       062000
Compte:    123456789
```

- Tapper **"Suivant"**
- ✅ Navigation vers Documents

### 6. Étape 4/5 - Documents

Progress: 80%

- Tapper **"📷 Prendre une photo"** (recto)
- Autoriser caméra si demandé
- Prendre/sélectionner photo
- ✅ Preview s'affiche
- Répéter pour verso
- Tapper **"Suivant"**
- ✅ 2 uploads API exécutés
- ✅ Navigation vers Review

### 7. Étape 5/5 - Récapitulatif

Progress: 100%

- ✅ Toutes infos affichées correctement
- Cocher **"J'accepte les CGU Stripe"**
- Tapper **"🚀 Activer mon compte"**
- ✅ API `completeOnboarding()` appelée
- ✅ Retour à StripeHub

### 8. Vérifier StripeHub

- ✅ Badge: 🟡 "En validation" ou "pending_verification"
- ✅ Message: "Stripe valide vos documents (24-48h)"
- ✅ Boutons paiement/payout DÉSACTIVÉS

**✅ Test complet OK!**

---

## ⚡ Tests Critiques (5 min)

### Test Navigation Retour

1. Welcome → Tapper "< Retour"
   - ✅ Retour à StripeHub
2. PersonalInfo → Tapper "< Retour"
   - ✅ Retour à Welcome
3. Review → Tapper "< Retour"
   - ✅ Retour à Documents (images préservées)

### Test Validations

1. **Email invalide**: `john.doe` (sans @)
   - ✅ Erreur affichée
2. **BSB invalide**: `12345` (5 chiffres)
   - ✅ Erreur affichée
3. **Document manquant**: Recto seulement
   - ✅ Erreur "Veuillez uploader les 2 photos"
4. **CGU non cochée**: Tapper "Activer" sans cocher
   - ✅ Erreur "Vous devez accepter les CGU"

### Test Blocage Fonctions

1. Compte en validation → Tenter "Créer lien paiement"
   - ✅ Bouton désactivé ou message d'erreur
2. Compte non activé → Chercher "Demander payout"
   - ✅ Bouton absent ou masqué

---

## 🐛 Checklist Bugs Courants

- [ ] Crash au lancement caméra → Vérifier permissions `app.json`
- [ ] Navigation bloquée → Vérifier `mainNavigation` passé à StripeHub
- [ ] Progress bar à 0% → Vérifier calcul dans chaque screen
- [ ] Bouton "Suivant" coupé → Ajouter KeyboardAvoidingView
- [ ] Photos floues → Vérifier compression image

---

## 📊 Console Logs Attendus

```
🔧 [StripeHub] Démarrage de l'onboarding Stripe natif...
✅ [StripeHub] Onboarding démarré: { accountId: "acct_...", progress: 0 }
✅ [PersonalInfo] Data submitted successfully
✅ [Address] Data submitted successfully
✅ [BankAccount] Data submitted successfully
✅ [Documents] Front uploaded: file_...
✅ [Documents] Back uploaded: file_...
✅ [Review] Onboarding completed: { status: "pending_verification" }
```

---

## ✅ Validation Finale

Si tous les tests passent:

```bash
# Commit
git add .
git commit -m "feat: Onboarding Stripe natif validé"

# Tag
git tag v1.0.0-stripe-onboarding

# Push
git push origin main --tags
```

---

**Durée réelle:** 15-20 minutes  
**Tests essentiels:** ✅ 8/8  
**Prêt pour déploiement beta**
