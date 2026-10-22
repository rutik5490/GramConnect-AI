import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app import models  # noqa: F401 - ensures all models are registered on Base
from app.routers import (
    auth,
    panchayats,
    citizens,
    complaints,
    campaigns,
    voice_assistant,
    schemes,
    announcements,
    analytics,
    reports,
    notifications,
    citizen_portal,
)

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="GramConnect AI",
    description="AI-powered voice governance platform for Gram Panchayats.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    logging.info("GramConnect AI backend started. AI features enabled: %s", bool(settings.OPENAI_API_KEY))


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "GramConnect AI",
        "status": "running",
        "ai_enabled": bool(settings.OPENAI_API_KEY),
    }


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(panchayats.router)
app.include_router(citizens.router)
app.include_router(complaints.router)
app.include_router(campaigns.router)
app.include_router(voice_assistant.router)
app.include_router(schemes.router)
app.include_router(announcements.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(citizen_portal.router)
