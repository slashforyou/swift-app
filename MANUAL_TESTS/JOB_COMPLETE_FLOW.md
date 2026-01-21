# Flow Complet d'un Job - Test Manuel

## Présentation

Ce document décrit les étapes nécessaires pour tester le flow complet d'un job dans l'application Swift, de sa création jusqu'au paiement. Chaque action doit être validée manuellement en cochant la case correspondante.

### Objectif

Valider le parcours utilisateur complet :

1. **Création** - Le client crée une demande de job
2. **Exécution** - Un prestataire accepte et réalise le job
3. **Paiement** - Le paiement est effectué et confirmé

---

### Nous bloquons à l'étape : ~~3.6~~ **CORRIGÉ**

## Actions

### 1. Initialisation [ Testée et validée ]

- [x] **1.1 Démarrer l'app**
      **Erreurs :**

  **Solutions :**

### 2. Accès au formulaire de création de job [ Testée mais non validée ]

- [x] **2.1 Naviguer vers le calendrier**
      **Erreurs :**

  **Solutions :**
  - [x] **2.2 Sélectionner une date**
        **Erreurs :**

    **Solutions :**
    - [x] **2.3 Cliquer sur "+" pour créer un ouvrir le formulaire de création de job**
          **Erreurs :**
      - L'icône "+" n'est pas sensé être visible lors d'une date passée.
        **Solutions :** ✅ _Implémenté le 20/01/2026_
        - [x] Ajouter une condition dans `dayScreen.tsx` pour masquer le FAB si la date sélectionnée est passée
        - [x] Comparaison de date : `selectedDate < today` → FAB non rendu

### 3. Création du job

- [x] **3.1a Appuyer sur "Créer un client"**
      **Erreurs :**

  **Solutions :**

- [x] **3.1b Sélectionner un client existant**
      **Erreurs :** - Malgré l'existance de client dans la base, l'application n'affiche pas les clients disponibles. - Toujours aucune option dans la liste déroulante des clients. - Pas de log d'erreur visible dans la console.

  **Solutions :** ✅ _Corrigé le 20/01/2026_
  - [x] Vérifier que le hook `useClients` reçoit correctement les données de l'API dans `CreateJobModal.tsx`
  - [x] Ajouter un log de debug pour voir si `clients` est un tableau vide ou undefined
  - [x] Vérifier que l'utilisateur est bien authentifié (le hook vérifie `isLoggedIn()`)
  - [x] **CORRIGÉ** : L'API retourne `{ success: true, data: { clients: [...] } }` - le service a été mis à jour pour extraire correctement `data.clients`
  - [x] Ajouter un message d'erreur visible si `error` est défini dans `useClients`
  - [x] Logs détaillés ajoutés dans `useClients.ts` (console.log pour debug)

- [ ] **3.2a Remplir les informations du client et valider**
      **Erreurs : Le clavier empeche la bonne visibilité des champs à remplir. Résolu le 20/01/2026 à 19:24.**

  **Solutions :** ✅ _Implémenté le 20/01/2026_
  - [x] Ajouter `keyboardShouldPersistTaps="handled"` au `ScrollView` dans `renderNewClientStep()`
  - [x] Envelopper le contenu du formulaire dans un `KeyboardAwareScrollView` (react-native-keyboard-aware-scroll-view)
  - [x] Ajouter un padding bottom suffisant au ScrollView pour que le dernier champ soit visible au-dessus du clavier
  - [x] Ajouter `automaticallyAdjustKeyboardInsets={true}` au ScrollView (iOS 16+)

- [ ] **3.3 Fermer la fenêtre de validation de création de client**
      **Erreurs :**

  **Solutions :**
  - [x] **3.4 Remplir les adressses du job (adresse de départ et d'arrivée)** - Erreurs : Le clavier masque le champ d'adresse de livraison, rendant impossible la saisie complète. Le champs "state" doit etre une liste déroulante pour éviter les erreurs de saisie. Résolu le 20/01/2026 à 19:24.

    **Solutions :** ✅ _Implémenté le 20/01/2026_
    - [x] Remplacer le `ScrollView` par `KeyboardAwareScrollView` dans `renderAddressStep()`
    - [x] Ajouter `contentContainerStyle={{ paddingBottom: 150 }}` au ScrollView pour laisser de l'espace sous le clavier
    - [x] Créer un composant `StatePicker` avec les états australiens (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
    - [x] Remplacer le `TextInput` du champ "state" par un `Pressable` ouvrant une modal de sélection
    - [x] Utiliser le même pattern que `LanguageSelector.tsx` pour la liste déroulante d'états

    - [ ] **3.5 Remplir les détails du job (date, heure, durée)**
          **Erreurs : Le clavier masque certains champs, rendant la saisie difficile. Le champs date n'est pas pratique. Résolu le 20/01/2026 à 19:24.**

    **Solutions :** ✅ _Complètement implémenté le 20/01/2026_
    - [x] Remplacer les `TextInput` de temps par des sélecteurs de temps natifs (`DateTimePicker` mode="time")
    - [x] Utiliser `@react-native-community/datetimepicker` pour les champs de temps
    - [x] Ajouter `keyboardShouldPersistTaps="handled"` au ScrollView
    - [x] Ajouter un padding bottom au ScrollView pour éviter que le clavier masque les champs
    - [x] Afficher un DatePicker en modal pour la date au lieu d'un simple affichage

    - [x] **3.6 Remplir les détails du job (level du job, commentaires)**
          **Erreurs : Le bouton de validation est innaccessible ne nous permettant pas d'aller plus loin dans la céation (étape bloquante). Résolu le 20/01/2026 à 19:24.**

    **Solutions :** ✅ _Implémenté le 20/01/2026_
    - [x] **CRITIQUE** : Le `buttonRow` est en dehors du `ScrollView`, donc masqué par le clavier
    - [x] Déplacer le `buttonRow` à l'intérieur du `ScrollView` avec un `paddingBottom` suffisant
    - [x] OU ajouter `keyboardVerticalOffset` au `KeyboardAvoidingView` (valeur recommandée: 100-120)
    - [x] OU utiliser `react-native-keyboard-aware-scroll-view` qui gère automatiquement ce problème
    - [x] Ajouter `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` avec un offset ajusté
    - [x] S'assurer que le modal a `minHeight: '70%'` mais pas de `maxHeight` qui empêche l'expansion

    - [x] **3.7 Remplir les détails du job (prestataire assigné, type de véhicule)**
          **Erreurs :** Ces champs n'existaient pas.

      **Solutions :** ✅ _Implémenté le 20/01/2026_
      - [x] Ajout d'un sélecteur de Staff avec modal (utilise `useBusinessStaff` hook)
      - [x] Ajout d'un sélecteur de type de véhicule (Van, Truck, 2-ton, Pantech)
      - [x] Champs optionnels - le job peut être assigné plus tard

    - [x] **3.8 Ajouter des extras au job (si applicable)**
          **Erreurs :** Cette fonctionnalité n'existait pas.

      **Solutions :** ✅ _Implémenté le 20/01/2026_
      - [x] Ajout d'une section "Extras" avec 9 options (Piano, Pool Table, Heavy Items, Antiques, Disassembly, Packing, Storage, Stairs, Lift)
      - [x] Sélection multiple possible avec cases à cocher visuelles
      - [x] Affichage dans l'étape de confirmation

    - [ ] **3.9 Remplir détails de paiement (mode de paiement, montant, accompte versée ou demande d'accompte)**
          **Erreurs : Cette étape n'existe pas, à implémenter**

      **Solutions :**
      - [ ] Cette section n'existe pas dans le formulaire de création - à implémenter

      **Solutions :**
      - [x] **3.10 Enregistrer le job**
            **Erreurs :** - Erreur après l'enregistrement du job : "Une erreur est survenue lors de la création du job. Veuillez réessayer." - HTTP 404.

        **Solutions :** ✅ _Corrigé le 20/01/2026_
        - [x] Ajout de logs détaillés dans `handleSubmit()` de CreateJobModal
        - [x] Affichage du message d'erreur détaillé de l'API dans l'Alert
        - [x] Console.log du payload envoyé et de la réponse
        - [x] **CORRIGÉ** : L'endpoint était `/v1/jobs` (pluriel) mais l'API attend `/v1/job` (singulier)

### 4. Exécution du job [ Pas encore testée ]

- [ ] **4.1 Acceder au job depuis la page du jour**
      **Erreurs :**

  **Solutions :**

- [ ] **4.2 Accepter le job en tant que prestataire**
      **Erreurs :**
      **Solutions :**
- [ ] **4.3 Démarrer le job**
      **Erreurs :**
      **Solutions :**
  - [ ] **4.4 Passer à l'étape suivante (si applicable)**
        **Erreurs :**

    **Solutions :**
    - [ ] **4.5 Prendre une photo**
          **Erreurs :**

      **Solutions :**
      - [ ] **4.6 Ajouter une note"
            **Erreurs :\*\*

        **Solutions :**
        - [ ] **4.7 Terminer le job**
              **Erreurs :**

          **Solutions :**

### 5. Paiement du job [ Pas encore testée ]

- [ ] **5.1 Accéder à la page de paiement du job**
      **Erreurs :**
      **Solutions :**
- [ ] **5.2 Vérifier les détails du paiement**
      **Erreurs :**
      **Solutions :**
- [ ] **5.3 Effectuer le paiement**
      **Erreurs :**
      **Solutions :**
- [ ] **5.4 Confirmer la réception du paiement**

  **Erreurs :**

  **Solutions :**

---

## Conclusion et vérifications finales

- [ ] **Vérifier que le job apparaît comme complété dans l'historique des jobs**
      **Erreurs :**

  **Solutions :**

- [ ] **Vérifier que le paiement est enregistré correctement**
      **Erreurs :**

  **Solutions :**
  ---## Notes supplémentaires

- Documenter toute anomalie rencontrée durant le test
