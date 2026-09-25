"""
LowKeySigns FastAPI Server
Main entrypoint initializing the FastAPI application, CORS middleware,
life-cycle events, and Uvicorn runtime.
"""

import sys
import os
from pathlib import Path

# Ensure project root and backend dir are in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.api.routes import router
from app.services.tts_service import get_tts_service
from app.inference.model_loader import get_model_manager

app = FastAPI(
    title=settings.system.app_name,
    description=f"{settings.system.app_subtitle} - Real-time sign language recognition for public service desks.",
    version=settings.system.version,
)

# CORS middleware for local Vite frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.server.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    print("=" * 65)
    print(f"  {settings.system.app_name} — {settings.system.app_subtitle}")
    print(f"  Version: {settings.system.version} | Host: {settings.server.host}:{settings.server.port}")
    print("=" * 65)

    # Initialize model manager at startup
    model_mgr = get_model_manager()
    print(f"[Startup] Model Status: {model_mgr.status}")
    print(f"[Startup] REST API: http://{settings.server.host}:{settings.server.port}")
    print(f"[Startup] WebSocket Stream: ws://{settings.server.host}:{settings.server.port}/ws")
    print(f"[Startup] Documentation: http://{settings.server.host}:{settings.server.port}/docs")


@app.on_event("shutdown")
def shutdown_event():
    print("[Shutdown] Cleaning up services and releasing TTS threads...")
    tts = get_tts_service()
    tts.stop()
    print("[Shutdown] Completed successfully.")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=False,
    )
