# TRIAL_DEPLOY_INSTRUCTIONS.md
# Activation du Free Trial 14 jours — Instructions de déploiement

## Pré-requis
- [ ] Romain a validé la décision produit (grâce de 14 jours pour les users existants OU basé sur created_at)
- [ ] Backup DB pris avant toute migration
- [ ] PM2 `swiftapp` accessible via `ssh sushinari`

---

## Commandes à exécuter dans l'ordre exact

### 1. Backup DB (indispensable avant toute migration)
```bash
ssh sushinari "mysqldump -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp > /tmp/swiftapp_backup_before_trial_$(date +%Y%m%d_%H%M%S).sql && echo 'Backup OK'"
```

### 2. Appliquer la migration (ajoute trial_ends_at, had_trial, met à jour les companies existantes)
```bash
scp _backend_deploy/migrations/050_subscription_model_v2.sql sushinari:/tmp/
ssh sushinari "mysql -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp < /tmp/050_subscription_model_v2.sql && echo 'Migration OK'"
```

### 3. Déployer subscribe.js (inscription → trial automatique)
```bash
scp _backend_deploy/endPoints/subscribe.js sushinari:/srv/www/htdocs/swiftapp/server/endPoints/
```

### 4. Déployer trialExpirationCron.js (cron quotidien 00:30)
```bash
scp _backend_deploy/trialExpirationCron.js sushinari:/srv/www/htdocs/swiftapp/server/cron/
```

### 5. Enregistrer le cron dans index.js + redémarrer PM2
```bash
ssh sushinari "sed -i 's|require(./cron/storageBillingCron);|require(\"./cron/storageBillingCron\");\n  require(\"./cron/trialExpirationCron\");|' /srv/www/htdocs/swiftapp/server/index.js && pm2 restart swiftapp && pm2 logs swiftapp --lines 20 --nostream"
```

> ⚠️ **L'étape 5 utilise `sed` sur `index.js` qui fait >10 000 lignes.**
> Si la substitution sed est incertaine, faire manuellement :
> ```bash
> ssh sushinari "nano /srv/www/htdocs/swiftapp/server/index.js"
> ```
> Chercher `storageBillingCron` et ajouter la ligne en dessous :
> ```js
>   require('./cron/trialExpirationCron');
> ```
> Puis : `pm2 restart swiftapp`

---

## Vérification post-déploiement

```bash
# 1. Colonnes bien présentes
ssh sushinari "mysql -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp -e \"SHOW COLUMNS FROM companies LIKE 'trial%';SHOW COLUMNS FROM companies LIKE 'had_trial';\""

# 2. Companies migrées avec trial_ends_at
ssh sushinari "mysql -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp -e \"SELECT COUNT(*), subscription_status FROM companies GROUP BY subscription_status;\""

# 3. Cron listé dans les process PM2
ssh sushinari "pm2 logs swiftapp --lines 30 --nostream | grep trialExpir"
```

---

## Rollback si problème

```bash
# Remettre la DB à l'état pre-migration
ssh sushinari "mysql -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp < /tmp/swiftapp_backup_before_trial_YYYYMMDD_HHMMSS.sql"

# Retirer le cron de index.js + restart
ssh sushinari "pm2 restart swiftapp"
```

---

## Questions ouvertes avant déploiement

**✅ Q1 (résolu)** — Companies existantes → plan `comped` (accès total, `subscription_status = 'active'`, pas de trial)

**✅ Q2 (résolu)** — Gate mobile `TrialExpiredGate` → Lucas s'en charge

**✅ Q3 (résolu)** — `trial_period_days: 14` configuré dans `stripe_subscriptions.js`

**Note** : `had_trial` est maintenant setté à `0` à l'inscription, et à `1` uniquement quand Stripe confirme la création d'un trial (dans `stripe_subscriptions.js`). Cela corrige le bug initial identifié par Julien.

1. **Companies existantes** : La migration v2 leur donne **14 jours depuis AUJOURD'HUI** (May 3, 2026).
   → Si tu veux plutôt **14 jours depuis leur date de création** (certains seraient expirés immédiatement),
     modifier dans `050_subscription_model_v2.sql` ligne UPDATE :
     `DATE_ADD(NOW(), INTERVAL 14 DAY)` → `DATE_ADD(created_at, INTERVAL 14 DAY)`

2. **Paiement automatique à l'expiration** : Le cron marque `subscription_status = 'expired'` et notifie.
   Le débit automatique Stripe (trial_period_days sur la Subscription Stripe) est **hors scope** de ce déploiement.
   → Julien doit configurer `trial_period_days: 14` lors de la création de la Stripe Subscription.

3. **Gate mobile** : Les écrans de l'app ne vérifient pas encore `subscription_status = 'expired'`.
   → Lucas doit ajouter le gate côté mobile avant que le cron expire des vraies companies.
