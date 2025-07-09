# 🚚 Swift App

Swift est une application mobile destinée aux entreprises de déménagement, offrant une gestion fluide des jobs, des clients, des notes, des articles et des itinéraires.

---

## 🧱 Version 0.0.1 – Structure de base

> Objectif : Créer une architecture robuste, modulaire et facilement testable dès le départ.

---

## 📁 Structure actuelle

assets/ # Images, icônes, polices
src/
├── components/ # Composants UI réutilisables
├── config/ # Fichiers de config (routes, thèmes, etc.)
├── features/
│ └── jobs/ # Fonctionnalité de gestion de jobs
│ ├── components/
│ ├── hooks/
│ └── screens/
├── navigation/ # Stack / Tab Navigators
├── screens/ # Écrans principaux (Connexion, Inscription...)
├── services/ # API, stockage local, etc.
├── store/ # State management
└── utils/ # Fonctions utilitaires

tests/ # Tests unitaires


---

## 🚀 Lancement du projet

```bash
npm install
npx expo start

🔧 Outils en place

    ✅ React Native avec Expo

    ✅ Linting avec ESLint + Prettier

    ✅ Tests avec Jest + Testing Library

    ✅ Structure modulaire orientée feature

    ✅ Git & GitHub ready

📌 Prochaines étapes

Authentification (connexion / inscription)

Création de job

Affichage des jobs à venir

Système de notes et d’articles liés à un job

Vue agenda / calendrier

Notifications et gestion des statuts

👨‍💻 Développement

Projet mené par @slashforyou — en cours de développement.