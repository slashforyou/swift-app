# 🚨 RÈGLES DE DÉVELOPPEMENT SWIFTAPP

## ⚠️ **RÈGLE ABSOLUE #1 : MODE ONLINE OBLIGATOIRE**

```
🔥 ATTENTION DÉVELOPPEUR !
L'APPLICATION SWIFTAPP EST ONLINE-ONLY
AUCUN TEST EN MODE OFFLINE SAUF DEMANDE EXPLICITE DU CLIENT !
```

### 📱 **COMMANDES DE DÉMARRAGE**

```bash
# ✅ TOUJOURS UTILISER (par défaut)
npm start                    # Mode online normal
npm run start:online         # Mode online explicite
npm run start:tunnel         # Mode tunnel pour tests devices

# ❌ JAMAIS UTILISER SAUF ORDRE EXPLICITE
npm run start:offline        # Mode offline (désactivé par défaut)
```

### 🎯 **POURQUOI CETTE RÈGLE**

1. **Architecture Online-Only :**
   - API calls vers https://altivo.fr/swift-app
   - Stripe payments en temps réel
   - Analytics tracking live
   - Synchronisation données cloud

2. **Tests Réalistes :**
   - Conditions de production identiques
   - Validation des APIs backend
   - Performance réseau réelle
   - Gestion des timeouts et erreurs réseau

3. **Intégrations Critiques :**
   - Stripe Elements nécessite connexion
   - Analytics en temps réel
   - Job synchronization
   - Push notifications

### 📋 **CHECKLIST PRE-DÉMARRAGE**

Avant chaque session de développement :

- [ ] ✅ Connexion internet active
- [ ] ✅ Backend API accessible (https://altivo.fr)
- [ ] ✅ `npm start` sans --offline
- [ ] ✅ Tests avec données réelles
- [ ] ❌ PAS de mode offline

### 🔧 **CONFIGURATION MISE À JOUR**

```json
{
  "start": "expo start",           // ✅ Online par défaut
  "start:offline": "expo start --offline",  // ❌ Explicitement nommé
  "start:online": "expo start"              // ✅ Redondant mais clair
}
```

### 📊 **MONITORING & ANALYTICS**

En mode online, nous pouvons :
- ✅ Tracker les events analytics
- ✅ Monitorer les performances API
- ✅ Tester les paiements Stripe
- ✅ Valider la synchronisation
- ✅ Débugger les issues réseau

### 🎯 **EXCEPTION UNIQUE**

Mode offline autorisé UNIQUEMENT si :
- Client demande explicitement
- Test de gestion hors-ligne spécifique
- Validation du comportement déconnecté

**RÈGLE : Demander confirmation avant tout test offline**

---

## 📝 **NOTE POUR LE DÉVELOPPEUR**

Cette règle est **CRITIQUE** pour :
- La qualité des tests
- La fiabilité des intégrations
- La conformité aux attentes client
- Le réalisme des conditions d'usage

**TOUJOURS SE RAPPELER :** SwiftApp = Online-First App

✨ **Développement efficace = Tests en conditions réelles**