import re

BEARER_RE = re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE)
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
IPV4_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

def scrub_pii(line: str) -> str:
    line = BEARER_RE.sub("Bearer <REDACTED_TOKEN>", line)
    line = EMAIL_RE.sub("<REDACTED_EMAIL>", line)
    line = IPV4_RE.sub("<REDACTED_IP>", line)
    return line