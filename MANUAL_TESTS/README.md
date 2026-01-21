# 📋 Tests Manuels - Vue d'ensemble

**Date de création**: 17 janvier 2026  
**Version**: 1.0  
**Objectif**: Valider les parcours utilisateur critiques avant release

---

## 📁 Liste des scénarios de test

| # | Scénario | Fichier | Priorité | Durée estimée |
|---|----------|---------|----------|---------------|
| 1 | Job de A à Z | [01_JOB_COMPLETE_FLOW.md](./01_JOB_COMPLETE_FLOW.md) | 🔴 Critique | 20-30 min |
| 2 | Inscription société | [02_COMPANY_ONBOARDING.md](./02_COMPANY_ONBOARDING.md) | 🔴 Critique | 15-20 min |
| 3 | Inscription employé | [03_EMPLOYEE_ONBOARDING.md](./03_EMPLOYEE_ONBOARDING.md) | 🟠 Haute | 10-15 min |

---

## 🎯 Comment utiliser ces tests

### Avant de commencer
1. S'assurer que l'app est en mode développement
2. Avoir un compte test disponible
3. Préparer l'environnement (Stripe test mode, etc.)

### Pendant le test
1. Suivre chaque étape dans l'ordre
2. **Cocher ✅ ou ❌** pour chaque étape
3. **Noter les bugs** avec screenshot si possible
4. Continuer même si un bug est trouvé (sauf bloquant)

### Après le test
1. Compter les ✅ et ❌
2. Documenter chaque bug trouvé dans le rapport
3. Prioriser les corrections

---

## 📊 Tableau de suivi des tests

| Date | Testeur | Scénario | Résultat | Bugs trouvés |
|------|---------|----------|----------|--------------|
| _/__/2026 | | Job A-Z | ⬜ Pass / ⬜ Fail | |
| _/__/2026 | | Company | ⬜ Pass / ⬜ Fail | |
| _/__/2026 | | Employee | ⬜ Pass / ⬜ Fail | |

---

## 🐛 Format de rapport de bug

```markdown
### BUG-XXX: [Titre court]

**Sévérité**: 🔴 Bloquant / 🟠 Majeur / 🟡 Mineur / 🟢 Cosmétique

**Étape**: [Numéro de l'étape où le bug apparaît]

**Description**: 
[Description claire du problème]

**Comportement attendu**:
[Ce qui devrait se passer]

**Comportement actuel**:
[Ce qui se passe réellement]

**Screenshot/Vidéo**: 
[Lien ou description]

**Reproductible**: Toujours / Parfois / Rare
```

---

## 🔧 Environnement de test

| Élément | Valeur |
|---------|--------|
| App Version | v1.0.0 |
| Backend | localhost:3021 |
| Stripe | Mode Test |
| Device | [iOS/Android/Web] |
| OS Version | |

---

## ✅ Critères de validation release

- [ ] 100% des étapes critiques (🔴) passent
- [ ] Aucun bug bloquant
- [ ] Bugs majeurs documentés avec workaround
- [ ] Performance acceptable (pas de freeze > 2s)
