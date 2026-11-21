from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.core.parser import analyze_log_stream
from app.core.ai_client import diagnose_incident

router = APIRouter(prefix="/api", tags=["logs"])

class DiagnoseRequest(BaseModel):
    anomalies: list[dict]
    top_clusters: list[dict]
    ai_context_sample: list[str]

@router.post("/analyze")
async def analyze_log(file: UploadFile = File(...)):
    return await analyze_log_stream(file)

@router.post("/diagnose")
def diagnose_log(req: DiagnoseRequest):
    try:
        return diagnose_incident(req.anomalies, req.top_clusters, req.ai_context_sample)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error llamando a Gemini: {str(e)}")