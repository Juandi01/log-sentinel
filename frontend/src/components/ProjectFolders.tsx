import { useState } from "react";
import {
  Folder,
  FolderPlus,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import type { HistoryItem } from "../services/api";

interface ProjectFoldersProps {
  folders: string[];
  history: HistoryItem[];
  onSelectFolder: (name: string) => void;
  onCreateFolder: (name: string) => void;
}

export function ProjectFolders({
  folders,
  history,
  onSelectFolder,
  onCreateFolder,
}: ProjectFoldersProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    onCreateFolder(clean);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Carpetas de proyectos
          </h2>
          <p className="text-xs text-zinc-500">
            Organiza tus logs por servicio o aplicación y gestiona sus incidentes
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/25"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Nueva carpeta
          </button>
        )}
      </div>

      {/* Formulario rápido para crear carpeta */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"
        >
          <Folder className="h-4 w-4 shrink-0 text-emerald-400" />
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del proyecto (ej. payments-api, nginx-prod...)"
            maxLength={60}
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear y abrir
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewName("");
            }}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Cuadrícula de carpetas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => {
          const items = history.filter((h) => h.project_name === folder);
          const openCount = items.filter((i) => i.status !== "resolved").length;
          const resolvedCount = items.filter(
            (i) => i.status === "resolved"
          ).length;
          const hasAnomalies = items.some(
            (i) => i.status !== "resolved" && i.anomaly_count > 0
          );

          return (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`rounded-lg p-2.5 ring-1 ${
                    hasAnomalies
                      ? "bg-red-500/10 text-red-400 ring-red-500/25"
                      : "bg-zinc-950 text-emerald-400 ring-zinc-800"
                  }`}
                >
                  <Folder className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300" />
              </div>

              <div className="mt-4">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {folder}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {items.length === 0
                    ? "Carpeta vacía · lista para subir logs"
                    : `${items.length} ${items.length === 1 ? "análisis" : "análisis"}`}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-zinc-800/70 pt-3 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                    openCount > 0
                      ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                      : "text-zinc-500"
                  }`}
                >
                  <AlertOctagon className="h-3 w-3" />
                  {openCount} pendientes
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                    resolvedCount > 0
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "text-zinc-500"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {resolvedCount} resueltos
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}