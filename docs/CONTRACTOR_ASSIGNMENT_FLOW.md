# Flux d'assignation prestataire — Plan d'implémentation

> **Contexte :** Une entreprise A assigne un prestataire (entreprise B) à un job (camion et/ou employé). L'entreprise B doit en être notifiée, voir le job, et pouvoir répondre.

---

## État actuel

| Élément                                                                         | État                       |
| ------------------------------------------------------------------------------- | -------------------------- |
| `assignment_status` sur le `Job` (`none/pending/accepted/declined/negotiating`) | ✅ Fait                    |
| `contractee` / `contractor` sur le `Job`                                        | ✅ Existant                |
| `acceptJob()` / `declineJob()` dans `services/jobs.ts`                          | ✅ Existant                |
| Template notif locale `jobAssigned` dans `notificationsService.ts`              | ✅ Existant                |
| Bannière "Assigné par" dans `modernJobBox.tsx`                                  | ✅ Fait                    |
| `ContractorJobWizardModal` (accept / decline / assign staff)                    | ✅ Fait (bug import fixé)  |
| Push notification à l'arrivée d'un job assigné (contractor company)             | ✅ Fait (`transfers.js`)   |
| Push notification assignation crew (`assignCrewToJobById.js`)                   | ✅ Fait                    |
| Case `job_assigned_contractor` dans `usePushNotifications`                      | ✅ Fait                    |
| Contre-proposition (date / heure / prix différents)                             | ✅ Fait (wizard + backend) |
| Endpoint backend `counter_proposal`                                             | ✅ Déployé                 |
| `calendar-days` retourne bien les jobs assignés pour le contractor              | ✅ Confirmé (backend)      |

---

## Tâches

### 1 — Valider que le job apparaît dans le calendrier du prestataire

- [x] Tester avec un compte prestataire — vérifier que `calendar-days` remonte les jobs où la company est `contractor`
- [x] Backend inclut ces jobs via requête filtrée par `contractor_company_id` dans `calendarDays.js`

---

### 2 — Push notification à l'assignation

- [x] **Backend** : push envoyée aux admins de l'entreprise B via `sendPushToCompany()` dans `transfers.js`
- [x] **Frontend** : case `job_assigned_contractor` dans `usePushNotifications` → navigate vers le bon jour calendrier via `navRef`
- [x] Message de notif : _"📦 Nouvelle mission — Un job vous a été attribué le [date]"_

---

### 3 — Wizard accept / decline (déjà codé, à tester)

`ContractorJobWizardModal` couvre :

- Vue d'ensemble du job (entreprise, date, type de ressource demandée)
- Accepter → assigner les employés internes
- Refuser → motif obligatoire

À tester end-to-end et corriger si besoin.

---

### 4 — Contre-proposition

**Flux souhaité :**

1. Prestataire tape "Proposer des modifications"
2. Il modifie : créneau horaire, tarif, note libre
3. `status` passe à `negotiating` (comme le système B2B transfer existant)
4. Entreprise A reçoit une notif + voit la contre-proposition dans le job detail
5. Entreprise A accepte ou refuse

**À faire :**

- [x] `POST /v1/jobs/{id}/counter_proposal` existe et est déployé (`counterProposal.js`)
- [x] Endpoint payload : `{ proposed_start, proposed_end, proposed_price?, note }` → `assignment_status = 'negotiating'`
- [x] Étape `"counter_proposal"` dans `ContractorJobWizardModal` (step + render)
- [x] `"negotiating"` ajouté dans `assignment_status` de `JobAPI` (`jobs.ts`) et `useJobsForDay.ts`
- [ ] Côté Entreprise A : afficher la contre-proposition dans `JobDetails` _(E2E à tester)_

---

### 5 — Feedback de clôture

- [ ] Après acceptation par A d'une contre-proposition → prestataire reçoit une notif "Votre proposition a été acceptée"
- [ ] Après refus → "Votre proposition a été refusée"
- [ ] `assignment_status` final : `accepted` ou `declined`

-

## Dépendances backend à confirmer

| Endpoint                               | Méthode | Nécessaire pour |
| -------------------------------------- | ------- | --------------- |
| `/v1/jobs/{id}/accept`                 | POST    | ✅ Existe       |
| `/v1/jobs/{id}/decline`                | POST    | ✅ Existe       |
| `/v1/jobs/{id}/counter_proposal`       | POST    | ✅ Déployé      |
| `calendar-days` filtre par contractor  | GET     | ✅ Confirmé     |
| Push notif `job_assigned_contractor`   | —       | ✅ Implémentée  |
| Push notif `counter_proposal_received` | —       | ⏳ E2E à tester |

---

## Ordre de réalisation recommandé

```
1. Valider que le job apparaît (calendrier)
   → fixes backend si nécessaire

2. Tester le wizard existant (accept / decline)
   → corriger les bugs visuels / fonctionnels

3. Push notifications
   → déclenche le flux complet sans action manuelle

4. Contre-proposition
   → backend d'abord, ensuite UI
```
