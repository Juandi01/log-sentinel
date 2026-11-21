from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(80), nullable=False, default="General", index=True)
    status = Column(String(20), nullable=False, default="open", index=True)  # "open" | "resolved"
    filename = Column(String, nullable=False)
    size_mb = Column(Float, nullable=False)
    processing_time_sec = Column(Float, nullable=False)
    total_lines = Column(Integer, nullable=False)
    error_count = Column(Integer, default=0)
    anomaly_count = Column(Integer, default=0)

    level_counts = Column(JSON, nullable=False)
    anomalies = Column(JSON, nullable=False)
    top_clusters = Column(JSON, nullable=False)
    timeline = Column(JSON, nullable=False)
    ai_context_sample = Column(JSON, nullable=False)
    diagnosis = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)