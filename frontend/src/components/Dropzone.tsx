import { useRef, useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  uploadProgress?: number | null;
}

export function Dropzone({
  onFileSelect,
  isLoading,
  uploadProgress,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (file && !isLoading) onFileSelect(file);
  };

  return (
    <div
      onClick={() => !isLoading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-10 transition-all ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
      } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".log,.txt,.gz"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {isLoading ? (
        <div className="flex w-full max-w-xs flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-3 text-sm font-medium text-zinc-200">
            {uploadProgress !== null &&
            uploadProgress !== undefined &&
            uploadProgress < 100
              ? `Subiendo archivo... ${uploadProgress}%`
              : "Analizando en streaming..."}
          </p>
          {uploadProgress !== null && uploadProgress !== undefined && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800 transition-transform group-hover:scale-105">
            <UploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-emerald-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-200">
            Arrastra tu archivo de log aquí o haz clic para seleccionarlo
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <FileText className="h-3.5 w-3.5" />
            Soporta archivos pesados (.log, .txt) de 100 MB+
          </p>
        </>
      )}
    </div>
  );
}