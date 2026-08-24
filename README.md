# Coffee Game

Fullstack app (FastAPI + React) to record daily coffee-game sessions.

## 🧪 Exécution locale (avec Node + Python)

- Build frontend :
  ```bash
  cd frontend && npm install && npm run build
  ```
- Backend :
  ```bash
  python -m venv .venv
  .venv/bin/pip install -r backend/requirements.txt
  ```
- Lancer le serveur :
  ```bash
  cd backend && uvicorn app.main:app --reload
  ```

## 🚀 Déploiement sur Render

Ce dépôt contient un `Dockerfile` prêt pour Render.

1. Connectez votre dépôt GitHub à Render.
2. Créez un **Web Service** et choisissez le build via **Docker**.
3. Render va construire l'image en utilisant `Dockerfile` et exposer l'application sur le port **8000**.

4. Dans les variables d'environnement Render, renseignez `DATABASE_URL` avec
  l'URL de connexion PostgreSQL de Supabase. Ne remplacez pas cette variable
  par l'URL SQLite locale `sqlite:///./coffee_game.db`.

> Si vous n'avez pas Node en local (comme c'est mon cas), Render fera la compilation frontend pour vous.
