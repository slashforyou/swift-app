# 🚚 Test Manuel - Job de A à Z

**Scénario**: Création, exécution et paiement complet d'un job  
**Priorité**: 🔴 Critique  
**Durée estimée**: 20-30 minutes  
**Prérequis**: Compte business actif, Stripe configuré

---

## 📋 Checklist pré-test

- [ ] App lancée et connectée avec un compte business
- [ ] Au moins 1 véhicule configuré
- [ ] Au moins 1 membre du staff disponible (optionnel)
- [ ] Mode Stripe Test activé

---

## PHASE 1: CRÉATION DU JOB

### 1.1 Accès à la création

| #   | Action                                        | Résultat attendu                    | ✅/❌ | Bug |
| --- | --------------------------------------------- | ----------------------------------- | ----- | --- |
| 1   | Depuis Home, appuyer sur "+" ou "Nouveau job" | Modal/écran de création s'ouvre     | ✅    |     |
| 2   | Vérifier le titre de l'écran                  | "Nouveau Job" ou équivalent visible | ✅    |     |

### 1.2 Informations client

| #   | Action                              | Résultat attendu               | ✅/❌ | Bug |
| --- | ----------------------------------- | ------------------------------ | ----- | --- |
| 3   | Entrer nom du client: "Test Client" | Texte affiché correctement     | ✅    |     |
| 4   | Entrer email: "<test@example.com>m>"    | Email validé (format correct)  | ✅    |     |
| 5   | Entrer téléphone: "0412345678"      | Numéro formaté correctement    | ✅    |     |
| 6   | Laisser un champ obligatoire vide   | Message d'erreur clair affiché | ⬜    |     |

### 1.3 Adresses

| #   | Action                           | Résultat attendu                       | ✅/❌ | Bug |
| --- | -------------------------------- | -------------------------------------- | ----- | --- |
| 7   | Appuyer sur "Adresse de départ"  | Écran/modal de saisie d'adresse        | ✅    |     |
| 8   | Taper "123 Main Street Sydney"   | Suggestions Google Places apparaissent | ✅    |     |
| 9   | Sélectionner une suggestion      | Adresse remplie automatiquement        | ✅    |     |
| 10  | Répéter pour "Adresse d'arrivée" | Même comportement                      | ✅    |     |
| 11  | Vérifier la distance calculée    | Distance affichée (ex: "15.2 km")      | ⬜    |     |

### 1.4 Date et heure

| #   | Action                           | Résultat attendu                     | ✅/❌ | Bug |
| --- | -------------------------------- | ------------------------------------ | ----- | --- |
| 12  | Appuyer sur le sélecteur de date | Date picker s'ouvre                  | ✅    |     |
| 13  | Sélectionner une date future     | Date affichée correctement           | ✅    |     |
| 14  | Sélectionner une heure           | Heure affichée (format 24h ou AM/PM) | ✅    |     |
| 15  | Essayer une date passée          | Devrait être bloqué ou warning       | ⬜    |     |

### 1.5 Détails du job

| #   | Action                                     | Résultat attendu                 | ✅/❌ | Bug |
| --- | ------------------------------------------ | -------------------------------- | ----- | --- |
| 16  | Sélectionner type de job (Moving/Delivery) | Option sélectionnée visuellement | ✅    |     |
| 17  | Ajouter des notes: "Fragile items"         | Texte sauvegardé                 | ✅    |     |
| 18  | Sélectionner un véhicule                   | Véhicule affiché avec détails    | ⬜    |     |
| 19  | Assigner du staff (si disponible)          | Staff assigné visible            | ⬜    |     |

### 1.6 Validation et création

| #   | Action                     | Résultat attendu              | ✅/❌ | Bug |
| --- | -------------------------- | ----------------------------- | ----- | --- |
| 20  | Vérifier le résumé du job  | Toutes les infos correctes    | ⬜    |     |
| 21  | Appuyer sur "Créer le job" | Loading indicator             | ⬜    |     |
| 22  | Attendre la confirmation   | Message de succès             | ⬜    |     |
| 23  | Vérifier redirection       | Écran détails du job OU liste | ⬜    |     |

---

## PHASE 2: GESTION DU JOB CRÉÉ

### 2.1 Visualisation

| #   | Action                           | Résultat attendu               | ✅/❌ | Bug |
| --- | -------------------------------- | ------------------------------ | ----- | --- |
| 24  | Aller sur le calendrier          | Job visible à la date choisie  | ⬜    |     |
| 25  | Appuyer sur le job               | Détails du job s'affichent     | ⬜    |     |
| 26  | Vérifier toutes les informations | Données correctes et complètes | ⬜    |     |

### 2.2 Modification

| #   | Action                        | Résultat attendu        | ✅/❌ | Bug |
| --- | ----------------------------- | ----------------------- | ----- | --- |
| 27  | Appuyer sur "Modifier"        | Mode édition activé     | ⬜    |     |
| 28  | Changer l'heure du job        | Nouvelle heure acceptée | ⬜    |     |
| 29  | Sauvegarder les modifications | Message de confirmation | ⬜    |     |
| 30  | Vérifier les changements      | Modifications visibles  | ⬜    |     |

---

## PHASE 3: EXÉCUTION DU JOB

### 3.1 Démarrage

| #   | Action                        | Résultat attendu            | ✅/❌ | Bug |
| --- | ----------------------------- | --------------------------- | ----- | --- |
| 31  | Ouvrir les détails du job     | Bouton "Démarrer" visible   | ⬜    |     |
| 32  | Appuyer sur "Démarrer le job" | Confirmation demandée       | ⬜    |     |
| 33  | Confirmer le démarrage        | Timer démarre (00:00:01...) | ⬜    |     |
| 34  | Statut change                 | "En cours" ou équivalent    | ⬜    |     |

### 3.2 Timer et suivi

| #   | Action                  | Résultat attendu                 | ✅/❌ | Bug |
| --- | ----------------------- | -------------------------------- | ----- | --- |
| 35  | Observer le timer       | Compteur progresse en temps réel | ⬜    |     |
| 36  | Appuyer sur "Pause"     | Timer s'arrête                   | ⬜    |     |
| 37  | Appuyer sur "Reprendre" | Timer reprend                    | ⬜    |     |
| 38  | Vérifier le temps total | Temps cumulé correct             | ⬜    |     |

### 3.3 Étapes du job (Stepper)

| #   | Action                            | Résultat attendu          | ✅/❌ | Bug |
| --- | --------------------------------- | ------------------------- | ----- | --- |
| 39  | Vérifier l'étape actuelle         | Étape 1 surlignée         | ⬜    |     |
| 40  | Appuyer sur "Étape suivante"      | Passage à l'étape 2       | ⬜    |     |
| 41  | Observer l'animation du stepper   | Animation fluide          | ⬜    |     |
| 42  | Répéter jusqu'à la dernière étape | Toutes les étapes passées | ⬜    |     |

### 3.4 Notes et photos

| #   | Action                       | Résultat attendu                 | ✅/❌ | Bug |
| --- | ---------------------------- | -------------------------------- | ----- | --- |
| 43  | Ajouter une note             | Bouton "Ajouter note" fonctionne | ⬜    |     |
| 44  | Écrire "Arrived on time"     | Note sauvegardée                 | ⬜    |     |
| 45  | Prendre une photo (si dispo) | Photo ajoutée au job             | ⬜    |     |
| 46  | Voir les notes/photos        | Liste visible et correcte        | ⬜    |     |

### 3.5 Fin du job

| #   | Action                        | Résultat attendu                 | ✅/❌ | Bug |
| --- | ----------------------------- | -------------------------------- | ----- | --- |
| 47  | Appuyer sur "Terminer le job" | Confirmation demandée            | ⬜    |     |
| 48  | Confirmer la fin              | Timer s'arrête définitivement    | ⬜    |     |
| 49  | Statut change                 | "Terminé" ou passage au paiement | ⬜    |     |
| 50  | Temps total affiché           | Durée finale correcte            | ⬜    |     |

---

## PHASE 4: PAIEMENT

### 4.1 Écran de paiement

| #   | Action                        | Résultat attendu                   | ✅/❌ | Bug |
| --- | ----------------------------- | ---------------------------------- | ----- | --- |
| 51  | Accéder à l'écran de paiement | Écran paiement s'affiche           | ⬜    |     |
| 52  | Vérifier le montant calculé   | Basé sur le temps/tarif            | ⬜    |     |
| 53  | Voir le détail du calcul      | Breakdown visible (heures × tarif) | ⬜    |     |

### 4.2 Options de paiement

| #   | Action                        | Résultat attendu          | ✅/❌ | Bug |
| --- | ----------------------------- | ------------------------- | ----- | --- |
| 54  | Voir les méthodes de paiement | Card, Cash, Bank transfer | ⬜    |     |
| 55  | Sélectionner "Card"           | Option sélectionnée       | ⬜    |     |
| 56  | Changer pour "Cash"           | Changement immédiat       | ⬜    |     |

### 4.3 Paiement par carte (Stripe)

| #   | Action                              | Résultat attendu          | ✅/❌ | Bug |
| --- | ----------------------------------- | ------------------------- | ----- | --- |
| 57  | Sélectionner "Card"                 | Formulaire carte apparaît | ⬜    |     |
| 58  | Entrer carte test: 4242424242424242 | Numéro accepté            | ⬜    |     |
| 59  | Entrer expiration: 12/28            | Date acceptée             | ⬜    |     |
| 60  | Entrer CVC: 123                     | CVC accepté               | ⬜    |     |
| 61  | Appuyer sur "Payer"                 | Loading indicator         | ⬜    |     |
| 62  | Attendre la confirmation            | Paiement réussi           | ⬜    |     |

### 4.4 Paiement cash

| #   | Action                           | Résultat attendu      | ✅/❌ | Bug |
| --- | -------------------------------- | --------------------- | ----- | --- |
| 63  | Sélectionner "Cash"              | Option activée        | ⬜    |     |
| 64  | Appuyer sur "Marquer comme payé" | Confirmation demandée | ⬜    |     |
| 65  | Confirmer                        | Paiement enregistré   | ⬜    |     |

### 4.5 Confirmation finale

| #   | Action                       | Résultat attendu                    | ✅/❌ | Bug |
| --- | ---------------------------- | ----------------------------------- | ----- | --- |
| 66  | Voir l'écran de confirmation | "Paiement réussi" affiché           | ⬜    |     |
| 67  | Animation de succès          | Animation visible (confetti, check) | ⬜    |     |
| 68  | Bouton "Retour à l'accueil"  | Navigation fonctionnelle            | ⬜    |     |

---

## PHASE 5: VÉRIFICATIONS POST-JOB

### 5.1 Historique

| #   | Action                           | Résultat attendu          | ✅/❌ | Bug |
| --- | -------------------------------- | ------------------------- | ----- | --- |
| 69  | Aller dans l'historique des jobs | Job visible dans la liste | ⬜    |     |
| 70  | Statut affiché                   | "Complété" ou "Payé"      | ⬜    |     |
| 71  | Montant affiché                  | Correct et formaté        | ⬜    |     |

### 5.2 Rapports/Analytics

| #   | Action                      | Résultat attendu        | ✅/❌ | Bug |
| --- | --------------------------- | ----------------------- | ----- | --- |
| 72  | Aller dans les statistiques | Job comptabilisé        | ⬜    |     |
| 73  | Revenu mis à jour           | Montant ajouté au total | ⬜    |     |

---

## 📊 RÉSUMÉ DU TEST

| Phase            | Total étapes | ✅ Passées | ❌ Échouées |
| ---------------- | ------------ | ---------- | ----------- |
| 1. Création      | 23           |            |             |
| 2. Gestion       | 7            |            |             |
| 3. Exécution     | 19           |            |             |
| 4. Paiement      | 18           |            |             |
| 5. Vérifications | 5            |            |             |
| **TOTAL**        | **72**       |            |             |

**Score**: **\_/72 (**%)

---

## 🐛 BUGS TROUVÉS

### BUG-001: [Titre]

**Sévérité**:
**Étape**:
**Description**:

---

### BUG-002: [Titre]

**Sévérité**:
**Étape**:
**Description**:

---

## 📝 NOTES GÉNÉRALES

_Observations, suggestions d'amélioration, points positifs..._

---

**Testé par**: ******\_\_\_\_******  
**Date**: \_**\_/\_\_**/2026  
**Signature**: ******\_\_\_\_******
