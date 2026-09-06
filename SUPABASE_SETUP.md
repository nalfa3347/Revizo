# REVIZO 2.0 — Guide de Déploiement et Configuration Supabase

Ce guide détaille l'architecture, le schéma relationnel, les politiques de sécurité (RLS), la gestion du stockage et la procédure de bascule pour connecter votre projet Supabase réel à REVIZO.

> ⚠️ **Sécurité & Confidentialité** :  
> Aucun secret ou clé d'API ne doit être committé dans le dépôt de code.  
> L'application conserve un mode `mock` par défaut garantissant une exécution locale sans backend distant.

---

## 1. Architecture Globale

REVIZO applique un modèle architectural rigoureusement découplé en couches :

```
┌────────────────────────────────────────────────────────┐
│               Composants React (UI)                   │
│   (Accueil, Révision, Mes cours, Quiz, Profil, etc.)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Services Métier                       │
│ (CourseService, RevisionService, QuizService, etc.)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           Contrats & Interfaces Abstraites             │
│            IDataProvider / IAuthProvider               │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
   (Mode local par défaut)        (Mode distant activable)
              │                            │
┌─────────────▼──────────────┐ ┌───────────▼─────────────┐
│      MockDataProvider      │ │   SupabaseDataProvider │
│      MockAuthProvider      │ │   SupabaseAuthProvider │
└────────────────────────────┘ └───────────┬─────────────┘
                                           │
                               ┌───────────▼─────────────┐
                               │       Repositories      │
                               │ (CourseRepo, QuizRepo...)│
                               └───────────┬─────────────┘
                                           │
                               ┌───────────▼─────────────┐
                               │         Mappers         │
                               │   (Domain <-> Postgres) │
                               └───────────┬─────────────┘
                                           │
                               ┌───────────▼─────────────┐
                               │   Supabase Client JS    │
                               │  (PostgreSQL, Auth, RLS)│
                               └─────────────────────────┘
```

**Points clés de l'architecture :**
- Les composants React interagissent uniquement via `useData()` et `useAuth()`.
- Aucun composant d'interface n'importe directement le client Supabase ni ne dépend de la structure SQL.
- La fabrique `providerFactory.ts` sélectionne automatiquement le provider approprié selon les variables d'environnement, avec un repli automatique et sécurisé sur le `MockDataProvider` si les identifiants Supabase sont absents.

---

## 2. Inventaire des Tables et Relations

Le schéma de données est versionné dans `supabase/migrations/20260905000001_revizo_core_schema.sql` et comprend 12 tables :

| Table | Clé Primaire | Clés Étrangères | Description |
| :--- | :--- | :--- | :--- |
| **`users`** | `id` (UUID) | `auth.users(id)` ON DELETE CASCADE | Profil élève (nom, classe, avatar, dates). |
| **`courses`** | `id` (TEXT) | `user_id` -> `auth.users(id)` | Cours importé, matière, résumé, progression, statut. |
| **`course_files`** | `id` (TEXT) | `course_id`, `user_id` | Fichiers sources (PDF/images) déposés dans Storage. |
| **`analyses`** | `id` (TEXT) | `course_id`, `user_id` | Résultat d'analyse pédagogique structuré (JSONB). |
| **`concepts`** | `id` (TEXT) | `course_id`, `analysis_id`, `user_id` | Notions extraites du cours, importance, score de maîtrise. |
| **`revisions`** | `id` (TEXT) | `course_id`, `analysis_id`, `user_id` | Fiche synthétique découpée en sections (JSONB). |
| **`quizzes`** | `id` (TEXT) | `course_id`, `revision_id`, `user_id` | Évaluation de compréhension liée à la révision. |
| **`quiz_questions`** | `id` (TEXT) | `quiz_id`, `concept_id` | Questions QCM ciblées par notion. |
| **`quiz_results`** | `id` (TEXT) | `user_id`, `quiz_id`, `course_id` | Historique de session, score, XP gagné, détail réponses. |
| **`user_progress`** | `user_id` (UUID) | `auth.users(id)` ON DELETE CASCADE | Gamification (XP, niveau, streak, énergies, diamants). |
| **`notifications`** | `id` (TEXT) | `user_id` -> `auth.users(id)` | Alertes révision, rappels, récompenses. |
| **`user_settings`** | `user_id` (UUID) | `auth.users(id)` ON DELETE CASCADE | Préférences de l'élève (animations, notifications). |

---

## 3. Sécurité et Row Level Security (RLS)

Les politiques RLS sont définies dans `supabase/migrations/20260905000002_revizo_rls_policies.sql`.

### Règles d'isolation stricte :
1. **Activation systématique** : `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` sur chacune des 12 tables.
2. **Isolation par `auth.uid()`** :
   - `SELECT` : Un utilisateur ne peut lire que les lignes où `user_id = auth.uid()` (ou `id = auth.uid()` pour `users`).
   - `INSERT` : Toute nouvelle ligne doit porter `user_id = auth.uid()`.
   - `UPDATE` : Modification restreinte à ses propres enregistrements (`USING` et `WITH CHECK`).
   - `DELETE` : Suppression restreinte à ses propres enregistrements.
3. **Cas particulier de `quiz_questions`** :
   - Les questions sont protégées par appartenance au quiz de l'utilisateur :  
     `quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())`.

---

## 4. Supabase Storage & Téléchargement Local

La configuration des compartiments de stockage est dans `supabase/migrations/20260905000003_revizo_storage_buckets.sql`.

### Buckets configurés :
1. **`source-documents`** (Privé, 50 Mo max) :
   - Fichiers sources importés par l'élève (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
   - Arborescence obligatoire : `{user_id}/{course_id}/{nom_fichier}`.
2. **`processed-assets`** (Privé, 20 Mo max) :
   - Artefacts générés par le pipeline backend (vignettes, schémas vectoriels).
   - Arborescence obligatoire : `{user_id}/{course_id}/{nom_fichier}`.

### ⚠️ Règle du Téléchargement Local de Révision :
Le produit REVIZO garantit à l'élève la possibilité de télécharger sa fiche de révision directement sur son appareil mobile ou ordinateur.  
**Supabase Storage ne remplace pas cette fonctionnalité** : le bouton « Télécharger la fiche » dans l'interface déclenche toujours la sauvegarde locale immédiate côté client.

---

## 5. Authentification (Auth)

L'abstraction `IAuthProvider` supporte de manière transparente les deux méthodes d'authentification :
- **Email + mot de passe**
- **Téléphone + mot de passe** (avec indicatif international `+33...`)

Dans le futur `SupabaseAuthProvider` :
- `signUp` crée le compte dans `auth.users`, puis initialise automatiquement le profil dans `public.users`, la progression dans `public.user_progress` et les préférences dans `public.user_settings`.
- `signIn` restaure la session et charge le profil synchronisé.
- `onAuthStateChange` écoute les changements de session en temps réel.

---

## 6. Variables d'Environnement

Un fichier modèle `.env.example` est fourni à la racine :

```env
# Choix du fournisseur : 'mock' (défaut) | 'supabase'
VITE_DATA_PROVIDER=mock

# Coordonnées Supabase (requises si VITE_DATA_PROVIDER=supabase)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
```

**Règles de configuration :**
- Ne mettez jamais la clé `service_role` dans le frontend. Seule la clé `anon` publique est autorisée côté client.
- `.env` et `.env.local` sont exclus du versionnement Git par le fichier `.gitignore`.

---

## 7. Procédure de Remplacement Mock → Supabase Réel

Lorsque vous déciderez de connecter votre projet distant :

### Étape 1 : Créer le projet Supabase
1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un projet.
2. Notez votre **Project URL** et votre **Anon Key** (disponibles dans Project Settings > API).

### Étape 2 : Appliquer les migrations SQL dans l'ordre
Dans le **SQL Editor** du tableau de bord Supabase (ou via la CLI Supabase `supabase db push`) :
1. Exécutez `supabase/migrations/20260905000001_revizo_core_schema.sql`
2. Exécutez `supabase/migrations/20260905000002_revizo_rls_policies.sql`
3. Exécutez `supabase/migrations/20260905000003_revizo_storage_buckets.sql`

### Étape 3 : Configurer l'environnement local
1. Créez un fichier `.env.local` à la racine de `c:\REVIZO 2.0` :
   ```env
   VITE_DATA_PROVIDER=supabase
   VITE_SUPABASE_URL=https://votre-id-de-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_reelle
   ```
2. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

### Étape 4 : Vérification
- L'application détecte automatiquement `VITE_DATA_PROVIDER=supabase` et instancie `SupabaseDataProvider` et `SupabaseAuthProvider`.
- Toutes les pages (Accueil, Révision, Mes cours, Quiz, Profil, etc.) continuent de fonctionner sans modifier une seule ligne de code des composants React.
- Si vous souhaitez revenir en mode local autonome à tout moment, il vous suffit de repasser `VITE_DATA_PROVIDER=mock`.
