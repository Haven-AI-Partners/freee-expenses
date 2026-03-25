import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function resolveFolderName(pattern: string, month: string): string {
  const [year, mon] = month.split("-");
  return pattern
    .replace("YYYY", year)
    .replace("MM", mon);
}

export function getLastMonth(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return formatMonth(last);
}
