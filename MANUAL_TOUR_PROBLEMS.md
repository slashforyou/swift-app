# Problèmes à rectifier sur l'app avant la release

## Calendar

- [x] Ajouter le logo au Calendar
- [x] Lors de la création de job si l'on recherche un client le wizard se réduit trop en hauteur et devient difficile à utiliser
- [x] Le bouton retour de la page month (celle ou l'on voit les jours du mois) doit renvoyer vers la page home, celui de la page day doit renvoyer vers la page month
- [x] Le wizard "creation de job" se réduit trop quand on sélectionne un input, fait en sorte que ce soit plus agréable pour l'utilisateur
- [x] Sur la page day, le bouton "details" dans la section "vehicules" d'un job doit renvoyer vers la section "Ressources" de la page "job details"
- [x] Sur la page Day la section pour les vehicules d'un job doit se mettre à jour quand un véhicule est ajouté, même celui d'un prestataire.
- [x] Le calendrier fini un peu trop bas sur l'écran il faut réduire légèrement la marge en dessous du logo.
- [x] Les jobs passés qui ne sont pas terminé après 48h, doivent être noté comme étant passé (a toi de voir pour la notation approprié)

## Paramètres

- [x] Enlever "SMS notifications" on ne fera jamais de notification par SMS
- [x] Enlever "Auto SYNC" on n'en a pas besoin
- [x] Enlever "Offline mode" on n'en a pas besoin
- [x] Enlever "Sound effect", l'app ne contient pas d'effets sonores
- [x] Faire en sorte que "Share location" permette vraiment de manipuler si on autorise ou non l'app à avoir la localisation de l'utilisateur, et que ce soit clair pour l'utilisateur
- [x] Enleve "Analytics" on n'en a pas besoin
- [x] Enleve "biometric authentication" on n'en a pas besoin
- [x] Dans la section profil tu peux retirer "business information", "Payment Settings", "Role & Permissions" et "Team management", ils n'ont pas lieu d'être dans la page paramètre de l'app.

## Badges

- [x] Le design doit être alligné avec le design system, notamment les couleurs et les tailles de police
- [x] Il manque le logo sur cette page, il doit être ajouté
- [x] Les badges doivent être alignés au centre, deux par ligne
- [x] Il y a une erreur quand on ouvre la page du classement, fais disparaitre son icone de la page home

## PAGE JOB

- [x] Le logo n'apparait pas sur cette page, il faut qu'il y soit !
- [x] La fleche de retour doit être en haut à gauche de l'écran avec de légère marge pour rester facile à clicquer, le petit bouton ouvrant le wizard contenant les bouton "edit job", "asign staff" et "delete job" doit être en haut à droite avec de légère marge également
- [x] Sur la page de paiement du job il faut faire apparaitre le status Stripe, soit il est actif et on dit au client qu'il peut accepter tout type de paiement, soit il est inactif et on lui recommande d'activer son compte avec un bouton pointant directement vers la page Stripe.
- [x] Le status Stripe doit apparaitre avant même que le job commence et durant tout le job si le status n'est pas valide.
- [x] Lors du paiement si le client a choisis de facturer les frais Stripe à son client ça doit figurer sur la facture comme "frais stripe" et "frais cobbr", toute facture est en anglais et ne peut pas être traduite pour le moment.
- [x] Permettre une pause d'une durée défini : on clique sur pause ça nous propose soit pas de durée, soit 10 min, 15 min, 30 min, personnalisé en min
- [x] accepter et refuser un job ne fonctionne pas, l'action ne produit aucun effet

## Home

- [x] Je veux une section qui alerte si Stripe n'est pas actif, avec un bouton vers la page pour activer Stripe et un message alertant que la personne ne pourra pas encaisser de paiement dans l'app ou même facturer sans Stripe.
- [x] Il nous faut un bouton logo "conversation" qui permet au utilisateurs de nous envoyer un message, dans celui ci ils peuvent soit demander de l'aide, donner leur avis, demander une modication (feature), signaler un problème.
- [x] Traduire le wizard conversation dans toute les langues
- [x] Le wizard conversation est mal calibré lorsqu'on ouvre le clavier, il faut qu'il soit facile de naviguer même avec le clavier ouvert
- [x] le systeme de messages (aide, soutiens...) ne fonctionne pas, les message ne partent pas.

## Business

- [x] Enlever la section "Statistics overview" dans l'écran business info
- [x] écran payout : revoir le design pour l'assortir au reste de l'app (doit prendre toute la largeur)
- [x] Sur la page stripe quand le compte est inactif il faut que le logo fasse la même taille que quand le compte est actif
- [x] Il faut une explication sur la page Stripe avant création du compte disant que le compte Stripe permet au utilisateur d'encaisser des paiement et de facturer depuis l'app. Ce paragraphe doit être traduit dans chaques langues.
- [x] Pour la page Stripe quand le compte est actif l'utilisateur doit pouvoir activer en un clic (checkbox, bouton slide) choisir de payer lui même les frais Stripe ou de les refacturer au client.
- [x] Pour la page partenaire une section "aide" doit expliquer que pour ajouter un partenaire il faut lui envoyer un code puis l'accepter. ce panneau doit être rétractable et fermé par défaut
- [x] Permettre au société d'ajouter leur logo sur la page business info
- [x] impossible d'ajouter un logo, le clic sur la photo n'active rien
- [x] reponse aux jobs en attente pas clair, à modifier (placer en dessous du job)

## AUTRES

- [x] Faire un test de notification avec une notification push pour un job
- [x] Vérifier que l'ensemble des fichiers de traductions soient complets
- [x] Faire en sorte que le logo soit bien centré sur toute les page en le haut de l'écran et l'élément en dessous du logo. Le logo doit être plus bas que la barre d'icones (du haut) du téléphone
