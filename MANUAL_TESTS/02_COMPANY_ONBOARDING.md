# 🏢 Test Manuel - Inscription et Paramétrage Société

**Scénario**: Onboarding complet d'une nouvelle entreprise  
**Priorité**: 🔴 Critique  
**Durée estimée**: 15-20 minutes  
**Prérequis**: Aucun compte existant, email valide

---

## 📋 Checklist pré-test

- [ ] App fraîchement installée ou déconnectée
- [ ] Accès à un email de test valide
- [ ] Mode Stripe Test disponible pour configuration
- [ ] Connexion internet stable

---

## PHASE 1: INSCRIPTION

### 1.1 Accès à l'inscription
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 1 | Lancer l'app | Écran de bienvenue/login | ⬜ | |
| 2 | Appuyer sur "Créer un compte" | Écran d'inscription | ⬜ | |
| 3 | Vérifier les options | "Business" / "Employé" visibles | ⬜ | |
| 4 | Sélectionner "Business" | Option sélectionnée visuellement | ⬜ | |

### 1.2 Informations personnelles
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 5 | Entrer prénom: "John" | Texte affiché | ⬜ | |
| 6 | Entrer nom: "Smith" | Texte affiché | ⬜ | |
| 7 | Entrer email: "test.company@example.com" | Validation format email | ⬜ | |
| 8 | Entrer email invalide | Message d'erreur clair | ⬜ | |
| 9 | Entrer téléphone: "0412345678" | Formatage correct | ⬜ | |

### 1.3 Mot de passe
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 10 | Entrer mot de passe faible: "123" | Rejeté avec explication | ⬜ | |
| 11 | Entrer mot de passe fort: "Test@1234" | Accepté, indicateur de force | ⬜ | |
| 12 | Confirmer mot de passe (différent) | Erreur "Ne correspond pas" | ⬜ | |
| 13 | Confirmer mot de passe (identique) | Validé | ⬜ | |
| 14 | Toggle "Afficher mot de passe" | Mot de passe visible/masqué | ⬜ | |

### 1.4 Conditions et validation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 15 | Voir les CGU | Lien vers CGU cliquable | ⬜ | |
| 16 | Cocher "J'accepte les CGU" | Checkbox cochée | ⬜ | |
| 17 | Essayer de valider sans CGU | Bloqué avec message | ⬜ | |
| 18 | Appuyer sur "Créer mon compte" | Loading indicator | ⬜ | |
| 19 | Attendre la création | Message de succès | ⬜ | |

### 1.5 Vérification email (si applicable)
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 20 | Écran de vérification email | Instructions claires | ⬜ | |
| 21 | Bouton "Renvoyer l'email" | Fonctionne sans erreur | ⬜ | |
| 22 | Cliquer sur le lien dans l'email | Redirection vers l'app | ⬜ | |
| 23 | Compte vérifié | Message de confirmation | ⬜ | |

---

## PHASE 2: INFORMATIONS DE L'ENTREPRISE

### 2.1 Profil entreprise
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 24 | Écran "Créez votre entreprise" | Formulaire affiché | ⬜ | |
| 25 | Entrer nom: "Swift Moving Co" | Texte affiché | ⬜ | |
| 26 | Entrer ABN: "12345678901" | Validation format ABN | ⬜ | |
| 27 | Entrer ABN invalide | Message d'erreur | ⬜ | |
| 28 | Sélectionner type d'activité | Liste déroulante fonctionne | ⬜ | |

### 2.2 Adresse de l'entreprise
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 29 | Entrer adresse: "456 Business St" | Autocomplete fonctionne | ⬜ | |
| 30 | Sélectionner ville: "Sydney" | Ville acceptée | ⬜ | |
| 31 | Sélectionner état: "NSW" | État accepté | ⬜ | |
| 32 | Entrer code postal: "2000" | Format validé | ⬜ | |

### 2.3 Logo et branding
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 33 | Appuyer sur "Ajouter un logo" | Picker image s'ouvre | ⬜ | |
| 34 | Sélectionner une image | Preview du logo | ⬜ | |
| 35 | Recadrer si nécessaire | Outil de crop fonctionne | ⬜ | |
| 36 | Skip l'ajout de logo | Possible de continuer | ⬜ | |

### 2.4 Validation profil entreprise
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 37 | Vérifier le résumé | Toutes infos correctes | ⬜ | |
| 38 | Appuyer sur "Continuer" | Passage à l'étape suivante | ⬜ | |

---

## PHASE 3: CONFIGURATION DES TARIFS

### 3.1 Tarif horaire
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 39 | Écran "Configurez vos tarifs" | Formulaire affiché | ⬜ | |
| 40 | Entrer tarif horaire: "85" | Valeur acceptée | ⬜ | |
| 41 | Voir le symbole devise ($) | Devise australienne | ⬜ | |
| 42 | Entrer tarif invalide (lettres) | Rejeté | ⬜ | |
| 43 | Entrer tarif min: "50" | Minimum accepté | ⬜ | |

### 3.2 Options de facturation
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 44 | Toggle "Facturation par incréments" | Option activable | ⬜ | |
| 45 | Sélectionner incrément (15/30/60 min) | Sélection fonctionne | ⬜ | |
| 46 | Toggle "Frais de déplacement" | Option activable | ⬜ | |
| 47 | Entrer frais km: "1.50" | Valeur décimale acceptée | ⬜ | |

### 3.3 Taxes
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 48 | Toggle "Appliquer GST" | Option activable | ⬜ | |
| 49 | Voir le taux GST (10%) | Taux affiché | ⬜ | |
| 50 | Valider les tarifs | Passage à l'étape suivante | ⬜ | |

---

## PHASE 4: CONFIGURATION DES VÉHICULES

### 4.1 Ajout du premier véhicule
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 51 | Écran "Ajoutez vos véhicules" | Interface claire | ⬜ | |
| 52 | Appuyer sur "Ajouter un véhicule" | Formulaire véhicule | ⬜ | |
| 53 | Sélectionner type: "Truck" | Type sélectionné | ⬜ | |
| 54 | Entrer plaque: "ABC-123" | Format validé | ⬜ | |
| 55 | Entrer capacité: "20 m³" | Capacité acceptée | ⬜ | |
| 56 | Ajouter photo du véhicule | Photo uploadée | ⬜ | |
| 57 | Sauvegarder le véhicule | Véhicule ajouté à la liste | ⬜ | |

### 4.2 Gestion des véhicules
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 58 | Voir la liste des véhicules | 1 véhicule affiché | ⬜ | |
| 59 | Modifier le véhicule | Édition possible | ⬜ | |
| 60 | Skip cette étape | Possible de continuer | ⬜ | |
| 61 | Appuyer sur "Continuer" | Passage à l'étape suivante | ⬜ | |

---

## PHASE 5: CONFIGURATION STRIPE (Paiements)

### 5.1 Introduction Stripe
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 62 | Écran "Configurez les paiements" | Explication Stripe | ⬜ | |
| 63 | Voir les avantages listés | Liste claire | ⬜ | |
| 64 | Appuyer sur "Connecter Stripe" | Redirection Stripe Connect | ⬜ | |

### 5.2 Stripe Connect Onboarding
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 65 | Page Stripe s'ouvre | Formulaire Stripe affiché | ⬜ | |
| 66 | Remplir les infos bancaires (test) | Champs fonctionnels | ⬜ | |
| 67 | Valider sur Stripe | Redirection vers l'app | ⬜ | |
| 68 | Confirmation dans l'app | "Stripe connecté" | ⬜ | |

### 5.3 Skip Stripe (optionnel)
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 69 | Appuyer sur "Plus tard" | Skip possible | ⬜ | |
| 70 | Warning affiché | "Paiements limités" | ⬜ | |

---

## PHASE 6: PARAMÈTRES AVANCÉS

### 6.1 Horaires d'ouverture
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 71 | Aller dans Paramètres > Horaires | Écran horaires | ⬜ | |
| 72 | Définir horaires Lundi-Vendredi | Sélection 8h-18h | ⬜ | |
| 73 | Marquer Samedi comme fermé | Toggle off fonctionne | ⬜ | |
| 74 | Sauvegarder les horaires | Confirmation | ⬜ | |

### 6.2 Notifications
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 75 | Aller dans Paramètres > Notifications | Écran notifications | ⬜ | |
| 76 | Toggle "Nouveau job" | Activable/désactivable | ⬜ | |
| 77 | Toggle "Rappels" | Activable/désactivable | ⬜ | |
| 78 | Toggle "Paiement reçu" | Activable/désactivable | ⬜ | |

### 6.3 Préférences régionales
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 79 | Aller dans Paramètres > Langue | Écran langue | ⬜ | |
| 80 | Changer la langue | Interface traduite | ⬜ | |
| 81 | Vérifier le format date/heure | Format local correct | ⬜ | |
| 82 | Vérifier la devise | AUD / $ | ⬜ | |

---

## PHASE 7: VÉRIFICATION FINALE

### 7.1 Dashboard
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 83 | Aller sur le Dashboard/Home | Interface principale | ⬜ | |
| 84 | Voir le nom de l'entreprise | "Swift Moving Co" affiché | ⬜ | |
| 85 | Voir les stats initiales | 0 jobs, $0 revenus | ⬜ | |
| 86 | Bouton "Créer un job" visible | Call-to-action présent | ⬜ | |

### 7.2 Profil entreprise
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 87 | Aller dans Profil | Infos entreprise affichées | ⬜ | |
| 88 | Vérifier toutes les données | Correspondance avec saisie | ⬜ | |
| 89 | Modifier une info | Modification possible | ⬜ | |

### 7.3 Test de déconnexion/reconnexion
| # | Action | Résultat attendu | ✅/❌ | Bug |
|---|--------|------------------|-------|-----|
| 90 | Se déconnecter | Retour écran login | ⬜ | |
| 91 | Se reconnecter | Accès au compte | ⬜ | |
| 92 | Vérifier la persistance des données | Tout est conservé | ⬜ | |

---

## 📊 RÉSUMÉ DU TEST

| Phase | Total étapes | ✅ Passées | ❌ Échouées |
|-------|--------------|------------|-------------|
| 1. Inscription | 23 | | |
| 2. Infos entreprise | 15 | | |
| 3. Tarifs | 12 | | |
| 4. Véhicules | 11 | | |
| 5. Stripe | 9 | | |
| 6. Paramètres | 12 | | |
| 7. Vérification | 10 | | |
| **TOTAL** | **92** | | |

**Score**: ___/92 (__%)

---

## 🐛 BUGS TROUVÉS

### BUG-001: [Titre]
**Sévérité**: 
**Étape**: 
**Description**: 

---

## 📝 NOTES GÉNÉRALES

_Observations, suggestions d'amélioration, points positifs..._

---

**Testé par**: ________________  
**Date**: ____/____/2026  
**Signature**: ________________
