import os
import json
from google import genai
from google.genai import types, errors
from pydantic import BaseModel

MODEL_FALLBACK_CHAIN = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-flash-lite-latest",
]

class DiagnosisResponse(BaseModel):
    severity: str
    root_cause: str
    explanation: str
    recommended_actions: list[str]

def diagnose_incident(anomalies: list[dict], top_clusters: list[dict], context_lines: list[str]) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "tu_api_key_aqui":
        raise ValueError("Falta configurar GEMINI_API_KEY en el archivo .env")

    # Timeout de 12s por petición para saltar rápido si un modelo está saturado
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=12_000),
    )

    payload = {
        "anomalies": anomalies[:3],
        "top_error_clusters": top_clusters[:5],
        "context_around_spike": context_lines[-25:],
    }

    prompt = (
        "Eres un ingeniero SRE senior analizando un incidente en producción. "
        "A partir de este resumen estadístico de logs (ya anonimizados y agrupados), "
        "identifica la causa raíz más probable, explica brevemente la cadena de fallos "
        "y da entre 2 y 4 acciones concretas para solucionarlo. Responde en español.\n\n"
        f"DATOS DEL INCIDENTE:\n{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )

    last_error = None
    for model_name in MODEL_FALLBACK_CHAIN:
        print(f"[AI] Probando modelo: {model_name}...", flush=True)
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DiagnosisResponse,
                    temperature=0.2,
                ),
            )
            result = json.loads(response.text)
            result["model_used"] = model_name
            return result
        except Exception as e:
            print(f"[AI] Falló {model_name}: {e}", flush=True)
            last_error = e
            continue

    raise RuntimeError(f"Todos los modelos fallaron. Último error: {last_error}")