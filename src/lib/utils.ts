import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
export function formatMoneyCompact(value: number, currency = "USD") {
  const abs = Math.abs(value);
  let num = value;
  let suffix = "";
  if (abs >= 1_000_000) {
    num = value / 1_000_000;
    suffix = "M";
  } else if (abs >= 1_000) {
    num = value / 1_000;
    suffix = "K";
  }
  const digits = suffix && Math.abs(num) < 100 && !Number.isInteger(num) ? 1 : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: suffix ? digits : 0,
  }).format(num);
  return suffix ? `${formatted}${suffix}` : formatted;
}
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Human initials from a full name. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Small id generator (mock persistence only). */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.floor(performance.now() * 1000).toString(36)}${Math.floor(
    (typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0]
      : 0) % 1_000_000
  ).toString(36)}`;
}
