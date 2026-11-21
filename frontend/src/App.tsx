import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  FileCode2,
  AlertOctagon,
  RotateCcw,
  Download,
  Folder,
  FileWarning,
  X,
  CheckCircle2,
  ArrowLeft,
  FlaskConical,
  FolderKanban,
} from "lucide-react";
import {
  analyzeLogFile,
  diagnoseIncident,
  fetchHistory,
  fetchHistoryDetail,
  updateHistoryStatus,
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
import { ProjectFolders } from "./components/ProjectFolders";
import { SandboxMode } from "./components/SandboxMode";
import { exportPostMortemMarkdown } from "./utils/exportMarkdown";

const ALLOWED_EXTENSIONS = [".log", ".txt", ".gz"];
const FOLDERS_STORAGE_KEY = "log_sentinel_folders";

export function App() {
  const [viewMode, setViewMode] = useState<"projects" | "sandbox">("projects");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ["General"];
    } catch {
      return ["General"];
    }
  });

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);

  const allFolders = useMemo(() => {
    const set = new Set<string>([
      ...customFolders,
      ...history.map((h) => h.project_name || "General"),
    ]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [customFolders, history]);

  const folderHistory = useMemo(() => {
    if (!selectedFolder) return [];
    return history.filter((h) => (h.project_name || "General") === selectedFolder);
  }, [history, selectedFolder]);

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

  const handleCreateFolder = (name: string) => {
    const updated = Array.from(new Set([...customFolders, name]));
    setCustomFolders(updated);
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updated));
    setSelectedFolder(name);
    setError(null);
  };

  const handleFileSelect = async (file: File, targetProject: string) => {
    const lowerName = file.name.toLowerCase();
    const isValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setError(
        `El archivo "${file.name}" no es un formato compatible. Por favor, sube un archivo de log válido.`
      );
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0);
    setError(null);
    setDiagnosis(null);
    setDiagError(null);

    try {
      const result = await analyzeLogFile(file, targetProject, (pct) =>
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

  const handleToggleStatus = async (
    id: number,
    nextStatus: "open" | "resolved"
  ) => {
    try {
      const updated = await updateHistoryStatus(id, nextStatus);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: updated.status, resolved_at: updated.resolved_at }
            : item
        )
      );
      if (analysis?.id === id) {
        setAnalysis((prev) =>
          prev
            ? { ...prev, status: updated.status, resolved_at: updated.resolved_at }
            : prev
        );
      }
    } catch {
      // ignore
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <button
            onClick={() => {
              handleReset();
              setSelectedFolder(null);
              setViewMode("projects");
            }}
            className="flex items-center gap-2.5 text-left"
          >
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
          </button>

          {/* Navegación principal cuando no hay un análisis abierto */}
          {!analysis ? (
            <div className="flex items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1">
              <button
                onClick={() => {
                  setViewMode("projects");
                  setError(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "projects"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Proyectos
              </button>
              <button
                onClick={() => {
                  setViewMode("sandbox");
                  setError(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "sandbox"
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Hacer una prueba
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {analysis.id && (
                <button
                  onClick={() =>
                    handleToggleStatus(
                      analysis.id!,
                      analysis.status === "resolved" ? "open" : "resolved"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    analysis.status === "resolved"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {analysis.status === "resolved"
                    ? "Resuelto"
                    : "Marcar resuelto"}
                </button>
              )}

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
                Volver
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!analysis ? (
          viewMode === "sandbox" ? (
            <div>
              <SandboxMode
                onFileSelect={(file) => handleFileSelect(file, "Pruebas")}
                isLoading={isAnalyzing}
                uploadProgress={uploadProgress}
              />
              {error && <FileErrorBanner error={error} onClose={() => setError(null)} />}
            </div>
          ) : !selectedFolder ? (
            <ProjectFolders
              folders={allFolders}
              history={history}
              onSelectFolder={(name) => {
                setSelectedFolder(name);
                setError(null);
              }}
              onCreateFolder={handleCreateFolder}
            />
          ) : (
            <div className="mx-auto max-w-3xl">
              {/* Cabecera de la carpeta abierta */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedFolder(null);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Carpetas
                  </button>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                      {selectedFolder}
                    </h2>
                  </div>
                </div>
              </div>

              <Dropzone
                onFileSelect={(file) => handleFileSelect(file, selectedFolder)}
                isLoading={isAnalyzing}
                uploadProgress={uploadProgress}
              />

              {error && <FileErrorBanner error={error} onClose={() => setError(null)} />}

              <HistoryList
                items={folderHistory}
                onSelect={handleSelectHistory}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteHistory}
              />
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                icon={<FileCode2 className="h-4 w-4 text-zinc-400" />}
                label="Archivo"
                value={`${analysis.size_mb} MB`}
                sub={`${analysis.project_name || "General"} · ${analysis.filename}`}
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

function FileErrorBanner({
  error,
  onClose,
}: {
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto mt-4 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
      <div className="mt-0.5 rounded-lg bg-amber-500/15 p-1.5 text-amber-400">
        <FileWarning className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-amber-300">
          Archivo no compatible
        </p>
        <p className="mt-0.5 text-xs text-zinc-300">{error}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">Formatos válidos:</span>
          {[".log", ".txt", ".log.gz"].map((ext) => (
            <span
              key={ext}
              className="rounded bg-zinc-950/80 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400 ring-1 ring-emerald-500/25"
            >
              {ext}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onClose}
        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-zinc-200"
      >
        <X className="h-4 w-4" />
      </button>
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