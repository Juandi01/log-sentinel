from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as log_router
from app.database import Base, engine
from app.models import AnalysisRecord  # noqa: F401 (registra la tabla)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Log Sentinel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(log_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "log-sentinel-backend"}