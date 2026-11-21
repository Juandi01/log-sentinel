import { useMemo, useState } from "react";
import {
  Clock,
  Trash2,
  Sparkles,
  FileText,
  ChevronRight,
  AlertOctagon,
  Activity,
  CheckCircle2,
  RotateCcw,
  Folder,
} from "lucide-react";
import type { HistoryItem } from "../services/api";

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (id: number) => void;
  onToggleStatus: (id: number, nextStatus: "open" | "resolved") => void;
  onDelete: (id: number) => void;
}

const PROJECT_COLORS = [
  "bg-sky-500/10 text-sky-400 ring-sky-500/25",
  "bg-violet-500/10 text-violet-400 ring-violet-500/25",
  "bg-cyan-500/10 text-cyan-400 ring-cyan-500/25",
  "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/25",
  "bg-indigo-500/10 text-indigo-400 ring-indigo-500/25",
];

function getProjectBadgeClasses(project: string) {
  if (project === "General") {
    return "bg-zinc-800/80 text-zinc-400 ring-zinc-700/60";
  }
  let hash = 0;
  for (let i = 0; i < project.length; i++) {
    hash = project.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
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

function getDayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HistoryList({
  items,
  onSelect,
  onToggleStatus,
  onDelete,
}: HistoryListProps) {
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");
  const [selectedProject, setSelectedProject] = useState<string>("ALL");

  const projects = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.project_name || "General")));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const openCount = items.filter((i) => i.status !== "resolved").length;
  const resolvedCount = items.filter((i) => i.status === "resolved").length;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesTab =
        activeTab === "resolved"
          ? item.status === "resolved"
          : item.status !== "resolved";
      const matchesProject =
        selectedProject === "ALL" || item.project_name === selectedProject;
      return matchesTab && matchesProject;
    });
  }, [items, activeTab, selectedProject]);

  const groupedByDay = useMemo(() => {
    const groups: { label: string; records: HistoryItem[] }[] = [];
    for (const item of filtered) {
      const label = getDayLabel(item.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.records.push(item);
      } else {
        groups.push({ label, records: [item] });
      }
    }
    return groups;
  }, [filtered]);

  if (items.length === 0) return null;

  return (
    <div className="mt-10">
      {/* Cabecera con pestañas tipo Trello */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-1">
          <button
            onClick={() => setActiveTab("open")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "open"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pendientes
            <span className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {openCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("resolved")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "resolved"
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resueltos
            <span className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {resolvedCount}
            </span>
          </button>
        </div>

        {/* Filtro rápido por proyecto (solo aparece si hay más de 1 proyecto) */}
        {projects.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedProject("ALL")}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                selectedProject === "ALL"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Todos
            </button>
            {projects.map((proj) => (
              <button
                key={proj}
                onClick={() => setSelectedProject(proj)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  selectedProject === proj
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Folder className="h-3 w-3" />
                {proj}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listado agrupado por día */}
      {groupedByDay.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20 py-8 text-center">
          <p className="text-xs text-zinc-500">
            {activeTab === "resolved"
              ? "Todavía no has marcado ningún incidente como resuelto."
              : "No hay incidentes pendientes en este filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDay.map((group) => (
            <div key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-zinc-800/70" />
              </div>

              <div className="space-y-2">
                {group.records.map((item) => {
                  const isResolved = item.status === "resolved";
                  const hasAnomalies = item.anomaly_count > 0;
                  const hasErrors = item.error_count > 0;

                  const iconBoxStyle = isResolved
                    ? "bg-emerald-500/10 ring-emerald-500/25 text-emerald-400"
                    : hasAnomalies
                      ? "bg-red-500/10 ring-red-500/25 text-red-400"
                      : hasErrors
                        ? "bg-amber-500/10 ring-amber-500/25 text-amber-400"
                        : "bg-zinc-950 ring-zinc-800 text-zinc-400";

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={`group flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
                        isResolved
                          ? "border-zinc-800/60 bg-zinc-900/20 opacity-80 hover:border-zinc-700 hover:opacity-100"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`rounded-lg p-2 ring-1 ${iconBoxStyle}`}>
                          {isResolved ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${getProjectBadgeClasses(
                                item.project_name
                              )}`}
                            >
                              <Folder className="h-2.5 w-2.5" />
                              {item.project_name}
                            </span>

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
                              {new Date(item.created_at).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(
                              item.id,
                              isResolved ? "open" : "resolved"
                            );
                          }}
                          title={
                            isResolved
                              ? "Reabrir incidente"
                              : "Marcar como resuelto"
                          }
                          className={`rounded-lg p-1.5 transition-all ${
                            isResolved
                              ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                              : "text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}
                        >
                          {isResolved ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>

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
          ))}
        </div>
      )}
    </div>
  );
}