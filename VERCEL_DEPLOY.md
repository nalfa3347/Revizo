# Guide de Déploiement Vercel & Portabilité REVIZO 2.0

Ce document explique comment déployer REVIZO sur **Vercel**, synchroniser automatiquement les variables d'environnement depuis `.env.local`, et comment cloner/modifier le projet depuis **n'importe quel autre ordinateur** en toute sécurité.

---

## 1. Statut Actuel du Dépôt GitHub

* **Dépôt distant** : `https://github.com/nalfa3347/Revizo`
* **Branche** : `main`
* **Code source** : 100% poussé (116 fichiers + `vercel.json` + suite de tests).
* **Sécurité** : `.env.local` est **strictement ignoré** par Git. Aucune clé secrète n'est exposée sur GitHub.

---

## 2. Déploiement sur Vercel (Recommandé : via le Dashboard Vercel)

La méthode la plus simple et la plus robuste pour que Vercel mette à jour l'application à chaque push GitHub :

### Étape 1 — Importer le projet sur Vercel
1. Rendez-vous sur [https://vercel.com/new](https://vercel.com/new) et connectez-vous avec votre compte GitHub **nalfa3347**.
2. Dans la liste **"Import Git Repository"**, trouvez le dépôt **Revizo** et cliquez sur **Import**.
3. Laissez le framework sur **Vite** (détecté automatiquement grâce à `vercel.json`).

### Étape 2 — Configurer les Variables d'Environnement
Dans la section **"Environment Variables"** sur Vercel, ajoutez les variables suivantes présentes dans votre `.env.local` :

| Nom de la variable | Rôle | Environnements |
|---|---|---|
| `VITE_DATA_PROVIDER` | `supabase` | Production, Preview, Development |
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète d'administration Supabase | Production, Preview, Development |
| `GEMINI_API_KEY` | Clé API Google Gemini AI | Production, Preview, Development |

> 💡 **Astuce** : Vous pouvez ouvrir `.env.local` sur votre machine, copier le contenu entier et le coller directement dans le premier champ de formulaire de Vercel. Vercel découpe et remplit automatiquement toutes les clés/valeurs en un clic !

### Étape 3 — Déployer
1. Cliquez sur **Deploy**.
2. Vercel compile l'application (`tsc -b && vite build`) et vous fournit une URL de production sécurisée (ex: `https://revizo-xxx.vercel.app`).

---

## 3. Alternative : Déploiement et Synchronisation Automatique via CLI

Si vous préférez synchroniser les clés directement depuis votre terminal actuel :

1. Connectez votre compte Vercel dans le terminal :
   ```bash
   npx vercel login
   ```
2. Liez le projet local au projet Vercel :
   ```bash
   npx vercel link
   ```
3. Exécutez le script automatique de synchronisation des clés :
   ```bash
   npm run sync:vercel
   ```
   *Ce script lit votre fichier `.env.local` et envoie chaque variable vers Vercel (Production, Preview, Dev) sans jamais afficher vos clés secrètes.*
4. Déployez en production :
   ```bash
   npx vercel --prod
   ```

---

## 4. Travailler sur un Autre Ordinateur

Une fois le code sur GitHub et les variables sur Vercel, vous pouvez **supprimer le dossier local de votre ordinateur actuel sans rien perdre**.

Pour reprendre le projet sur n'importe quel autre ordinateur :

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/nalfa3347/Revizo.git
   cd Revizo
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Récupérer les variables d'environnement** :
   - *Option A (Automatique avec Vercel CLI)* :
     ```bash
     npx vercel login
     npx vercel link
     npx vercel env pull .env.local
     ```
     *(Vercel téléchargera automatiquement votre fichier `.env.local` complet avec toutes vos clés !)*
   - *Option B (Manuelle)* :
     Copiez `.env.example` en `.env.local` et collez vos clés :
     ```bash
     cp .env.example .env.local
     ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

5. **Déployer de nouvelles modifications** :
   Dès que vous faites `git commit` et `git push origin main`, Vercel redéploie automatiquement la nouvelle version en ligne !
