# Swift App (Cobbr) — Fonctionnalités cœur & identité produit

**But de ce document** : lister les fonctionnalités principales utiles aux utilisateurs, et expliciter ce qui fait l’identité de l’app.

**Sources** : `README.md`, `docs/RELEASE_NOTES_v1.0.md`, écrans `src/screens/**` (Jobs/Calendar/Stripe/Business).

---

## 1) Fonctionnalités cœur (quotidien utilisateur)

### A. Gestion des jobs (cœur opérationnel)

#### Créer / modifier / supprimer un job

Centralisez vos déménagements dans un seul outil : créez un job en quelques minutes, ajustez les infos quand le client change d’avis, et gardez une vision claire de l’avancement. Chaque job devient une “fiche” unique avec son statut, sa date, ses informations clés et tout ce dont l’équipe a besoin pour exécuter sans friction. Résultat : moins d’allers-retours, moins d’erreurs, et une organisation qui tient même quand le planning bouge.

#### Jobs multi-étapes (multi-adresses)

Un déménagement réel ne se limite pas à “départ → arrivée”. Avec les jobs multi-étapes, vous modélisez exactement la mission : enlèvement, dépôt temporaire, second passage, livraison finale… et chaque étape a sa logique. L’équipe sait toujours où aller ensuite, et l’entreprise garde une traçabilité fidèle au terrain, sans bricolage ni notes éparpillées.

#### Détails complets d’un job

Dans un même écran, retrouvez l’essentiel : client, adresses, consignes, équipement, crew, photos, notes… tout ce qui évite d’improviser le jour J. L’idée est simple : le job est la source de vérité, accessible par tous ceux qui doivent agir. Vous gagnez en qualité de service (moins d’oubli) et en efficacité (moins de temps perdu à “chercher l’info”).

### B. Planification (agenda / calendrier)

#### Calendrier des jobs (vues mois / jour)

Planifier devient visuel : une vue calendrier vous permet de voir les journées chargées, d’anticiper les trous, et d’équilibrer la semaine. En un coup d’œil, vous repérez les périodes de rush et vous organisez l’activité au lieu de la subir. C’est l’écran “tour de contrôle” pour gérer votre planning de déménagements.

#### Accès rapide : date → jobs → détails

Un appui sur une date, et vous arrivez directement sur les jobs prévus ce jour-là. Plus besoin de fouiller dans des listes : vous naviguez naturellement du planning vers l’opérationnel, puis vers la fiche complète du job. C’est conçu pour être rapide, que vous soyez au bureau ou sur le terrain.

#### Expérience adaptée au rôle (entreprise vs assignations)

La même app, mais pas la même expérience selon le rôle : un owner/manager voit la vision “entreprise”, un employé voit “ses jobs assignés”. L’objectif n’est pas de compliquer, mais de rendre l’interface pertinente pour chacun : la bonne information, au bon niveau, au bon moment. Ça évite les confusions et fluidifie l’organisation d’équipe.

### C. Exécution sur le terrain (standardiser et tracer)

#### Timer intégré & progression par étapes

Le terrain, c’est du mouvement : le timer et les étapes structurent l’exécution (départ, arrivée, chargement, déchargement…). Vous suivez où en est le job sans appeler l’équipe toutes les 10 minutes, et vous standardisez la manière de travailler. À la clé : une exécution plus fiable, une meilleure visibilité, et des données utiles pour analyser vos opérations.

#### Notes rattachées au job

Les consignes importantes ne doivent pas se perdre dans un SMS : ajoutez des notes directement sur le job, visibles par toute l’équipe concernée. Particularités d’accès, fragilité d’objets, remarques client, instructions de dernière minute… tout est au même endroit. Vous réduisez les oublis et améliorez la qualité perçue par le client.

#### Photos rattachées au job

Les photos servent à documenter et sécuriser : état avant/après, éléments sensibles, preuve de livraison, détails utiles pour préparer. En les attachant au job, vous retrouvez l’historique instantanément, sans chercher dans la galerie d’un téléphone. C’est aussi un excellent support pour la coordination interne et la résolution rapide de litiges.

### D. Client & itinéraire

#### Informations client associées au job

Chaque job embarque les infos client nécessaires au bon déroulé : contact, contexte, éléments de communication. L’équipe gagne du temps et le client sent que tout est maîtrisé, même si plusieurs personnes interviennent. L’objectif : fluidifier la relation client sans multiplier les outils.

#### Route / map (itinéraire)

Depuis les adresses du job, ouvrez l’itinéraire directement dans votre application de cartographie. Plus besoin de recopier une adresse ou de jongler entre applis : le trajet se lance en quelques secondes. C’est un petit détail qui fait une grande différence sur le terrain, surtout quand la journée est dense.

---

## 2) Paiements & monétisation (cœur “business”)

### A. Paiement des jobs

#### Paiement in-app (selon les méthodes supportées)

Encaissez plus simplement : l’app propose un parcours de paiement intégré pour finaliser un job sans outils externes. En centralisant l’opérationnel et la facturation, vous réduisez les oublis et vous accélérez le cashflow. C’est pensé pour rester “terrain-friendly” : rapide, clair, et orienté action.

#### Validation de carte & UX dédiée

Le paiement par carte est accompagné d’une interface qui aide à éviter les erreurs (format, champs, validation). Le but : que l’utilisateur comprenne immédiatement ce qui manque, et qu’il puisse corriger sans frustration. Résultat : moins d’échecs de paiement, et une expérience plus pro face au client.

### B. StripeHub (hub de pilotage)

#### Statut Stripe (readiness & requirements)

StripeHub vous donne une lecture claire de l’état de votre compte : ce qui est actif, ce qui bloque, et ce qu’il reste à compléter. Plutôt que de découvrir un problème au moment d’encaisser, vous anticipez. C’est une vue “santé” du paiement, utile pour piloter au quotidien.

#### Actions Stripe : setup, paiements, payouts, liens de paiement

Depuis le hub, vous accédez aux actions utiles : configurer votre compte, consulter les paiements, suivre les virements, et créer des liens de paiement quand c’est pertinent. L’idée est de rendre les opérations Stripe accessibles sans jargon, avec des entrées directes vers ce qui compte. Vous passez moins de temps dans des dashboards séparés, et plus de temps sur votre activité.

### C. Onboarding Stripe 100% In‑App (Custom)

#### Onboarding Stripe 100% in-app (KYC sans redirection)

L’activation des paiements se fait directement dans l’app, étape par étape, sans redirection vers Stripe. Vous complétez les informations nécessaires (profil, identité, documents, banque), et vous suivez une progression claire jusqu’à l’activation. C’est conçu pour réduire l’abandon et rendre le setup compréhensible, même pour quelqu’un qui ne “fait pas de technique”.

#### Progression & prochaine étape automatique

Au lieu de deviner quoi remplir, l’app s’appuie sur l’avancement et les “requirements” pour guider l’utilisateur vers la bonne étape. Si un élément manque, on vous indique quoi fournir, et où le faire. Vous gagnez du temps, et vous évitez les blocages lors de l’activation.

---

## 3) Entreprise, équipe, flotte

### A. Équipe (staff / crew)

#### Gestion du staff

Gérez votre équipe comme une vraie organisation : liste des membres, profils, statut, et informations utiles. L’objectif est de simplifier la gestion au quotidien, surtout quand vous grandissez et que tout ne tient plus “dans la tête”. Vous gardez une base fiable pour travailler en équipe.

#### Crew : assignation aux jobs

Assignez les bonnes personnes aux bons jobs pour éviter les malentendus. Le crew rend visible “qui fait quoi”, et donne à chaque employé une liste claire de ses missions. C’est un gain immédiat en coordination et en exécution.

### B. Rôles & permissions (multi‑utilisateurs)

#### Rôles & permissions (owner/manager/employee)

Parce que tout le monde n’a pas les mêmes responsabilités, l’app adapte l’interface selon le rôle : création de job, vues “entreprise” vs “assignations”, et actions disponibles. Le résultat : une app plus simple pour les employés, et plus puissante pour les responsables. Et surtout : moins de risque d’erreur, car les permissions sont cohérentes entre l’UI et les règles backend.

### C. Véhicules & équipements

#### Flotte véhicules & équipements

Suivez votre flotte (camions, vans, véhicules) et gardez les informations utiles au même endroit : caractéristiques, documents/infos, photos, etc. C’est particulièrement utile quand plusieurs personnes utilisent les mêmes véhicules et qu’il faut éviter les approximations. L’objectif : une exploitation plus fluide et mieux organisée.

---

## 4) Ce qui fait l’identité de l’app ("ce qu’elle est")

### A. Une approche end‑to‑end centrée “job”

L’app est pensée comme un **outil de production** pour une entreprise de déménagement :

#### Planifier → Exécuter → Tracer → Encaisser → Piloter

- **Planifier** : calendrier + création/organisation des jobs.
- **Exécuter** : timer + étapes + accès terrain.
- **Tracer** : notes/photos/signature (preuves et historique).
- **Encaisser** : paiement intégré (Stripe).
- **Piloter** : StripeHub + visibilité business.

### B. Une centralisation opérationnel + business

Ce n’est pas un CRM générique : les écrans, données et parcours sont orientés **terrain + facturation** (déménagement), avec un workflow “réel” (multi‑étapes, crew, flotte, paiement, KYC).

### C. Signature (preuve client) — bloc prêt pour newsletter

Faites signer le client directement dans l’app au bon moment, sans papier et sans aller-retour. La signature est attachée au job, ce qui crée une preuve simple à retrouver (et à partager si nécessaire). C’est un élément clé pour professionnaliser la fin de prestation et réduire les frictions sur la validation.

---

## 5) Notes (important)

- Certaines fonctions peuvent être **en cours d’intégration/itération** selon l’environnement backend (Stripe Custom, endpoints, permissions).
- Ce document liste les éléments **présents dans le repo** et/ou explicités dans la doc produit interne.
