# 👤 Test Manuel - Inscription et Onboarding Employé

**Scénario**: Onboarding complet d'un nouvel employé invité par l'entreprise  
**Priorité**: 🔴 Critique  
**Durée estimée**: 12-15 minutes  
**Prérequis**: Compte entreprise existant (owner/admin), email employé valide

---

## 📋 Checklist pré-test

- [ ] Compte entreprise créé et configuré
- [ ] Connexion en tant que Owner ou Admin
- [ ] Email employé test disponible
- [ ] App installée sur un 2ème device (ou déconnexion)

---

## PARTIE A: CÔTÉ ENTREPRISE (Owner/Admin)

### PHASE A1: INVITATION DE L'EMPLOYÉ

#### A1.1 Accès à la gestion d'équipe
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 1 | Se connecter en tant qu'owner/admin | Dashboard affiché | ⬜ | |
| 2 | Ouvrir le menu/navigation | Menu visible | ⬜ | |
| 3 | Aller dans "Équipe" ou "Staff" | Liste du personnel | ⬜ | |
| 4 | Voir la liste actuelle | Membres existants affichés | ⬜ | |

#### A1.2 Création de l'invitation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 5 | Appuyer sur "Inviter" / "+" | Formulaire d'invitation | ⬜ | |
| 6 | Entrer email: "employee@test.com" | Email validé | ⬜ | |
| 7 | Entrer email invalide | Message d'erreur | ⬜ | |
| 8 | Entrer prénom: "Marie" | Texte affiché | ⬜ | |
| 9 | Entrer nom: "Dupont" | Texte affiché | ⬜ | |

#### A1.3 Attribution du rôle
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 10 | Voir les rôles disponibles | Liste des rôles | ⬜ | |
| 11 | Sélectionner "Technician" | Rôle sélectionné | ⬜ | |
| 12 | Voir les permissions du rôle | Permissions affichées | ⬜ | |
| 13 | Modifier les permissions (si possible) | Personnalisation | ⬜ | |

#### A1.4 Attribution d'équipe (optionnel)
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 14 | Option "Assigner à une équipe" | Sélecteur d'équipe | ⬜ | |
| 15 | Sélectionner une équipe | Équipe assignée | ⬜ | |
| 16 | Skip l'équipe | Possible de continuer | ⬜ | |

#### A1.5 Envoi de l'invitation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 17 | Appuyer sur "Envoyer l'invitation" | Loading indicator | ⬜ | |
| 18 | Confirmation d'envoi | Message de succès | ⬜ | |
| 19 | Voir l'invitation dans la liste | Statut "En attente" | ⬜ | |
| 20 | Email reçu par l'employé | Email d'invitation reçu | ⬜ | |

#### A1.6 Gestion des invitations
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 21 | Voir les invitations en cours | Liste des pending | ⬜ | |
| 22 | Annuler une invitation | Option disponible | ⬜ | |
| 23 | Renvoyer une invitation | Option disponible | ⬜ | |
| 24 | Voir la date d'expiration | Date affichée | ⬜ | |

---

## PARTIE B: CÔTÉ EMPLOYÉ

### PHASE B1: RÉCEPTION DE L'INVITATION

#### B1.1 Email d'invitation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 25 | Ouvrir l'email d'invitation | Email bien formaté | ⬜ | |
| 26 | Voir le nom de l'entreprise | "Swift Moving Co" | ⬜ | |
| 27 | Voir le rôle proposé | "Technician" affiché | ⬜ | |
| 28 | Cliquer sur le lien/bouton | Redirection app/web | ⬜ | |

### PHASE B2: CRÉATION DU COMPTE EMPLOYÉ

#### B2.1 Écran d'acceptation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 29 | Page d'acceptation | Infos invitation visibles | ⬜ | |
| 30 | Voir l'entreprise invitante | Nom et logo | ⬜ | |
| 31 | Voir le rôle proposé | Détails du rôle | ⬜ | |
| 32 | Bouton "Accepter" visible | Call-to-action clair | ⬜ | |

#### B2.2 Création du mot de passe
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 33 | Prénom/Nom pré-remplis | "Marie Dupont" | ⬜ | |
| 34 | Email pré-rempli et non modifiable | "employee@test.com" | ⬜ | |
| 35 | Entrer mot de passe: "Employee@123" | Force validée | ⬜ | |
| 36 | Confirmer le mot de passe | Match validé | ⬜ | |
| 37 | Accepter les CGU | Checkbox cochée | ⬜ | |

#### B2.3 Informations complémentaires
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 38 | Entrer téléphone: "0498765432" | Format validé | ⬜ | |
| 39 | Ajouter photo de profil (optionnel) | Upload fonctionnel | ⬜ | |
| 40 | Skip la photo | Possible de continuer | ⬜ | |

#### B2.4 Validation du compte
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 41 | Appuyer sur "Créer mon compte" | Loading indicator | ⬜ | |
| 42 | Compte créé | Message de succès | ⬜ | |
| 43 | Redirection vers l'app | Dashboard employé | ⬜ | |

### PHASE B3: PREMIÈRE CONNEXION EMPLOYÉ

#### B3.1 Dashboard employé
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 44 | Voir le dashboard | Interface simplifiée | ⬜ | |
| 45 | Voir les jobs assignés | Liste (vide ou avec jobs) | ⬜ | |
| 46 | Voir son équipe | Équipe affichée si assigné | ⬜ | |
| 47 | Nom de l'entreprise visible | "Swift Moving Co" | ⬜ | |

#### B3.2 Vérification des permissions
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 48 | Essayer de créer un job | Accès refusé (Technician) | ⬜ | |
| 49 | Voir les détails d'un job | Accès autorisé | ⬜ | |
| 50 | Voir les paramètres entreprise | Accès limité/refusé | ⬜ | |
| 51 | Voir la liste des employés | Selon permissions | ⬜ | |

#### B3.3 Profil employé
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 52 | Aller dans "Mon profil" | Profil affiché | ⬜ | |
| 53 | Voir son rôle | "Technician" affiché | ⬜ | |
| 54 | Voir son équipe | Équipe affichée | ⬜ | |
| 55 | Modifier son téléphone | Modification possible | ⬜ | |
| 56 | Modifier son email | Non modifiable (ou limité) | ⬜ | |

---

## PARTIE C: VÉRIFICATION CÔTÉ ENTREPRISE

### PHASE C1: CONFIRMATION DE L'INSCRIPTION

#### C1.1 Mise à jour de la liste
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 57 | Retourner dans "Équipe" (owner) | Liste mise à jour | ⬜ | |
| 58 | Voir "Marie Dupont" | Statut "Actif" | ⬜ | |
| 59 | Voir le rôle assigné | "Technician" | ⬜ | |
| 60 | Voir l'équipe assignée | Équipe correcte | ⬜ | |

#### C1.2 Gestion de l'employé
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 61 | Appuyer sur le profil employé | Détails affichés | ⬜ | |
| 62 | Modifier le rôle | Changement possible | ⬜ | |
| 63 | Changer l'équipe | Changement possible | ⬜ | |
| 64 | Désactiver temporairement | Option disponible | ⬜ | |

---

## PARTIE D: TESTS DES RÔLES

### PHASE D1: TEST RÔLE ADMIN

#### D1.1 Invitation en tant qu'Admin
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 65 | Inviter "admin@test.com" en Admin | Invitation envoyée | ⬜ | |
| 66 | Accepter l'invitation | Compte créé | ⬜ | |
| 67 | Vérifier accès aux paramètres | Accès complet | ⬜ | |
| 68 | Vérifier création de job | Autorisé | ⬜ | |
| 69 | Vérifier invitation employés | Autorisé | ⬜ | |

### PHASE D2: TEST RÔLE MANAGER

#### D2.1 Invitation en tant que Manager
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 70 | Inviter "manager@test.com" en Manager | Invitation envoyée | ⬜ | |
| 71 | Accepter l'invitation | Compte créé | ⬜ | |
| 72 | Vérifier création de job | Autorisé | ⬜ | |
| 73 | Vérifier gestion d'équipe | Accès limité | ⬜ | |
| 74 | Vérifier paramètres entreprise | Accès refusé | ⬜ | |

### PHASE D3: TEST RÔLE VIEWER

#### D3.1 Invitation en tant que Viewer
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 75 | Inviter "viewer@test.com" en Viewer | Invitation envoyée | ⬜ | |
| 76 | Accepter l'invitation | Compte créé | ⬜ | |
| 77 | Vérifier lecture des jobs | Autorisé | ⬜ | |
| 78 | Vérifier modification job | Accès refusé | ⬜ | |
| 79 | Vérifier toute action d'écriture | Accès refusé | ⬜ | |

---

## PARTIE E: CAS LIMITES

### PHASE E1: ERREURS ET EDGE CASES

| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 80 | Inviter un email déjà inscrit | Message d'erreur approprié | ⬜ | |
| 81 | Utiliser un lien d'invitation expiré | Message d'expiration | ⬜ | |
| 82 | Double-cliquer sur l'invitation | Pas de doublon | ⬜ | |
| 83 | Invitation avec email temporaire | Rejeté ou accepté ? | ⬜ | |
| 84 | Employé refuse l'invitation | Option de refus | ⬜ | |
| 85 | Owner essaie de se supprimer | Impossible | ⬜ | |
| 86 | Supprimer le dernier admin | Bloqué avec avertissement | ⬜ | |

### PHASE E2: SYNCHRONISATION MULTI-DEVICE

| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 87 | Owner modifie rôle employé | Mise à jour temps réel | ⬜ | |
| 88 | Employé voit le changement | Permissions mises à jour | ⬜ | |
| 89 | Désactiver un employé connecté | Déconnexion forcée ? | ⬜ | |

---

## 📊 RÉSUMÉ DU TEST

| Partie | Phase | Total | ✅ Passées | ❌ Échouées |
|--------|-------|-------|------------|-------------|
| A | Côté Entreprise | 24 | | |
| B | Côté Employé | 32 | | |
| C | Vérification | 8 | | |
| D | Tests Rôles | 15 | | |
| E | Cas Limites | 10 | | |
| **TOTAL** | | **89** | | |

**Score**: ___/89 (__%)

---

## 📋 MATRICE DES RÔLES TESTÉS

| Permission | Owner | Admin | Manager | Technician | Viewer |
|------------|-------|-------|---------|------------|--------|
| Voir jobs | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Créer jobs | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Modifier jobs | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Inviter staff | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Gérer équipes | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Paramètres | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Paiements | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🐛 BUGS TROUVÉS

### BUG-001: [Titre]
**Sévérité**: 🔴 Critique / 🟠 Majeur / 🟡 Mineur / 🟢 Cosmétique  
**Partie**: A / B / C / D / E  
**Étape**: #  
**Description**: 

**Reproduction**:
1. 
2. 
3. 

---

## 📝 NOTES GÉNÉRALES

_Observations sur l'UX d'onboarding, temps de réponse, clarté des messages..._

---

**Testé par**: ________________  
**Date**: ____/____/2026  
**Version app**: _______________  
**Signature**: ________________
