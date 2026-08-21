export const ROOT_DOMAIN = process.env.REACT_APP_ROOT_DOMAIN || "ilmoz.uz";
const ROOT_HOSTNAMES = ["localhost", ROOT_DOMAIN, `www.${ROOT_DOMAIN}`];
export const RESERVED_SUBDOMAINS = new Set([
  "support",
  "admin",
  "api",
  "app",
  "www",
  "mail",
  "blog",
  "dev",
  "status",
  "help",
  "security",
  "portal",
  "cloud",
  "static",
  "assets",
  "payment",
  "billing",
  "docs",
  "legal",
  "terms",
  "privacy",
  "test",
  "demo",
  "office",
  "jobs",
  "careers",
  "ilmoz",
  "dashboard",
  "login",
  "register",
  "signup",
  "setup",
  "presentation",
  "pitch",
  "promo",
]);

/** Check if a subdomain slug is a system-reserved/technical name. */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase());
}

/** Extract the subdomain from the current hostname, or null if on the root domain. */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  // localhost → null
  // applikata.localhost → "applikata"
  // applikata.<ROOT_DOMAIN> → "applikata"
  if (parts.length < 2) return null;
  if (ROOT_HOSTNAMES.includes(hostname)) return null;

  const sub = parts[0];
  if (sub === "www" || sub === "app") return null;
  return sub;
}

/** Convert a human name to a valid subdomain slug (lowercase alphanumeric + hyphens). */
export function slugifySubdomain(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Generate alternative subdomain suggestions when the preferred one is taken. */
export function generateAlternatives(base: string): string[] {
  return [
    `${base}1`,
    `${base}2`,
    `${base}-edu`,
    `${base}-center`,
    `go-${base}`,
  ];
}

/** Build the full URL for a subdomain (adapts for localhost vs production). */
export function buildSubdomainUrl(subdomain: string, hostname = window.location.hostname, port = window.location.port): string {
  const isLocalhost = hostname === "localhost" || hostname.endsWith(".localhost");
  const rootHost = isLocalhost ? "localhost" : ROOT_DOMAIN;
  const portSuffix = port ? `:${port}` : "";
  return `${window.location.protocol}//${subdomain}.${rootHost}${portSuffix}`;
}

/** Build the root-domain URL (the main site, not a tenant subdomain). */
export function buildRootUrl(hostname = window.location.hostname, port = window.location.port): string {
  const isLocalhost = hostname === "localhost" || hostname.endsWith(".localhost");
  const rootHost = isLocalhost ? "localhost" : ROOT_DOMAIN;
  const portSuffix = port ? `:${port}` : "";
  return `${window.location.protocol}//${rootHost}${portSuffix}`;
}
