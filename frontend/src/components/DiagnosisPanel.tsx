import { Sparkles, CheckCircle2, AlertTriangle, Loader2, Cpu } from "lucide-react";
import type { DiagnosisResult } from "../services/api";

interface DiagnosisPanelProps {
  diagnosis: DiagnosisResult | null;
  isLoading: boolean;
  error: string | null;
  onDiagnose: () => void;
}

export function DiagnosisPanel({
  diagnosis,
  isLoading,
  error,
  onDiagnose,
}: DiagnosisPanelProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-medium text-zinc-200">
            Diagnóstico SRE con IA
          </h2>
        </div>

        {diagnosis && (
          <span className="flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400 ring-1 ring-zinc-800">
            <Cpu className="h-3 w-3 text-emerald-400" />
            {diagnosis.model_used}
          </span>
        )}
      </div>

      {!diagnosis && !isLoading && (
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-6 text-center">
          <p className="text-xs text-zinc-400">
            Envía solo el resumen estadístico y los patrones anonimizados a Gemini
            para identificar la causa raíz y el plan de mitigación.
          </p>
          <button
            onClick={onDiagnose}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Diagnosticar incidente
          </button>
          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center gap-2.5 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-xs text-zinc-400">
            Analizando cadena de fallos con Gemini...
          </p>
        </div>
      )}

      {diagnosis && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Severidad: {diagnosis.severity}
              </span>
              <p className="mt-0.5 text-sm font-medium text-zinc-100">
                {diagnosis.root_cause}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cadena de fallos
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300">
              {diagnosis.explanation}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Acciones recomendadas
            </h3>
            <ul className="space-y-2">
              {diagnosis.recommended_actions.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2.5 text-xs leading-relaxed text-zinc-300"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}