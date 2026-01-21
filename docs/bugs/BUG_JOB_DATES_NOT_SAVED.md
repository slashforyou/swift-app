# 🐛 BUG: Les dates de job ne sont pas sauvegardées lors de la création

## ✅ RÉSOLU - 21 janvier 2026

Les dates sont maintenant correctement sauvegardées.

---

# 🐛 ~~BUG: calendar-days ne filtre pas par timezone local~~

## ✅ RÉSOLU - 21 janvier 2026

Le backend filtre maintenant correctement par timezone local !

### Corrections apportées

| Amélioration                     | Description                                                        |
| -------------------------------- | ------------------------------------------------------------------ |
| **Expansion SQL ±1 jour**        | Capture les jobs à la frontière des timezones                      |
| **Filtrage JS par timezone**     | Chaque job filtré selon son propre timezone                        |
| **Nouvelles données retournées** | `timezone`, `local_start_window_start`, `local_date`, `local_time` |

### Test validé

```
POST /calendar-days { from: "21-01-2026", to: "21-01-2026" }
→ 5 jobs trouvés ✅ (avant: 0)
```

| Job ID | UTC Start         | Timezone            | Local Date | Local Time |
| ------ | ----------------- | ------------------- | ---------- | ---------- |
| 22     | 2026-01-20T22:00Z | Australia/Melbourne | 2026-01-21 | 09:00      |
| 23     | 2026-01-20T22:00Z | Australia/Melbourne | 2026-01-21 | 09:00      |
| 26     | 2026-01-20T22:00Z | Australia/Melbourne | 2026-01-21 | 09:00      |
| 24     | 2026-01-21T09:00Z | Australia/Sydney    | 2026-01-21 | 20:00      |

### Fonctionnalités timezone implémentées

| Composant                    | Description                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| **timezoneService.js**       | Géocodage via OpenStreetMap Nominatim + détection timezone via GPS + fallback par état |
| **createJob.js**             | Détecte auto le timezone depuis l'adresse pickup, sauvegarde GPS, stocke timezone      |
| **GET /v1/job/:id/timezone** | Retourne dates en UTC et heure locale, indique si heure d'été active                   |

### Timezones australiens supportés

| Ville     | Timezone            | Offset | Heure d'été |
| --------- | ------------------- | ------ | ----------- |
| Sydney    | Australia/Sydney    | +11:00 | ✅ Oui      |
| Melbourne | Australia/Melbourne | +11:00 | ✅ Oui      |
| Brisbane  | Australia/Brisbane  | +10:00 | ❌ Non      |
| Perth     | Australia/Perth     | +08:00 | ❌ Non      |
| Adelaide  | Australia/Adelaide  | +10:30 | ✅ Oui      |
| Hobart    | Australia/Hobart    | +11:00 | ✅ Oui      |
| Darwin    | Australia/Darwin    | +09:30 | ❌ Non      |

---

# ✅ Statut des champs - Tous fonctionnels

## Champs de création de job

| Champ                | Frontend | Backend | Status                                                  |
| -------------------- | -------- | ------- | ------------------------------------------------------- |
| `client_id`          | ✅       | ✅      | ✅ OK                                                   |
| `status`             | ✅       | ✅      | ✅ OK                                                   |
| `priority`           | ✅       | ✅      | ✅ OK                                                   |
| `start_window_start` | ✅       | ✅      | ✅ OK                                                   |
| `start_window_end`   | ✅       | ✅      | ✅ OK                                                   |
| `end_window_start`   | ✅       | ✅      | ✅ OK                                                   |
| `end_window_end`     | ✅       | ✅      | ✅ OK                                                   |
| `estimated_duration` | ✅       | ✅      | ✅ OK                                                   |
| `truck_name`         | ✅       | ✅      | ✅ OK                                                   |
| `extras`             | ✅       | ✅      | ✅ OK                                                   |
| `addresses`          | ✅       | ✅      | ✅ OK                                                   |
| `notes`              | ✅       | ✅      | ✅ OK                                                   |
| `assigned_staff_id`  | ✅       | ✅      | ✅ OK                                                   |
| `amount_total`       | ✅       | ❌      | **Non sauvegardé** (retourne `null`)                    |
| `payment_method`     | ✅       | ❌      | **Non sauvegardé** (envoyé: `"card"`, retourne: `null`) |
| `deposit_required`   | ✅       | ⚠️      | Sauvegardé comme `0`                                    |
| `deposit_percentage` | ✅       | ⚠️      | Sauvegardé comme `"0.00"`                               |
| `deposit_paid`       | ✅       | ⚠️      | Sauvegardé comme `0`                                    |

---

## Nouvel endpoint disponible

### GET /v1/job/:id/timezone

Retourne les informations de timezone pour un job :

```json
{
  "success": true,
  "job_id": 23,
  "timezone": "Australia/Melbourne",
  "utc_offset": "+11:00",
  "is_dst": true,
  "dates": {
    "start_window_start": {
      "utc": "2026-01-20T22:00:00.000Z",
      "local": "2026-01-21T09:00:00+11:00"
    },
    "end_window_end": {
      "utc": "2026-01-21T06:00:00.000Z",
      "local": "2026-01-21T17:00:00+11:00"
    }
  }
}
```

---

## Autres champs à implémenter côté backend

### Champs envoyés mais non confirmés

Ces champs sont envoyés par l'application mobile mais leur sauvegarde n'est pas confirmée :

| Champ                 | Description              | Type              | Exemple                                    |
| --------------------- | ------------------------ | ----------------- | ------------------------------------------ |
| `estimated_duration`  | Durée estimée du job     | Integer (minutes) | `240`                                      |
| `truck_name`          | Type de véhicule         | String            | `"Truck"`, `"Van"`, `"2-ton"`, `"Pantech"` |
| `truck_license_plate` | Plaque d'immatriculation | String            | `"ABC-123"`                                |
| `extras`              | Options supplémentaires  | Array of strings  | `["piano", "heavy_items", "packing"]`      |
| `addresses`           | Adresses pickup/delivery | Array of objects  | Voir structure ci-dessous                  |
| `assigned_staff_id`   | ID du staff assigné      | Integer/String    | `15`                                       |
| `notes`               | Notes/commentaires       | String            | `"Fragile items"`                          |

### Structure de `addresses`

```json
{
  "addresses": [
    {
      "type": "pickup",
      "street": "10 flinders lane",
      "city": "Melbourne",
      "state": "VIC",
      "zip": "3000"
    },
    {
      "type": "delivery",
      "street": "50 Collins street",
      "city": "Melbourne",
      "state": "VIC",
      "zip": "3000"
    }
  ]
}
```

### Valeurs possibles pour `extras`

| Clé           | Description                  |
| ------------- | ---------------------------- |
| `piano`       | Piano à déménager            |
| `pool_table`  | Table de billard             |
| `heavy_items` | Objets lourds (>100kg)       |
| `antiques`    | Antiquités / objets fragiles |
| `disassembly` | Démontage de meubles requis  |
| `packing`     | Emballage requis             |
| `storage`     | Stockage temporaire          |
| `stairs`      | Escaliers (pas d'ascenseur)  |
| `lift`        | Ascenseur disponible         |

---

## Champs à ajouter côté frontend (étape 3.9)

Ces champs existent dans la base de données (visibles dans la réponse API) mais ne sont pas encore dans le formulaire mobile :

| Champ                | Description                | Type     | Priorité   |
| -------------------- | -------------------------- | -------- | ---------- |
| `amount_total`       | Montant total estimé/devis | Decimal  | 🟡 Moyenne |
| `deposit_required`   | Acompte requis (0/1)       | Boolean  | 🟡 Moyenne |
| `deposit_percentage` | Pourcentage d'acompte      | Decimal  | 🟡 Moyenne |
| `deposit_amount`     | Montant de l'acompte       | Decimal  | 🟡 Moyenne |
| `deposit_paid`       | Acompte déjà versé (0/1)   | Boolean  | 🟡 Moyenne |
| `payment_method`     | Mode de paiement           | String   | 🟢 Basse   |
| `due_date`           | Date d'échéance paiement   | DateTime | 🟢 Basse   |

### Valeurs suggérées pour `payment_method`

- `cash` - Espèces
- `card` - Carte bancaire
- `bank_transfer` - Virement bancaire
- `invoice` - Facturation ultérieure
