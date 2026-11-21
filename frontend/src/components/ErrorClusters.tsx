import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import type { ErrorCluster } from "../services/api";

export function ErrorClusters({ clusters }: { clusters: ErrorCluster[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">
            Patrones de error agrupados
          </h2>
          <p className="text-xs text-zinc-500">
            Miles de líneas repetidas colapsadas en firmas únicas
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-400/90">
          <ShieldCheck className="h-3.5 w-3.5" />
          PII sanitizado
        </span>
      </div>

      <div className="space-y-2">
        {clusters.map((c, idx) => {
          const isOpen = openIndex === idx;
          const isCritical = c.level === "CRITICAL";

          return (
            <div
              key={c.pattern}
              className="rounded-lg border border-zinc-800/80 bg-zinc-950/60"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-zinc-900/60"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      isCritical
                        ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                        : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                    }`}
                  >
                    {c.level}
                  </span>
                  <code className="truncate font-mono text-xs text-zinc-300">
                    {c.pattern}
                  </code>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-300 ring-1 ring-zinc-800">
                    ×{c.count.toLocaleString()}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-800/70 bg-zinc-950 px-3 py-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    Muestra anonimizada
                  </p>
                  <code className="block break-all font-mono text-xs text-zinc-400">
                    {c.sample}
                  </code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}