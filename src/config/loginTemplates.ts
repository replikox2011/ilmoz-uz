// ---------------------------------------------------------------------------
// Login page templates — the 10 visual designs a center can pick for its
// subdomain login page. Purely presentational metadata; the actual rendering
// lives in `src/components/auth/LoginBrandPanel.tsx`, keyed by `id`.
// ---------------------------------------------------------------------------

export type LoginTemplateId =
  | "aurora"
  | "minimal"
  | "cover"
  | "mesh"
  | "spotlight"
  | "glass"
  | "geometric"
  | "wave"
  | "corporate"
  | "neon";

export interface LoginTemplateMeta {
  id: LoginTemplateId;
  /** Display name in the template gallery. */
  name: string;
  /** One-line description in the gallery. */
  description: string;
  /** Default accent (hex) if the center hasn't chosen one. */
  defaultAccent: string;
  /** Whether this template renders a background/cover image. */
  supportsImage: boolean;
  /** Two-stop gradient used to render the gallery thumbnail. */
  swatch: [string, string];
}

export const LOGIN_TEMPLATES: LoginTemplateMeta[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Floating gradient orbs on deep space — the Ilmoz signature.",
    defaultAccent: "#3b6bff",
    supportsImage: false,
    swatch: ["#2450f5", "#0a0c14"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Restrained, near-black canvas with a single centered mark.",
    defaultAccent: "#93b8ff",
    supportsImage: false,
    swatch: ["#1a1c24", "#05060a"],
  },
  {
    id: "cover",
    name: "Cover Photo",
    description: "Full-bleed image with a headline over a soft gradient.",
    defaultAccent: "#ffffff",
    supportsImage: true,
    swatch: ["#4b5563", "#0a0c14"],
  },
  {
    id: "mesh",
    name: "Mesh",
    description: "Vibrant multi-color mesh gradient for a lively brand.",
    defaultAccent: "#a855f7",
    supportsImage: false,
    swatch: ["#ec4899", "#6366f1"],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "A radial glow spotlights your logo in the dark.",
    defaultAccent: "#f59e0b",
    supportsImage: false,
    swatch: ["#f59e0b", "#0a0c14"],
  },
  {
    id: "glass",
    name: "Frosted Glass",
    description: "Stacked frosted panels with a heavy glass blur.",
    defaultAccent: "#22d3ee",
    supportsImage: false,
    swatch: ["#22d3ee", "#155e75"],
  },
  {
    id: "geometric",
    name: "Geometric",
    description: "Accent shapes and a subtle grid for a technical feel.",
    defaultAccent: "#10b981",
    supportsImage: false,
    swatch: ["#10b981", "#064e3b"],
  },
  {
    id: "wave",
    name: "Waves",
    description: "Layered gradient waves flowing across the panel.",
    defaultAccent: "#3b82f6",
    supportsImage: false,
    swatch: ["#3b82f6", "#1e3a8a"],
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "A confident solid color block — clean and professional.",
    defaultAccent: "#2450f5",
    supportsImage: false,
    swatch: ["#2450f5", "#1e328b"],
  },
  {
    id: "neon",
    name: "Neon",
    description: "Cyber grid with a glowing neon accent.",
    defaultAccent: "#e11d8f",
    supportsImage: false,
    swatch: ["#e11d8f", "#0a0c14"],
  },
];

export const DEFAULT_TEMPLATE_ID: LoginTemplateId = "aurora";

export function getLoginTemplate(id?: string): LoginTemplateMeta {
  return (
    LOGIN_TEMPLATES.find((t) => t.id === id) ??
    LOGIN_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
  );
}
