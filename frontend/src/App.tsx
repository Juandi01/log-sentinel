import { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  FileCode2,
  AlertOctagon,
  RotateCcw,
  Download,
} from "lucide-react";
import {
  analyzeLogFile,
  diagnoseIncident,
  fetchHistory,
  fetchHistoryDetail,
  deleteHistoryRecord,
  type AnalysisResult,
  type DiagnosisResult,
  type HistoryItem,
} from "./services/api";
import { Dropzone } from "./components/Dropzone";
import { TimelineChart } from "./components/TimelineChart";
import { ErrorClusters } from "./components/ErrorClusters";
import { DiagnosisPanel } from "./components/DiagnosisPanel";
import { HistoryList } from "./components/HistoryList";
import { exportPostMortemMarkdown } from "./utils/exportMarkdown";

export function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const items = await fetchHistory();
      setHistory(items);
    } catch {
      // Silencioso si el backend aún está arrancando
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(0);
    setError(null);
    setDiagnosis(null);
    setDiagError(null);

    try {
      const result = await analyzeLogFile(file, (pct) =>
        setUploadProgress(pct)
      );
      setAnalysis(result);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(null);
    }
  };

  const handleDiagnose = async () => {
    if (!analysis) return;
    setIsDiagnosing(true);
    setDiagError(null);

    try {
      const res = await diagnoseIncident(analysis);
      setDiagnosis(res);
      loadHistory();
    } catch (err) {
      setDiagError(err instanceof Error ? err.message : "Error al diagnosticar");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSelectHistory = async (id: number) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const detail = await fetchHistoryDetail(id);
      setAnalysis(detail);
      setDiagnosis(detail.diagnosis ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al abrir registro");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await deleteHistoryRecord(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setDiagnosis(null);
    setError(null);
    setDiagError(null);
    loadHistory();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
                Log Sentinel
              </h1>
              <p className="text-[11px] text-zinc-500">
                Streaming Log Analyzer &amp; AI Incident Triage
              </p>
            </div>
          </div>

          {analysis && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportPostMortemMarkdown(analysis, diagnosis)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar .md
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Analizar otro archivo
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!analysis ? (
          <div className="mx-auto max-w-2xl pt-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
                Detecta anomalías en logs masivos
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Procesamiento en streaming con memoria acotada, sanitizado PII automático
                y diagnóstico de causa raíz con Gemini.
              </p>
            </div>

            <Dropzone
              onFileSelect={handleFileSelect}
              isLoading={isAnalyzing}
              uploadProgress={uploadProgress}
            />

            {error && (
              <p className="mt-4 text-center text-xs text-red-400">{error}</p>
            )}

            <HistoryList
              items={history}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                icon={<FileCode2 className="h-4 w-4 text-zinc-400" />}
                label="Archivo"
                value={`${analysis.size_mb} MB`}
                sub={analysis.filename}
              />
              <KpiCard
                icon={<Clock className="h-4 w-4 text-emerald-400" />}
                label="Tiempo de proceso"
                value={`${analysis.processing_time_sec} s`}
                sub={`${analysis.total_lines.toLocaleString()} líneas`}
              />
              <KpiCard
                icon={<AlertOctagon className="h-4 w-4 text-amber-400" />}
                label="Errores totales"
                value={(
                  (analysis.level_counts.ERROR || 0) +
                  (analysis.level_counts.CRITICAL || 0)
                ).toLocaleString()}
                sub={`${analysis.top_clusters.length} patrones únicos`}
              />
              <KpiCard
                icon={<Activity className="h-4 w-4 text-red-400" />}
                label="Picos anómalos"
                value={String(analysis.anomalies.length)}
                sub={
                  analysis.anomalies[0]
                    ? `Max Z-score: ${analysis.anomalies[0].z_score}`
                    : "Tráfico estable"
                }
              />
            </div>

            <TimelineChart
              timeline={analysis.timeline}
              anomalies={analysis.anomalies}
            />

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ErrorClusters clusters={analysis.top_clusters} />
              </div>
              <div className="lg:col-span-2">
                <DiagnosisPanel
                  diagnosis={diagnosis}
                  isLoading={isDiagnosing}
                  error={diagError}
                  onDiagnose={handleDiagnose}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

export default App;