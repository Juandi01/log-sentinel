from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.parser import analyze_log_stream
from app.core.ai_client import diagnose_incident
from app.database import get_db
from app.models import AnalysisRecord

router = APIRouter(prefix="/api", tags=["logs"])

ALLOWED_EXTENSIONS = (".log", ".txt", ".gz")


class DiagnoseRequest(BaseModel):
    analysis_id: int | None = None
    anomalies: list[dict]
    top_clusters: list[dict]
    ai_context_sample: list[str]


class UpdateRecordRequest(BaseModel):
    status: str | None = None  # "open" | "resolved"
    project_name: str | None = None


@router.post("/analyze")
async def analyze_log(
    file: UploadFile = File(...),
    project_name: str = Form("General"),
    db: Session = Depends(get_db),
):
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Tipo de archivo no permitido. Por favor, sube un archivo válido (.log, .txt o .log.gz).",
        )

    try:
        result = await analyze_log_stream(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="No se pudo leer el archivo. Asegúrate de subir un log válido (.log, .txt o .log.gz).",
        )

    clean_project = project_name.strip()[:80] or "General"
    error_total = (
        result["level_counts"].get("ERROR", 0)
        + result["level_counts"].get("CRITICAL", 0)
    )

    record = AnalysisRecord(
        project_name=clean_project,
        status="open",
        filename=result["filename"],
        size_mb=result["size_mb"],
        processing_time_sec=result["processing_time_sec"],
        total_lines=result["total_lines"],
        error_count=error_total,
        anomaly_count=len(result["anomalies"]),
        level_counts=result["level_counts"],
        anomalies=result["anomalies"],
        top_clusters=result["top_clusters"],
        timeline=result["timeline"],
        ai_context_sample=result["ai_context_sample"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["project_name"] = record.project_name
    result["status"] = record.status
    return result


@router.post("/diagnose")
def diagnose_log(req: DiagnoseRequest, db: Session = Depends(get_db)):
    try:
        diagnosis = diagnose_incident(
            req.anomalies, req.top_clusters, req.ai_context_sample
        )
        if req.analysis_id is not None:
            record = (
                db.query(AnalysisRecord)
                .filter(AnalysisRecord.id == req.analysis_id)
                .first()
            )
            if record:
                record.diagnosis = diagnosis
                db.commit()
        return diagnosis
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error llamando a Gemini: {str(e)}"
        )


@router.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    records = (
        db.query(AnalysisRecord)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "project_name": r.project_name,
            "status": r.status,
            "filename": r.filename,
            "size_mb": r.size_mb,
            "processing_time_sec": r.processing_time_sec,
            "total_lines": r.total_lines,
            "error_count": r.error_count,
            "anomaly_count": r.anomaly_count,
            "has_diagnosis": r.diagnosis is not None,
            "severity": r.diagnosis.get("severity") if r.diagnosis else None,
            "created_at": r.created_at.isoformat(),
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        }
        for r in records
    ]


@router.get("/history/{record_id}")
def get_history_detail(record_id: int, db: Session = Depends(get_db)):
    r = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    return {
        "id": r.id,
        "project_name": r.project_name,
        "status": r.status,
        "filename": r.filename,
        "size_mb": r.size_mb,
        "processing_time_sec": r.processing_time_sec,
        "total_lines": r.total_lines,
        "level_counts": r.level_counts,
        "anomalies": r.anomalies,
        "top_clusters": r.top_clusters,
        "timeline": r.timeline,
        "ai_context_sample": r.ai_context_sample,
        "diagnosis": r.diagnosis,
        "created_at": r.created_at.isoformat(),
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
    }


@router.patch("/history/{record_id}")
def update_history_record(
    record_id: int, req: UpdateRecordRequest, db: Session = Depends(get_db)
):
    r = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")

    if req.status is not None:
        if req.status not in ("open", "resolved"):
            raise HTTPException(status_code=400, detail="Estado no válido")
        r.status = req.status
        r.resolved_at = datetime.now(timezone.utc) if req.status == "resolved" else None

    if req.project_name is not None:
        r.project_name = req.project_name.strip()[:80] or "General"

    db.commit()
    db.refresh(r)
    return {
        "id": r.id,
        "status": r.status,
        "project_name": r.project_name,
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
    }


@router.delete("/history/{record_id}")
def delete_history_record(record_id: int, db: Session = Depends(get_db)):
    r = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    db.delete(r)
    db.commit()
    return {"deleted": record_id}