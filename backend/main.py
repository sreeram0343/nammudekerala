import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import Base, engine, get_db
from backend.services.websocket_service import manager
from backend.middleware.logger import RequestLoggerMiddleware
from backend.middleware.rate_limiter import RateLimiterMiddleware
from backend.utils.db_seed import seed_if_empty
from backend.routes import (
    auth_router,
    assembly_router,
    post_router,
    comment_router,
    representative_router,
    notification_router,
    follow_router,
    report_router,
    upload_router
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize Database Schema & Seed (Safe for production/Render Free)
Base.metadata.create_all(bind=engine)
seed_if_empty()

app = FastAPI(
    title="Nammude Kerala API",
    description="Production-Ready Civic Discussion & Assembly-Level Issue Reporting API",
    version="1.1.0"
)

# CORS Configurations
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
client_url = os.getenv("CLIENT_URL")
if client_url:
    allowed_origins.append(client_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Custom Production Middlewares (Logger + sliding window Rate Limiter)
app.add_middleware(RequestLoggerMiddleware)
# Bucket capacity: 100 requests per IP, refilling at 2 requests per second
app.add_middleware(RateLimiterMiddleware, max_tokens=100, refill_rate=2.0)

# Serve local fallback media uploads statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keeps the connection alive; responds to client ping messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health Check & DB Status
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.1.0"}

@app.get("/api/db-status")
def db_status(db: Session = Depends(get_db)):
    try:
        # Check connection
        db.execute(text("SELECT 1"))
        # Check if assemblies are seeded
        from backend.models import Assembly
        count = db.query(Assembly).count()
        return {
            "database": "connected",
            "assemblies_count": count,
            "is_seeded": count > 0,
            "message": "Database is ready" if count > 0 else "Database connected but not seeded."
        }
    except Exception as e:
        return {"database": "error", "detail": str(e)}

# Include Modular API Routers
app.include_router(auth_router)
app.include_router(assembly_router)
app.include_router(post_router)
app.include_router(comment_router)
app.include_router(representative_router)
app.include_router(notification_router)
app.include_router(follow_router)
app.include_router(report_router)
app.include_router(upload_router)
