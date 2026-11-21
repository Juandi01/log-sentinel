import { useRef, useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function Dropzone({ onFileSelect, isLoading }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border border-dashed p-12 text-center transition-all ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".log,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-zinc-200">
            Procesando archivo en streaming...
          </p>
          <p className="text-xs text-zinc-500">
            Sanitizando PII, agrupando patrones y calculando Z-score
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-zinc-900 p-3 ring-1 ring-zinc-800">
            <UploadCloud className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Arrastra tu archivo de log aquí o haz clic para seleccionarlo
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <FileText className="h-3.5 w-3.5" />
              Soporta archivos pesados (.log, .txt) de 100 MB+
            </p>
          </div>
        </div>
      )}
    </div>
  );
}