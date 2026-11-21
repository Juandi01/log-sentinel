import { useState } from "react";
import { ChevronDown, ShieldCheck, Copy, Check } from "lucide-react";
import type { ErrorCluster } from "../services/api";

interface ErrorClustersProps {
  clusters: ErrorCluster[];
}

export function ErrorClusters({ clusters }: ErrorClustersProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "ERROR">("ALL");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filtered = clusters.filter((c) =>
    filter === "ALL" ? true : c.level.toUpperCase() === filter
  );

  const handleCopy = (e: React.MouseEvent, text: string, idx: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">
            Patrones de error agrupados
          </h3>
          <p className="text-xs text-zinc-500">
            Miles de líneas repetidas colapsadas en firmas únicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-[11px]">
            {(["ALL", "CRITICAL", "ERROR"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setFilter(lvl);
                  setOpenIndex(0);
                }}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  filter === lvl
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {lvl === "ALL" ? "Todos" : lvl}
              </button>
            ))}
          </div>

          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            PII sanitizado
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-500">
            No hay patrones con nivel {filter}.
          </p>
        ) : (
          filtered.map((cluster, idx) => {
            const isOpen = openIndex === idx;
            const isCritical = cluster.level.toUpperCase() === "CRITICAL";

            return (
              <div
                key={`${cluster.pattern}-${idx}`}
                className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/60"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-zinc-900/60"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isCritical
                          ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                          : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                      }`}
                    >
                      {cluster.level}
                    </span>
                    <span className="truncate font-mono text-xs text-zinc-300">
                      {cluster.pattern}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-400 ring-1 ring-zinc-800">
                      ×{cluster.count.toLocaleString()}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950 px-3.5 py-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        Muestra anonimizada
                      </span>
                      <button
                        onClick={(e) => handleCopy(e, cluster.sample, idx)}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-400">
                      {cluster.sample}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}