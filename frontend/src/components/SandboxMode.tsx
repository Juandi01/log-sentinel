import {
  UploadCloud,
  Activity,
  ShieldCheck,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { Dropzone } from "./Dropzone";

interface SandboxModeProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  uploadProgress: number | null;
}

export function SandboxMode({
  onFileSelect,
  isLoading,
  uploadProgress,
}: SandboxModeProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/25">
          <FlaskConical className="h-3.5 w-3.5" />
          Modo Prueba · Guía interactiva
        </span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
          Prueba Log Sentinel en 3 pasos
        </h2>
        <p className="mt-1.5 text-sm text-zinc-400">
          Ideal para analizar un log rápido sin crear carpetas. Los resultados se
          guardan aparte en <span className="text-zinc-200">Pruebas</span>.
        </p>
      </div>

      {/* 3 pasos visuales */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] text-emerald-400 ring-1 ring-emerald-500/30">
              1
            </span>
            Sube tu archivo
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Arrastra un <code className="text-zinc-300">.log</code>,{" "}
            <code className="text-zinc-300">.txt</code> o{" "}
            <code className="text-zinc-300">.log.gz</code> (incluso de 100 MB+).
            Se procesa en streaming sin saturar la RAM.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-[11px] text-red-400 ring-1 ring-red-500/30">
              2
            </span>
            Detecta los picos
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Fíjate en los <strong className="text-red-400">puntos rojos</strong>{" "}
            de la gráfica: indican picos anómalos con{" "}
            <strong className="text-zinc-200">Z-Score &gt; 2.5</strong> respecto
            al tráfico normal.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-[11px] text-amber-400 ring-1 ring-amber-500/30">
              3
            </span>
            Diagnostica y exporta
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Revisa los patrones agrupados (sin datos sensibles) y pulsa{" "}
            <strong className="text-emerald-400">Diagnosticar incidente</strong>{" "}
            para obtener causa raíz y plan de acción.
          </p>
        </div>
      </div>

      {/* Dropzone listo para la prueba */}
      <Dropzone
        onFileSelect={onFileSelect}
        isLoading={isLoading}
        uploadProgress={uploadProgress}
      />

      {/* Qué mirar al ver los resultados */}
      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          ¿En qué fijarte cuando termine el análisis?
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="text-xs">
              <p className="font-medium text-zinc-200">Max Z-Score</p>
              <p className="text-zinc-500">
                Mide cuánto se dispara un minuto frente a la media. &gt;2.5 es
                anomalía real.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="text-xs">
              <p className="font-medium text-zinc-200">Clusters + PII</p>
              <p className="text-zinc-500">
                Miles de errores repetidos colapsan en 3–5 firmas con emails e
                IPs censurados.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-xs">
              <p className="font-medium text-zinc-200">Post-Mortem .md</p>
              <p className="text-zinc-500">
                Descarga el informe completo en Markdown listo para pegar en
                Jira o GitHub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}