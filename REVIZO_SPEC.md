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
