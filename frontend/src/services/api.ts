const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AnomalySpike {
  minute: string;
  error_count: number;
  z_score: number;
  baseline_mean: number;
}

export interface ErrorCluster {
  pattern: string;
  level: string;
  count: number;
  sample: string;
}

export interface TimelinePoint {
  minute: string;
  total: number;
  errors: number;
}

export interface DiagnosisResult {
  severity: string;
  root_cause: string;
  explanation: string;
  recommended_actions: string[];
  model_used: string;
}

export interface AnalysisResult {
  id?: number;
  filename: string;
  size_mb: number;
  processing_time_sec: number;
  total_lines: number;
  level_counts: Record<string, number>;
  anomalies: AnomalySpike[];
  top_clusters: ErrorCluster[];
  timeline: TimelinePoint[];
  ai_context_sample: string[];
  diagnosis?: DiagnosisResult | null;
}

export interface HistoryItem {
  id: number;
  filename: string;
  size_mb: number;
  processing_time_sec: number;
  total_lines: number;
  error_count: number;
  anomaly_count: number;
  has_diagnosis: boolean;
  severity: string | null;
  created_at: string;
}

export function analyzeLogFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/analyze`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Respuesta inválida del servidor"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || "Error al analizar el archivo de log"));
        } catch {
          reject(new Error("Error al analizar el archivo de log"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));
    xhr.send(formData);
  });
}

export async function diagnoseIncident(analysis: AnalysisResult): Promise<DiagnosisResult> {
  const res = await fetch(`${API_URL}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_id: analysis.id ?? null,
      anomalies: analysis.anomalies,
      top_clusters: analysis.top_clusters,
      ai_context_sample: analysis.ai_context_sample,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al solicitar el diagnóstico IA");
  }

  return res.json();
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) throw new Error("Error al cargar el historial");
  return res.json();
}

export async function fetchHistoryDetail(id: number): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/api/history/${id}`);
  if (!res.ok) throw new Error("Error al cargar el análisis");
  return res.json();
}

export async function deleteHistoryRecord(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/history/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar el registro");
}