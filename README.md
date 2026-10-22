# GramConnect AI

AI-powered voice governance platform for Gram Panchayats — citizen database, AI-driven complaint triage, outbound AI calling campaigns, an inbound AI voice assistant, government scheme eligibility matching, analytics, AI-written insights, and PDF/Excel/CSV reporting.

Built to the spec in the original project brief: FastAPI + PostgreSQL backend, React + Tailwind frontend styled in a "Digital India" government theme (navy/saffron/green, tricolor letterhead accent, serif+sans typography).

---

## 1. What's included

- **Full backend** (`/backend`): FastAPI, SQLAlchemy models for every entity in the spec (citizens, wards, complaints, campaigns, call logs, transcripts, announcements, schemes, surveys, AI insights, notifications, reports, audit logs), JWT auth with 5 staff roles + RBAC, a separate mobile-number+OTP auth system for citizens, and an OpenAI-backed AI service layer.
- **Full staff web dashboard** (`/frontend`): React + Vite + Tailwind, government-themed UI, role-aware sidebar, dashboard with charts, citizen/ward/complaint management, campaign builder + AI call simulator, a live chat-style AI voice assistant demo, scheme eligibility checker, announcements, AI insights, and report downloads.
- **Citizen mobile app** (`/mobile`): React Native (Expo), mobile-number + OTP login, complaint filing/tracking, the same AI assistant as an in-app chat, announcements, and scheme eligibility — talking to the same backend as the staff dashboard. See `mobile/README.md` for how the two are connected.
- **Docker Compose** to run Postgres + backend + web dashboard together with one command.
- **Seed script** with a realistic demo Gram Panchayat (Wagholi, Pune) — 4 wards, 5 citizens, 5 users (one per role), 3 government schemes.

### About the AI features
Every AI feature (complaint auto-classification, the AI voice assistant, campaign call summaries, AI insight headlines) calls OpenAI's API **when `OPENAI_API_KEY` is set**, and automatically falls back to solid rule-based logic when it isn't — so the whole platform runs end-to-end for demos and pilots without any API key. Add your key any time to switch on real conversational AI.

Real telephony (Exotel/Twilio) is **not** wired in — outbound campaigns run in a "simulated calling" mode (queues calls, picks a plausible citizen reply, and has the AI summarize/classify sentiment) so you can pilot the whole workflow today. See "Connecting real telephony" below for the next step.

---

## 2. Quick start (Docker — recommended)

```bash
cd gramconnect-ai
cp backend/.env.example backend/.env   # optional: add OPENAI_API_KEY here
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API docs (Swagger): http://localhost:8000/docs

Then seed demo data (one time):

```bash
docker compose exec backend python -m app.seed_data
```

**Demo login:** `admin@wagholi.gov.in` / `Password@123`

---

## 3. Running without Docker

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: point DATABASE_URL at a running Postgres instance,
# or for a quick local test use: DATABASE_URL=sqlite:///./dev.db
python -m app.seed_data
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
Visit http://localhost:5173.

---

## 4. Enabling real AI (OpenAI)

Set in `backend/.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
Restart the backend. This immediately upgrades:
- Complaint classification (category + priority) from keyword-matching to real NLU, in Marathi/Hindi/English.
- The AI voice assistant from single-turn keyword replies to a full contextual conversation that remembers the call and can register complaints or answer scheme questions naturally.
- Campaign call summaries and sentiment detection.
- AI insight headlines (plain-English, written from the underlying stats).

No code changes needed — `app/services/ai_service.py` handles the switch automatically.

---

## 5. Connecting real telephony (Exotel / Twilio) — next step

The platform is structured so this is a contained change:
1. Add your Exotel or Twilio credentials to `backend/.env` (fields already scaffolded).
2. In `app/routers/campaigns.py`, replace the simulated citizen-reply logic inside `run_campaign()` with a real outbound call request to your telephony provider, using `campaign.message_script` as the TTS prompt (pair with a Marathi TTS provider) and routing the citizen's spoken reply through STT before passing it to `ai_service.generate_campaign_call_summary`.
3. For the inbound line, point your telephony provider's webhook at `/api/voice-assistant/turn` (it already accepts `caller_mobile` and returns the next reply) — you'll add STT on the way in and TTS on the way out.

---

## 6. Project structure

```
gramconnect-ai/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (one file per domain)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # FastAPI route modules
│   │   ├── core/          # security.py (JWT, RBAC, password hashing)
│   │   ├── services/      # ai_service.py, scheme_service.py, report_service.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed_data.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/          # One component per screen
│   │   ├── components/     # Sidebar, TopBar, Layout, AshokaChakra, ui.jsx
│   │   ├── context/         # AuthContext
│   │   └── api/             # axios client + endpoint helpers
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```

---

## 7. Roles & permissions

| Role | Can do |
|---|---|
| Super Admin | Everything, including creating new Panchayats |
| Panchayat Admin | Manage wards, citizens, campaigns, complaints, reports, schemes, announcements |
| Gram Sevak | Handle and update complaints assigned to their ward |
| Sarpanch | View analytics/insights, publish announcements |
| Data Entry Operator | Add/import citizens |

RBAC is enforced server-side in every router via `require_roles(...)` — the frontend simply reflects what the API allows.

---

## 8. What's deliberately left for the pilot phase

Per the original brief's MVP scope, these are scaffolded (models/fields exist) but not built out yet, to keep the first release focused:
- WhatsApp chatbot channel (enum value exists; not wired to a provider)
- Citizen-facing mobile app (web dashboard is admin/staff-facing only)
- Offline mode, GIS maps, IoT integration, voice biometrics
- Alembic migrations (currently `Base.metadata.create_all` on startup — fine for a pilot; swap in Alembic before scaling to multiple Panchayats in production)

---

## 9. Support

This is a generated MVP scaffold — review the code, adjust business rules (especially scheme eligibility logic and complaint priority thresholds) to match your Panchayat's actual policies before piloting with real citizens.
