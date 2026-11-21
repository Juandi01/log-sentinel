import asyncio
import gzip
import io
import pytest
from fastapi import UploadFile

from app.core.scrubber import scrub_pii
from app.core.clusterer import normalize_pattern
from app.core.anomaly import detect_anomalies
from app.core.parser import analyze_log_stream


# --- 1. Tests de Sanitizado PII ---

def test_scrub_pii_removes_emails_and_ips():
    raw = "2026-11-21 10:42:18 ERROR [auth] Login failed for juan.perez@empresa.com from 192.168.1.45"
    cleaned = scrub_pii(raw)

    assert "juan.perez@empresa.com" not in cleaned
    assert "192.168.1.45" not in cleaned
    assert "Login failed" in cleaned


# --- 2. Tests de Clustering de Patrones ---

def test_normalize_pattern_collapses_dynamic_values():
    line_a = "2026-11-21 10:42:18 ERROR [db-pool] Connection timeout for user_id=4821 from 10.0.0.12"
    line_b = "2026-11-21 10:43:05 ERROR [db-pool] Connection timeout for user_id=99104 from 10.0.0.88"

    assert normalize_pattern(line_a) == normalize_pattern(line_b)


def test_normalize_pattern_separates_different_errors():
    line_a = "2026-11-21 10:42:18 ERROR [nginx] 502 Bad Gateway upstream timed out"
    line_b = "2026-11-21 10:42:19 CRITICAL [payments] psycopg2.OperationalError: deadlock detected"

    assert normalize_pattern(line_a) != normalize_pattern(line_b)


# --- 3. Tests de Detección de Anomalías (Z-Score) ---

def test_detect_anomalies_finds_clear_spike():
    timeline = {f"2026-11-21 10:{m:02d}": 5 for m in range(20)}
    timeline["2026-11-21 10:15"] = 250  # Pico artificial masivo

    anomalies = detect_anomalies(timeline)

    assert len(anomalies) == 1
    assert anomalies[0]["minute"] == "2026-11-21 10:15"
    assert anomalies[0]["z_score"] > 2.5


def test_detect_anomalies_returns_empty_on_flat_traffic():
    timeline = {f"2026-11-21 10:{m:02d}": 10 for m in range(15)}
    assert detect_anomalies(timeline) == []


# --- 4. Tests del Parser en Streaming (Texto, .gz y Seguridad) ---

SAMPLE_LOG = (
    "2026-11-21 10:01:01 INFO [api] Request OK\n"
    "2026-11-21 10:01:02 ERROR [payments] Failed to charge test@mail.com: deadlock\n"
    "2026-11-21 10:01:03 CRITICAL [payments] Failed to charge otro@mail.com: deadlock\n"
)


def test_parser_handles_plain_and_gzip_identically():
    plain_upload = UploadFile(
        filename="app.log",
        file=io.BytesIO(SAMPLE_LOG.encode("utf-8")),
    )
    gz_upload = UploadFile(
        filename="app.log.gz",
        file=io.BytesIO(gzip.compress(SAMPLE_LOG.encode("utf-8"))),
    )

    plain_res = asyncio.run(analyze_log_stream(plain_upload))
    gz_res = asyncio.run(analyze_log_stream(gz_upload))

    assert plain_res["total_lines"] == 3
    assert gz_res["total_lines"] == plain_res["total_lines"]
    assert gz_res["level_counts"] == plain_res["level_counts"]
    assert len(gz_res["top_clusters"]) == len(plain_res["top_clusters"])


def test_parser_rejects_binary_files():
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00"
    upload = UploadFile(filename="foto.log", file=io.BytesIO(fake_png))

    with pytest.raises(ValueError, match="binario"):
        asyncio.run(analyze_log_stream(upload))


def test_parser_rejects_empty_files():
    upload = UploadFile(filename="empty.log", file=io.BytesIO(b""))

    with pytest.raises(ValueError, match="vacío"):
        asyncio.run(analyze_log_stream(upload))