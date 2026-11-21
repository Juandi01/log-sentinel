import re
from app.core.scrubber import scrub_pii

TIMESTAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+")
UUID_RE = re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.I)
NUM_ASSIGN_RE = re.compile(r"(=)\d+(ms|s)?\b")
HEX_RE = re.compile(r"\b0x[0-9a-fA-F]+\b")

def normalize_pattern(line: str) -> str:
    clean = scrub_pii(line)
    clean = TIMESTAMP_RE.sub("", clean)
    clean = UUID_RE.sub("<UUID>", clean)
    clean = NUM_ASSIGN_RE.sub(r"\1<NUM>", clean)
    clean = HEX_RE.sub("<HEX>", clean)
    return clean.strip()