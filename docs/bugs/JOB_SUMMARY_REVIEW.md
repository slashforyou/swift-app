# Job Summary — Revue & Plan d'action

**Date:** 19/02/2026  
**Fichier principal:** `src/screens/JobDetailsScreens/summary.tsx`

---

## Structure actuelle (de haut en bas)

1. **JobTimerDisplay** — Timer + stepper + boutons d'action (state machine)
2. **JobStepHistoryCard** — Historique des étapes (si `timer_info` dispo)
3. **QuickActionsSection** — 5 boutons : Appeler, GPS, Avancer, Note, Photo
4. **CompanyDetailsSection** — Contractee / Contractor
5. **ClientDetailsSection** — Nom, tel, email du client
6. **ContactDetailsSection** — Personne contact
7. **AddressesSection** — Adresses pickup/dropoff
8. **TimeWindowsSection** — Créneaux horaires
9. **TruckDetailsSection** — Véhicule assigné

---

## Bugs / Risques de crash

| #   | Problème                                                                                                              | Composant                         | Gravité       | Statut                          |
| --- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------- | ------------------------------- |
| 1   | Crash si `job.contact` est null — accès direct sans guard                                                             | ContactDetailsSection             | **Critique**  | ✅ Fait                         |
| 2   | Dates invalides (NaN/NaN) si champs time window undefined                                                             | TimeWindowsSection                | **Critique**  | ✅ Fait                         |
| 3   | `Alert.prompt` = iOS only — fallback crash sur Android                                                                | QuickActionsSection               | Moyen         | ✅ Contournable (modal utilisé) |
| 4   | Doublon "Avancer" (QuickActions) vs "Suivant" (JobTimerDisplay) — 2 code paths différents, désynchronisation possible | QuickActionsSection + summary.tsx | **Important** | ✅ Fait                         |
| 5   | Adresses affichent "undefined" si champ manquant                                                                      | AddressesSection                  | Moyen         | ✅ Fait                         |

## Améliorations

| #   | Point                                      | Détail                                                                            | Statut                                                     |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 6   | Pas d'i18n sur 4/8 sections                | CompanyDetails, ContactDetails, Addresses, JobStepHistoryCard → textes en dur     | ✅ Contact + Addresses + QuickActions + TimeWindows fait   |
| 7   | Typing `any` partout                       | Toutes les sections reçoivent `job: any` → pas de sécurité de type                | ✅ Fait (`JobSummaryData` dans `src/types/jobSummary.ts`)  |
| 8   | ~15 console.log dans summary.tsx           | Logs de debug verbeux encore actifs                                               | ✅ Fait                                                    |
| 9   | Styles inline dans JobStepHistoryCard      | ~100 lignes recréées à chaque render                                              | ✅ Fait (Phase 2 — `useMemo` + `StyleSheet.create`)        |
| 10  | Format heure AM/PM dans TimeWindowsSection | Incohérent pour app française (dates en dd/MM mais heures en 12h)                 | ✅ Fait (24h)                                              |
| 11  | Import Ionicons incohérent                 | TruckDetailsSection = `@expo/vector-icons`, autres = `@react-native-vector-icons` | ✅ Fait (Phase 2 — harmonisé `@react-native-vector-icons`) |

## À retirer

| #   | Élément                                                              | Raison                                          | Statut      |
| --- | -------------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| 12  | Bouton "Avancer" dans QuickActionsSection                            | Doublon avec "Suivant" de JobTimerDisplay       | ✅ Fait     |
| 13  | `JobStepAdvanceModal` (import + render)                              | Plus nécessaire sans bouton "Avancer"           | ✅ Fait     |
| 14  | `handleAdvanceStep` + `handleNextStep` dans summary.tsx (~80 lignes) | Code mort — step géré par JobTimerDisplay       | ✅ Fait     |
| 15  | `StepValidationBadge` (commenté dans summary.tsx)                    | Code commenté jamais réactivé                   | ✅ Fait     |
| 16  | `JobProgressSection.tsx` (fichier)                                   | Dead code — plus importé depuis fusion Nov 2025 | ✅ Supprimé |
| 17  | Console.logs de debug dans summary.tsx + CompanyDetailsSection       | ~15 logs verbeux                                | ✅ Fait     |

## À ajouter (suggestions)

| #   | Idée                               | Détail                                                               | Statut                             |
| --- | ---------------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| 18  | Loading skeleton pour les sections | Skeleton placeholder pendant chargement                              | ✅ Fait (`JobSummarySkeleton.tsx`) |
| 19  | Section "Résumé financier"         | Montant total/payé/reste — infos déjà dans job mais jamais affichées | ✅ Fait                            |
| 20  | Indicateur de statut global        | Bandeau en haut : En cours / Terminé / Annulé                        | ✅ Fait                            |
| 21  | Actions contextuelles              | Masquer Appeler/GPS si job terminé                                   | ✅ Fait                            |
| 22  | Signature preview                  | Aperçu de la signature si job signé                                  | ✅ Fait                            |

---

## Ordre d'exécution recommandé

### Phase 1 — Nettoyage et crash guards (prioritaire)

1. ~~Retirer doublon "Avancer" + code associé (#12, #13, #14)~~
2. ~~Nettoyer console.logs (#8, #17)~~
3. ~~Fix crash ContactDetailsSection (#1)~~
4. ~~Fix crash TimeWindowsSection (#2)~~
5. ~~Fix "undefined" dans AddressesSection (#5)~~
6. ~~Retirer code commenté (#15) et dead code (#16)~~

### Phase 2 — i18n et qualité ✅

1. ~~i18n CompanyDetailsSection (#6)~~ ✅ Fait
2. ~~i18n ContactDetailsSection (#6)~~ ✅ Fait (Phase 1)
3. ~~i18n AddressesSection (#6)~~ ✅ Fait (Phase 1)
4. ~~i18n JobStepHistoryCard (#6) + StyleSheet.create extraction~~ ✅ Fait
5. ~~Fix format heure 24h (#10)~~ ✅ Fait (Phase 1)
6. ~~Harmoniser imports Ionicons (#11) — TruckDetailsSection + JobTimerDisplay~~ ✅ Fait

### Phase 3 — Ajouts fonctionnels ✅

1. ~~Résumé financier (#19) — `FinancialSummarySection.tsx`~~ ✅ Fait
2. ~~Indicateur de statut (#20) — `JobStatusBanner.tsx`~~ ✅ Fait
3. ~~Actions contextuelles (#21) — masque Appeler/GPS si job terminé~~ ✅ Fait
4. ~~Signature preview (#22) — `SignaturePreviewSection.tsx`~~ ✅ Fait
