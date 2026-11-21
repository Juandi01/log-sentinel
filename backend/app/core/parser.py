import re
import time
import zlib
from collections import defaultdict, deque
from fastapi import UploadFile
from app.core.clusterer import normalize_pattern
from app.core.scrubber import scrub_pii
from app.core.anomaly import detect_anomalies

LINE_META_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}):\d{2}\s+(INFO|WARN|WARNING|ERROR|CRITICAL)"
)
CHUNK_SIZE = 64 * 1024  # 64 KB por lectura


async def analyze_log_stream(file: UploadFile) -> dict:
    start_time = time.perf_counter()

    total_lines = 0
    total_bytes = 0
    level_counts = defaultdict(int)
    timeline_total = defaultdict(int)
    timeline_errors = defaultdict(int)
    clusters: dict[str, dict] = {}
    recent_context = deque(maxlen=30)
    spike_context: dict[str, list[str]] = {}

    def process_line(line: str) -> None:
        nonlocal total_lines
        if not line.strip():
            return
        total_lines += 1
        match = LINE_META_RE.match(line)

        if match:
            minute, level = match.group(1), match.group(2)
            level_counts[level] += 1
            timeline_total[minute] += 1

            if level in ("ERROR", "CRITICAL"):
                timeline_errors[minute] += 1
                pattern = normalize_pattern(line)
                if pattern not in clusters:
                    clusters[pattern] = {
                        "pattern": pattern,
                        "level": level,
                        "count": 0,
                        "sample": scrub_pii(line),
                    }
                clusters[pattern]["count"] += 1

                if minute not in spike_context and timeline_errors[minute] == 10:
                    spike_context[minute] = list(recent_context) + [scrub_pii(line)]
            else:
                timeline_errors.setdefault(minute, 0)

        recent_context.append(scrub_pii(line))

    buffer = ""
    decompressor = None
    first_chunk = True

    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break

        total_bytes += len(chunk)

        # Detectamos automáticamente si es un archivo .gz por sus magic bytes (\x1f\x8b)
        if first_chunk:
            first_chunk = False
            if chunk.startswith(b"\x1f\x8b") or (file.filename or "").lower().endswith(".gz"):
                decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
            elif b"\x00" in chunk[:2048]:
                raise ValueError(
                    "El archivo parece ser binario o estar corrupto. Por favor, sube archivos de texto plano (.log, .txt) o comprimidos (.log.gz)."
                )

        data = decompressor.decompress(chunk) if decompressor else chunk
        buffer += data.decode("utf-8", errors="replace")

        lines = buffer.split("\n")
        buffer = lines.pop()

        for line in lines:
            process_line(line)

    # Vaciamos el resto del descompresor y la última línea si no acababa en salto de línea
    if decompressor:
        tail = decompressor.flush()
        if tail:
            buffer += tail.decode("utf-8", errors="replace")

    for line in buffer.split("\n"):
        process_line(line)

    anomalies = detect_anomalies(timeline_errors)
    top_clusters = sorted(clusters.values(), key=lambda c: c["count"], reverse=True)[:10]

    timeline = [
        {"minute": m, "total": timeline_total[m], "errors": timeline_errors.get(m, 0)}
        for m in sorted(timeline_total.keys())
    ]

    elapsed = round(time.perf_counter() - start_time, 2)
    
    if total_lines == 0:
        raise ValueError(
            "El archivo está vacío o no contiene líneas legibles. Sube un archivo de log válido (.log, .txt o .log.gz)."
        )

    return {
        "filename": file.filename,
        "size_mb": round(total_bytes / (1024 * 1024), 2),
        "processing_time_sec": elapsed,
        "total_lines": total_lines,
        "level_counts": dict(level_counts),
        "anomalies": anomalies,
        "top_clusters": top_clusters,
        "timeline": timeline,
        "ai_context_sample": spike_context.get(anomalies[0]["minute"], []) if anomalies else [],
    }