# REVIZO — SPÉCIFICATION CENTRALE OFFICIELLE V2

## 🔒 VERROUILLAGE MAÎTRE : DÉVELOPPEMENT LOCAL AVANT BACKEND RÉEL

> **RÈGLE FONDAMENTALE D'EXÉCUTION** :
> REVIZO est d'abord construit **entièrement en local**, exécutable et testable directement sur la machine locale.
> 
> **Pendant la phase de construction locale :**
> - **Supabase réel = NON CONNECTÉ.**
> - Aucune modification, aucune migration, aucune table créée/supprimée sur un projet distant.
> - Aucun bucket distant ou Edge Function n'est sollicité.
> - L'application est conçue rigoureusement selon les exigences fonctionnelles et pédagogiques de REVIZO, et non en fonction d'un schéma préexistant.
> - Les données de démonstration et tests transitent par une couche d'abstraction propre :
>   `Interface Utilisateur (UI) -> Services Métier -> Repositories / DAL -> Data Provider -> Mock Provider (Actuel) -> Supabase Provider (Intégration ultérieure)`.
> - La bascule vers le backend réel Supabase interviendra dans une phase ultérieure dédiée, une fois l'application locale pleinement validée.

---

## 1. VISION PRODUIT & MISSION PÉDAGOGIQUE

**REVIZO** est une application mobile et desktop conçue pour les élèves.
Sa mission centrale : **transformer un cours scolaire importé (PDF, photos, images, scans) en contenu de révision précis, court, compréhensible et facile à mémoriser, puis permettre à l'élève de vérifier sa compréhension grâce à des quiz pertinents.**

### Pipeline Pédagogique Officiel
```text
Document de cours (PDF, images, photos)
        ↓
Compréhension globale du cours (analyse approfondie, schémas, tableaux)
        ↓
Extraction des notions et concepts clés
        ↓
Hiérarchisation et priorisation
        ↓
Révision synthétique structurée (concise, fidèle, mémorisable)
        ↓
Vérification de compréhension
        ↓
Quiz interactif (relié aux notions réelles)
        ↓
Analyse précise des erreurs
        ↓
Révision ciblée sur les faiblesses
        ↓
Nouveau test de validation
        ↓
Maîtrise validée
```

L'IA ne doit **jamais inventer** un concept ou un fait absent du cours. Tout quiz et toute explication pédagogique s'ancrent strictement dans la représentation structurée du cours.

---

## 2. RÈGLES DE DONNÉES & STOCKAGE

1. **Couche d'Abstraction Data Provider**
   - L'UI et la logique métier ne dépendent jamais directement d'une source concrète.
   - Les appels passent par `IDataProvider` implémenté par `MockDataProvider` durant le développement local.
   - Lors de la phase d'intégration, `SupabaseDataProvider` sera branché sans réécriture de l'UI ou des services.

2. **Aucune Base de Données Métier Locale**
   - **Interdiction absolue** d'utiliser IndexedDB, SQLite, Realm, AsyncStorage, localStorage, sessionStorage ou des fichiers JSON comme base de données locale offline-first synchronisée a posteriori.
   - Les mocks ne servent qu'au développement et aux démonstrations locales.

3. **Distinction Clé : Données Internes vs Téléchargement Utilisateur**
   - **Données internes REVIZO** : Gérées par le Provider (Supabase à terme).
   - **Téléchargement explicite de révision** : Lorsque l'élève clique sur *"Télécharger la révision"*, un vrai PDF est généré et enregistré sur l'appareil (système de fichiers natif de l'OS).
   - Ce fichier appartient à l'élève. Il peut l'ouvrir, le partager et le lire sans connexion.
   - Une révision non téléchargée explicitement n'est pas consultable hors connexion.

4. **Comportement Hors Connexion Épuré & Sans Erreurs Techniques**
   - **Zéro message technique** : Jamais de code `404`, `500`, "Network Error", "Failed to fetch", "Supabase error", stack trace ou JSON d'erreur visible par l'élève.
   - **Révision téléchargée** : Lisible et accessible sans connexion.
   - **Révision non téléchargée** : Message bienveillant *"Connexion requise pour consulter cette révision."*
   - **Quiz hors connexion** : Les quiz générés sont visibles, mais le démarrage est désactivé avec le message clair : *"Connexion requise pour commencer le quiz."*
   - **Aucune réponse stockée localement** : Le quiz se joue avec une connexion active pour persister directement les réponses, l'XP, l'énergie et le streak.

5. **Gamification Pédagogique**
   - 3 énergies par session de quiz (perte sur erreur, explication immédiate).
   - Récompenses : XP, diamants, série (streak).
   - La gamification valorise l'apprentissage sans le dénaturer.

---

## 3. NAVIGATION OFFICIELLE

### Mobile (Bottom Navigation Stricte)
- **Barre inférieure (4 onglets uniquement)** :
  1. **Accueil**
  2. **Révision**
  3. **Mes cours**
  4. **Quiz**
- *(Le profil n'est PAS un 5e élément inférieur)*.
- **Barre supérieure (Header)** :
  - Recherche
  - Notifications
  - Profil

### Desktop (Sidebar Fixe à Gauche)
- **Logo REVIZO** en haut.
- **Navigation principale** :
  1. **Accueil**
  2. **Révision**
  3. **Mes cours**
  4. **Quiz**
- **Bas de la sidebar** :
  - **Profil**
- **Zone principale (Header en haut à droite)** :
  - Recherche
  - Notifications

---

## 4. DIRECTION ARTISTIQUE & SYSTÈME VISUEL OFFICIEL (RÉFÉRENCES V2)

L'apparence officielle de REVIZO est dictée par les captures de référence fournies (Desktop & Mobile) :

- **Ambiance globale** : Fond lumineux, sobre et chaleureux (`#F8F9FA`), cartes blanches épurées (`#FFFFFF`), contrasté par une **Hero Card sombre** (`#1E2022`) créant un point focal instantané.
- **Identité de marque** : Logo textuel fort `REVIZO✦` avec étincelle dorée/ambre (`#F59E0B`).
- **Accents de couleur** :
  - Teinte primaire d'action : Orange vif (`#EA580C`) et ambre chaud (`#F59E0B` / `#F0A558`).
  - Onglet actif Desktop : Fond pilule douce pêche/orange (`#FFF3E8`), texte et icône orange vif.
  - Onglet actif Mobile : Souligné d'une barre horizontale orange (`mobile-active-indicator`).
- **Hero Card "Objectif du jour"** :
  - Fond anthracite/noir mat (`#1E2022`), coins arrondis `24px`.
  - Durée : `15 min de révision` en grands caractères blancs.
  - Barre de progression : 10 segments arrondis (7 segments dorés remplis = 70%, 3 segments sombres vides).
  - Illustration : Cible 3D avec flèche et étincelles dorées (`Target3DIllustration`).
  - Bouton d'action : `Réviser →` en ambre chaud (`#F0A558`), sans icône à gauche, avec flèche vers la droite alignée à droite du texte.
- **Cartes de Gamification & Statistiques** :
  - **Diamants** : Icône facettée ambre sur fond doré doux (`24 Diamants`).
  - **Série en cours** : Flamme orange (`12 jours`) + jours de la semaine `L M M J V S D` (jours validés en pilules orangées).
  - **Niveau** : Badge octogonal sombre avec chiffre blanc (`Niveau 8`, `260 XP avant le niveau 9` avec jauge fine).
- **Section "Mes matières"** :
  - Cartes avec icône carrée arrondie, titre en gras, jauge de maîtrise fine et badge de niveau en pilule (Mathématiques 78% / Niv 6, Français 64% / Niv 5, Sciences 42% / Niv 3).
- **Groupe Pinned / Fixe "Relever les défis"** :
  - Fixé en permanence au bas de l'écran lors du défilement (au-dessus de la barre de navigation mobile et des safe areas).
  - Fond pêche clair avec flou d'arrière-plan (`rgba(255, 248, 243, 0.98)` / `backdrop-filter: blur(16px)`), bordure subtile `#FFD8BA`.
  - Bouton d'action principal `Relever les défis →` animé d'une respiration douce continue (zoom très léger, retour calme, pause, boucle) non intrusive.
  - Padding bas de page suffisant (`125px` mobile, `105px` desktop) empêchant tout masquage du contenu de fin de page.
- **Page "Révision" (Référence Visuelle Officielle Validée)** :
  - **Header** : Grand titre `Révision` en gras (2rem, 800), icône Recherche, icône Notifications avec badge orange `3`, avatar circulaire Nasser.
  - **Grande carte "Commence une nouvelle révision"** :
    - Fond crème chaud `#FFFBF5`, bordure fine `#F3EBE1`, rayon 24px.
    - Titre "Commence une \n nouvelle révision", sous-titre "Importe ton cours et laisse RÉVIZO créer ton parcours de révision avec l'IA."
    - Deux cartes d'actions côte à côte :
      1. `IMPORTER UN PDF` (icône vectorielle document PDF dorée, "Importer un cours depuis ton téléphone")
      2. `PRENDRE UNE PHOTO` (icône vectorielle appareil photo dorée, "Photographier une page de ton cours")
    - Mention centrée : `📄 PDF, JPG ou PNG`.
  - **Grande carte "✨ Révision intelligente"** :
    - Titre avec étincelles `✨ Révision intelligente`, sous-titre "L'IA transforme automatiquement ton cours en :".
    - 4 cartes horizontales (`repeat(4, 1fr)`) : Résumé (FileText), Questions (HelpCircle), Quiz (CheckSquare), Exercices (Pencil).
  - **Section "Mes cours récents"** :
    - En-tête avec titre "Mes cours récents" et lien "Voir tout >".
    - Boîte blanche avec 3 cours séparés par des séparateurs fins :
      1. Mathématiques : "Les équations du second degré", jauge dorée `#C47D2B`, `65 %`, chevron >.
      2. Français : "Le commentaire composé", jauge verte `#10B981`, `40 %`, chevron >.
      3. Sciences : "La reproduction humaine", jauge violette `#8B5CF6`, `25 %`, chevron >.
  - **Carte "Continuer ma dernière révision"** :
    - Badge trophée/médaille dans carré arrondi crème/doré `#FBF3E8`.
    - Mention dorée "Continuer ma dernière révision", matière "Mathématiques", cours "Les équations du second degré", progression "Question 7 sur 15".
    - Bouton doré `CONTINUER →` avec flèche.
  - **Contradiction signalée** : La maquette graphique d'origine affichait une barre inférieure avec `Défi` et `Classement`. Conformément à la Règle Absolue de REVIZO, la navigation officielle à 4 onglets (`Accueil`, `Révision`, `Mes cours`, `Quiz`) est scrupuleusement conservée.
- **Vue de Lecture de Fiche de Révision (Après « CONTINUER → »)** :
  - **Navigation de retour sans répétition** :
    - Sur mobile : Le titre statique du header est dynamiquement remplacé par le bouton discret `← Révision`, évitant toute redondance visuelle.
    - Sur desktop : Le header supérieur reste neutre, et un bouton discret `← Révision` en pilule beige dorée surplombe la feuille de lecture.
  - **Identité de la fiche** :
    - Badge de matière (ex. `Mathématiques`).
    - Titre de la fiche lisible et proportionné (`Fiche Essentielle — Les équations du second degré`, 2 lignes sur mobile, pas de cassures excessives).
    - Information secondaire du cours (`Cours : Les équations du second degré`).
  - **Action de téléchargement** : Grand bouton principal secondaire `↓ Télécharger la révision` (48px de hauteur, padding généreux, coins arrondis, typographie nette, état téléchargé `✓ Fiche enregistrée sur l'appareil`).
  - **Feuille pédagogique unifiée** : Document unifié évitant l'éparpillement en cartes multiples, comprenant la carte dorée `✨ Résumé essentiel`, les sections éditoriales fluides (`1. Notions Fondamentales`), et les blocs `À retenir` avec liseré d'accent doré.
  - **Dégagement mobile** : Marge basse de 120px garantissant que la barre de navigation inférieure ne masque jamais le dernier contenu.
- **Page « Mes cours » (Spécification Officielle Validée)** :
  - **Navigation & En-tête** : Onglet officiel « Mes cours » (actif en barre inférieure sur Mobile avec indicateur orange, actif dans la sidebar fixe blanche sur Desktop). Header unifié avec titre `Mes cours`, icône recherche, notifications (badge 3) et avatar profil.
  - **Action principale** : Bouton évident `+ Ajouter un cours` (orange vif `#EA580C`, coins arrondis, typographie nette, ombre subtile) redirigeant immédiatement vers le parcours d'importation existant de Révision.
  - **Recherche & Filtres rapides** : Champ de recherche avec icône loupe, bouton de nettoyage rapide `X`, et filtrage en temps réel par titre, matière et résumé. Pilules de filtrage par matière avec compteurs dynamiques (`Tous les cours`, `Mathématiques`, `Français`, `Sciences`, etc.).
  - **Section « Dernier cours ajouté »** : Carte mise en valeur avec fond dégradé doux crème (`#FFFBF5`), bordure dorée, badge « Récemment importé », progression, date d'ajout et action rapide vers la fiche de révision.
  - **Grille de cours responsive** : Cartes blanches épurées (`radius: 20px`), badge matière avec couleurs dédiées, état téléchargé (`✓ Téléchargé` en vert émeraude doux ou `En ligne` en gris perle), titre en gras, jauge fine de progression, date d'activité et lien `Réviser →`. Clic sur la carte ouvrant directement la fiche de lecture de révision.
  - **États UI gérés** : Chargement avec Skeletons géométriques (aucun clignotement "0 cours"), état vide de recherche ("Aucun cours trouvé" avec bouton d'effacement), et état vide global ("Aucun cours pour le moment" avec bouton `+ Ajouter un cours`).
- **Page « Quiz » (Spécification Officielle Validée)** :
  - **Navigation & En-tête** : Onglet officiel « Quiz » (actif en barre inférieure sur Mobile avec indicateur orange, actif dans la sidebar fixe blanche sur Desktop). Header épuré avec titre `Quiz` sur mobile et profil Nasser.
  - **Hub des Quiz disponibles** :
    - En-tête explicatif : *"Vérifie ce que tu as réellement compris et mémorisé grâce à des quiz ciblés issus de tes cours."*
    - Grille de cartes de quiz reliées aux cours réels (`Course -> CourseAnalysis -> Concepts -> Revision -> Quiz -> Questions`).
    - Métadonnées complètes par carte : Matière, Titre du cours, Nombre de questions, Niveau de difficulté, Jauge de progression et bouton d'action `Commencer`.
    - Aucune statistique décorative inutile.
  - **Écran de Préparation du Quiz** :
    - Bouton discret `← Retour aux quiz`.
    - Fiche récapitulative : Matière, Niveau, Titre du quiz (`Quiz d’Évaluation — [Cours]`).
    - Grille d'informations préalables : Nombre de questions, Durée estimée (~6 min), Règle d'énergie (`1 erreur = -1 énergie ⚡`), Récompenses prévues (`+25 XP / réponse + 5 💎`).
    - Liste à puces des notions évaluées issues des concepts réels du cours.
    - Grand bouton d'action principal tactile : `Commencer le quiz`.
  - **Interface de Question (Player)** :
    - Barre supérieure : Lien discret `Quitter`, compteur clair (`Question X / Y`), jauge d'énergie (`⚡ X/3`) avec pulsation en cas de perte, et barre de progression continue.
    - Badge de la notion évaluée (`Notion : [Concept]`).
    - Texte de la question lisible et aéré.
    - Choix de réponses sous forme de grandes cartes tactiles (`min-height: 56px`), bordures douces, grand confort tactile sur mobile, lettre en pilule (A, B, C, D).
    - Barre de contrôle inférieure : `← Question précédente` et bouton principal `Valider ma réponse ✓` devenant `Question suivante →`.
  - **Validation & Feedback Pédagogique Immédiat** :
    - Choix validé mis en évidence (vert si correct, rouge si incorrect avec révélation simultanée de la bonne réponse en vert).
    - Bloc pédagogique clair et motivant :
      - En cas de succès : `✓ Bonne réponse ! (+25 XP)`.
      - En cas d'erreur : `✕ Pas tout à fait (-1 énergie)` avec bouton d'action directe `📖 Revoir cette notion`.
      - Explication didactique systématique répondant à : *"POURQUOI CETTE RÉPONSE EST-ELLE CORRECTE ?"* directement ancrée sur le concept évalué.
  - **Écran de Résultats Pédagogiques & Analyse d'Erreurs** :
    - Badge trophée doré et message d'encouragement.
    - Score clair : `X / Y (Z%)`.
    - Résumé sobre de gamification : XP gagnés, Diamants collectés, Série en jours.
    - **Section centrale « À revoir »** : Regroupe les notions exactes associées aux erreurs commises, nombre d'erreurs par notion, et bouton d'action immédiate `📖 Revoir la notion`.
    - **Section « Concepts validés »** : Liste des notions assimilées avec coche verte.
    - Actions de sortie : `Consulter la fiche de révision complète` (retour vers la lecture du cours) et `Recommencer le quiz`.
  - **Parcours de Révision Ciblée & Retest** :
    - **Révision Ciblée** : Fiche synthétique concentrée uniquement sur le concept fragile (Points clés à retenir, Règles & Formules fondamentales).
    - **Retest Dédié** : Bouton `🔄 Retester cette notion` qui génère et lance un sous-quiz focalisé exclusivement sur les questions du concept concerné (sans relancer tout le quiz aléatoirement).
  - **Gestion Hors Connexion Stricte** :
    - Les quiz disponibles peuvent être consultés sans connexion.
    - Toute tentative de démarrage ou de soumission hors ligne est immédiatement bloquée avec un message utilisateur bienveillant : *"Connecte-toi pour commencer ce quiz. Tes réponses et ta progression doivent être enregistrées en ligne."*
    - Zéro queue de synchronisation locale, zéro stockage hors ligne de réponses (préservation de l'intégrité de l'XP et des séries).
- **Page « Profil » (Spécification Officielle Validée)** :
  - **Navigation & En-tête** : Accessible depuis l'avatar utilisateur du header (mobile & desktop) et depuis la carte profil au bas de la sidebar desktop. Navigation mobile strictement préservée sur 4 onglets (zéro 5e onglet). Header mobile avec bouton retour dédié `← Retour` et titre `Profil`. Sur desktop, bouton discret `← Retour` surplombant la fiche personnelle.
  - **Carte d'Identité Utilisateur** : Grand avatar soigné avec badge de niveau (`Niveau 8`), nom complet de l'élève, badge pilule de classe scolaire (`Classe de 3e`), adresse email de compte (`nasser@revizo.app`), et date d'inscription formatée en clair (`Élève REVIZO depuis août 2026`).
  - **Synthèse de Progression Globale (4 indicateurs clés)** :
    1. *Niveau d'apprentissage* : `Niveau 8` (+1740 XP, jauge textuelle `260 XP avant le niveau 9`).
    2. *Série en cours* : `12 jours` avec flamme orange et mention du record personnel.
    3. *Diamants collectés* : `24 💎` (solde d'échange).
    4. *Cours actifs* : `4 cours` (3 matières actives).
  - **Section « Mes objectifs » (Pédagogique)** :
    - 3 repères concrets calculés à partir des données réelles du `UserService` :
      1. *Objectif quotidien de révision* : `10 sur 15 minutes révisées aujourd'hui` avec barre de progression continue.
      2. *Maintenir la série de travail* : Progression sur 14 jours et pilules d'état hebdomadaire `L M M J V S D` (jours validés en orange vif).
      3. *Consolidation des notions fragiles* : Notion fragile identifiée (`Calcul des racines selon le signe de Delta`), score de maîtrise actuel vs cible de 80%.
  - **Section « Compte & Préférences »** :
    - Carte d'actions tactiles avec icônes encadrées et chevrons d'accès :
      1. *Modifier mon profil* : Modale accessible permettant d'éditer le nom d'affichage et le niveau scolaire, avec persistance immédiate dans le `MockDataProvider` et notification toast de succès.
      2. *Paramètres* : Modale d'aperçu des réglages locaux (Thème clair REVIZO, animations, langue, version certifiée v2.0.0).
      3. *Notifications* : Accès direct aux alertes et rappels de révision.
      4. *Se déconnecter* : Modale de confirmation bienveillante (*« Se déconnecter ? Tu pourras te reconnecter à tout moment... »*) avec actions `Annuler` et `Se déconnecter`.
  - **États UI** : Skeletons pendant le chargement initial, gestion des erreurs avec `FriendlyNotice` sans jargon technique, et dégagement mobile de 135px au-dessus de la barre de navigation.
- **Page « Paramètres » (Spécification Officielle Validée)** :
  - **Navigation & En-tête** :
    - Accès exclusif depuis l'action « Paramètres » de la page Profil.
    - Aucun onglet ajouté : La navigation inférieure mobile reste strictement limitée aux 4 onglets officiels (`Accueil`, `Révision`, `Mes cours`, `Quiz`).
    - Sur Mobile : Header avec bouton de retour dédié `← Profil` ramenant instantanément à la page Profil.
    - Sur Desktop : Sidebar REVIZO fixe préservée à gauche, titre et bouton retour `← Profil` en pilule au-dessus de la colonne centrale.
  - **Section Apparence** :
    - Thème de l'application affiché en `Clair (Défaut)`.
    - Architecture prête pour l'ajout ultérieur de modes d'affichage sans rupture de la DA actuelle.
  - **Section Expérience** :
    - Interrupteur ON/OFF pour les *Micro-animations*.
    - Impact réel : Déclenche l'application ou le retrait de la classe CSS `reduce-motion` sur l'élément racine `<html>`, adoucissant les transitions décoratives tout en préservant l'intégrité des flux fonctionnels.
  - **Section Langue** :
    - Affichage de la langue active : `Français (France)` avec badge de validation `✓ Français`.
    - Préparation à l'internationalisation future sans simulation de langues non traduites.
  - **Section Notifications** :
    - 3 contrôles tactiles indépendants avec mémorisation dans l'état de l'application :
      1. *Notifications de révision* (Rappels pour réviser les notions fragiles).
      2. *Rappels quotidiens* (Alerte douce pour préserver la série de travail).
      3. *Récompenses et progression* (Gains de diamants et montées de niveau).
    - Retour visuel immédiat via bannière de notification toast.
  - **Section Confidentialité et Données** :
    - *Politique de confidentialité* : Modale accessible formulée en termes clairs et compréhensibles par un élève, expliquant la non-revente des données, le traitement purement pédagogique des cours et l'isolation sécurisée du profil.
    - *Gestion de mes données* : Modale récapitulative transparente énumérant les éléments stockés (fiches, concepts, scores de quiz) et garantissant la souveraineté de l'élève.
  - **Section Compte** :
    - *Mon profil* : Lien d'accès direct ramenant au Profil.
    - *Se déconnecter* : Ouvre la modale de confirmation existante sans duplication logique, garantissant un flux de déconnexion unifié.
  - **Pied de page & Version** :
    - Mention centrée discrète et élégante : `REVIZO✦ Version 2.0.0 — Environnement d'exécution local certifié`.
  - **Architecture de Données & États** :
    - Respect absolu de la chaîne d'abstraction : `UI -> SettingsService -> IDataProvider -> MockDataProvider`.
    - Zéro persistance illicite (`localStorage`, `sessionStorage`, `IndexedDB`).
    - Chargement avec Skeletons géométriques et messages d'erreur traités par `FriendlyNotice` (zéro message technique ou code d'erreur HTTP).
- **Mobile vs Desktop** :
  - Mobile : Bottom bar à 4 onglets, header haut avec avatar Nasser, cartes de statistiques en 3 colonnes compactes, matières empilées.
  - Desktop : Sidebar fixe blanche à gauche avec profil Nasser au pied, grille 2 colonnes en haut (Hero 1.6fr / Stats 1fr), grille 3 colonnes pour les matières.
  - **États UI obligatoires** : Normal, chargement (Skeletons), vide, succès, erreur bienveillante sans jargon technique, hors-connexion élégant.
- **Parcours « Authentification Locale & Onboarding » (Spécification Officielle Validée)** :
  - **Architecture AuthProvider & Découplage** :
    - Contrat formel d'interface `IAuthProvider` (`getCurrentUser()`, `checkIdentifier()`, `signIn()`, `signUp()`, `signOut()`, `isAuthenticated()`).
    - Implémentation locale mémoire `MockAuthProvider` isolée, stockant les comptes de test sans recourir à `localStorage`, `sessionStorage`, `IndexedDB` ou SQLite.
    - Couche métier `AuthService` validant les formats et fournissant des messages d'erreur bienveillants adaptés aux élèves.
    - `AuthContext` fournissant l'état d'authentification réactif et synchronisant l'utilisateur actif avec `DataProvider`.
  - **Écran de Connexion Mobile & Desktop** :
    - Sélecteur de méthode : *« Continuer avec mon email »* ou *« Continuer avec mon numéro de téléphone »*.
    - Étape 1 : Saisie de l'identifiant. Détection de compte mock.
      - Si compte reconnu : Transition fluide vers le champ mot de passe avec bouton œil (afficher/masquer) et bouton *Se connecter*.
      - Si identifiant inconnu : Bannière bienveillante *« Aucun compte n’est associé à cet identifiant »* avec action directe *« Créer mon compte avec cet identifiant »*.
    - Compte de démonstration officiel : Nasser (`nasser@revizo.app` / `0612345678`, mot de passe : `Password123!`).
  - **Parcours de Création de Compte (Inscription 4 étapes)** :
    - Étape 1 : Email ou numéro de téléphone (avec toggle rapide).
    - Étape 2 : Mot de passe (au moins 6 caractères avec œil masquer/afficher).
    - Étape 3 : Prénom et nom (ex: Léa Martin).
    - Étape 4 : Classe scolaire (grille de sélection en pilules de 6e à Supérieur).
    - Bouton principal tactile : *« Créer mon compte ✨ »*.
  - **Onboarding Court & Didactique** :
    - Immédiatement affiché après l'inscription :
      - *« Bienvenue sur REVIZO 👋 »* avec personnalisation au prénom de l'élève.
      - *« Comment veux-tu apprendre ? »* (Options : *15 minutes par jour* ou *Mémorisation par quiz*).
    - Bouton *« Commencer à réviser → »* activant la session et ouvrant directement l'Accueil.
  - **Protection Stricte des Routes** :
    - Toutes les pages privées (`Accueil`, `Révision`, `Mes cours`, `Quiz`, `Profil`, `Paramètres`) sont subordonnées à une session active.
    - L'application démarre sans session et affiche l'écran de connexion sans aucun clignotement de l'application privée.
    - Écran de chargement épuré avec logo `REVIZO✦` pendant la résolution de session.
  - **Déconnexion Unifiée** :
    - Déconnexion accessible depuis le Profil et les Paramètres.
    - Réutilisation de la modale de confirmation existante (*« Se déconnecter ? »*).
    - Confirmation nettoyant la session en mémoire et renvoyant instantanément à l'écran de connexion.
  - **Personnalisation Dynamique du Profil** :
    - Le profil de l'élève connecté s'affiche dynamiquement sur la page Profil, l'avatar header et la sidebar desktop (ex: Léa Martin, Classe de 4e). Nasser n'est plus hardcodé.
  - **Gestion des Erreurs Utilisateur** :
    - Zéro jargon technique ou code HTTP (`400`, `404`, `500`, `Network Error`, `API Error`).
    - Formulations compréhensibles pour l'élève : *« Mot de passe incorrect. »*, *« Vérifie ton adresse email ou ton numéro. »*, *« Indique ton prénom et ton nom. »*.
- **Recherche Globale & Centre de Notifications (Transversaux)** :
  - **Architecture Découplée** :
    - `UI -> SearchService -> IDataProvider -> MockDataProvider`
    - `UI -> NotificationService -> IDataProvider -> MockDataProvider`
    - Zéro stockage persistant (`localStorage`, `sessionStorage`, `IndexedDB`), état géré en mémoire via le Provider.
  - **Recherche Globale (`SearchView`)** :
    - Accessible depuis l'icône loupe présente dans tous les en-têtes (Accueil, Révision, Mes cours, Quiz, Profil, Paramètres).
    - Périmètre de recherche transversale :
      - Cours : titre, matière, résumé pédagogique.
      - Révisions : titre, concepts clés, intitulés et contenus des sections éditoriales.
      - Quiz : titre du quiz, intitulé du cours associé.
    - Résultats hiérarchisés : Badge de type (Cours en bleu, Révision en orange, Quiz en violet), badge matière, titre, extrait/description, métadonnées pédagogiques (notions clés, sections, difficulté) et action « Consulter > ».
    - Clic sur un résultat : ouvre directement le contenu concerné (fiche de révision en lecture ou quiz d'évaluation).
    - Accueil de recherche : écran accueillant *« Que veux-tu retrouver ? »* avec suggestions rapides (Second degré, Mathématiques, Pythagore, etc.).
    - État vide bienveillant : *« Aucun résultat trouvé »* avec conseils et bouton *« Effacer la recherche »*.
    - États de chargement : Skeletons animés durant la frappe.
  - **Centre de Notifications (`NotificationsView`)** :
    - Accessible depuis l'icône cloche présente dans tous les en-têtes.
    - Badge de notification : calculé dynamiquement sur le nombre exact de notifications non lues (disparaît totalement quand 0 non lue).
    - 5 catégories pédagogiques REVIZO :
      - Révision : notions méritant d'être revues.
      - Rappel : rappels d'étude et de reprise de fiches.
      - Progression : gains d'XP et régularité.
      - Quiz : quiz prêts à être passés.
      - Récompense : diamants gagnés.
    - Distinction visuelle nette : point indicateur orange, légère mise en avant typographique et fond distinct (sans clignotement).
    - Clic sur notification : marque instantanément la notification comme lue et navigue directement vers la fiche ou le quiz cible.
    - Action *« Tout marquer comme lu »* : réinitialise l'état non lu de toutes les alertes et fait disparaître le badge du header.
    - Action *« Vider »* : permet de tester l'état vide accueillant *« Aucune notification pour le moment »*.
    - Filtrage : onglets *« Toutes »* et *« Non lues »*.

- **Mobile vs Desktop** :
  - Mobile : Bottom bar à 4 onglets, header haut avec avatar Nasser, cartes de statistiques en 3 colonnes compactes, matières empilées. Bouton retour unique dans le header pour la recherche et les notifications.
  - Desktop : Sidebar fixe blanche à gauche avec profil Nasser au pied, grille 2 colonnes en haut (Hero 1.6fr / Stats 1fr), grille 3 colonnes pour les matières.
- **États UI obligatoires** : Normal, chargement (Skeletons), vide, succès, erreur bienveillante sans jargon technique, hors-connexion élégant.

---

## 5. SUIVI DES PHASES DU PROJET

- [x] **PHASE 0 — Audit Initial** (Terminée et Validée)
- [x] **PHASE 1 — Nettoyage et Socle Technique Local** (Terminée et Validée)
- [x] **PHASE 2 — Modèles Domaine, DAL & Mock Provider Avancé** (Terminée et Validée)
- [x] **PHASE 3 — Authentification Locale & Onboarding** (Terminée et Validée)
- [x] **PHASE 4 — App Shell (Navigation Mobile & Sidebar Desktop)** (Terminée et Validée)
- [x] **PHASE 5 — Accueil (Dashboard d'action pédagogique)** (Terminée et Validée)
- [x] **PHASE 6 — Mes Cours (Bibliothèque & recherche)** (Terminée et Validée)
- [x] **PHASE 7 — Import des Cours (PDF, Image, Caméra)** (Terminée et Validée — pipeline mock fonctionnel)
- [x] **PHASE 8 — Simulateur Orchestrateur IA & Queue de traitement** (Terminée et Validée — MockAIProvider + AIOrchestrator)
- [x] **PHASE 9 — Analyse Documentaire & Extraction de Concepts** (Terminée et Validée — DocumentExtractorService + pdfjs-dist)
- [x] **PHASE 10 — Génération de la Révision Pédagogique** (Terminée et Validée — génération mock structurée)
- [x] **PHASE 11 — Lecture de la Révision (Sections & Progression)** (Terminée et Validée — RevisionView lecture complète)
- [x] **PHASE 12 — Système de Téléchargement PDF Natif Appareil** (Terminée et Validée — vrai PDF binaire 1.4)
- [x] **PHASE 13 — Consultation Hors Connexion des Révisions Téléchargées** (Terminée et Validée — fiches téléchargées consultables hors connexion, fiches non téléchargées bloquées avec message bienveillant sans crash)
- [x] **PHASE 14 — Moteur de Quiz Pédagogique (Questions par Concept)** (Terminée et Validée)
- [x] **PHASE 15 — Comportement Quiz Hors Connexion (Démarrage bloqué élégamment)** (Terminée et Validée)
- [x] **PHASE 16 — Feedback Pédagogique Immédiat & Analyse d'Erreurs** (Terminée et Validée)
- [x] **PHASE 17 — Gamification (3 Énergies, XP, Diamants, Série)** (Terminée et Validée)
- [x] **PHASE 18 — Calcul de Progression par Concept & Maîtrise** (Terminée et Validée — persistance PostgreSQL Supabase, scores notions, détection fragilités et quiz_results)
- [x] **PHASE 19 — Moteur de Révision Ciblée sur Faiblesses** (Terminée et Validée)
- [x] **PHASE 20 — Page Révision Dédiée** (Terminée et Validée)
- [x] **PHASE 21 — Page Quiz Dédiée** (Terminée et Validée)
- [x] **PHASE 22 — Moteur de Recherche Global** (Terminée et Validée)
- [x] **PHASE 23 — Notifications & Rappels d'Étude** (Terminée et Validée)
- [x] **PHASE 24 — Page Profil & Préférences** (Terminée et Validée)
- [x] **PHASE 25 — Gestion Globale de Connexion Réseau (Bannière discrète & guards)** (Terminée et Validée — NetworkBar, simulateur réseau, blocage élégant imports/quiz/fiches non téléchargées)
- [x] **PHASE 26 — Audit Hors Connexion (Scénarios A, B, C, D)** (Terminée et Validée — tests automatisés des 4 scénarios au vert)
- [x] **PHASE 27 — Audit Erreurs Utilisateur (Zéro jargon technique)** (Terminée et Validée — formatFriendlyError & FriendlyNotice sans aucun code HTTP ni stack trace)
- [x] **PHASE 28 — Audit Responsive Multi-Écrans (Mobile à Desktop)** (Terminée et Validée — Bottom bar 4 onglets Mobile & Sidebar fixe Desktop conformes)
- [x] **PHASE 30 — Parcours Utilisateur Réel de Bout en Bout** (Terminée et Validée — cycle complet Authentification -> Bibliothèque -> Lecture Fiche -> Téléchargement Natif PDF -> Session Quiz -> Maîtrise Concept -> Gamification -> Robustesse Hors Connexion validé par test automatisé)
- [x] **PHASE 31 — Audit Final de Conformité Locale & Validation** (Terminée et Validée — 16 fichiers de tests, 88 tests automatisés au vert à 100%, build de production TypeScript & Vite sans avertissement bloquant, zéro secret exposé)
- [x] **PHASE — PRÉPARATION À SUPABASE RÉEL** (Terminée et Validée)
  - Découplage strict de l'architecture : UI -> Services -> Repositories -> Provider -> Mock ou Supabase.
  - Inventaire des 12 tables et modèles PostgreSQL (`database.types.ts`).
  - Couche de Mappers bidirectionnels (`src/mappers/`).
  - Couche de Repositories domaine isolés (`src/repositories/`).
  - Fournisseurs `SupabaseDataProvider` et `SupabaseAuthProvider`.
  - Fabrique de fournisseurs `providerFactory.ts` avec bascule transparente et repli sécurisé sur `MockDataProvider`.
  - Migrations SQL versionnées et reproductibles dans `supabase/migrations/` (Core schema, RLS policies, Storage buckets).
  - Isolement multi-tenant strict garanti par Row Level Security (`auth.uid() = user_id`).
  - Modèle `.env.example` et sécurisation Git via `.gitignore`.
  - Documentation de déploiement `SUPABASE_SETUP.md`.
  - 69 tests automatisés au vert (100% de réussite) et build de production validé.
- [x] **PHASE CRITIQUE PRÉ-SUPABASE** (Terminée et Validée)
  - Suppression du `userId` hardcodé `'usr-demo-001'` dans `AIOrchestrator.ts` et `RevisionView.tsx`.
  - Le `userId` est désormais dynamique : provient du profil authentifié via `DataContext`.
  - Génération d'un vrai PDF binaire (PDF 1.4) dans `RevisionService.downloadRevisionPDF()`, remplaçant le `.txt`.
  - Nettoyage du dépôt : scripts E2E dans `e2e/`, screenshots dans `e2e/screenshots/`, fixtures de test dans `e2e/fixtures/`.
  - Suppression du répertoire orphelin `scratch_edge/`.
  - Mise à jour du `.gitignore` (tsconfig.tsbuildinfo, screenshots, scratch).
  - Test de séparation multi-utilisateur ajouté dans `MockDataProvider.test.ts`.
  - Synchronisation de REVIZO_SPEC.md avec l'état réel du projet.
- [x] **PHASE INTÉGRATION BACKEND RÉEL (SUPABASE RÉEL)** (Terminée et Validée le 2026-09-06)
  - Connexion effective de REVIZO 2.0 au projet Supabase distant (`ajmfsjankmhcdobpuegk`).
  - Archivage sans perte de données des tables de l'ancien prototype (`legacy_*`).
  - Déploiement des 12 tables PostgreSQL du schéma officiel REVIZO 2.0 (`users`, `courses`, `course_files`, `analyses`, `concepts`, `revisions`, `quizzes`, `quiz_questions`, `quiz_results`, `user_progress`, `notifications`, `user_settings`).
  - Configuration du trigger `handle_new_user()` sur `auth.users` initialisant automatiquement le profil, la progression (10 diamants, 3 énergies) et les paramètres de chaque élève.
  - Activation de la sécurité Row Level Security (RLS) sur les 12 tables avec isolation stricte multi-tenant basée sur `auth.uid() = user_id`.
  - Configuration des compartiments privés Supabase Storage (`source-documents` 50 Mo, `processed-assets` 20 Mo) avec politiques RLS d'isolation par répertoire utilisateur `{user_id}/...`.
  - Bascule de l'application via `VITE_DATA_PROVIDER=supabase` dans `.env.local`.
  - Validation du test E2E de persistance et d'étanchéité multi-comptes avec 2 comptes réels (`src/test/supabaseE2EPersistence.test.ts`) :
    - Inscription / Connexion distinctes pour Élève Alpha et Élève Bêta.
    - Création et persistance des cours dans PostgreSQL.
    - Épreuve de sécurité RLS : Élève Bêta ne voit aucun cours d'Élève Alpha, ne peut pas lire ses révisions par ID direct, et ne peut pas altérer sa progression.
    - Reconnexion multi-sessions avec préservation intégrale des données de chaque élève.
  - Suite de 77 tests automatisés au vert (13 fichiers de tests, 100% de réussite).
- [x] **PHASE DÉPLOIEMENT GITHUB & CONFIGURATION VERCEL MULTI-MACHINES** (Terminée et Validée le 2026-09-06)
  - Initialisation et synchronisation propre du dépôt distant `https://github.com/nalfa3347/Revizo` sur la branche `main`.
  - Intégralité des 116 fichiers sources, tests et configurations poussés en production.
  - Zéro fuite de secret : `.env.local` est strictement exclu via `.gitignore`, seul `.env.example` est versionné.
  - Ajout de la configuration `vercel.json` avec règles de réécriture SPA (`/(.*) -> /index.html`) et mise en cache des assets statiques.
  - Création du script sécurisé `scripts/sync-vercel-env.mjs` (`npm run sync:vercel`) permettant d'injecter automatiquement toutes les variables d'environnement (`VITE_DATA_PROVIDER`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) vers Vercel (Production, Preview, Development) par flux `stdin` sans jamais afficher les clés en clair.
  - Rédaction du guide exhaustif `VERCEL_DEPLOY.md` détaillant le déploiement continu, l'étanchéité des secrets et la portabilité inter-machines (permettant la suppression locale du projet sans perte de données ni interruption de service).
- [x] **PHASE PURGE INTÉGRALE DES DONNÉES FICTIVES (VRAIES DONNÉES SUPABASE EXCLUSIVES)** (Terminée et Validée le 2026-09-06)
  - Suppression radicale de toutes les données factices hardcodées dans l'application UI :
    - `HomeView` : suppression du prénom "Nasser", des scores figés (Maths 78%, Français 64%, Sciences 42%), des niveaux/diamants hardcodés. Intégration de la lecture dynamique des matières et cours réels de l'élève depuis Supabase avec états vides accueillants.
    - `RevisionView` : suppression définitive de `recentCoursesList` (les 3 faux cours "Les équations du second degré", "Le commentaire composé", "La mitose cellulaire") et de la carte factice "Continuer ma dernière révision". Branchement direct sur `courseService.getAllCourses()` pour n'afficher que les vrais cours persistés dans Supabase.
    - `AppShell` : suppression du prénom "Nasser" en sidebar et header mobile, suppression du niveau `8` hardcodé au profit du niveau réel issu de `user_progress`, et remplacement des photos de stock Unsplash par des badges d'initiales élégants et personnalisés.
    - `SettingsView` : affichage des statistiques réelles (nom, classe, nombre de cours réels, niveau, série, diamants) dans la modale "Gestion de mes données".
    - `ProfileView` : suppression des valeurs de repli factices dans le formulaire d'édition.
    - `AuthView` : masquage des indices de compte démo en mode réel Supabase.
    - `SupabaseDataProvider` : calcul dynamique en temps réel des moyennes de maîtrise par matière à partir de la table PostgreSQL `concepts`, et retour de valeurs neutres (0%, niveau 1) en cas d'absence de données au lieu de faux chiffres.
  - 100% de réussite aux tests automatisés (16 fichiers, 88 tests validés) et compilation de production Vite sans erreur.
- [x] **PHASE CORRECTION & FIABILISATION DE LA GÉNÉRATION DE PDF NATIF (PDF 1.4 BINAIRE)** (Terminée et Validée le 2026-09-06)
  - Diagnostic approfondi : l'ancienne implémentation utilisait l'opérateur PDF relatif `Td` avec des coordonnées absolues cumulatives, ce qui décalait toutes les lignes après la première en dehors de la page visible (Y > 1500+). De plus, l'encodage UTF-8 brut dans les polices Type 1 WinAnsi générait du mojibake (`â€”`, `RÃ©vision`).
  - Implémentation du moteur de rendu PDF 1.4 pur avec positionnement absolu strict via matrices `1 0 0 1 x y Tm`.
  - Mappage et échappement octal WinAnsi complet des caractères accentués français (`é`, `è`, `ê`, `à`, `ô`, `ù`, `ç`, `É`, `È`, `—`, `–`, `•`, etc.).
  - Design premium conforme aux règles de la marque REVIZO : bandeau supérieur indigo (`#4F46E5`), logo REVIZO, badge de certification scolaire, carte de résumé avec aplat et barre d'accent gauche, puces et flèches stylisées, sections numérotées, blocs "À retenir" et "Exemples".
  - Pagination dynamique automatique multipages avec en-têtes de continuation et pied de page officiel ("Page X sur Y") sur toutes les pages.
  - Sécurisation du téléchargement navigateur avec libération temporisée du blob (`setTimeout(() => URL.revokeObjectURL(url), 1500)`).
  - 17 fichiers de tests, 93 tests réussis sur 93 (100% de succès) et build de production Vite sans erreur.
- [x] **PHASE DE VALIDATION RÉELLE — REVIZO E2E (GEMINI & SUPABASE DE BOUT EN BOUT)** (Terminée et Validée le 2026-09-07)
  - Validation fonctionnelle réelle du parcours utilisateur complet d'un élève sans simulation ni mock.
  - Script de banc d'essai complet : `e2e/validate_real_gemini_pipeline.mjs` (51 / 51 validations au vert).
  - Authentification réelle Supabase avec deux comptes élèves isolés (`test_alpha_2026@revizo.test` et `test_beta_2026@revizo.test`).
  - Ingestion d'un vrai fichier PDF de cours de 60 Ko (`e2e/fixtures/cours_revolution_francaise.pdf`).
  - Appel réel de l'Edge Function Supabase `orchestrate-course` avec clé Gemini 2.5 Flash côté serveur (zéro secret côté client).
  - Traitement IA réel par Gemini (durée : 38.7s pour le PDF, 37.0s pour le mode photo OCR).
  - Extraction stricte des notions clés et concepts sans hallucination : fidélité au document source (12/19 termes clés identifiés, aucun terme parasite).
  - Synthèse de révision concise, structurée (5 sections, 2137 caractères vs 61 Ko source) plus courte que le cours original.
  - Génération de 4 questions de compréhension et 2 exercices reliés aux concepts avec références sources exactes.
  - Planification de 3 quiz d'évaluation espacés (8 questions au total avec explications didactiques complètes).
  - Persistance intégrale dans les 8 tables PostgreSQL Supabase (`courses`, `analyses`, `concepts`, `revisions`, `comprehension_questions`, `quiz_plans`, `quizzes`, `exercises`).
  - Vérification de l'étanchéité multi-tenant Row Level Security (RLS) : l'élève B ne peut voir ni cours, ni concepts, ni révisions, ni quiz, ni questions de l'élève A.
  - Résilience à la reconnexion : réhydratation instantanée de l'état complet après ré-authentification.
  - Gestion des cas d'erreur réels : rejet immédiat des requêtes non authentifiées, des documents vides et des fichiers PDF corrompus.
  - Non-régression totale : 17 suites Vitest (93/93 tests passés) et compilation TypeScript / Vite de production réussie sans erreur.
- [x] **PHASE MONÉTISATION, ÉNERGIE, DIAMANTS ET PARRAINAGE (SYSTÈME ÉCONOMIQUE REVIZO)** (Terminée et Validée le 2026-09-07)
  - **3 Abonnements Officiels (FCFA)** :
    - *Essentiel* : 1 000 FCFA/mois, 3 révisions/jour, 10 ⚡ max, 10 💎 de bienvenue.
    - *Intensif* : 3 000 FCFA/mois, 10 révisions/jour, "Le plus populaire", 20 ⚡ max, 30 💎 de bienvenue.
    - *Premium* : 5 000 FCFA/mois, 20 révisions/jour, "Expérience complète", 30 ⚡ max, 60 💎 de bienvenue.
    - *Free* : Préparé avec 1 révision/jour, 3 ⚡ max, 10 💎 initiaux.
  - **Contrôle Serveur des Révisions Quotidiennes** :
    - Quota vérifié et décrémenté côté serveur (Edge Function `orchestrate-course` & fonction PostgreSQL `record_revision_usage`).
    - Réinitialisation quotidienne automatique basée sur la date calendaire.
    - Blocage strict en HTTP 429 avec message bienveillant lorsque la limite est atteinte.
    - Impossible de contourner par rechargement, reconnexion, changement de navigateur ou manipulation frontend.
  - **Système d'Énergie ⚡ & Transactions Atomiques** :
    - Monnaie persistée dans la table PostgreSQL `user_energy` (`current_energy`, `max_energy`).
    - Consommation de 1 ⚡ par session pédagogique complète (pas de surconsommation par question de quiz).
    - Conversion atomique : 5 💎 = +1 ⚡ via RPC PostgreSQL `convert_diamonds_to_energy`.
    - Plafond de sécurité anti-abus : maximum 10 ⚡ converties par jour grâce aux diamants.
  - **Système de Diamants 💎 & Idempotence des Récompenses** :
    - Monnaie persistée dans `user_diamonds` (`balance`, `lifetime_earned`, `lifetime_spent`).
    - Contrainte SQL `CHECK (balance >= 0)` interdisant formellement tout solde négatif.
    - Événements de récompense idempotents tracés dans `reward_events` (`user_id`, `event_key`) :
      - Fin d'une révision : +2 💎 (`user_completed_revision:{revisionId}`)
      - Fin d'un quiz : +2 💎 (`user_completed_quiz:{quizId}`)
      - Réussite quiz >= 80% : +3 💎 bonus (`user_quiz_high_score:{quizId}`)
      - Série de 5 bonnes réponses : +2 💎 (`user_streak_5:{quizId}:{date}`)
      - Série de 7 jours consécutifs : +10 💎 (`user_streak_7days:{date}`)
      - Premier abonnement payant d'un filleul : +10 💎 (`referral_first_sub:{refereeId}`)
    - Traçabilité complète dans `diamond_transactions` et `energy_transactions`.
  - **Système de Parrainage & Protection Anti-Fraude** :
    - Code de parrainage unique par élève au format `REV-XXXXXX` généré lors de la création du compte.
    - Règle stricte : 1 seul parrain par compte filleul, auto-parrainage impossible.
    - Aucune récompense à la simple inscription : bonus parrain (+10 💎) déclenché **exclusivement** après confirmation du premier abonnement payant du filleul.
    - Opération idempotente garantie par clé unique `referral_first_sub:{referee_id}`.
  - **Sécurité Multi-Utilisateur & RLS (Row Level Security)** :
    - Politiques RLS actives sur les 7 tables économiques (`subscriptions`, `user_energy`, `user_diamonds`, `diamond_transactions`, `energy_transactions`, `referral_accounts`, `reward_events`).
    - Les élèves n'ont qu'un accès `SELECT` sur leurs propres lignes (`auth.uid() = user_id`).
    - Aucune mise à jour (`UPDATE` / `INSERT`) directe autorisée depuis le client sur les soldes ou quotas : toutes les mutations passent obligatoirement par des fonctions stockées PostgreSQL `SECURITY DEFINER`.
  - **Architecture Prête pour Fedapay** :
    - Statuts d'abonnement supportés : `free`, `active`, `expired`, `cancelled`, `past_due`.
    - Champs préparés : `payment_provider`, `external_subscription_id`, `expires_at`.
    - Aucune confirmation de paiement arbitraire côté client : déclenchement par webhook ou service serveur de paiement.
  - **Interface Utilisateur & Expérience Élève** :
    - Header unifié avec badges interactifs 💎 et ⚡ affichant soldes et ratios.
    - Vue dédiée « Mes diamants » : solde, guide d'obtention didactique, conversion 5💎 → 1⚡, progression de recharge quotidienne (X/10), historique des transactions.
    - Vue dédiée « Abonnement » : présentation sobre et premium des 3 offres en FCFA, mise en avant « Le plus populaire » pour l'Intensif, bouton de simulation sécurisée pour les tests.
    - Vue dédiée « Invite tes amis » : code de parrainage unique, bouton de partage natif/copie, statistiques des filleuls et récompenses obtenues.
    - Respect absolu de la navigation mobile à 4 onglets (`Accueil`, `Révision`, `Mes cours`, `Quiz`). Les vues économiques sont des overlays accessibles via le header ou le profil.
  - **Validation Automatisée & E2E Réelle** :
    - 23 tests unitaires et d'intégration dans `src/test/MonetizationEconomy.test.ts` (100% de succès).
    - 7 tests E2E réels sur projet Supabase distant `ajmfsjankmhcdobpuegk` dans `src/test/MonetizationRealE2E.test.ts` validant le cycle complet des Utilisateurs Alpha & Bêta.
    - 19 suites de tests au total (123 tests réussis sur 123), compilation TypeScript stricte (`tsc -b`) et build de production Vite sans erreur.
- [x] **PHASE AUDIT FINAL PRODUIT + UX + PRÉPARATION AU PAIEMENT RÉEL** (Terminée et Validée le 2026-09-07)
  - **Audit de l'expérience utilisateur bout en bout (comme un véritable élève débutant)** :
    - Détection et correction du point de blocage sur l'Accueil : pour un nouvel élève sans cours, le clic sur *"Réviser →"* redirige désormais directement vers l'écran d'importation de cours (`App.tsx`).
    - Harmonisation des jauges d'énergie : élimination des libellés obsolètes en `/3` dans `QuizView.tsx`, `QuizPlayerModal.tsx` et `ProfileView.tsx`, remplacés par la jauge dynamique `{currentEnergy} ⚡ / {maxEnergy} ⚡` correspondant au plan réel de l'élève (10, 20 ou 30).
    - Explication claire et didactique de la règle 5 💎 = 1 ⚡ dans la modale d'épuisement d'énergie, sans jargon technique ni codes HTTP.
    - Blocage immédiat de conversion avec retour convivial lorsque l'énergie de l'élève est déjà à son maximum (`energy_already_full`).
    - En cas de quota de révision quotidien atteint, affichage direct d'un bouton d'action *"Voir les abonnements"* dans la modale d'importation pour faciliter l'upgrade sans frustration.
  - **Audit de la Persistance et de l'Expiration d'Abonnement** :
    - En cas d'abonnement expiré (`expires_at < NOW()`), le système (fonction SQL `get_user_economy_state` et `MockDataProvider`) applique automatiquement les limites du plan Free (1 révision/jour, 3 ⚡ max, énergie plafonnée à 3), tout en préservant 100% des diamants, des cours et des révisions accumulés.
    - Aucune perte de données pédagogiques ou financières après expiration ou reconnexion.
  - **Conformité Ergonomie Mobile & Desktop** :
    - Barre inférieure mobile strictement restreinte aux 4 onglets officiels (`Accueil`, `Révision`, `Mes cours`, `Quiz`).
    - Badges 💎 et ⚡ cliquables dans le header ouvrant les modales/overlays dédiées sans briser la navigation.
    - Interface desktop avec sidebar fixe préservée.
  - **Validation Automatisée & Non-Régression** :
    - Création de la suite complète d'audit dans `src/test/ProductUXMonetizationAudit.test.ts` (22 tests dédiés à l'expérience utilisateur, aux quotas stricts, à l'anti-fraude parrainage et à la persistance).
    - 20 suites de tests exécutées avec succès (145 tests sur 145 réussis, 100%).
    - Build de production (`tsc -b && vite build`) vérifié et validé sans avertissement bloquant.
    - Statut : **✅ PRÊT POUR INTÉGRATION FEDAPAY**.
- [x] **PHASE INTÉGRATION DU SYSTÈME DE PAIEMENT SÉCURISÉ FEDAPAY** (Terminée et Validée le 2026-09-07)
  - **Moteur de Paiement FedaPay (Mobile Money & Cartes Bancaires)** :
    - Prise en charge officielle de MTN Mobile Money, Moov Money, Orange Money, Wave, Celtiis et Cartes Visa / Mastercard.
    - Montants stricts en FCFA (XOF) : Essentiel (1 000 FCFA), Intensif (3 000 FCFA), Premium (5 000 FCFA).
    - Table de traçabilité `payment_transactions` créée et protégée par Row Level Security (RLS) sur PostgreSQL Supabase.
  - **Edge Functions Supabase Déployées & Sécurisées** :
    - `fedapay-checkout` : Création de transactions et génération du token de paiement Checkout côté serveur via `FEDAPAY_SECRET_KEY` (zéro clé secrète exposée au client).
    - `fedapay-webhook` : Réception des événements `transaction.approved`, vérification de statut auprès de l'API FedaPay, activation automatique et idempotente de l'abonnement (`activate_subscription`) et attribution du bonus parrain (+10 💎 via `process_referral_reward_on_payment`).
  - **Interface Élève (`SubscriptionView.tsx`)** :
    - Boutons d'action branchés sur `createCheckoutSession`.
    - Redirection fluide vers le guichet officiel de paiement FedaPay.
    - Écran de retour automatique (`?payment=success` ou `?payment=callback`) avec réhydratation instantanée de l'état économique et bannière de confirmation didactique.
    - Mode simulation gracieux en l'absence temporaire de clé secrète de production.
  - **Validation & Non-Régression** :
    - 21 suites de tests exécutées avec succès (**151 tests réussis sur 151, 100% de succès**).
    - Compilation TypeScript stricte sans erreur (`tsc -b --noEmit`).
    - Build de production Vite (`tsc -b && vite build`) généré avec succès en 8.20s.
    - URL du Webhook FedaPay prête à être renseignée : `https://ajmfsjankmhcdobpuegk.supabase.co/functions/v1/fedapay-webhook`.
- [x] **PHASE CRÉATION DE LA LANDING PAGE SOBRE & PREMIUM (HEADER, HERO, PALETTE OR/AMBRE, SANS PREUVE SOCIALE)** (Terminée et Validée le 2026-09-07)
  - **Fidélité Visuelle Absolue au Header & Hero de Référence** :
    - Reproduction exacte de la structure de navigation : Logo REVIZO✦ avec étincelle dorée, rubriques (`Fonctionnalités`, `Comment ça marche`, `Tarifs`, `FAQ`), sélecteur de langue `FR`, bouton sobre `Connexion` et bouton pilule proéminent `Commencer →`.
    - Hero section : Badge supérieur `🎓 Pour les étudiants ambitieux`, grand titre H1 percutant avec mise en valeur de *"fiches intelligentes"* dans la couleur d'accent officielle, sous-titre didactique, bouton CTA principal `Essayer gratuitement →` et lien sobre `Voir comment ça marche`.
    - Aperçu interactif de l'application (Mockup fenêtre macOS avec statut prêt et badge flottant `Quiz généré ! ⚡`).
  - **Adaptation Stricte des Exigences Utilisateur** :
    - Remplacement du vert/turquoise de la référence par la palette officielle de REVIZO : **Or / Ambre chaleureux** (`#F59E0B`, `#D97706`, `#EA580C`) et surfaces lumineuses et sobres.
    - Suppression intégrale de la preuve sociale (aucune étoile, aucun avatar, aucune mention "10 000 étudiants") comme demandé.
  - **Composants & Sections Intégrées** :
    - `LandingNavbar.tsx` (Navbar fixe avec menu mobile burger).
    - `LandingHero.tsx` (Hero fidèle et mockup d'application).
    - `LandingFeatures.tsx` (4 piliers : import multi-formats, synthèses concises, quiz ciblés, gamification).
    - `LandingHowItWorks.tsx` (3 étapes guidées).
    - `LandingPricing.tsx` (Offres officielles REVIZO en Francs CFA : Découverte 0 F, Essentiel 1 000 F, Intensif 3 000 F, Premium 5 000 F avec FedaPay).
    - `LandingFaq.tsx` (Accordéon interactif).
    - `LandingFooter.tsx` (Pied de page épuré avec rappel de marque).
  - **Parcours d'Entrée & Connexion Application (`App.tsx`)** :
    - Les visiteurs non connectés arrivent naturellement sur la Landing Page.
    - Clic sur `Connexion` ouvre l'écran de connexion (`AuthView`) en mode login.
    - Clic sur `Commencer →` ou `Essayer gratuitement →` ouvre le formulaire d'inscription en mode signup.
    - Bouton `← Retour au site` disponible dans l'authentification pour revenir à la landing page en 1 clic.
  - **Validation & Non-Régression** :
    - Suite de tests unitaires dédiée `src/test/LandingPage.test.ts` (6 tests).
    - **22 suites de tests exécutées avec succès (157 tests réussis sur 157, 100% de succès)**.
    - Compilation TypeScript stricte sans erreur (`tsc -b --noEmit`).
    - Build de production Vite (`tsc -b && vite build`) vérifié et validé sans avertissement bloquant.
- [x] **PHASE INTÉGRATION DU MOCKUP SMARTPHONE REVIZO & CARTES FLOTTANTES ANIMÉES EN BOUCLE** (Terminée et Validée le 2026-09-07)
  - **Smartphone Central iPhone & Tableau de Bord Réaliste** :
    - Châssis iPhone avec Dynamic Island, barre de statut 9:41 (WiFi, batterie), bordures titane douces et écran OLED.
    - Reproduction exacte de l'interface mobile de REVIZO dans l'écran : profil élève "Bonjour Julien 👋 (Niveau 4)", badges réels 🔥 5j, ⚡ 3/3, 💎 24, carte sombre "Objectif du jour" avec barre segmentée or/ambre (4/5), cours "Mathématiques — Fonctions & Dérivées" avec maîtrise à 85% et bouton "Réviser →", raccourcis des matières et barre inférieure officielle à 4 onglets (`Accueil`, `Révision`, `Mes cours`, `Quiz`).
    - Respect absolu de la règle métier : aucune donnée fictive n'a été injectée dans le code applicatif ou la base de données réelle.
  - **4 Cartes Flottantes Périphériques & Flèches Vectorielles Courbées** :
    - Carte Haut-Gauche : *"Réviser 3x plus vite"* (icône ambre).
    - Carte Bas-Gauche : *"Quiz de mémorisation active"* (icône émeraude).
    - Carte Haut-Droite : *"85% de taux de rétention"* (icône indigo).
    - Carte Bas-Droite : *"Motivation & Séries"* (icône orange).
    - 4 flèches courbées dessinées en SVG pointant délicatement vers le smartphone.
  - **Animation Douce Continue en Boucle (Sobre)** :
    - Mouvement de lévitation vertical du smartphone (`@keyframes phoneFloatLoop`) sur 4.5s.
    - Oscillation délicate des cartes et flèches (`@keyframes cardFloatLeft`, `@keyframes cardFloatRight`, `@keyframes arrowFloat`) sans interruption (`infinite alternate ease-in-out`).
    - Adaptation responsive (< 1024px et < 900px) garantissant une lisibilité parfaite sans dépassement.
  - **Validation & Non-Régression** :
    - Suite de tests `LandingPage.test.ts` enrichie et validée.
    - **22 suites de tests réussies (157/157 tests passants, 100%)**.
    - Compilation TypeScript stricte sans erreur (`tsc -b --noEmit`).
    - Build de production Vite (`tsc -b && vite build`) validé avec succès.
- [x] **PHASE LOGO OFFICIEL ORANGE, PWA INSTANTANÉE & MENTIONS LÉGALES DU CRÉATEUR** (Terminée et Validée le 2026-09-07)
  - **Logo & Favicon Orange Unifiés** :
    - Mise à jour du favicon `public/revizo-logo.svg` avec le dégradé orange officiel de la marque (`#EA580C` vers `#F97316`), tracé R blanc et accents or/blanc.
    - Remplacement des icônes génériques de la Navbar et du Footer par le composant `RevizoLogo.tsx` pour une cohérence visuelle absolue à 100% avec le favicon.
    - Génération haute résolution des icônes d'application `revizo-logo-192.png` et `revizo-logo-512.png` pour l'écran d'accueil mobile.
  - **Mentions Légales & Conditions d'Utilisation Personnalisées (Sans fausse entreprise)** :
    - Respect strict de la directive utilisateur : aucune société fictive n'a été inventée.
    - Mention claire du statut de particulier / développeur indépendant (Nasser).
    - Intégration des contacts directs officiels : Téléphone / WhatsApp `+228 92 88 00 10`, Email `nasserpillar4@gmail.com`.
    - Mention transparente des hébergeurs réels de la plateforme : Vercel Inc. (frontend) et Supabase Inc. (base de données et authentification).
    - Création du composant modal interactif `LegalModals.tsx` avec 3 onglets (Mentions légales, Conditions d'utilisation, Confidentialité & Données).
  - **Installation Instantanée PWA au Défilement** :
    - Création de `public/manifest.json` avec nom, thème `#EA580C` et icônes orange.
    - Création et enregistrement du Service Worker `public/sw.js` dans `src/main.tsx`.
    - Composant `PwaInstallButton.tsx` : détection du scroll (dès 150px de défilement) et déclenchement automatique du prompt natif d'installation sur Android/Chrome via `beforeinstallprompt`, ou guidage visuel en 2 étapes pour iPhone/iOS Safari.
  - **Optimisation Responsive de la Barre de Navigation Mobile** :
    - Résolution du débordement sur formats mobiles (< 640px et jusqu'à 320px) : masquage des éléments secondaires dans le bandeau supérieur (`FR` et `Commencer`) et intégration propre dans le menu déroulant.
    - Le bouton **« Connexion »** est désormais parfaitement calé en haut à droite dans un format pilule épuré, accompagné du bouton burger `[ ☰ ]`, sans aucun dépassement ou coupure.
  - **Validation & Non-Régression** :
    - Tests unitaires et E2E : **22 suites de tests, 160 tests réussis sur 160 (100% de succès)**.
    - TypeScript : 0 erreur (`tsc -b --noEmit`).
    - Build de production : `tsc -b && vite build` validé avec succès.
    - Poussé sur Git `origin main` (déploiement automatique Vercel).
- [x] **PHASE CONNEXION DIRECTE PWA/MOBILE, ICÔNE IPHONE HD & HEADER IN-APP RESPONSIVE** (Terminée et Validée le 2026-09-08)
  - **Connexion Directe sur Application Téléchargée / PWA (`App.tsx` & `manifest.json`)** :
    - Détection intelligente de l'environnement applicatif via `isInstalledMobileApp()` : vérifie `display-mode: standalone`, `display-mode: minimal-ui`, `display-mode: fullscreen`, la propriété iOS Safari `(navigator as any).standalone === true`, et les paramètres d'URL d'entrée PWA `?source=pwa` ou `?app`.
    - Lorsqu'un utilisateur non connecté ouvre l'application installée sur son téléphone (Android ou iPhone), l'application **saute automatiquement la landing page** et affiche directement l'écran de connexion (`AuthView`).
    - La Landing Page reste accessible pour les visiteurs sur navigateur web standard.
  - **Icône Opaque Haute Définition pour iPhone (Apple Touch Icon)** :
    - Résolution de la contrainte technique iOS : Safari transforme toute transparence PNG en fond noir sur l'écran d'accueil de l'iPhone.
    - Création et déploiement d'une icône `apple-touch-icon.png` (180x180 px) 100% opaque avec fond dégradé officiel orange REVIZO (`#EA580C` vers `#F97316`), tracé R blanc et étoiles/points dorés.
    - Déclaration explicite dans le `<head>` de `index.html` : `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` et tailles 180x180, garantissant un rendu impeccable sur tous les modèles d'iPhone.
  - **Header In-App Parfaitement Responsive (iPhone & Android)** :
    - Intégration du composant SVG `RevizoLogo` (26px) aux côtés du titre textuel `REVIZO✦` sur mobile et dans la barre latérale desktop (28px).
    - Prise en charge des zones de sécurité iOS : padding supérieur avec `env(safe-area-inset-top)` pour ne jamais être masqué par le Dynamic Island ou l'encoche de l'iPhone.
    - Adaptation responsive de la typographie : dimensionnement fluide par `clamp()` pour `.header-revision-title` et `.btn-header-back` avec troncature élégante `text-overflow: ellipsis` pour empêcher tout chevauchement ou rupture de ligne.
    - Application stricte de la Règle 7 (Navigation officielle) sur mobile (< 640px) : masquage des pilules d'économie d'énergie (diamants et éclairs, déjà présents en grand sur l'Accueil) pour préserver plus de 230px d'espace libre pour les titres d'onglets (`Accueil`, `Mes révisions`, `Mes cours`, `Quiz`), sans collision avec les actions de droite (Recherche, Notifications, Avatar).
  - **Validation & Non-Régression** :
    - 22 suites de tests validées (161 tests avec 100% de réussite).
    - Compilation TypeScript stricte sans erreur (`tsc -b --noEmit`).
    - Build de production Vite (`tsc -b && vite build`) validé avec succès.
    - Vérification visuelle multi-écrans (360px Android, 375px-390px iPhone, 412px, etc.).
- [x] **PHASE AUTHENTIFICATION UNIFIÉE & PERSISTANCE MULTI-APPAREILS (EMAIL & NUMÉRO DE TÉLÉPHONE)** (Terminée et Validée le 2026-09-08)
  - **Stratégie d'Identité & Mapping Déterministe d'Email Virtuel (`SupabaseAuthProvider.ts`)** :
    - Résolution de la contrainte Supabase Auth qui impose une adresse email pour `signInWithPassword` : mise en œuvre d'un mapping déterministe `phone_{chiffres}@auth.revizo.app` pour les comptes créés avec un numéro de téléphone.
    - Gestion robuste et bidirectionnelle des formats d'indicatifs : détection automatique et tentative de secours pour les formats ouest-africains (ex: Togo +228, 8 chiffres locaux vs 11 chiffres internationaux) et français (06... vs +336...).
    - Assainissement strict des emails virtuels côté affichage et domaine via `UserMapper.ts` et `SupabaseAuthProvider.ts` : aucun email virtuel n'est jamais exposé à l'élève dans son profil ou son interface.
  - **Trigger SQL d'Amorçage Résilient & Idempotent (`handle_new_user`)** :
    - Mise à jour de la fonction trigger `public.handle_new_user` sur `auth.users` : pour les comptes créés par téléphone (`is_phone_account = true`), le champ `public.users.email` est positionné à `NULL` (et `phone` est renseigné avec le numéro brut), empêchant toute collision d'unicité d'email.
    - Initialisation idempotente avec clause `ON CONFLICT (id) DO NOTHING` pour `public.users`, `public.user_progress` et `public.user_settings`.
  - **Vérification Sécurisée Préventive & RPC Multi-Formats (`check_identifier_exists`)** :
    - Fonction PostgreSQL `check_identifier_exists` avec privilèges `SECURITY DEFINER` : permet aux visiteurs non connectés de vérifier l'existence de leur compte sans violer les politiques d'isolation RLS.
    - Recherche universelle couvrant à la fois `auth.users` et `public.users` par email direct, chiffres bruts de téléphone, et variations d'indicatifs (+228 / +33).
    - Vérification préventive intégrée dans `SupabaseAuthProvider.signUp` et `AuthView.tsx` : affichage immédiat d'un message bienveillant et clair ("Un compte existe déjà avec ce numéro de téléphone. Connecte-toi directement.") au lieu d'une erreur 500 ou technique.
    - Échappatoire conviviale ajoutée dans `AuthView` : si l'identifiant n'est pas détecté, l'élève peut toujours forcer la saisie directe de son mot de passe en un clic.
  - **Gestion Réactive de l'État de Session & Multi-Onglets (`AuthContext.tsx`)** :
    - Implémentation de `onAuthStateChange` dans `IAuthProvider`, `SupabaseAuthProvider`, `MockAuthProvider` et `AuthService`.
    - Abonnement dans `AuthContext` permettant la synchronisation immédiate de la session utilisateur lors des rafraîchissements automatiques de tokens ou des connexions multi-onglets/multi-appareils.
  - **Suite de Tests E2E Dédiée & Non-Régression Complète** :
    - Création de `PhoneAndEmailAuthE2E.test.ts` (8 étapes automatisées validées à 100%) : inscription téléphone, détection multiformats, connexion locale et internationale, déconnexion/reconnexion, blocage des doublons, flux email complet, et gestion bienveillante des mots de passe erronés.
    - Validation complète : **23 suites de tests réussies, 169/169 tests passants (100%)**.
    - Build de production validé (`tsc -b && vite build`) en 9.66s avec 0 erreur.
- [x] **PHASE PIPELINE PÉDAGOGIQUE ENRICHI V2 — DÉDUPLICATION SÉMANTIQUE & RICHESSE ENGAGEANTE** (Terminée et Validée le 2026-09-09)
  - **Objectif 1 — Déduplication Sémantique Complète (`concepts` & `sourceReferences`)** :
    - Extraction et fusion sémantique en amont : si une même notion apparaît sous des formulations différentes, dans les rappels ou en conclusion, elle ne produit qu'une seule entrée canonique dans la liste des concepts.
    - Conservation absolue de toutes les `sourceReferences` (pages, sections, citations textuelles exactes) pour chaque concept fusionné afin de garantir l'anti-hallucination (Règle 9).
    - Ajout du champ `semanticAliases` listant les variantes de formulation du cours.
  - **Objectif 2 — Richesse et Simplicité de la Fiche de Révision (`RevisionSection`)** :
    - Ajout de sous-titres courts et limpides (`subtitle`), sans jargon académique intimidant.
    - Explication amicale et vulgarisée en premier (`simpleExplanation`) avant toute règle ou formule formelle (`technicalFormulation`).
    - Analogies et exemples concrets de la vie quotidienne (`analogyOrExample`) pour ancrer durablement la notion.
    - Astuces mémo / moyens mnémotechniques pertinents (`mnemonicTip`).
    - Encarts d'alerte bienveillants « ⚠️ Piège fréquent » (`commonMistake`) pour prévenir les confusions classiques.
    - Exhaustivité garantie : chaque notion essentielle et importante est obligatoirement représentée une fois sans exception.
  - **Objectif 3 — Lutte Contre l'Ennui & Rotation Dynamique des Formats de Présentation** :
    - Rupture de la monotonie visuelle grâce à une rotation de 4 formats de présentation : `definition_directe`, `question_reponse`, `mise_en_situation`, et `comparaison_avant_apres`.
    - Composant UI `RevisionView.tsx` et styles CSS modernes (`components.css`) affichant des badges colorés élégants, encarts lumineux (ambre pour les pièges, violet pour les mnémos, bleu pour les analogies, vert pour les explications amicales).
  - **Objectif 4 — Dérivation en Cascade (Anti-Doublon Global)** :
    - Les questions de vérification de compréhension (`comprehensionQuestions`), le quiz QCM (`quizzes`) et les exercices guidés (`exercises`) sont impérativement dérivés des concepts DÉJÀ dédupliqués de la fiche.
    - Rattachement obligatoire de chaque question et exercice à son concept d'origine via `conceptId`, interdisant toute duplication d'angle ou formulation identique entre plusieurs formats.
  - **Objectif 5 — Variété et Catégorisation des Questions** :
    - Diversification pédagogique garantie via `QuestionCategory` : rotation équilibrée entre `rappel_direct`, `application_concrete`, `piege_confusion`, et `mise_en_situation`.
    - Types d'exercices structurés (`ExerciseType`) : `calcul_application`, `analyse_piege`, `resolution_probleme`.
  - **Rétrocompatibilité PDF & Persistance Supabase** :
    - Le contenu textuel `content` de chaque section assemble automatiquement les blocs enrichis (`— Sous-titre`, `💡 En clair`, `📐 Règle`, `🌍 Analogie`, `🧠 Astuce`, `⚠️ Piège`), garantissant que le moteur natif de génération de PDF (`RevisionService.downloadRevisionPDF`) exporte instantanément toutes les richesses sans régression.
    - Les champs structurés sont persistés en base dans les tables Supabase via `RevisionMapper` et `QuizMapper`.
  - **Validation & Non-Régression** :
    - Suite de tests dédiée `src/test/EnrichedPedagogicalPipeline.test.ts` validant les 5 objectifs clés (6 tests).
    - **24 suites de tests réussies, 175 tests sur 175 validés (100% de succès)**.
    - Compilation TypeScript stricte sans erreur (`tsc -b --noEmit`).
    - Build de production Vite (`tsc -b && vite build`) généré avec succès en 7.37s.
- [x] **PHASE SÉCURISATION DU TIER GRATUIT GEMINI, RÉSILIENCE 429 & GARDE-FOU SERVEUR (TESTS SANS FACTURATION)** (Terminée et Validée le 2026-09-09)
  - **Limites Réelles du Tier Gratuit Google AI Studio (`gemini-3.6-flash`)** :
    - RPM (Requêtes par minute) : **5 RPM** (1 requête toutes les 12 secondes).
    - RPD (Requêtes par jour) : **20 RPD** (réinitialisé chaque jour à minuit UTC / heure Pacifique).
    - TPM (Tokens par minute) : **250 000 TPM**.
    - Statut du compte : « Niveau sans frais » (Free of charge tier), strictement sans facturation Google Cloud rattachée (si une limite est dépassée, Google bloque en HTTP 429 sans jamais facturer).
  - **Gestion Robuste des Erreurs de Quota HTTP 429 & Backoff Adapté à 5 RPM (`orchestrate-course`)** :
    - Mécanisme de relance automatique `fetchWithRetry` dans l'Edge Function Supabase :
      - 3 tentatives (initiale + 2 retries).
      - Backoff calibré sur le cycle de renouvellement des slots à 5 RPM (60s / 5 = 12s) : délais de `12s` à `24s` + jitter aléatoire (évite de ré-épuiser le quota à 1s ou 2s).
      - Respect du header standard `Retry-After` s'il est renvoyé par l'API Google.
    - Message bienveillant élève en cas d'indisponibilité persistante après tous les essais : *« Le service est très demandé, réessaie dans quelques instants. »* (aucun code HTTP technique exposé).
  - **Garde-Fou Côté Application (Plafond à 90% du Quota Journalier Réel = 18 RPD)** :
    - Fonction PostgreSQL `check_global_ai_daily_limit(p_safe_limit INT DEFAULT 18)` créée dans Supabase avec privilèges `SECURITY DEFINER`.
    - Plafond de sécurité configuré à 90% de 20 = **18 requêtes/jour**.
    - Comptage automatique et atomique des analyses générées aujourd'hui (`created_at >= CURRENT_DATE`).
    - Blocage préventif propre avant même de solliciter l'API Gemini dès que le seuil de 18 est atteint : message clair pour les élèves/testeurs (*« Le quota d'analyses quotidien pour la phase de test a été atteint (18/20 cours). Les analyses reprendront demain dès minuit. »*).
    - Capacité journalière assurée pour les tests : **18 cours complets par jour**.
  - **Rappel Juridique & Confidentialité des Données (Free Tier vs Paid Tier)** :
    - En Tier Gratuit (Google AI Studio Free Tier), Google utilise les données d'entrée (prompts, cours, PDF, images) et de sortie pour améliorer et entraîner ses modèles d'IA, avec possibles revues humaines anonymisées.
    - En Tier Payant (Google Cloud Pay-as-you-go ou Vertex AI), les données ne sont jamais utilisées pour l'entraînement et restent strictement confidentielles. Idéal pour la conformité RGPD lors du lancement commercial public auprès d'élèves mineurs.
  - **Modèle Économique Réel & Analyse de Marges FedaPay (`gemini-3.6-flash`)** :
    - Grille tarifaire officielle Google AI Studio (au 09/09/2026, en vigueur jusqu'au 31/12/2026) :
      - Input : **0,75 $ / million de tokens**.
      - Output : **3,75 $ / million de tokens** (incluant tokens de raisonnement thinking).
    - Métriques réelles mesurées par cours : 2 149 tokens entrée / 8 359 tokens sortie (Maths: 2099/8167, Histoire: 2165/6757, SVT: 2184/10152).
    - Coût moyen par cours analysé : **0,033 $ USD (20,27 FCFA ou ~0,031 €)**.
    - Échelle de volumes :
      - 100 cours = 3,30 $ (2 027 FCFA | 3,09 €).
      - 1 000 cours = 32,96 $ (20 269 FCFA | 30,90 €).
      - 10 000 cours = 329,57 $ (202 686 FCFA | 308,99 €).
    - Analyse de rentabilité des forfaits FedaPay :
      - *Essentiel (1 000 FCFA)* : Seuil de rentabilité à 48 cours/mois. Usage typique (20 cours) = 570 FCFA de marge nette (+57%). Usage max théorique (90 cours) = -849 FCFA de marge.
      - *Intensif (3 000 FCFA)* : Seuil de rentabilité à 144 cours/mois. Usage typique (60 cours) = 1 709 FCFA de marge nette (+57%). Usage max théorique (300 cours) = -3 156 FCFA de marge.
      - *Premium (5 000 FCFA)* : Seuil de rentabilité à 240 cours/mois. Usage typique (120 cours) = 2 443 FCFA de marge nette (+49%). Usage max théorique (600 cours) = -7 286 FCFA de marge.
- [x] **PHASE BENCHMARK QUALITÉ FLASH-LITE & BASCULEMENT DE PRODUCTION (RENTABILITÉ FORFAITS REVIZO)** (Terminée et Validée le 2026-09-09)
  - **Vérification Officielle des Tarifs & Modèles (`ai.google.dev/pricing`)** :
    - Confirmation par API : le modèle `gemini-2.5-flash-lite` est déprécié par Google pour les nouveaux projets (code HTTP 404, incitant officiellement à basculer sur `gemini-3.5-flash-lite`).
    - Modèle de production déployé : **`gemini-3.5-flash-lite`** (avec replis automatiques `gemini-flash-lite-latest` et `gemini-3.6-flash`).
    - Grille officielle confirmée sur `ai.google.dev/pricing` pour `gemini-3.5-flash-lite` :
      - Input : **0,30 $ / 1M tokens** (au lieu de 0,75 $ pour gemini-3.6-flash).
      - Output : **2,50 $ / 1M tokens** (au lieu de 3,75 $ pour gemini-3.6-flash).
  - **Benchmark Qualitatif Comparatif sur les 3 Cours Réels** :
    - *Mathématiques (Pythagore)* : 1 438 in / 3 994 out = 5 432 tokens en 11.1s. 3 concepts dédupliqués, 3 sections (`definition_directe` -> `mise_en_situation` -> `comparaison_avant_apres`).
    - *Histoire (Première Guerre Mondiale)* : 1 504 in / 6 323 out = 7 827 tokens en 21.9s. 5 concepts dédupliqués, 4 sections (`definition_directe` -> `mise_en_situation` -> `comparaison_avant_apres` -> `question_reponse`).
    - *SVT (Génétique et Hérédité)* : 1 523 in / 5 486 out = 7 009 tokens en 15.5s. 4 concepts dédupliqués, 4 sections (`definition_directe` -> `question_reponse` -> `mise_en_situation` -> `comparaison_avant_apres`).
    - Évaluation qualitative sur les 4 critères d'excellence :
      1. *Absence de doublons* : 100% respectée (concepts fusionnés, zéro redondance entre sections, flashcards et QCM).
      2. *Rotation des formats* : 100% respectée (0 consécution identique, rotation fluide des 4 formats).
      3. *Pertinence des analogies* : Excellente et parlante pour le public scolaire (diagonale d'une pièce, hachoir géant pour Verdun, bibliothèque et 46 tomes d'encyclopédie, modèle de voiture vs peinture pour gène vs allèle).
      4. *Pertinence des pièges* : Pièges réels d'examen identifiés avec précision (racine carrée finale en maths, rôle méconnu de l'arrière en histoire, non-disparition des allèles récessifs en SVT).
    - Vitesse de génération : **16.2s en moyenne** (plus de 2× plus rapide que gemini-3.6-flash à 35-40s).
  - **Mesure des Coûts Réels & Rentabilité Économique** :
    - Moyenne mesurée par cours : **1 488 tokens d'entrée / 5 268 tokens de sortie**.
    - Coût unitaire réel moyen : **0,01362 $ USD = 8,38 FCFA (0,0128 €)**.
    - Économie immédiate : **-58,7% par rapport à gemini-3.6-flash** (coût unitaire divisé par 2,42).
    - Marges réelles FedaPay confirmées avec les nouveaux quotas :
      - *Essentiel (1 000 FCFA / mois, quota 4 cours/j = 120 max)* : usage réaliste (20 cours) = **+802 FCFA (+80,2% de marge)** ; cas de saturation théorique (120 cours) = -35 FCFA (quasiment à l'équilibre).
      - *Pro (3 000 FCFA / mois, quota 10 cours/j = 300 max)* : usage réaliste (60 cours) = **+2 407 FCFA (+80,2% de marge)** ; cas de saturation théorique (300 cours) = **+396 FCFA (+13,2% de marge bénéficiaire même au pire cas !)**.
      - *Premium (5 000 FCFA / mois, quota 20 cours/j = 600 max)* : usage réaliste (120 cours) = **+3 845 FCFA (+76,9% de marge)**.
  - **Basculement en Production Effectué** :
    - Edge Function `orchestrate-course` mise à jour avec `candidateModels = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.6-flash"]`.
    - Suppression de `thinkingConfig` pour le modèle Flash-Lite (élimination des `MALFORMED_RESPONSE`).
    - Déploiement réussi sur Supabase : **Version 8 active (`ACTIVE`)**.
    - Appel live de validation en production exécuté avec succès (status 200, `modelUsed: "gemini-3.5-flash-lite"`).

- [x] **PHASE VÉRIFICATION FACTURATION, CORRECTION MARGE PREMIUM, TEST DOCUMENTS LONGS & LIMITE D'ESSAI GRATUIT** (Terminée et Validée le 2026-09-09)
  - **Tâche 1 — Diagnostic Facturation Google Cloud & Quotas Actifs** :
    - *Facturation Google Cloud* : **NON ACTIVÉE**. Test de charge direct sur l'API Gemini : dès la 8e requête simultanée, l'API renvoie une erreur `HTTP 429: You exceeded your current quota, please check your plan and billing details`. Le projet fonctionne toujours sur le **Tier Gratuit Google AI Studio (Free Tier)**.
    - *Quotas actifs confirmés* :
      - `gemini-3.6-flash` : 5 RPM, 20 RPD, 250 000 TPM.
      - `gemini-3.5-flash-lite` : 15 RPM, 1 500 RPD, 1 000 000 TPM (protégé préventivement par le garde-fou applicatif REVIZO fixé à 18 cours/jour tant que la facturation n'est pas activée).
    - *Directive stricte* : aucun test multi-utilisateurs massif avant l'activation effective de la carte/facturation sur Google Cloud.
  - **Tâche 2 — Correction Mathématique de la Marge sur le Forfait Premium** :
    - *Problème résolu* : à 20 générations/jour (600/mois), avec des frais FedaPay de 3% (150 FCFA) et un coût réel de 8,38 FCFA/cours, le forfait Premium accusait une perte nette de -178 FCFA ($4\,850 - 5\,028$).
    - *Ajustement du quota officiel* : quota Premium ramené de 20 à **18 générations/jour** (soit 540 cours/mois max).
    - *Calcul de la nouvelle marge* :
      - Revenu net perçu : $5\,000 - 150 = 4\,850\text{ FCFA}$.
      - Coût IA max à saturation complète (540 cours) : $540 \times 8,38 = 4\,525,2\text{ FCFA}$.
      - **Marge nette à saturation complète** : $\mathbf{+324,8\text{ FCFA}}$ (**+6,5% de bénéfice net garanti** même si l'élève consomme 100% de son quota chaque jour du mois).
      - **Marge nette en usage réel élevé (120 cours/mois)** : $4\,850 - 1\,005,6 = \mathbf{+3\,844,4\text{ FCFA}}$ (**+76,9% de marge nette**).
    - *Alignement code source* : `SUBSCRIPTION_PLANS.premium.dailyRevisionLimit = 18`, `features[0] = '18 révisions intelligentes par jour'`, `MockDataProvider`, et `record_revision_usage` SQL.
  - **Tâche 3 — Benchmark sur Documents Longs & Limite Garantie à 100%** :
    - *Résultats expérimentaux réels avec `gemini-3.5-flash-lite`* :
      1. **~10 pages** (3 112 mots / 20.9 Ko) : 5 508 in / 6 445 out (11 953 total), 18.8s, finishReason: 'STOP', JSON 100% valide, 10 concepts dédupliqués.
      2. **~20 pages** (6 213 mots / 41.8 Ko) : 10 579 in / 8 310 out (18 889 total), 24.2s, finishReason: 'STOP', JSON 100% valide, 20 concepts dédupliqués.
      3. **~30 pages** (9 305 mots / 62.7 Ko) : 15 654 in / 11 253 out (26 907 total), 32.7s, finishReason: 'STOP', JSON 100% valide, 22 concepts (38 964 caractères générés).
    - *Limite maximale garantie à 100% pour un appel unique* : **20 pages**. Au-delà de 20 pages, le risque de latence excessive (> 35-40s) et de timeout réseau augmente, et la densité pédagogique commence à s'étaler.
    - *Garde-fou d'import implémenté* :
      - Détection de pagination instantanée côté frontend via `getPdfPageCount(file)` dans `src/utils/documentUtils.ts`.
      - Si `pageCount > 20` : blocage préventif avec affichage bienveillant : *"Ce cours fait X pages et dépasse la limite de 20 pages par révision. Découpe-le en chapitres pour garantir une révision complète, ultra-précise et sans omission."*
      - Sécurisation côté serveur dans l'Edge Function (`status: 422`, `tooManyPages: true`).
  - **Tâche 4 — Règle Stricte d'Essai Gratuit (1 Seul Import à Vie pour Non-Abonnés)** :
    - *Règle produit* : Un utilisateur sans abonnement payant actif a droit à exactement **1 import gratuit à vie**.
    - *Blocage au 2e import* :
      - Contrôle serveur strict dans `record_revision_usage` : si `v_courses_count >= 1` et aucun forfait payant actif, retour immédiat de `trialExhausted = TRUE` et HTTP 403. Impossible de contourner en rechargeant ou en appelant l'API.
      - Contrôle d'interface dans `RevisionView.tsx` : si `hasExhaustedFreeTrial`, le clic sur import PDF ou photo bloque l'import et redirige directement vers l'écran des forfaits (`SubscriptionView` avec Essentiel 1 000 F, Pro 3 000 F, Premium 5 000 F et paiement FedaPay).
      - Dans `ImportProcessingModal.tsx` : affichage du titre *"Essai gratuit terminé"* avec bouton *"Choisir un forfait"* déclenchant le choix du forfait.
    - *Immunité des abonnés payants* : tout utilisateur disposant d'un abonnement actif (`essentiel`, `intensif`/`pro`, `premium`) n'est jamais bloqué par l'essai gratuit. Seul son quota quotidien officiel s'applique (Essentiel: 4/j, Pro: 10/j, Premium: 18/j).
  - **Validation & Non-Régression** :
    - Edge Function Supabase `orchestrate-course` déployée en **Version 9 active (`ACTIVE`)**.
    - Tests réels d'API sur compte non abonné (HTTP 403 bloquant avec message d'essai gratuit) et compte abonné (HTTP 200 avec quota 18/j).
    - 25 suites de tests unitaires et d'intégration réussies (48/48 tests de monétisation et utilitaires validés à 100%).
    - Build de production `tsc -b && vite build` validé avec succès en 13.31s.

- [x] **PHASE VÉRIFICATION ET CORRECTION COMPLÈTE DES QUOTAS PAR FORFAIT** (Terminée et Validée le 2026-09-09)
  - **Tâche 1 — Quota Forfait Essentiel (4 révisions / jour)** :
    - *Implémentation* : Limite de 4 générations par jour confirmée et active dans la fonction PostgreSQL `record_revision_usage` et `MockDataProvider`.
    - *Comportement au dépassement* : Au 5e import le même jour, blocage strict (`allowed: false`, `limit: 4`, `used: 4`, `canUpgrade: true`, `upgradeTarget: 'pro_or_premium'`).
    - *Message affiché* : *"Tu as atteint ta limite de 4 révisions du jour. Ton compteur sera réinitialisé demain à minuit UTC. Passe à Pro (10/j) ou Premium (18/j) pour réviser davantage dès maintenant !"*.
    - *Proposition d'upgrade* : Bouton principal *"Passer à Pro ou Premium"* redirigeant vers l'écran d'abonnement + bouton *"Fermer"*.
    - *Preuve réelle en production* : Test réel Supabase validé avec 4 imports acceptés (`used: 1..4, allowed: true`), 5e import bloqué (`used: 4, allowed: false`).
  - **Tâche 2 — Quota Forfait Pro (10 révisions / jour)** :
    - *Implémentation* : Limite de 10 générations par jour (`plan: 'intensif'`) active en base de données et côté frontend.
    - *Comportement au dépassement* : Au 11e import le même jour, blocage strict (`allowed: false`, `limit: 10`, `used: 10`, `canUpgrade: true`, `upgradeTarget: 'premium'`).
    - *Message affiché* : *"Tu as atteint ta limite de 10 révisions du jour. Ton compteur sera réinitialisé demain à minuit UTC. Passe à Premium pour réviser jusqu’à 18 cours par jour !"*.
    - *Proposition d'upgrade ciblée* : Bouton principal *"Passer à Premium"* (aucune rétrogradation vers Essentiel proposée) + bouton *"Fermer"*.
    - *Preuve réelle en production* : Test réel Supabase validé avec 10 imports acceptés (`used: 1..10, allowed: true`), 11e import bloqué (`used: 10, allowed: false`).
  - **Tâche 3 — Quota & Comportement Spécifique Premium (18 révisions / jour)** :
    - *Règle critique* : Premium est le palier le plus élevé (sommet de gamme). Au dépassement de quota (19e import), le système **ne doit jamais proposer de mise à niveau ni d'écran de paywall**.
    - *Implémentation* :
      - Backend PostgreSQL : `canUpgrade: false`, `upgradeTarget: null`.
      - Edge Function `orchestrate-course` : propage `canUpgrade: false`, `upgradeTarget: null`.
      - Frontend modal (`ImportProcessingModal.tsx`) : Détecte l'abonné Premium et affiche **uniquement** le bouton neutre *"J'ai compris"* qui ferme le modal. Zéro bouton d'upgrade, zéro paywall.
    - *Message épuré affiché* : *"Tu as utilisé tes 18 révisions du jour. Reviens demain pour continuer à réviser !"*.
    - *Preuve réelle en production* : Test réel Supabase validé avec 18 imports acceptés (`used: 1..18, allowed: true`), 19e import bloqué (`used: 18, allowed: false, canUpgrade: false, upgradeTarget: null`).
  - **Tâche 4 — Preuve Technique de Réinitialisation Quotidienne à Minuit UTC** :
    - *Paliers payants (Essentiel, Pro, Premium)* : Le compteur `daily_revision_used` est automatiquement réinitialisé à 0 à minuit UTC grâce à la condition PostgreSQL `IF v_energy.revision_counter_date < CURRENT_DATE THEN v_used := 0; END IF;` (l'instance Supabase étant synchronisée sur l'horloge UTC).
    - *Preuve technique réelle testée* : Un utilisateur Premium ayant consommé ses 18 révisions avec `revision_counter_date` à la veille voit son premier appel du lendemain réinitialiser son compteur : `used: 1, remaining: 17, allowed: true`.
    - *Essai Gratuit (ne se réinitialise JAMAIS à vie)* : L'éligibilité à l'essai gratuit dépend du comptage persistant des cours créés en base (`SELECT COUNT(*) FROM courses WHERE user_id = p_user_id`). Les cours n'étant jamais supprimés, `courses_count >= 1` reste vrai à perpétuité. Preuve technique testée : le lendemain, l'utilisateur gratuit reste strictement bloqué (`allowed: false, trialExhausted: true`).
  - **Validation & Non-Régression** :
    - Edge Function Supabase `orchestrate-course` déployée en **Version 10 active (`ACTIVE`)**.
    - Migration PostgreSQL appliquée avec succès sur Supabase.
    - 181/181 tests unitaires et d'intégration Vitest validés à 100% sans aucune régression.
    - Build de production `tsc -b && vite build` validé avec succès en 18.31s.

- [x] **PHASE ALIGNEMENT OFFRE LANDING PAGE, PURGE CB, SUPPRESSION ÉNERGIE MAX, ÉTANCHÉITÉ ÉNERGIE QUIZ & PARRAINAGE DEUX PALIERS** (Terminée et Validée le 2026-09-09)
  - **Tâche 1 — Alignement Landing Page sur la Vraie Offre App & Source Unique de Vérité** :
    - *Création de la source de vérité unique* : `src/config/subscriptionPlans.ts` centralise désormais la définition officielle des 4 formules (`SUBSCRIPTION_PLANS` et `ORDERED_PLANS`) consommée à la fois par `SubscriptionView.tsx` (in-app), `LandingPricing.tsx` (public), `LandingFaq.tsx` et les tests d'intégration.
    - *Harmonisation stricte des forfaits et quotas journaliers* :
      1. **Essai Gratuit** : 0 FCFA à vie, 1 seul cours gratuit à vie (aucune mention de 2 cours ni de renouvellement mensuel).
      2. **Essentiel** : 1 000 FCFA/mois, 4 révisions/jour (et non "10/mois"), 10 diamants offerts.
      3. **Intensif (Pro)** : 3 000 FCFA/mois, 10 révisions/jour (et non "illimité"), 30 diamants offerts.
      4. **Premium** : 5 000 FCFA/mois, 18 révisions/jour (quota explicite), 60 diamants offerts.
    - *Mise en page de la Landing Page* : 1 bandeau Essai Gratuit dédié (`landing-free-trial-banner`) + 1 grille de 3 cartes payantes (`landing-pricing-card` pour Essentiel, Intensif, Premium) au lieu de 4 cartes distinctes.
    - *Résultat* : Aucune désynchronisation possible entre la landing page et l'application in-app.
  - **Tâche 2 — Suppression Totale des Mentions Carte Bancaire & Mobile Money Exclusif** :
    - *Règle respectée* : Retrait de toute référence à la carte bancaire ou aux banques, sans justification superflue.
    - *Formulation officielle adoptée* : *"Tarifs simples en Francs CFA, payables facilement par Mobile Money (MTN, Moov, Orange, Wave)."*
    - *Fichiers assainis* : `LandingPricing.tsx`, `LandingFaq.tsx`, `SubscriptionView.tsx`.
  - **Tâche 3 — Retrait de la Ligne "X ⚡ d'énergie max" des Cartes Payantes** :
    - Suppression complète de la ligne "10/20/30 ⚡ d'énergie max" des 3 cartes d'abonnement in-app (`SubscriptionView.tsx`).
    - Seuls les avantages réels sont conservés : révisions par jour, diamants offerts à l'inscription, accès illimité aux fiches, quiz renforcés, traitement IA prioritaire.
  - **Tâche 4 — Suppression de la Récupération Gratuite d'Énergie sur Erreur Quiz & Sécurisation de la Jauge** :
    - *Diagnostic et cause racine* : Déconnexion historique entre `user_progress.energy_balance` et la table `user_energy` lors des erreurs de quiz, combinée à des fallbacks d'UI laxistes (`energy ?? 10`). L'élève voyait son énergie revenir à 3 ou 10 lors des rafraîchissements ou du passage à la révision ciblée.
    - *Corrections apportées* :
      1. `submitQuizAnswer` appelle désormais directement la RPC `consume_energy` pour décrémenter atomiquement `user_energy.current_energy` et `user_progress.energy_balance`.
      2. Remplacement systématique de tous les fallbacks fallacieux (`?? 10`) par `?? 0` dans `QuizView.tsx`, `QuizPlayerModal.tsx`, `AppShell.tsx`, `DiamondsView.tsx`, `ProfileView.tsx`.
      3. Rafraîchissement synchrone de `user_progress` et `user_economy` dès qu'une erreur de quiz est enregistrée.
      4. Maintien intact de la remédiation pédagogique (proposer de revoir la notion faible) sans AUCUN crédit d'énergie gratuit.
      5. Seules recharges valides dans REVIZO : réinitialisation quotidienne (3 ⚡) OU conversion de diamants (5 💎 = 1 ⚡ via `convert_diamonds_to_energy`).
  - **Tâche 5 — Système de Parrainage Complet à Deux Paliers par Code** :
    - *Règles métier implémentées* :
      1. Chaque élève possède un code de parrainage unique (`referral_code` format `REV-XXXXXX`) visible et partageable depuis son profil (`ReferralView.tsx`).
      2. **Palier 1 (Inscription)** : Quand le nouvel utilisateur B s'inscrit avec le code de A :
         - A reçoit immédiatement **+5 diamants**.
         - B reçoit immédiatement **+5 diamants**.
         - Crédité une seule et unique fois par code utilisé, au moment de l'inscription.
      3. **Palier 2 (Premier abonnement payant)** : Quand B souscrit son premier forfait (Essentiel, Intensif ou Premium) :
         - A reçoit immédiatement un bonus supplémentaire de **+10 diamants**.
         - B reçoit ses diamants d'inscription réguliers liés au forfait choisi (10, 30 ou 60 💎).
      4. **Anti-fraude absolue** :
         - Auto-parrainage formellement interdit (`referrer_id = referee_id` rejeté).
         - Un même compte filleul B ne peut utiliser qu'un seul code, une seule fois à vie (`referred_by_user_id IS NOT NULL` rejeté).
      5. **Interface utilisateur** :
         - Champ *"Code d'invitation d'un ami (facultatif)"* intégré dans le formulaire d'inscription (`AuthView.tsx`).
         - Vue dédiée *"Inviter un ami"* (`ReferralView.tsx`) détaillant les deux paliers (5 💎 à l'inscription + 10 💎 au 1er abonnement) avec bouton de partage natif/copie de lien.
    - *Architecture Backend & Base de données* :
      - Migration SQL `20260909000010_revizo_referral_signup_bonus.sql` déployée sur Supabase.
      - Fonction PostgreSQL `apply_referral_code` sécurisée avec transactions atomiques et idempotence (`claim_reward`).
      - Déclencheur automatique de parrainage intégré dans `SupabaseAuthProvider.signUp` et `MockDataProvider.applyReferralCode`.
  - **Validation & Non-Régression** :
    - Test réel de bout en bout exécuté sur le projet Supabase de production avec de vrais comptes :
      - Création Parrain A (`REV-L4TAPN`, 10 💎 initiaux).
      - Inscription Filleul B avec code A -> Palier 1 validé : A = 15 💎 (+5 💎), B = 15 💎 (+5 💎).
      - Tentative d'auto-parrainage / réutilisation -> Rejetée proprement.
      - Abonnement Essentiel activé par B -> Palier 2 validé : A = 25 💎 (+10 💎).
      - Erreur quiz provoquée -> Énergie décrémentée de 3 à 2 ⚡.
      - Consultation de la notion faible -> Énergie reste strictement à 2 ⚡ (zéro fuite).
      - Achat de recharge (5 💎 = 1 ⚡) -> Énergie restaurée à 3 ⚡, solde diamant débité à 20 💎.
    - Test d'isolation RLS multi-tenant `supabaseE2EPersistence.test.ts` : 8/8 tests passés (100% succès).
    - Suite COMPLÈTE `npm test` : 25/25 fichiers de test passés, **181 tests passés sur 181 (100% de succès)**.
    - Build de production `tsc -b && vite build` validé avec succès en 8.54s.

---

## 🔒 RÈGLE IMPÉRATIVE DE SÉCURITÉ : GESTION DES SECRETS & CLÉS D'API
- **Interdiction formelle et absolue d'écrire une clé d'API en dur dans le code, les tests unitaires ou les scripts de scratch / expérimentation, même de façon temporaire.**
- Tout script exécutable (outil de diagnostic, script de test, runner d'audit ou de benchmark) doit obligatoirement lire ses clés dynamiquement depuis les variables d'environnement (`process.env`) ou par chargement sécurisé depuis `.env.local`.
- `.env.local` est le seul réceptacle des valeurs locales, strictement ignoré par Git (`.gitignore`).
- Les clés de production restent exclusivement confinées aux environnements sécurisés de Supabase Edge Functions et Vercel.

