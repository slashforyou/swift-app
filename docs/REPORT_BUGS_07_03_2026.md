# Rapport de bugs — 07/03/2026

Retours terrain après test sur device réel (contractor / prestataire).

---

## Bug 1 — Wizard trop petit en hauteur

**Description :** Le wizard de réponse aux demandes de job (`ContractorJobWizardModal`) est trop petit verticalement, gêne la lecture et l'interaction.

**Attendu :** Hauteur minimale à 80% de l'écran.

**Fichier :** `src/components/calendar/ContractorJobWizardModal.tsx`  
**Correction :** `minHeight: "55%"` → `minHeight: "82%"`

**Statut :** ✅ Corrigé

---

## Bug 2 — Ressources demandées invisibles dans le wizard

**Description :** Quand on ouvre un job en attente d'acceptation (statut `pending`), la section "Ce qui est demandé" (camion, chauffeur, offsider) ne s'affiche pas ou affiche un état vide.

**Causes identifiées :**

1. La section est conditionnée à un objet `job.transfer` non-null. Si tous les champs (`requested_drivers`, `requested_offsiders`, `pricing_amount`, etc.) sont `NULL` en base, le transfer est `null` et la section disparaît.
2. `preferred_truck_id` n'est pas inclus dans le SELECT de `calendarDays.js` ni dans l'interface TypeScript `transfer`.

**Corrections :**

- `useJobsForDay.ts` : retirer la condition de garde `null` sur le `transfer` pour tous les jobs externes pending — toujours construire l'objet, même si tous les champs sont null.
- `ContractorJobWizardModal.tsx` : afficher "Non spécifié" si les champs sont vides.
- Backend `calendarDays.js` : ajouter `jtransfers.preferred_truck_id` et `jtransfers.resource_note` au SELECT.
- `useJobsForDay.ts` : ajouter `preferred_truck_id` et `resource_note` à l'interface `transfer`.

**Statut :** ✅ Corrigé

---

## Bug 3 — Jobs refusés cliquables

**Description :** Les jobs avec `assignment_status = "declined"` (affichés en rouge avec "refusé") sont cliquables et ouvrent le wizard, alors qu'ils ne devraient pas l'être.

**Attendu :** Un job refusé ne doit pas être cliquable / ne doit pas ouvrir le wizard.

**Fichier :** `src/screens/calendar/dayScreen.tsx`  
**Correction :** Dans `handleJobPress`, ajouter un guard : si `job.assignment_status === "declined"` → `return` sans rien faire.

**Statut :** ✅ Corrigé

---

## Bug 4 — Demandes de prestation absentes du panel de notifications

**Description :** Quand une entreprise assigne un job à un prestataire (contractor), la push notification est bien envoyée, mais la notification n'apparaît pas dans le panneau de notifications accessible depuis la page home (icône cloche).

**Cause :** Le backend ne stocke pas de ligne dans la table `notifications` lors d'une nouvelle assignation contractor → le fetch du panel revient vide.

**Solution :**

- Le `NotificationsPanel` est augmenté : il affiche aussi les jobs pending sous forme de "cartes action" au-dessus de la liste de notifications classiques, en utilisant le hook `usePendingAssignments` déjà en place.
- Cela garantit la visibilité immédiate sans dépendre du moteur de notifications serveur.
- Bonus : les cartes sont cliquables et naviguent vers le bon jour calendrier.

**Fichiers :**

- `src/components/home/NotificationsPanel.tsx`
- `src/components/home/PendingAssignmentsSection.tsx` (réutilisé depuis le home)

**Statut :** ✅ Corrigé

---

## Checklist d'exécution

| #   | Tâche                                                  | Fichier(s)                     | Statut |
| --- | ------------------------------------------------------ | ------------------------------ | ------ |
| 1   | Wizard height 82%                                      | `ContractorJobWizardModal.tsx` | ✅     |
| 2a  | Transfer toujours construit pour jobs externes pending | `useJobsForDay.ts`             | ✅     |
| 2b  | Affichage fallback "Non spécifié" dans wizard          | `ContractorJobWizardModal.tsx` | ✅     |
| 2c  | Backend : add `preferred_truck_id` + `resource_note`   | `calendarDays.js` (serveur)    | ✅     |
| 2d  | Interface TS `transfer` avec nouveaux champs           | `useJobsForDay.ts`             | ✅     |
| 3   | Block declined jobs                                    | `dayScreen.tsx`                | ✅     |
| 4   | Pending assignments dans NotificationsPanel            | `NotificationsPanel.tsx`       | ✅     |
