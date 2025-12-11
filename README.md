# Coffee Game

Fullstack app (FastAPI + React) to record daily coffee-game sessions.

How to run locally (if you have node & python):
- Build frontend: cd frontend && npm install && npm run build
- Backend: python -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
- Run: cd backend && uvicorn app.main:app --reload

Deployment: repo ready for Render using Dockerfile at project root.
