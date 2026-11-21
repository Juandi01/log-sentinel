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

export interface AnalysisResult {
  filename: string;
  size_mb: number;
  processing_time_sec: number;
  total_lines: number;
  level_counts: Record<string, number>;
  anomalies: AnomalySpike[];
  top_clusters: ErrorCluster[];
  timeline: TimelinePoint[];
  ai_context_sample: string[];
}

export interface DiagnosisResult {
  severity: string;
  root_cause: string;
  explanation: string;
  recommended_actions: string[];
  model_used: string;
}

export async function analyzeLogFile(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al analizar el archivo de log");
  }

  return res.json();
}

export async function diagnoseIncident(analysis: AnalysisResult): Promise<DiagnosisResult> {
  const res = await fetch(`${API_URL}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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