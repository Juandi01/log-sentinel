import {
  Clock,
  Trash2,
  Sparkles,
  FileText,
  ChevronRight,
  AlertOctagon,
  Activity,
} from "lucide-react";
import type { HistoryItem } from "../services/api";

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

function getSeverityBadgeClasses(severity: string | null) {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
    case "HIGH":
      return "bg-red-500/10 text-red-400 ring-red-500/25";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 ring-amber-500/25";
    default:
      return "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25";
  }
}

export function HistoryList({ items, onSelect, onDelete }: HistoryListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          Análisis recientes
        </h3>
        <span className="text-xs text-zinc-600">
          {items.length} {items.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const hasAnomalies = item.anomaly_count > 0;
          const hasErrors = item.error_count > 0;

          const iconBoxStyle = hasAnomalies
            ? "bg-red-500/10 ring-red-500/25 text-red-400"
            : hasErrors
              ? "bg-amber-500/10 ring-amber-500/25 text-amber-400"
              : "bg-zinc-950 ring-zinc-800 text-zinc-400";

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`rounded-lg p-2 ring-1 ${iconBoxStyle}`}>
                  <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.filename}
                    </p>
                    {item.has_diagnosis && (
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${getSeverityBadgeClasses(
                          item.severity
                        )}`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {item.severity || "IA"}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>{item.size_mb} MB</span>

                    <span className="text-zinc-700">·</span>

                    {hasErrors ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-400 ring-1 ring-amber-500/20">
                        <AlertOctagon className="h-3 w-3" />
                        {item.error_count.toLocaleString()} errores
                      </span>
                    ) : (
                      <span>0 errores</span>
                    )}

                    {hasAnomalies ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 font-medium text-red-400 ring-1 ring-red-500/20">
                        <Activity className="h-3 w-3" />
                        {item.anomaly_count}{" "}
                        {item.anomaly_count === 1 ? "anomalía" : "anomalías"}
                      </span>
                    ) : (
                      <span>0 anomalías</span>
                    )}

                    <span className="text-zinc-700">·</span>

                    <span>
                      {new Date(item.created_at).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Eliminar registro"
                  className="rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}