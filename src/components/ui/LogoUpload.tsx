import * as React from "react";
import { cn } from "../../lib/utils";
import { ImagePlus, Loader2, X } from "lucide-react";

interface LogoUploadProps {
  centerId?: string;     // no longer needed, kept for API compatibility
  value?: string;        // base64 data URL
  onChange: (url: string) => void;
  className?: string;
}

export function LogoUpload({ value, onChange, className }: LogoUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-white/60">
        Center logo <span className="text-white/30">(optional)</span>
      </label>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "relative flex h-24 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition-all",
          "hover:border-brand-400/40 hover:bg-white/[0.06]",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="logo" className="h-16 w-16 rounded-xl object-contain" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="absolute right-2 top-2 rounded-full bg-black/40 p-0.5 text-white/60 hover:text-white transition"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-white/35">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Click or drag image</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
