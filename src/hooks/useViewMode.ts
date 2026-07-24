import { useState, useEffect } from "react";

export type ViewMode = "grid" | "list" | "table";

export function useViewMode(key: string, defaultMode: ViewMode = "grid") {
  const [mode, setMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`viewMode_${key}`);
    if (saved === "grid" || saved === "list" || saved === "table") {
      return saved;
    }
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(`viewMode_${key}`, mode);
  }, [key, mode]);

  return [mode, setMode] as const;
}
