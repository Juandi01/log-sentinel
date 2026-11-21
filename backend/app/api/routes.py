from fastapi import APIRouter, UploadFile, File
from app.core.parser import analyze_log_stream

router = APIRouter(prefix="/api", tags=["logs"])

@router.post("/analyze")
async def analyze_log(file: UploadFile = File(...)):
    return await analyze_log_stream(file)